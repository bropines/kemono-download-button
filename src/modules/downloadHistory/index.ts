// Download history on post pages: every attachment link whose file is already in the download history gets a
// small "Downloaded" badge, and a "Find elsewhere" button that asks the site (search_hash, one request per
// click) in how many other posts the same file appears. Our nodes sit after the site's links and are removed on
// unmount and before htmx snapshots; the site's own nodes are never changed.

import type { KdlModule, ModuleContext } from '../../core/types';
import { button, badge, ensureKit, kitIcon, kitScope, setButtonLoading } from '../../ui/kit';
import { el } from '../../utils/dom';
import { debugLog, getApiUrl } from '../../utils/helpers';
import { gmXmlhttpRequestWithRetries } from '../../utils/http';
import { hashFromUrl, isUrlDownloaded, loadDownloadHistory, onDownloadHistoryChange } from '../../services/downloadHistory';
import { t } from '../../i18n';

const LINKS = '.post__attachment-link';
const OWN = 'kdl-hist-own';
const MARK = 'data-kdl-hist';

const STYLES = `.${OWN} { display: inline-flex; align-items: center; flex-wrap: wrap; gap: 6px; vertical-align: middle; }
.post__attachments > .post__attachment:has(> .${OWN}) { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; gap: 8px; flex: 1 1 520px; min-width: 0; }
.post__attachment > .kui-attachment-styled.kdl-ui-btn { width: 100%; max-width: none; min-width: 0; }
.post__attachment > .${OWN} { display: contents !important; }
.post__attachment > .${OWN} .kdl-hist-find { grid-column: 2; grid-row: 1; width: 100%; min-width: 0; }
.post__attachment > .${OWN} .kdl-hist-find > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.post__attachment > .${OWN} .kdl-ui-badge { grid-column: 2; grid-row: 2; justify-self: start; }
@media (max-width: 600px) {
  .post__attachments > .post__attachment:has(> .${OWN}) { grid-template-columns: minmax(0, 1fr); gap: 6px; }
  .post__attachment > .${OWN} .kdl-hist-find { grid-column: 1; grid-row: 2; min-height: 44px; height: auto; }
  .post__attachment > .${OWN} .kdl-ui-badge { grid-column: 1; grid-row: 3; }
}
.${OWN} .kdl-hist-find[data-result="only"] { opacity: 0.7; }`;

const currentPostId = (): string => /\/post\/([^/?#]+)/.exec(window.location.pathname)?.[1] ?? '';

/** How many posts other than the current one contain the file; null when the response has no post list. */
async function otherPostsWith(hash: string): Promise<number | null> {
  const response = await gmXmlhttpRequestWithRetries({ method: 'GET', url: getApiUrl(`/api/v1/search_hash/${hash}`), responseType: 'json', timeout: 20000 });
  const data = response.response;
  const posts: unknown = Array.isArray(data) ? data : data?.posts;
  if (!Array.isArray(posts)) return null;
  const here = currentPostId();
  return posts.filter((post) => String(post?.id) !== here).length;
}

/** The answer replaces the button's own label: "Only in this post" (disabled) or "In N other posts", which then
 *  opens the site's hash search listing them */
function findButton(hash: string): HTMLButtonElement {
  let found = 0;
  const find: HTMLButtonElement = button({
    label: t('dl.history.findElsewhere'),
    icon: 'search',
    variant: 'outline',
    size: 'sm',
    title: t('dl.history.elsewhereTitle'),
    className: 'kdl-hist-find',
    onClick: async () => {
      if (found > 0) {
        window.open(`/search_hash?hash=${hash}`, '_blank', 'noopener');
        return;
      }
      setButtonLoading(find, true);
      try {
        const count = await otherPostsWith(hash);
        if (count === null) throw new Error('No post list in the response');
        setButtonLoading(find, false);
        found = count;
        find.replaceChildren(kitIcon(count > 0 ? 'external-link' : 'check'), el('span', { textContent: count > 0 ? t('dl.history.elsewhere', { count }) : t('dl.history.onlyHere') }));
        find.disabled = count === 0;
        find.dataset.result = count > 0 ? 'found' : 'only';
      } catch (error) {
        debugLog('search_hash failed:', error);
        setButtonLoading(find, false);
        find.replaceChildren(kitIcon('triangle-alert'), el('span', { textContent: t('dl.history.failed') }));
      }
    },
  });
  return find;
}

function enhance(): void {
  const links = document.querySelectorAll<HTMLAnchorElement>(`${LINKS}:not([${MARK}])`);
  if (links.length > 0) ensureKit();
  links.forEach((link) => {
    const hash = hashFromUrl(link.getAttribute('href'));
    if (!hash) return;
    link.setAttribute(MARK, '');
    const downloaded = badge({ text: t('dl.history.downloaded'), variant: 'success', icon: 'check', title: t('dl.history.downloadedTitle') });
    downloaded.hidden = !isUrlDownloaded(link.href);
    downloaded.dataset.kdlHistHash = hash;
    link.after(kitScope([downloaded, findButton(hash)], { tag: 'span', className: OWN }));
  });
}

function refreshBadges(): void {
  document.querySelectorAll<HTMLElement>(`.${OWN} [data-kdl-hist-hash]`).forEach((node) => {
    node.hidden = !isUrlDownloaded(`/${node.dataset.kdlHistHash}.x`);
  });
}

function strip(): void {
  document.querySelectorAll(`.${OWN}`).forEach((node) => node.remove());
  document.querySelectorAll(`[${MARK}]`).forEach((node) => node.removeAttribute(MARK));
}

let active = false;

async function run(): Promise<void> {
  await loadDownloadHistory();
  if (active) enhance();
}

export const downloadHistoryModule: KdlModule = {
  id: 'downloader.history',
  name: 'Download history marks',
  description: 'Marks attachments you already downloaded on post pages and finds the same file in other posts.',
  group: 'Downloader',
  pages: ['post'],
  defaultEnabled: true,
  after: ['kui.post'],
  styles: STYLES,
  mount(ctx: ModuleContext) {
    active = true;
    ctx.onCleanup(onDownloadHistoryChange(refreshBadges));
    void run();
  },
  update: () => void run(),
  unmount() {
    active = false;
    strip();
  },
  beforeSnapshot: strip,
};
