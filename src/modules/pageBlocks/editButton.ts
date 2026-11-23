// The "Edit page layout" switch on the page itself: an icon button in the creator / post header's action row and,
// while editing, a Done bar in the bottom dock (kit root, outside #main, so htmx swaps never take it away).
import type { KdlModule } from '../../core/types';
import { getModuleSetting, isModuleMounted, onRegistryChange, setModuleSetting } from '../../core/registry';
import { el } from '../../utils/dom';
import { addKitStyles, button, ensureKit, getKitRoot, kitIcon, kitScope, setTooltip, tooltip } from '../../ui/kit';
import { getDockSlot } from '../../ui/components/fixedControls';
import { t } from '../../i18n';

export const LAYOUT_BUTTON_MODULE = 'layout.editButton';
const BUTTON_ID = 'kdl-layout-edit-btn';
const DONE_ID = 'kdl-layout-done';
const CREATOR_POSTS = /^\/[^/]+\/user\/[^/?#]+\/?$/;

/** The edit mode itself is a setting of the creator block order module; the post blocks and the overview read it too */
export const isLayoutEditing = (): boolean => getModuleSetting<boolean>('creator.blockOrder', 'editMode') === true;
export const setLayoutEditing = (on: boolean): void => setModuleSetting('creator.blockOrder', 'editMode', on);

let active = false;
let timer: ReturnType<typeof setTimeout> | undefined;

/** Whether editing changes anything here: a block with move controls, or a page whose block modules are running */
function applies(): boolean {
  if (document.querySelector('.kdl-ov__order')) return true;
  const page = document.documentElement.dataset.kdlPage;
  if (page === 'post') return isModuleMounted('post.blockOrder');
  if (page === 'creator') return CREATOR_POSTS.test(location.pathname) && (isModuleMounted('creator.blockOrder') || isModuleMounted('creators.overview'));
  return false;
}

const actionRow = (): Element | null => document.querySelector('.user-header__actions') ?? document.querySelector('.post__header .post__actions');

function paint(btn: HTMLButtonElement, editing: boolean): void {
  const label = t(editing ? 'layout.edit.done' : 'layout.edit.button');
  btn.classList.toggle('kdl-ui-btn--default', editing);
  btn.classList.toggle('kdl-ui-btn--outline', !editing);
  btn.setAttribute('aria-label', label);
  btn.setAttribute('aria-pressed', String(editing));
  btn.replaceChildren(kitIcon(editing ? 'check' : 'layout-dashboard'));
  setTooltip(btn, t(editing ? 'layout.edit.doneHint' : 'layout.edit.buttonHint'));
}

function syncButton(show: boolean, editing: boolean): void {
  const old = document.getElementById(BUTTON_ID);
  const row = show ? actionRow() : null;
  if (!row) return void old?.remove();
  if (old && old.parentElement === row) {
    const btn = old.querySelector<HTMLButtonElement>('.kdl-ui-btn');
    if (btn && btn.getAttribute('aria-pressed') !== String(editing)) paint(btn, editing);
    return;
  }
  old?.remove();
  ensureKit();
  const btn = button({ variant: 'outline', size: 'icon', icon: 'layout-dashboard', ariaLabel: t('layout.edit.button'), onClick: () => setLayoutEditing(!isLayoutEditing()) });
  tooltip(btn, { text: t('layout.edit.buttonHint') });
  paint(btn, editing);
  const scope = kitScope([btn], { tag: 'span' });
  scope.id = BUTTON_ID;
  row.append(scope);
}

const DONE_STYLES = `
#${DONE_ID} {
  pointer-events: auto; display: flex; align-items: center; gap: 10px; max-width: 100%; box-sizing: border-box;
  padding: 6px 6px 6px 14px; border: 1px solid var(--kdl-border); border-radius: 9999px;
  background: var(--kdl-background); color: var(--kdl-foreground); box-shadow: var(--kdl-shadow);
  font-size: 13px; line-height: 1.3; animation: kdl-ui-fade-in 0.15s ease-out;
}
#${DONE_ID} > .kdl-ui-icon { flex: 0 0 auto; width: 16px; height: 16px; color: var(--kdl-muted-foreground); }
.kdl-layout-done__text { display: flex; flex-direction: column; min-width: 0; }
.kdl-layout-done__title { font-weight: 600; }
.kdl-layout-done__hint { color: var(--kdl-muted-foreground); font-size: 12px; }
#${DONE_ID} > .kdl-ui-btn { flex: 0 0 auto; border-radius: 9999px; }
@media (max-width: 600px) { .kdl-layout-done__hint { display: none; } }
@media (prefers-reduced-motion: reduce) { #${DONE_ID} { animation: none; } }
`;

function syncDone(show: boolean): void {
  const existing = getKitRoot().getElementById(DONE_ID);
  if (!show) return void existing?.remove();
  if (existing) return;
  addKitStyles('kdl-layout-done-styles', DONE_STYLES);
  const bar = el('div', { id: DONE_ID }, [
    kitIcon('layout-dashboard'),
    el('div', { className: 'kdl-layout-done__text' }, [
      el('span', { className: 'kdl-layout-done__title', textContent: t('layout.edit.active') }),
      el('span', { className: 'kdl-layout-done__hint', textContent: t('layout.edit.activeHint') }),
    ]),
    button({ label: t('layout.edit.done'), icon: 'check', size: 'sm', onClick: () => setLayoutEditing(false) }),
  ]);
  bar.setAttribute('role', 'status');
  getDockSlot('layout').append(bar);
}

function sync(): void {
  if (!active) return;
  const show = applies();
  const editing = isLayoutEditing();
  syncButton(show, editing);
  syncDone(show && editing);
}

function strip(): void {
  document.getElementById(BUTTON_ID)?.remove();
}

export const layoutEditButtonModule: KdlModule = {
  id: LAYOUT_BUTTON_MODULE,
  name: 'Edit layout button',
  description: 'A button in the creator and post page headers that turns "Edit page layout" on and off, with a Done bar while editing.',
  group: 'Interface',
  pages: ['creator', 'post'],
  defaultEnabled: true,
  // The movable blocks belong to the redesign
  requires: ['ui.shadcn'],
  after: ['post.blockOrder', 'creator.blockOrder', 'creators.overview', 'downloader.post', 'downloader.creator'],
  styles: `
:is(.user-header__actions, .post__actions) > #${BUTTON_ID} { display: inline-flex; order: 1; }
#${BUTTON_ID} > .kdl-ui-btn { width: 2rem; height: 2rem; }
@media (max-width: 600px) { .user-header__actions > #${BUTTON_ID} > .kdl-ui-btn { width: 2.25rem; height: 2.25rem; } }
`,
  mount(ctx) {
    active = true;
    const off = onRegistryChange((event) => {
      if (event.type === 'setting' ? event.id === 'creator.blockOrder' && event.key === 'editMode' : event.type === 'mounted' || event.type === 'unmounted') sync();
    });
    ctx.onCleanup(off);
    sync();
  },
  update: sync,
  unmount() {
    active = false;
    clearTimeout(timer);
    strip();
    syncDone(false);
  },
  beforeSnapshot() {
    clearTimeout(timer);
    strip();
    const path = location.pathname;
    timer = setTimeout(() => { if (location.pathname === path) sync(); }, 0);
  },
};
