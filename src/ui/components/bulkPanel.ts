import { executeBulkDownload } from '../../services/downloadService';
import { getPostCardDetails } from '../../services/collectorService';
import { appState } from '../../state/store';
import { PostDetails } from '../../types';
import { el } from '../../utils/dom';
import { showMultiPostFilePickerModal } from './filePickerModal';

let lastCheckedIndex: number | null = null;
let selectionPageUrl = '';

export function getSelectedPostsDetails(): PostDetails[] {
  const postCards = Array.from(document.querySelectorAll('article.post-card[data-id]')) as HTMLElement[];
  const pageAuthorName = document.querySelector('.post-header__name, .user-header__name span[itemprop="name"]')?.textContent?.trim() || 'UnknownAuthor';
  const selectedDetails: PostDetails[] = [];

  postCards.forEach((card) => {
    const checkbox = card.querySelector('.kdl-post-checkbox') as HTMLInputElement | null;
    if (checkbox && checkbox.checked) {
      selectedDetails.push(getPostCardDetails(card, pageAuthorName));
    }
  });

  return selectedDetails;
}

export function updateSelectionState(): void {
  const postCards = Array.from(document.querySelectorAll('article.post-card[data-id]')) as HTMLElement[];
  appState.selectedPostIds.clear();
  postCards.forEach((card) => {
    const checkbox = card.querySelector('.kdl-post-checkbox') as HTMLInputElement | null;
    if (checkbox && checkbox.checked) {
      appState.selectedPostIds.add(checkbox.dataset.id!);
    }
  });

  const selectedCount = appState.selectedPostIds.size;
  const downloadBtn = document.getElementById('kdl-bulk-download-btn') as HTMLButtonElement | null;
  const pickAttachmentsBtn = document.getElementById('kdl-bulk-pick-attachments-btn') as HTMLButtonElement | null;
  const panel = document.getElementById('kdl-bulk-panel');

  if (downloadBtn) {
    downloadBtn.textContent = `Download Selected (${selectedCount})`;
    downloadBtn.disabled = selectedCount === 0;
  }

  if (pickAttachmentsBtn) {
    pickAttachmentsBtn.textContent = `📎 Pick Attachments (${selectedCount})`;
    pickAttachmentsBtn.disabled = selectedCount === 0;
  }

  if (panel) {
    if (selectedCount > 0) {
      panel.classList.add('kdl-visible');
    } else {
      panel.classList.remove('kdl-visible');
    }
  }
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
  if (document.getElementById('kdl-bulk-panel')) return;
  const cardList = document.querySelector('.card-list');
  if (!cardList) return;

  const panel = el('div', { id: 'kdl-bulk-panel' }, [
    el(
      'button',
      {
        id: 'kdl-bulk-select-all',
        onClick: () =>
          document.querySelectorAll('article.post-card[data-id] .kdl-post-checkbox:not(:checked)').forEach((cb: any) => cb.click())
      },
      ['Select All']
    ),
    el(
      'button',
      {
        id: 'kdl-bulk-deselect-all',
        onClick: () =>
          document.querySelectorAll('article.post-card[data-id] .kdl-post-checkbox:checked').forEach((cb: any) => cb.click())
      },
      ['Deselect All']
    ),
    el('label', { style: { color: '#fff', fontSize: '0.9em' } }, ['Order: ']),
    el(
      'select',
      {
        id: 'kdl-bulk-sort-order',
        style: { backgroundColor: '#444', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '4px' }
      },
      [
        el('option', { value: 'selection' }, ['By Selection']),
        el('option', { value: 'oldest' }, ['Oldest First']),
        el('option', { value: 'newest' }, ['Newest First'])
      ]
    ),
    el('button', {
      id: 'kdl-bulk-pick-attachments-btn',
      disabled: true,
      onClick: () => {
        const selectedPosts = getSelectedPostsDetails();
        showMultiPostFilePickerModal(selectedPosts);
      }
    }, ['📎 Pick Attachments (0)']),
    el('button', { id: 'kdl-bulk-download-btn', disabled: true, onClick: () => executeBulkDownload() }, ['Download Selected (0)'])
  ]);

  document.body.appendChild(panel);
}
