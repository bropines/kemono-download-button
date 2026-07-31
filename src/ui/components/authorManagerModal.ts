import { getApiAdapter } from '../../api';
import { executeBulkDownload } from '../../services/downloadService';
import { getSettings, state } from '../../state/store';
import { el } from '../../utils/dom';
import { getApiUrl, getThumbnailUrl, sanitizeFilename } from '../../utils/helpers';

export async function launchAuthorManager(forceRefresh = false): Promise<void> {
  let overlay = document.getElementById('kdl-author-manager-overlay');
  if (!overlay) {
    overlay = el('div', { id: 'kdl-author-manager-overlay' }, [
      el('div', { id: 'kdl-author-manager-modal' }, [
        el('div', { id: 'kdl-manager-header' }, [
          el('h3', { id: 'kdl-manager-title' }),
          el('em', { id: 'kdl-manager-cache-status', style: { fontSize: '0.8em', color: '#aaa', marginLeft: '10px' } })
        ]),
        el('div', { id: 'kdl-manager-controls', style: { flexWrap: 'wrap' } }, [
          el('button', { id: 'kdl-manager-refresh', className: 'kdl-manager-btn', title: 'Force Refresh', style: { backgroundColor: '#17a2b8' } }, ['🔄']),
          el('input', { type: 'text', id: 'kdl-manager-search', placeholder: 'Search by title...' }),
          el('select', { id: 'kdl-manager-sort', className: 'kdl-manager-btn', style: { padding: '8px 6px' } }, [
            el('option', { value: 'date-desc' }, ['Newest First']),
            el('option', { value: 'date-asc' }, ['Oldest First']),
            el('option', { value: 'files-desc' }, ['Most Files']),
            el('option', { value: 'files-asc' }, ['Fewest Files']),
            el('option', { value: 'title-asc' }, ['Title (A-Z)']),
            el('option', { value: 'title-desc' }, ['Title (Z-A)'])
          ]),
          el('button', { id: 'kdl-manager-select-all', className: 'kdl-manager-btn', style: { backgroundColor: '#007bff' } }, ['Select Visible']),
          el('button', { id: 'kdl-manager-deselect-all', className: 'kdl-manager-btn', style: { backgroundColor: '#dc3545' } }, ['Deselect All'])
        ]),
        el('div', { id: 'kdl-manager-post-list' }),
        el('div', { id: 'kdl-manager-footer' }, [
          el('span', { id: 'kdl-manager-counter' }, ['Selected: 0']),
          el('div', {}, [
            el('button', { id: 'kdl-manager-download', className: 'kdl-manager-btn', style: { backgroundColor: '#28a745' }, disabled: true }, ['Download Selected']),
            el('button', { id: 'kdl-manager-close', className: 'kdl-manager-btn', style: { backgroundColor: '#6c757d' } }, ['Close'])
          ])
        ])
      ])
    ]);
    document.body.appendChild(overlay);
    overlay.querySelector('#kdl-manager-close')!.addEventListener('click', () => (overlay!.style.display = 'none'));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay!.style.display = 'none';
    });
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
  const cacheKey = `kemono_posts_cache_${service}_${userID}`;

  if (!forceRefresh && state.settings.cacheDurationHours > 0) {
    const cachedData = await GM_getValue(cacheKey, null);
    if (cachedData && cachedData.postList) {
      const cacheAgeHours = (Date.now() - cachedData.timestamp) / (1000 * 60 * 60);
      if (cacheAgeHours < state.settings.cacheDurationHours) {
        title.textContent = `Manage ${cachedData.postList.length} posts by ${authorName}`;
        populateManagerList(cachedData.postList);
        setupManagerEventListeners();
        return;
      }
    }
  }

  title.textContent = `Loading posts for: ${authorName}`;
  listContainer.replaceChildren(el('p', { style: { textAlign: 'center', padding: '20px' } }, ['Fetching all post data from API...']));
  const allPosts = await getApiAdapter().fetchAllAuthorPosts(service, userID);

  if (allPosts.length > 0) {
    if (state.settings.cacheDurationHours > 0) {
      await GM_setValue(cacheKey, { timestamp: Date.now(), postList: allPosts });
    }
    title.textContent = `Manage ${allPosts.length} posts by ${authorName}`;
    populateManagerList(allPosts);
    setupManagerEventListeners();
  } else {
    title.textContent = `Failed to load posts for ${authorName}`;
    listContainer.replaceChildren(el('p', { style: { textAlign: 'center', padding: '20px' } }, ['Could not retrieve post list.']));
  }
}

export function populateManagerList(posts: any[]): void {
  const listContainer = document.getElementById('kdl-manager-post-list')!;
  const fragment = document.createDocumentFragment();

  posts.forEach((post) => {
    const postDate = post.published ? new Date(post.published).toISOString().split('T')[0] : 'No Date';
    const fileCount = (post.file ? 1 : 0) + (post.attachments ? post.attachments.length : 0);

    let previewElem: HTMLElement;
    if (post.file?.path) {
      const pathParts = post.file.path.split('/').filter((p: string) => p);
      const fileName = pathParts.pop();
      const thumbUrl = getThumbnailUrl(`${pathParts.join('/')}/${fileName}`);
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
          id: post.id,
          title: post.title.toLowerCase(),
          date: post.published || '0',
          files: String(fileCount)
        }
      },
      [
        previewElem,
        el('input', { type: 'checkbox', dataset: { id: post.id } }),
        el('div', { className: 'post-item-label' }, [
          el('span', { className: 'post-item-title' }, [sanitizeFilename(post.title)]),
          el('span', { className: 'post-item-date' }, [`${postDate} | Files: ${fileCount} | ID: ${post.id}`])
        ]),
        el('a', { href: postUrl, target: '_blank', className: 'post-item-open-link', title: 'Open post in new tab' }, ['↗️'])
      ]
    );

    fragment.appendChild(item);
  });

  listContainer.replaceChildren(fragment);
}

export function setupManagerEventListeners(): void {
  const searchInput = document.getElementById('kdl-manager-search') as HTMLInputElement;
  const listContainer = document.getElementById('kdl-manager-post-list')!;
  const downloadBtn = document.getElementById('kdl-manager-download') as HTMLButtonElement;
  const counter = document.getElementById('kdl-manager-counter')!;

  const getCheckboxes = () => Array.from(listContainer.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];

  const updateCounter = () => {
    const count = getCheckboxes().filter((cb) => cb.checked).length;
    counter.textContent = `Selected: ${count}`;
    downloadBtn.disabled = count === 0;
  };

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

    if (target.tagName !== 'INPUT') checkbox.checked = !checkbox.checked;

    if (e.shiftKey && lastCheckedIndex !== null) {
      const start = Math.min(currentIndex, lastCheckedIndex);
      const end = Math.max(currentIndex, lastCheckedIndex);
      const isChecked = checkboxes[lastCheckedIndex].checked;
      for (let i = start; i <= end; i++) checkboxes[i].checked = isChecked;
    }
    lastCheckedIndex = currentIndex;
    updateCounter();
  });

  downloadBtn.addEventListener('click', () => {
    const selectedIds = new Set<string>();
    getCheckboxes().forEach((cb) => {
      if (cb.checked) selectedIds.add(cb.dataset.id!);
    });
    if (selectedIds.size > 0) {
      document.getElementById('kdl-author-manager-overlay')!.style.display = 'none';
      executeBulkDownload(selectedIds);
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
      title: 'Load all posts from this author into a powerful manager with search and bulk selection.',
      style: {
        backgroundColor: '#6f42c1',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '0 12px',
        height: '32px',
        fontSize: '14px',
        cursor: 'pointer'
      },
      onClick: () => launchAuthorManager()
    },
    ['🗂️ Manage All Posts']
  );
}
