import { fetchAllAuthorPosts } from '../../api/kemonoApi';
import { executeBulkDownload } from '../../services/downloadService';
import { getSettings, state } from '../../state/store';
import { el } from '../../utils/dom';
import { getApiUrl, getThumbnailUrl, sanitizeFilename } from '../../utils/helpers';

export async function launchAuthorManager(forceRefresh = false): Promise<void> {
  let overlay = document.getElementById('kdl-author-manager-overlay');
  if (!overlay) {
    overlay = el('div', { id: 'kdl-author-manager-overlay' });
    overlay.innerHTML = `
      <div id="kdl-author-manager-modal">
        <div id="kdl-manager-header"><h3 id="kdl-manager-title"></h3><em id="kdl-manager-cache-status" style="font-size: 0.8em; color: #aaa; margin-left: 10px;"></em></div>
        <div id="kdl-manager-controls" style="flex-wrap: wrap;">
            <button id="kdl-manager-refresh" class="kdl-manager-btn" title="Force Refresh" style="background-color: #17a2b8;">🔄</button>
            <input type="text" id="kdl-manager-search" placeholder="Search by title...">
            <select id="kdl-manager-sort" class="kdl-manager-btn" style="padding: 8px 6px;">
                <option value="date-desc">Newest First</option><option value="date-asc">Oldest First</option>
                <option value="files-desc">Most Files</option><option value="files-asc">Fewest Files</option>
                <option value="title-asc">Title (A-Z)</option><option value="title-desc">Title (Z-A)</option>
            </select>
            <button id="kdl-manager-select-all" class="kdl-manager-btn" style="background-color: #007bff;">Select Visible</button>
            <button id="kdl-manager-deselect-all" class="kdl-manager-btn" style="background-color: #dc3545;">Deselect All</button>
        </div>
        <div id="kdl-manager-post-list"></div>
        <div id="kdl-manager-footer">
            <span id="kdl-manager-counter">Selected: 0</span>
            <div>
                <button id="kdl-manager-download" class="kdl-manager-btn" style="background-color: #28a745;" disabled>Download Selected</button>
                <button id="kdl-manager-close" class="kdl-manager-btn" style="background-color: #6c757d;">Close</button>
            </div>
        </div>
      </div>
    `;
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
  listContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Fetching all post data from API...</p>';
  const allPosts = await fetchAllAuthorPosts(service, userID);

  if (allPosts.length > 0) {
    if (state.settings.cacheDurationHours > 0) {
      await GM_setValue(cacheKey, { timestamp: Date.now(), postList: allPosts });
    }
    title.textContent = `Manage ${allPosts.length} posts by ${authorName}`;
    populateManagerList(allPosts);
    setupManagerEventListeners();
  } else {
    title.textContent = `Failed to load posts for ${authorName}`;
    listContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Could not retrieve post list.</p>';
  }
}

export function populateManagerList(posts: any[]): void {
  const listContainer = document.getElementById('kdl-manager-post-list')!;
  const fragment = document.createDocumentFragment();

  posts.forEach((post) => {
    const postDate = post.published ? new Date(post.published).toISOString().split('T')[0] : 'No Date';
    const fileCount = (post.file ? 1 : 0) + (post.attachments ? post.attachments.length : 0);
    const item = el('div', {
      className: 'post-item',
      dataset: {
        id: post.id,
        title: post.title.toLowerCase(),
        date: post.published || '0',
        files: String(fileCount)
      }
    });

    let previewHtml = '<div class="post-item-preview"></div>';
    if (post.file?.path) {
      const pathParts = post.file.path.split('/').filter((p: string) => p);
      const fileName = pathParts.pop();
      const thumbUrl = getThumbnailUrl(`${pathParts.join('/')}/${fileName}`);
      previewHtml = `<img src="${thumbUrl}" class="post-item-preview" loading="lazy">`;
    }

    const postUrl = getApiUrl(`/${post.service}/user/${post.user}/post/${post.id}`);

    item.innerHTML = `
      ${previewHtml}
      <input type="checkbox" data-id="${post.id}">
      <div class="post-item-label">
          <span class="post-item-title">${sanitizeFilename(post.title)}</span>
          <span class="post-item-date">${postDate} | Files: ${fileCount} | ID: ${post.id}</span>
      </div>
      <a href="${postUrl}" target="_blank" class="post-item-open-link" title="Open post in new tab">↗️</a>
    `;
    fragment.appendChild(item);
  });

  listContainer.innerHTML = '';
  listContainer.appendChild(fragment);
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
