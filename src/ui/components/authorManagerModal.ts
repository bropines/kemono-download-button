import { getApiAdapter } from '../../api';
import { readStored, writeStored } from '../../state/gmStorage';
import { executeBulkDownload } from '../../services/downloadService';
import { getSettings, state } from '../../state/store';
import { el } from '../../utils/dom';
import { icon } from '../../config/icons';
import { getApiUrl, getThumbnailUrl, sanitizeFilename } from '../../utils/helpers';
import { PostDetails } from '../../types';

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
function toPostDetails(post: any, authorName: string): PostDetails {
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

export async function launchAuthorManager(forceRefresh = false): Promise<void> {
  let overlay = document.getElementById('kdl-author-manager-overlay');
  if (!overlay) {
    overlay = el('div', { id: 'kdl-author-manager-overlay' }, [
      el('div', { id: 'kdl-author-manager-modal' }, [
        el('div', { id: 'kdl-manager-header' }, [
          el('h3', { id: 'kdl-manager-title' }),
          el('em', { id: 'kdl-manager-cache-status' })
        ]),
        el('div', { id: 'kdl-manager-controls' }, [
          el('button', { id: 'kdl-manager-refresh', className: 'kdl-manager-btn', title: 'Force Refresh' }, [icon('refresh-cw')]),
          el('input', { type: 'text', id: 'kdl-manager-search', placeholder: 'Search by title...' }),
          el('select', { id: 'kdl-manager-sort', className: 'kdl-manager-btn' }, [
            el('option', { value: 'date-desc' }, ['Newest First']),
            el('option', { value: 'date-asc' }, ['Oldest First']),
            el('option', { value: 'files-desc' }, ['Most Files']),
            el('option', { value: 'files-asc' }, ['Fewest Files']),
            el('option', { value: 'title-asc' }, ['Title (A-Z)']),
            el('option', { value: 'title-desc' }, ['Title (Z-A)'])
          ]),
          el('button', { id: 'kdl-manager-select-all', className: 'kdl-manager-btn' }, ['Select Visible']),
          el('button', { id: 'kdl-manager-deselect-all', className: 'kdl-manager-btn' }, ['Deselect All'])
        ]),
        el('div', { id: 'kdl-manager-post-list' }),
        el('div', { id: 'kdl-manager-footer' }, [
          el('span', { id: 'kdl-manager-counter' }, ['Selected: 0']),
          el('div', {}, [
            el('button', { id: 'kdl-manager-download', className: 'kdl-manager-btn', disabled: true }, ['Download Selected']),
            el('button', { id: 'kdl-manager-close', className: 'kdl-manager-btn' }, ['Close'])
          ])
        ])
      ])
    ]);
    document.body.appendChild(overlay);
    overlay.querySelector('#kdl-manager-close')!.addEventListener('click', () => (overlay!.style.display = 'none'));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay!.style.display = 'none';
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay!.style.display !== 'none') overlay!.style.display = 'none';
    });
    // Bound once with the persistent modal; refreshes only replace the rows
    setupManagerEventListeners();
  }
  overlay.style.display = 'flex';

  await getSettings();
  const listContainer = document.getElementById('kdl-manager-post-list')!;
  const title = document.getElementById('kdl-manager-title')!;
  const authorName = document.querySelector('.user-header__name span[itemprop="name"]')?.textContent?.trim() || 'UnknownAuthor';

  const pathParts = window.location.pathname.match(/\/([^/]+)\/user\/([^/]+)/);
  if (!pathParts) return;
  const service = pathParts[1];
  const userID = pathParts[2];
  const cacheKey = `${CACHE_PREFIX}${service}_${userID}`;

  if (!forceRefresh) {
    const cachedPosts = readAuthorCache(cacheKey);
    if (cachedPosts) {
      title.textContent = `Manage ${cachedPosts.length} posts by ${authorName}`;
      showPosts(cachedPosts, authorName);
      return;
    }
  }

  title.textContent = `Loading posts for: ${authorName}`;
  showPosts([], authorName);
  listContainer.replaceChildren(el('p', { style: { textAlign: 'center', padding: '20px' } }, ['Fetching all post data from API...']));
  const allPosts = await getApiAdapter().fetchAllAuthorPosts(service, userID);

  if (allPosts.length > 0) {
    if (state.settings.cacheDurationHours > 0) {
      writeAuthorCache(cacheKey, allPosts);
    } else {
      pruneAuthorCache();
    }
    title.textContent = `Manage ${allPosts.length} posts by ${authorName}`;
    showPosts(allPosts, authorName);
  } else {
    title.textContent = `Failed to load posts for ${authorName}`;
    listContainer.replaceChildren(el('p', { style: { textAlign: 'center', padding: '20px' } }, ['Could not retrieve post list.']));
  }
}

function showPosts(posts: any[], authorName: string): void {
  currentPosts = posts;
  currentAuthorName = authorName;
  populateManagerList(posts);
  refreshManagerCounter();
}

function refreshManagerCounter(): void {
  const listContainer = document.getElementById('kdl-manager-post-list');
  const downloadBtn = document.getElementById('kdl-manager-download') as HTMLButtonElement | null;
  const counter = document.getElementById('kdl-manager-counter');
  if (!listContainer || !downloadBtn || !counter) return;
  const count = listContainer.querySelectorAll('input[type="checkbox"]:checked').length;
  counter.textContent = `Selected: ${count}`;
  downloadBtn.disabled = count === 0;
}

export function populateManagerList(posts: any[]): void {
  const listContainer = document.getElementById('kdl-manager-post-list')!;
  const fragment = document.createDocumentFragment();

  posts.forEach((post) => {
    const postDate = isoDay(post.published) || 'No Date';
    const fileCount = (post.file ? 1 : 0) + (post.attachments ? post.attachments.length : 0);

    const mainFilePath = post.file?.path || (Array.isArray(post.attachments) && post.attachments[0]?.path);
    let previewElem: HTMLElement;
    if (mainFilePath) {
      const thumbUrl = getThumbnailUrl(mainFilePath);
      previewElem = el('img', { src: thumbUrl, className: 'post-item-preview', loading: 'lazy' });
    } else {
      previewElem = el('div', { className: 'post-item-preview' });
    }

    const postUrl = getApiUrl(`/${post.service}/user/${post.user}/post/${post.id}`);

    const item = el(
      'div',
      {
        className: 'post-item',
        dataset: {
          id: String(post.id),
          title: String(post.title || '').toLowerCase(),
          date: post.published || '0',
          files: String(fileCount)
        }
      },
      [
        previewElem,
        el('input', { type: 'checkbox', dataset: { id: String(post.id) } }),
        el('div', { className: 'post-item-label' }, [
          el('span', { className: 'post-item-title' }, [sanitizeFilename(post.title || 'UntitledPost')]),
          el('span', { className: 'post-item-date' }, [`${postDate} | Files: ${fileCount} | ID: ${post.id}`])
        ]),
        el('a', { href: postUrl, target: '_blank', className: 'post-item-open-link', title: 'Open post in new tab' }, [icon('external-link')])
      ]
    );

    fragment.appendChild(item);
  });

  listContainer.replaceChildren(fragment);
}

/** Binds the modal's controls. Idempotent: the modal persists, and a second binding would multiply every handler (and download). */
export function setupManagerEventListeners(): void {
  const searchInput = document.getElementById('kdl-manager-search') as HTMLInputElement;
  const listContainer = document.getElementById('kdl-manager-post-list')!;
  const downloadBtn = document.getElementById('kdl-manager-download') as HTMLButtonElement;

  if (listContainer.dataset.kdlListenersBound) {
    refreshManagerCounter();
    return;
  }
  listContainer.dataset.kdlListenersBound = 'true';

  const getCheckboxes = () => Array.from(listContainer.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];
  const updateCounter = refreshManagerCounter;

  const applyFiltersAndSort = () => {
    const allItems = Array.from(listContainer.querySelectorAll('.post-item')) as HTMLElement[];
    const searchTerm = searchInput.value.toLowerCase();
    const sortMethod = (document.getElementById('kdl-manager-sort') as HTMLSelectElement).value;

    let visibleItems = allItems.filter((item) => {
      const match = item.dataset.title!.includes(searchTerm);
      item.style.display = match ? 'flex' : 'none';
      return match;
    });

    visibleItems.sort((a, b) => {
      switch (sortMethod) {
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

    visibleItems.forEach((item) => listContainer.appendChild(item));
  };

  searchInput.addEventListener('input', applyFiltersAndSort);
  document.getElementById('kdl-manager-sort')!.addEventListener('change', applyFiltersAndSort);
  document.getElementById('kdl-manager-refresh')!.addEventListener('click', () => launchAuthorManager(true));

  document.getElementById('kdl-manager-select-all')!.addEventListener('click', () => {
    getCheckboxes().forEach((cb) => {
      if ((cb.closest('.post-item') as HTMLElement).style.display !== 'none') cb.checked = true;
    });
    updateCounter();
  });

  document.getElementById('kdl-manager-deselect-all')!.addEventListener('click', () => {
    getCheckboxes().forEach((cb) => {
      if ((cb.closest('.post-item') as HTMLElement).style.display !== 'none') cb.checked = false;
    });
    updateCounter();
  });

  let lastCheckedIndex: number | null = null;
  listContainer.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.post-item-open-link')) return;
    const item = target.closest('.post-item') as HTMLElement;
    if (!item) return;

    const checkboxes = getCheckboxes();
    const checkbox = item.querySelector('input[type="checkbox"]') as HTMLInputElement;
    const currentIndex = checkboxes.indexOf(checkbox);

    const desiredState = target.tagName === 'INPUT' ? checkbox.checked : !checkbox.checked;
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
    updateCounter();
  });

  downloadBtn.addEventListener('click', () => {
    const selectedIds = new Set<string>();
    getCheckboxes().forEach((cb) => {
      if (cb.checked) selectedIds.add(cb.dataset.id!);
    });
    // Built from the manager's post objects, so posts that are not on the current page download too
    const selectedPosts = currentPosts
      .filter((post) => selectedIds.has(String(post.id)))
      .map((post) => toPostDetails(post, currentAuthorName));
    if (selectedPosts.length > 0) {
      document.getElementById('kdl-author-manager-overlay')!.style.display = 'none';
      executeBulkDownload(selectedPosts);
    }
  });

  updateCounter();
}

export function createAuthorManagerButton(): HTMLElement {
  let managerBtn = document.getElementById('kdl-author-manager-btn');
  if (managerBtn) return managerBtn;
  return el(
    'button',
    {
      id: 'kdl-author-manager-btn',
      className: 'user-header__manage',
      type: 'button',
      title: 'Load all posts from this author into a powerful manager with search and bulk selection.',
      onClick: () => launchAuthorManager()
    },
    [
      el('span', { className: 'user-header__fav-icon' }, [icon('folders')]),
      el('span', { className: 'user-header__fav-text' }, ['Manage All Posts'])
    ]
  );
}
