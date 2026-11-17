import { comparePostsAscending, executeBulkDownload } from '../../services/downloadService';
import { getPostCardDetails } from '../../services/collectorService';
import { appState } from '../../state/store';
import { PostDetails } from '../../types';
import { el } from '../../utils/dom';
import { badge, button, select, setButtonLoading } from '../kit';
import { mountOverlayStyles } from '../overlayStyles';
import { bulkPanelStyles } from '../../styles/components/bulkPanel.styles';
import { getDockSlot } from './fixedControls';
import { showMultiPostFilePickerModal } from './filePickerModal';

/**
 * Light-DOM marker for the router: it looks for #kdl-bulk-panel to know the panel was injected and removes it
 * on a creator change. The visible bar lives in the kit shadow root and only shows while the marker exists.
 */
const MARKER_ID = 'kdl-bulk-panel';

interface BulkBar {
  root: HTMLElement;
  count: HTMLElement;
  pick: HTMLButtonElement;
  download: HTMLButtonElement;
  sort: HTMLSelectElement;
}
let bar: BulkBar | null = null;

let lastCheckedIndex: number | null = null;
let selectionPageUrl = '';

// Selection survives paging through a creator (?o=): cards on other pages are gone from the DOM,
// so their details are kept from when they were ticked. The router clears selectedPostIds when
// the creator changes, and the stale details are pruned against it here.
const selectedDetails = new Map<string, PostDetails>();

function syncSelectionFromPage(): void {
  for (const id of selectedDetails.keys()) {
    if (!appState.selectedPostIds.has(id)) selectedDetails.delete(id);
  }
  const pageAuthorName = document.querySelector('.post-header__name, .user-header__name span[itemprop="name"]')?.textContent?.trim() || 'UnknownAuthor';
  document.querySelectorAll<HTMLElement>('article.post-card[data-id]').forEach((card) => {
    const checkbox = card.querySelector('.kdl-post-checkbox') as HTMLInputElement | null;
    const id = checkbox?.dataset.id;
    if (!checkbox || !id) return;
    if (checkbox.checked) {
      selectedDetails.set(id, getPostCardDetails(card, pageAuthorName));
      appState.selectedPostIds.add(id);
    } else {
      selectedDetails.delete(id);
      appState.selectedPostIds.delete(id);
    }
  });
}

export function getSelectedPostsDetails(): PostDetails[] {
  syncSelectionFromPage();
  return [...selectedDetails.values()];
}

export function updateSelectionState(): void {
  syncSelectionFromPage();

  if (!bar) return;
  const selectedCount = appState.selectedPostIds.size;
  const visible = selectedCount > 0 && !!document.getElementById(MARKER_ID);
  bar.count.textContent = `${selectedCount} selected`;
  if (!bar.download.hasAttribute('data-loading')) bar.download.disabled = selectedCount === 0;
  bar.pick.disabled = selectedCount === 0;
  bar.root.dataset.state = visible ? 'open' : 'closed';
}

const clickCheckboxes = (selector: string) =>
  document.querySelectorAll<HTMLInputElement>(`article.post-card[data-id] .kdl-post-checkbox${selector}`).forEach((cb) => cb.click());

function sortPosts(posts: PostDetails[], order: string): PostDetails[] {
  if (order === 'oldest') return [...posts].sort(comparePostsAscending);
  if (order === 'newest') return [...posts].sort((a, b) => comparePostsAscending(b, a));
  return posts;
}

/** Downloads the selection in the chosen order, then drops the downloaded posts from it. */
async function downloadSelection(): Promise<void> {
  if (!bar) return;
  const { download, sort } = bar;
  const posts = sortPosts(getSelectedPostsDetails(), sort.value);
  setButtonLoading(download, true);
  try {
    await executeBulkDownload(posts);
  } finally {
    setButtonLoading(download, false);
    for (const post of posts) {
      appState.selectedPostIds.delete(String(post.postID));
      selectedDetails.delete(String(post.postID));
    }
    updateSelectionState();
  }
}

function buildBulkBar(): BulkBar {
  const count = badge({ text: '0 selected' });
  count.setAttribute('aria-live', 'polite');
  const sort = select({
    id: 'kdl-bulk-sort-order',
    ariaLabel: 'Download order',
    options: [
      { value: 'selection', label: 'By selection' },
      { value: 'oldest', label: 'Oldest first' },
      { value: 'newest', label: 'Newest first' },
    ],
  });
  const pick = button({
    id: 'kdl-bulk-pick-attachments-btn',
    label: 'Pick attachments',
    icon: 'paperclip',
    variant: 'secondary',
    size: 'sm',
    disabled: true,
    onClick: () => showMultiPostFilePickerModal(getSelectedPostsDetails()),
  });
  const download = button({
    id: 'kdl-bulk-download-btn',
    label: 'Download',
    icon: 'download',
    size: 'sm',
    disabled: true,
    onClick: () => void downloadSelection(),
  });
  const root = el('div', { className: 'kdl-ov-bulkbar', dataset: { state: 'closed' } }, [
    count,
    button({ id: 'kdl-bulk-select-all', label: 'Select all', variant: 'outline', size: 'sm', onClick: () => clickCheckboxes(':not(:checked)') }),
    button({ id: 'kdl-bulk-deselect-all', label: 'Deselect all', variant: 'ghost', size: 'sm', onClick: () => clickCheckboxes(':checked') }),
    el('span', { className: 'kdl-ov-bulkbar__sep' }),
    sort,
    pick,
    download,
  ]);
  root.setAttribute('role', 'toolbar');
  root.setAttribute('aria-label', 'Selected posts');
  // Escape inside the bar clears the selection (the bar then hides)
  root.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || (event.target as HTMLElement).tagName === 'SELECT') return;
    event.stopPropagation();
    clickCheckboxes(':checked');
  });
  return { root, count, pick, download, sort };
}

const getPostCards = () => Array.from(document.querySelectorAll('article.post-card[data-id]')) as HTMLElement[];

function setCheckboxRange(cards: HTMLElement[], from: number, to: number, checked: boolean): void {
  for (let i = Math.min(from, to); i <= Math.max(from, to); i++) {
    const checkbox = cards[i]?.querySelector('.kdl-post-checkbox') as HTMLInputElement | null;
    if (checkbox) checkbox.checked = checked;
  }
}

export function initializeShiftClickLogic(): void {
  // The range anchor belongs to one page's card list (covers pagination and creator changes)
  if (selectionPageUrl !== window.location.href) {
    selectionPageUrl = window.location.href;
    lastCheckedIndex = null;
  }

  const postCards = getPostCards();
  if (postCards.length === 0) return;

  // This runs on every re-init while cards survive it, and checkboxes get recreated: bind each element
  // once and resolve the checkbox/index at click time, so a toggle is never applied twice or to a stale node
  postCards.forEach((card) => {
    if (!card.dataset.kdlShiftClickBound) {
      card.dataset.kdlShiftClickBound = 'true';
      card.addEventListener(
        'click',
        (event: MouseEvent) => {
          if (!event.shiftKey) return;
          const target = event.target as HTMLElement;
          if (target.closest('.post-card-download-controls, .kdl-post-checkbox')) return;
          const checkbox = card.querySelector('.kdl-post-checkbox') as HTMLInputElement | null;
          if (!checkbox) return;

          event.preventDefault();
          event.stopPropagation();

          const cards = getPostCards();
          const index = cards.indexOf(card);
          const desiredState = !checkbox.checked;
          checkbox.checked = desiredState;
          if (lastCheckedIndex !== null) setCheckboxRange(cards, index, lastCheckedIndex, desiredState);
          lastCheckedIndex = index;
          updateSelectionState();
        },
        true
      );
    }

    const checkbox = card.querySelector('.kdl-post-checkbox') as HTMLInputElement | null;
    if (checkbox && !checkbox.dataset.kdlShiftClickBound) {
      checkbox.dataset.kdlShiftClickBound = 'true';
      checkbox.addEventListener('click', (event: MouseEvent) => {
        const cards = getPostCards();
        const index = cards.indexOf(card);
        if (event.shiftKey && lastCheckedIndex !== null) setCheckboxRange(cards, index, lastCheckedIndex, checkbox.checked);
        lastCheckedIndex = index;
        updateSelectionState();
      });
    }
  });

  updateSelectionState();
}

export function createBulkDownloadPanel(): void {
  if (!document.querySelector('.card-list')) return;
  if (!document.getElementById(MARKER_ID)) document.body.appendChild(el('div', { id: MARKER_ID, hidden: true }));
  if (!bar?.root.isConnected) {
    mountOverlayStyles('kdl-bulk-styles', bulkPanelStyles);
    bar = buildBulkBar();
    getDockSlot('bulk').appendChild(bar.root);
  }
  updateSelectionState();
}
