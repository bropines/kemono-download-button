import { executeBulkDownload } from '../../services/downloadService';
import { appState } from '../../state/store';
import { el } from '../../utils/dom';

let lastCheckedIndex: number | null = null;

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
  const btn = document.getElementById('kdl-bulk-download-btn') as HTMLButtonElement | null;
  const panel = document.getElementById('kdl-bulk-panel');

  if (btn) {
    btn.textContent = `Download Selected (${selectedCount})`;
    btn.disabled = selectedCount === 0;
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

    // 1. Intercept Shift+Click anywhere on the post card so the link/image doesn't open
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

    // 2. Handle direct click on checkbox element
    checkbox.addEventListener('click', (event: MouseEvent) => {
      // Do NOT call event.preventDefault() here so the checkbox native state updates!
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
    el('button', { id: 'kdl-bulk-download-btn', disabled: true, onClick: () => executeBulkDownload() }, ['Download Selected (0)'])
  ]);

  document.body.appendChild(panel);
}
