import { getApiAdapter } from '../../api';
import { readStored, writeStored } from '../../state/gmStorage';
import { executeBulkDownload } from '../../services/downloadService';
import { getSettings, state } from '../../state/store';
import { el } from '../../utils/dom';
import { getApiUrl, getThumbnailUrl, sanitizeFilename } from '../../utils/helpers';
import { PostDetails } from '../../types';
import { addKitStyles,
  badge,
  button,
  checkbox,
  emptyState,
  ensureKit,
  input,
  kitIcon,
  kitScope,
  progress,
  scrollArea,
  select,
  sheet,
  type DialogHandle
} from '../kit';
import { authorManagerModalStyles } from '../../styles/components/authorManagerModal.styles';
import { onLanguageChange, t } from '../../i18n';

const CACHE_PREFIX = 'kemono_posts_cache_';
/** Most recently used cache keys first; only these authors keep a cached post list */
const CACHE_INDEX_KEY = 'kemono_posts_cache_index';
const MAX_CACHED_AUTHORS = 5;

interface CachedPostList {
  timestamp: number;
  postList: any[];
}

// The post list and author behind the rows currently in the manager; downloads are built from these
let currentPosts: any[] = [];
let currentAuthorName = 'UnknownAuthor';

/** GM_deleteValue is not granted, so a dropped entry is overwritten with an empty string (reads back as null). */
const dropCacheEntry = (key: string): void => writeStored(key, '');

/**
 * Keeps at most MAX_CACHED_AUTHORS fresh entries, most recently used first, and drops the rest.
 * `touchKey` moves to the front (an entry written before the index existed is adopted or dropped here).
 * Returns the keys kept.
 */
function pruneAuthorCache(touchKey?: string): string[] {
  const maxAgeMs = state.settings.cacheDurationHours * 60 * 60 * 1000;
  const index = readStored<string[]>(CACHE_INDEX_KEY, []);
  const ordered = Array.isArray(index) ? index.filter((key) => typeof key === 'string' && key.startsWith(CACHE_PREFIX)) : [];
  if (touchKey) ordered.unshift(touchKey);

  const kept: string[] = [];
  for (const key of ordered) {
    if (kept.includes(key)) continue;
    const entry = readStored<CachedPostList | null>(key, null);
    const fresh = !!entry?.postList && maxAgeMs > 0 && Date.now() - entry.timestamp < maxAgeMs;
    if (fresh && kept.length < MAX_CACHED_AUTHORS) {
      kept.push(key);
    } else if (entry) {
      dropCacheEntry(key);
    }
  }
  writeStored(CACHE_INDEX_KEY, kept);
  return kept;
}

function readAuthorCache(cacheKey: string): any[] | null {
  if (!pruneAuthorCache(cacheKey).includes(cacheKey)) return null;
  return readStored<CachedPostList | null>(cacheKey, null)?.postList || null;
}

function writeAuthorCache(cacheKey: string, postList: any[]): void {
  writeStored(cacheKey, { timestamp: Date.now(), postList } satisfies CachedPostList);
  pruneAuthorCache(cacheKey);
}

/** A download descriptor straight from the API post object, independent of what the page currently shows. */
export function toPostDetails(post: any, authorName: string): PostDetails {
  return {
    service: String(post.service),
    userID: String(post.user),
    authorName,
    postID: String(post.id),
    postTitle: post.title || 'UntitledPost',
    postDate: isoDay(post.published) || 'UnknownDate'
  };
}

function isoDay(published: unknown): string {
  if (!published) return '';
  const date = new Date(published as string);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
}


interface ManagerView {
  sheet: DialogHandle;
  title: HTMLElement;
  search: HTMLInputElement;
  sort: HTMLSelectElement;
  list: HTMLElement;
  loading: HTMLElement;
  loadingText: HTMLElement;
  counter: HTMLElement;
  download: HTMLButtonElement;
}
let view: ManagerView | null = null;
// Built once and reused: a language switch drops a closed sheet so the next launch is built in the new language
onLanguageChange(() => {
  if (view && !view.sheet.isOpen()) {
    view.sheet.element.remove();
    view = null;
  }
});
// Bumped by every launch, so a slow fetch never overwrites the rows of a newer one
let loadToken = 0;

const sortOptions = () => [
  { value: 'date-desc', label: t('dl.bulk.order.newest') },
  { value: 'date-asc', label: t('dl.bulk.order.oldest') },
  { value: 'files-desc', label: t('dl.manager.sort.filesDesc') },
  { value: 'files-asc', label: t('dl.manager.sort.filesAsc') },
  { value: 'title-asc', label: t('dl.manager.sort.titleAsc') },
  { value: 'title-desc', label: t('dl.manager.sort.titleDesc') }
];

const getItems = (list: HTMLElement) => Array.from(list.querySelectorAll<HTMLElement>('.kdl-ov-manager__item'));
const getCheckboxes = (list: HTMLElement) => Array.from(list.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));

function applyFiltersAndSort(): void {
  if (!view) return;
  const { list, search, sort } = view;
  const searchTerm = search.value.toLowerCase();
  const visibleItems = getItems(list).filter((item) => {
    item.hidden = !item.dataset.title!.includes(searchTerm);
    return !item.hidden;
  });

  visibleItems.sort((a, b) => {
    switch (sort.value) {
      case 'date-asc':
        return a.dataset.date!.localeCompare(b.dataset.date!);
      case 'files-desc':
        return parseInt(b.dataset.files!, 10) - parseInt(a.dataset.files!, 10);
      case 'files-asc':
        return parseInt(a.dataset.files!, 10) - parseInt(b.dataset.files!, 10);
      case 'title-asc':
        return a.dataset.title!.localeCompare(b.dataset.title!);
      case 'title-desc':
        return b.dataset.title!.localeCompare(a.dataset.title!);
      default:
        return b.dataset.date!.localeCompare(a.dataset.date!);
    }
  });

  visibleItems.forEach((item) => list.appendChild(item));
}

function setVisibleChecked(checked: boolean): void {
  if (!view) return;
  getItems(view.list).forEach((item) => {
    if (!item.hidden) item.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked = checked;
  });
  refreshManagerCounter();
}

function refreshManagerCounter(): void {
  if (!view) return;
  const count = view.list.querySelectorAll('input[type="checkbox"]:checked').length;
  view.counter.textContent = t('dl.manager.selectedCount', { count });
  view.download.disabled = count === 0;
}

function downloadSelected(): void {
  if (!view) return;
  const selectedIds = new Set(getCheckboxes(view.list).filter((cb) => cb.checked).map((cb) => cb.dataset.id!));
  // Built from the manager's post objects, so posts that are not on the current page download too
  const selectedPosts = currentPosts
    .filter((post) => selectedIds.has(String(post.id)))
    .map((post) => toPostDetails(post, currentAuthorName));
  if (selectedPosts.length > 0) {
    view.sheet.close();
    executeBulkDownload(selectedPosts);
  }
}

/** Row clicks toggle the row's checkbox; Shift extends the toggle over the range from the last clicked row. */
function bindRangeSelection(list: HTMLElement): void {
  let lastCheckedIndex: number | null = null;
  list.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.kdl-ov-manager__open')) return;
    const item = target.closest<HTMLElement>('.kdl-ov-manager__item');
    if (!item) return;

    const checkboxes = getCheckboxes(list);
    const checkbox = item.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    const currentIndex = checkboxes.indexOf(checkbox);
    const desiredState = target === checkbox ? checkbox.checked : !checkbox.checked;
    checkbox.checked = desiredState;

    if (e.shiftKey && lastCheckedIndex !== null) {
      const start = Math.min(currentIndex, lastCheckedIndex);
      const end = Math.max(currentIndex, lastCheckedIndex);
      for (let i = start; i <= end; i++) {
        // lastCheckedIndex can point past a list that was re-populated by a refresh
        if (checkboxes[i]) checkboxes[i].checked = desiredState;
      }
    }
    lastCheckedIndex = currentIndex;
    refreshManagerCounter();
  });
}

/** Builds the sheet once; it keeps its rows and filters between openings. */
function getView(): ManagerView {
  if (view) return view;
  addKitStyles('kdl-author-manager-styles', authorManagerModalStyles);

  const search = input({
    type: 'search',
    id: 'kdl-manager-search',
    placeholder: t('dl.manager.search'),
    ariaLabel: t('dl.manager.searchLabel'),
    className: 'kdl-ov-manager__search',
    onInput: applyFiltersAndSort
  });
  const sort = select({ id: 'kdl-manager-sort', ariaLabel: t('dl.manager.sortLabel'), options: sortOptions(), onChange: applyFiltersAndSort });
  const list = scrollArea({ className: 'kdl-ov-manager__list', ariaLabel: t('dl.manager.posts') });
  list.id = 'kdl-manager-post-list';
  bindRangeSelection(list);

  const loadingText = el('p', { className: 'kdl-ov-manager__status' });
  loadingText.setAttribute('aria-live', 'polite');
  const loading = el('div', { className: 'kdl-ov-manager__loading' }, [progress({ ariaLabel: t('dl.manager.loadingPosts') }), loadingText]);
  loading.hidden = true;

  const counter = badge({ text: t('dl.manager.selectedCount', { count: 0 }), variant: 'secondary', className: 'kdl-ov-manager__count' });
  counter.id = 'kdl-manager-counter';
  counter.setAttribute('aria-live', 'polite');
  const download = button({ id: 'kdl-manager-download', label: t('dl.picker.downloadSelected'), icon: 'download', disabled: true, onClick: downloadSelected });

  const managerSheet = sheet({
    title: t('dl.manager.title'),
    description: t('dl.manager.description'),
    side: 'right',
    className: 'kdl-ov-manager',
    initialFocus: search,
    content: [
      el('div', { id: 'kdl-manager-controls', className: 'kdl-ov-manager__toolbar' }, [
        search,
        sort,
        button({ id: 'kdl-manager-refresh', icon: 'refresh-cw', variant: 'outline', size: 'icon', ariaLabel: t('dl.manager.refreshLabel'), title: t('dl.manager.refresh'), onClick: () => void launchAuthorManager(true) }),
        button({ id: 'kdl-manager-select-all', label: t('dl.manager.selectVisible'), variant: 'secondary', onClick: () => setVisibleChecked(true) }),
        button({ id: 'kdl-manager-deselect-all', label: t('dl.bulk.deselectAll'), variant: 'ghost', onClick: () => setVisibleChecked(false) })
      ]),
      loading,
      list
    ],
    footer: [counter, button({ id: 'kdl-manager-close', label: t('dl.common.close'), variant: 'outline', onClick: () => view?.sheet.close() }), download]
  });
  managerSheet.element.id = 'kdl-author-manager-modal';
  const title = managerSheet.element.querySelector<HTMLElement>('.kdl-ui-dialog__title')!;
  title.id = 'kdl-manager-title';

  view = { sheet: managerSheet, title, search, sort, list, loading, loadingText, counter, download };
  return view;
}

function setLoading(text: string | null): void {
  if (!view) return;
  view.loading.hidden = text === null;
  view.loadingText.textContent = text ?? '';
}

export async function launchAuthorManager(forceRefresh = false): Promise<void> {
  const { sheet: managerSheet, title, list } = getView();
  managerSheet.open();
  const token = ++loadToken;

  await getSettings();
  const authorName = document.querySelector('.user-header__name span[itemprop="name"]')?.textContent?.trim() || 'UnknownAuthor';

  const pathParts = window.location.pathname.match(/\/([^/]+)\/user\/([^/]+)/);
  if (!pathParts) return;
  const service = pathParts[1];
  const userID = pathParts[2];
  const cacheKey = `${CACHE_PREFIX}${service}_${userID}`;

  if (!forceRefresh) {
    const cachedPosts = readAuthorCache(cacheKey);
    if (cachedPosts) {
      title.textContent = t('dl.manager.titleLoaded', { count: cachedPosts.length, author: authorName });
      setLoading(null);
      showPosts(cachedPosts, authorName);
      return;
    }
  }

  title.textContent = t('dl.manager.titleLoading', { author: authorName });
  showPosts([], authorName);
  setLoading(t('dl.manager.fetching'));
  // The fetcher reports per-page status through a progress-task-like object
  const allPosts = await getApiAdapter().fetchAllAuthorPosts(service, userID, {
    updateStatus: (text: string) => token === loadToken && setLoading(text),
    finish: () => {}
  });
  if (token !== loadToken) return;
  setLoading(null);

  if (allPosts.length > 0) {
    if (state.settings.cacheDurationHours > 0) {
      writeAuthorCache(cacheKey, allPosts);
    } else {
      pruneAuthorCache();
    }
    title.textContent = t('dl.manager.titleLoaded', { count: allPosts.length, author: authorName });
    showPosts(allPosts, authorName);
  } else {
    title.textContent = t('dl.manager.titleFailed', { author: authorName });
    list.replaceChildren(emptyState({ icon: 'triangle-alert', title: t('dl.manager.listFailed') }));
  }
}

function showPosts(posts: any[], authorName: string): void {
  currentPosts = posts;
  currentAuthorName = authorName;
  populateManagerList(posts);
  applyFiltersAndSort();
  refreshManagerCounter();
}

export function populateManagerList(posts: any[]): void {
  const { list } = getView();
  const fragment = document.createDocumentFragment();

  posts.forEach((post) => {
    const postDate = isoDay(post.published) || t('dl.manager.noDate');
    const fileCount = (post.file ? 1 : 0) + (post.attachments ? post.attachments.length : 0);
    const postTitle = sanitizeFilename(post.title || 'UntitledPost');

    const mainFilePath = post.file?.path || (Array.isArray(post.attachments) && post.attachments[0]?.path);
    const preview = mainFilePath
      ? el('img', { src: getThumbnailUrl(mainFilePath), className: 'kdl-ov-manager__thumb', loading: 'lazy', alt: '' })
      : el('div', { className: 'kdl-ov-manager__thumb' });

    const postUrl = getApiUrl(`/${post.service}/user/${post.user}/post/${post.id}`);
    const box = checkbox({ ariaLabel: postTitle });
    box.dataset.id = String(post.id);
    const openLink = button({
      href: postUrl,
      target: '_blank',
      icon: 'external-link',
      variant: 'ghost',
      size: 'icon',
      title: t('dl.manager.openPost'),
      ariaLabel: t('dl.manager.openPostLabel', { title: postTitle }),
      className: 'kdl-ov-manager__open'
    });

    fragment.appendChild(
      el(
        'div',
        {
          className: 'kdl-ov-manager__item',
          dataset: {
            id: String(post.id),
            title: String(post.title || '').toLowerCase(),
            date: post.published || '0',
            files: String(fileCount)
          }
        },
        [
          box,
          preview,
          el('div', { className: 'kdl-ov-manager__text' }, [
            el('span', { className: 'kdl-ov-manager__title', title: postTitle }, [postTitle]),
            el('span', { className: 'kdl-ov-manager__meta' }, [t('dl.manager.meta', { date: postDate, files: fileCount, id: post.id })])
          ]),
          openLink
        ]
      )
    );
  });

  list.replaceChildren(fragment);
}

/** Header button in the creator page (light DOM), drawn with the kit inside a .kdl-scope wrapper that carries the id. */
export function createAuthorManagerButton(): HTMLElement {
  const existing = document.getElementById('kdl-author-manager-btn');
  if (existing) return existing;
  ensureKit();
  const scope = kitScope(
    [
      button({
        label: t('dl.manager.button'),
        icon: 'folders',
        variant: 'secondary',
        size: 'sm',
        title: t('dl.manager.buttonHint'),
        onClick: () => void launchAuthorManager()
      })
    ],
    { tag: 'span' }
  );
  scope.id = 'kdl-author-manager-btn';
  return scope;
}
