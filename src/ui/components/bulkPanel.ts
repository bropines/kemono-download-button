import { executeBulkDownload } from '../../services/downloadService';
import { getPostCardDetails } from '../../services/collectorService';
import { appState } from '../../state/store';
import { PostDetails } from '../../types';
import { el } from '../../utils/dom';
import { showMultiPostFilePickerModal } from './filePickerModal';

let lastCheckedIndex: number | null = null;

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

export function initializeShiftClickLogic(): void {
  const postCards = Array.from(document.querySelectorAll('article.post-card[data-id]')) as HTMLElement[];
  if (postCards.length === 0) return;

  postCards.forEach((card, index) => {
    const checkbox = card.querySelector('.kdl-post-checkbox') as HTMLInputElement | null;
    if (!checkbox) return;

    card.addEventListener(
      'click',
      (event: MouseEvent) => {
        if (!event.shiftKey) return;
        const target = event.target as HTMLElement;
        if (target.closest('.post-card-download-controls')) return;

        event.preventDefault();
        event.stopPropagation();

        const desiredState = !checkbox.checked;
        checkbox.checked = desiredState;

        if (lastCheckedIndex !== null) {
          const start = Math.min(index, lastCheckedIndex);
          const end = Math.max(index, lastCheckedIndex);
          for (let i = start; i <= end; i++) {
            const cb = postCards[i].querySelector('.kdl-post-checkbox') as HTMLInputElement | null;
            if (cb) cb.checked = desiredState;
          }
        }
        lastCheckedIndex = index;
        updateSelectionState();
      },
      true
    );

    checkbox.addEventListener('click', (event: MouseEvent) => {
      if (event.shiftKey && lastCheckedIndex !== null) {
        const start = Math.min(index, lastCheckedIndex);
        const end = Math.max(index, lastCheckedIndex);
        const targetChecked = checkbox.checked;

        for (let i = start; i <= end; i++) {
          const cb = postCards[i].querySelector('.kdl-post-checkbox') as HTMLInputElement | null;
          if (cb) cb.checked = targetChecked;
        }
      }
      lastCheckedIndex = index;
      updateSelectionState();
    });
  });

  const pagination = document.querySelector('.paginator');
  if (pagination) {
    pagination.addEventListener('click', () => {
      lastCheckedIndex = null;
    });
  }

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
