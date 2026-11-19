// Download history on post pages: every attachment link whose file is already in the download history gets a
// small "Downloaded" badge, and a "Find elsewhere" button that asks the site (search_hash, one request per
// click) in how many other posts the same file appears. Our nodes sit after the site's links and are removed on
// unmount and before htmx snapshots; the site's own nodes are never changed.

import type { KdlModule, ModuleContext } from '../../core/types';
import { button, badge, ensureKit, kitScope, setButtonLoading } from '../../ui/kit';
import { el } from '../../utils/dom';
import { debugLog, getApiUrl } from '../../utils/helpers';
import { gmXmlhttpRequestWithRetries } from '../../utils/http';
import { hashFromUrl, isUrlDownloaded, loadDownloadHistory, onDownloadHistoryChange } from '../../services/downloadHistory';
import { t } from '../../i18n';

const LINKS = '.post__attachment-link';
const OWN = 'kdl-hist-own';
const MARK = 'data-kdl-hist';

const STYLES = `.${OWN} { display: inline-flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-left: 8px; vertical-align: middle; }`;

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

function findButton(hash: string, result: HTMLElement): HTMLButtonElement {
  const find: HTMLButtonElement = button({
    label: t('dl.history.findElsewhere'),
    icon: 'search',
    variant: 'ghost',
    size: 'sm',
    title: t('dl.history.elsewhereTitle'),
    onClick: async () => {
      setButtonLoading(find, true);
      try {
        const count = await otherPostsWith(hash);
        if (count === null) throw new Error('No post list in the response');
        result.replaceChildren(badge({ text: count > 0 ? t('dl.history.elsewhere', { count }) : t('dl.history.onlyHere'), variant: count > 0 ? 'secondary' : 'outline' }));
        find.remove();
      } catch (error) {
        debugLog('search_hash failed:', error);
        result.replaceChildren(badge({ text: t('dl.history.failed'), variant: 'destructive' }));
        setButtonLoading(find, false);
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
    const result = el('span');
    link.after(kitScope([downloaded, findButton(hash, result), result], { tag: 'span', className: OWN }));
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
