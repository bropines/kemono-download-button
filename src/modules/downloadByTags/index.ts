// Download by tags: a "Tags" button in the creator header opens a dialog (a bottom sheet on phones) with the
// creator's tags as selectable chips. On confirm the posts of the chosen tags are collected through the API
// (deduplicated by post id) and handed to the bulk downloader.
//
// The only DOM we add to the site is the button (#kdl-tags-btn); it is removed on unmount and before snapshots.

import type { KdlModule } from '../../core/types';
import { fetchCreatorName, fetchCreatorTags, fetchTaggedPostsPage, type CreatorTag } from '../../api/kemonoApi';
import { getSettings, state } from '../../state/store';
import { executeBulkDownload } from '../../services/downloadService';
import { toPostDetails } from '../../ui/components/authorManagerModal';
import { addKitStyles, badge, button, dialog, emptyState, ensureKit, input, kitScope, progress, sheet, type DialogHandle } from '../../ui/kit';
import { showMessage } from '../../ui/toast';
import { debugLog } from '../../utils/helpers';
import { el } from '../../utils/dom';
import { t } from '../../i18n';

const BUTTON_ID = 'kdl-tags-btn';
const PAGE_SIZE = 50;

let active = false;
let current: { handle: DialogHandle; cancelled: boolean } | null = null;

function creatorFromUrl(): { service: string; id: string } | null {
  const match = /\/([^/]+)\/user\/([^/?#]+)/.exec(window.location.pathname);
  return match ? { service: match[1], id: match[2] } : null;
}

async function authorName(service: string, id: string): Promise<string> {
  return (
    document.querySelector('.user-header__name span[itemprop="name"]')?.textContent?.trim() ||
    (await fetchCreatorName(service, id)) ||
    'UnknownAuthor'
  );
}

/** Posts of every tag, deduplicated by id; `onProgress` gets the running unique count. Stops quietly when cancelled. */
async function collectPosts(
  service: string,
  id: string,
  tags: string[],
  isCancelled: () => boolean,
  onProgress: (tag: string, index: number, unique: number) => void
): Promise<any[]> {
  const byId = new Map<string, any>();
  for (let index = 0; index < tags.length; index++) {
    for (let offset = 0; !isCancelled(); offset += PAGE_SIZE) {
      onProgress(tags[index], index, byId.size);
      let page: any[];
      try {
        page = await fetchTaggedPostsPage(service, id, tags[index], offset);
      } catch (error: any) {
        // The API answers 400 past the last page
        if (String(error?.message || '').includes('Status 400')) break;
        throw error;
      }
      page.forEach((post) => byId.set(String(post.id), post));
      if (page.length < PAGE_SIZE) break;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    if (isCancelled()) break;
  }
  return Array.from(byId.values());
}

function openDialog(): void {
  const creator = creatorFromUrl();
  if (!creator) return;
  ensureKit();
  addKitStyles('kdl-tags-dl-styles', DIALOG_STYLES);

  const narrow = window.matchMedia('(max-width: 600px)').matches;
  const options = {
    title: t('tagsdl.title'),
    description: t('tagsdl.description'),
    className: 'kdl-tgd',
    onClose: () => {
      if (current) current.cancelled = true;
      current = null;
    },
  };
  const handle = narrow ? sheet({ ...options, side: 'bottom' }) : dialog({ ...options, size: 'lg' });
  const run = { handle, cancelled: false };
  current = run;
  handle.open();

  const setFooter = (...children: Array<HTMLElement | null>) => handle.footer.replaceChildren(...(children.filter(Boolean) as HTMLElement[]));
  handle.footer.hidden = false;
  const closeButton = () => button({ label: t('dl.common.close'), variant: 'outline', onClick: () => handle.close() });

  const showLoading = () => {
    handle.body.replaceChildren(el('div', { className: 'kdl-tgd__loading' }, [progress({ ariaLabel: t('tagsdl.loading') }), el('p', { className: 'kdl-tgd__status' }, [t('tagsdl.loading')])]));
    setFooter(closeButton());
  };

  const showMessageState = (icon: 'triangle-alert' | 'tag', title: string, retry?: boolean) => {
    handle.body.replaceChildren(
      emptyState({ icon, title, action: retry ? button({ label: t('tagsdl.retry'), icon: 'refresh-cw', variant: 'outline', onClick: () => void load() }) : undefined })
    );
    setFooter(closeButton());
  };

  const showCollecting = (label: HTMLElement) => {
    run.cancelled = false;
    handle.body.replaceChildren(el('div', { className: 'kdl-tgd__loading' }, [progress({ ariaLabel: t('tagsdl.collecting') }), label]));
    setFooter(
      button({
        label: t('dl.common.cancel'),
        variant: 'outline',
        onClick: () => {
          run.cancelled = true;
          label.textContent = t('tagsdl.cancelling');
        },
      })
    );
  };

  const confirm = async (tags: string[], backToPicker: () => void) => {
    const label = el('p', { className: 'kdl-tgd__status' }, [t('tagsdl.collecting')]);
    showCollecting(label);
    try {
      const raw = await collectPosts(creator.service, creator.id, tags, () => run.cancelled || !handle.isOpen(), (tag, index, unique) => {
        label.textContent = t('tagsdl.progress', { tag, done: index + 1, total: tags.length, count: unique });
      });
      if (run.cancelled || !handle.isOpen()) {
        if (handle.isOpen()) backToPicker();
        return;
      }
      if (raw.length === 0) {
        showMessage(t('tagsdl.noPosts'), 'warning');
        backToPicker();
        return;
      }
      const name = await authorName(creator.service, creator.id);
      const posts = raw.map((post) => toPostDetails(post, name));
      handle.close();
      void executeBulkDownload(posts);
    } catch (error) {
      debugLog('[tags] collection failed:', error);
      if (!handle.isOpen()) return;
      showMessage(t('tagsdl.failed'), 'error');
      backToPicker();
    }
  };

  const showPicker = (tags: CreatorTag[], selected: Set<string>, filter: string) => {
    const chips = new Map<string, HTMLButtonElement>();
    const note = el('span', { className: 'kdl-tgd__note' });
    const total = badge({ text: '', variant: 'secondary' });
    const download = button({ icon: 'download', disabled: true, onClick: () => void confirm(Array.from(selected), () => showPicker(tags, selected, search.value)) });
    const search = input({ type: 'search', placeholder: t('tagsdl.filter'), ariaLabel: t('tagsdl.filterLabel'), className: 'kdl-tgd__search', value: filter, onInput: () => applyFilter() });
    const countText = el('span', { className: 'kdl-tgd__count' });

    const applyFilter = () => {
      const needle = search.value.trim().toLowerCase();
      let shown = 0;
      chips.forEach((chip, tag) => {
        const match = !needle || tag.toLowerCase().includes(needle);
        chip.hidden = !match;
        if (match) shown++;
      });
      countText.textContent = t('tagsdl.shown', { shown, count: tags.length });
    };

    const refresh = () => {
      chips.forEach((chip, tag) => chip.setAttribute('aria-pressed', String(selected.has(tag))));
      const sum = tags.filter((row) => selected.has(row.tag)).reduce((acc, row) => acc + row.count, 0);
      total.textContent = t('tagsdl.selected', { count: selected.size });
      const label = selected.size > 1 ? t('tagsdl.downloadUpTo', { count: sum }) : t('tagsdl.download', { count: sum });
      download.replaceChildren(...Array.from(download.childNodes).filter((node) => node.nodeType !== Node.TEXT_NODE), document.createTextNode(label));
      download.disabled = selected.size === 0;
    };

    const setVisible = (on: boolean) => {
      chips.forEach((chip, tag) => {
        if (chip.hidden) return;
        if (on) selected.add(tag);
        else selected.delete(tag);
      });
      refresh();
    };

    const list = el('div', { className: 'kdl-tgd__chips', role: 'group' });
    list.setAttribute('aria-label', t('tagsdl.listLabel'));
    tags.forEach((row) => {
      const chip = el('button', { type: 'button', className: 'kdl-tgd__chip', title: row.tag }, [
        el('span', { className: 'kdl-tgd__chip-name' }, [row.tag]),
        el('span', { className: 'kdl-tgd__chip-count' }, [String(row.count)]),
      ]);
      chip.addEventListener('click', () => {
        if (selected.has(row.tag)) selected.delete(row.tag);
        else selected.add(row.tag);
        refresh();
      });
      chips.set(row.tag, chip);
      list.append(chip);
    });

    handle.body.replaceChildren(
      el('div', { className: 'kdl-tgd__toolbar' }, [
        search,
        button({ label: t('tagsdl.selectAll'), variant: 'secondary', onClick: () => setVisible(true) }),
        button({ label: t('tagsdl.selectNone'), variant: 'ghost', onClick: () => setVisible(false) }),
      ]),
      countText,
      list
    );

    void getSettings().then(() => {
      const mode = state.settings.bulkDownloadMode === 'multiple' ? t('settings.downloads.bulkMultiple') : t('settings.downloads.bulkSingle');
      note.textContent = t('tagsdl.mode', { mode });
    });
    setFooter(el('div', { className: 'kdl-tgd__summary' }, [total, note]), closeButton(), download);
    applyFilter();
    refresh();
    search.focus();
  };

  const load = async () => {
    showLoading();
    try {
      const tags = await fetchCreatorTags(creator.service, creator.id);
      if (run.cancelled || !handle.isOpen()) return;
      if (tags.length === 0) showMessageState('tag', t('tagsdl.empty'));
      else showPicker(tags, new Set(), '');
    } catch (error) {
      debugLog('[tags] fetch failed:', error);
      if (run.cancelled || !handle.isOpen()) return;
      showMessageState('triangle-alert', t('tagsdl.error'), true);
    }
  };

  void load();
}

function placeButton(): void {
  const actions = document.querySelector('.user-header__actions');
  if (!actions || actions.querySelector(`#${BUTTON_ID}`)) return;
  ensureKit();
  const scope = kitScope(
    [button({ label: t('tagsdl.button'), icon: 'tag', variant: 'secondary', size: 'sm', title: t('tagsdl.buttonHint'), onClick: openDialog })],
    { tag: 'span' }
  );
  scope.id = BUTTON_ID;
  // Right after the author manager button when it is there, so the two stay together
  const manager = actions.querySelector('#kdl-author-manager-btn');
  if (manager) manager.after(scope);
  else actions.prepend(scope);
}

function removeButton(): void {
  document.getElementById(BUTTON_ID)?.remove();
}

// Kit shadow root: the dialog
const DIALOG_STYLES = `
.kdl-tgd [hidden] { display: none !important; }
.kdl-tgd .kdl-ui-dialog__body { display: flex; flex-direction: column; gap: 10px; }
.kdl-tgd__toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.kdl-tgd__search.kdl-ui-input { flex: 1 1 180px; width: auto; min-width: 0; }
.kdl-tgd__count { font-size: 12px; color: var(--kdl-muted-foreground); }
.kdl-tgd__chips { display: flex; flex-wrap: wrap; gap: 6px; align-content: flex-start; }
.kdl-tgd__chip {
  display: inline-flex; align-items: center; gap: 6px; max-width: 100%;
  padding: 4px 10px; border: 1px solid var(--kdl-border); border-radius: 9999px;
  background: transparent; color: var(--kdl-foreground); font: inherit; font-size: 13px; cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
}
.kdl-tgd__chip:hover { background: var(--kdl-accent); }
.kdl-tgd__chip:focus-visible { outline: 2px solid var(--kdl-ring); outline-offset: 2px; }
.kdl-tgd__chip[aria-pressed="true"] { background: var(--kdl-primary); border-color: var(--kdl-primary); color: var(--kdl-primary-foreground); }
.kdl-tgd__chip-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kdl-tgd__chip-count { font-size: 11px; opacity: 0.7; font-variant-numeric: tabular-nums; }
.kdl-tgd__loading { display: flex; flex-direction: column; gap: 8px; padding: 8px 0; }
.kdl-tgd__status { margin: 0; font-size: 13px; color: var(--kdl-muted-foreground); overflow-wrap: anywhere; }
.kdl-tgd .kdl-ui-dialog__footer { flex-wrap: wrap; align-items: center; }
.kdl-tgd__summary { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-right: auto; min-width: 0; }
.kdl-tgd__note { font-size: 12px; color: var(--kdl-muted-foreground); }
@media (max-width: 600px) {
  .kdl-tgd__summary { flex: 1 1 100%; }
}
`;

export const downloadByTagsModule: KdlModule = {
  id: 'downloader.tags',
  name: 'Download by tags',
  description: 'A Tags button on creator pages: pick the creator\'s tags and download every post carrying them.',
  group: 'Downloader',
  pages: ['creator'],
  defaultEnabled: true,
  after: ['downloader.creator'],
  mount(ctx) {
    active = true;
    placeButton();
    ctx.onCleanup(() => {
      active = false;
      current?.handle.close();
      removeButton();
    });
  },
  update() {
    if (active) placeButton();
  },
  beforeSnapshot() {
    current?.handle.close();
    removeButton();
  },
};
