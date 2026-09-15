import { SELECTORS } from '../../config/selectors';
import { KUI_STORAGE_KEYS } from '../../config/storage';
import { el } from '../../utils/dom';

type CommentsLayout = 'list' | 'grid' | 'carousel';

const LAYOUTS: Array<{ id: CommentsLayout; icon: string; title: string }> = [
  { id: 'list', icon: '☰', title: 'List' },
  { id: 'grid', icon: '▦', title: 'Grid' },
  { id: 'carousel', icon: '⇆', title: 'Carousel' },
];
const LAYOUT_CLASSES = LAYOUTS.map(({ id }) => `kui-comments--${id}`);
const LIMIT_OPTIONS = [10, 20, 50, 100, 0]; // 0 = all
const DEFAULT_LAYOUT: CommentsLayout = 'grid';
const DEFAULT_LIMIT = 20;

// Comments revealed by "Show more", per container element (a new page brings a new element)
const revealedCounts = new WeakMap<Element, number>();
let delegatedListenersBound = false;

const readValue = <T>(key: string, fallback: T): T => (typeof GM_getValue === 'function' ? GM_getValue<T>(key, fallback) : fallback);
const saveValue = (key: string, value: unknown): void => {
  if (typeof GM_setValue === 'function') GM_setValue(key, value);
};

function readLayout(): CommentsLayout {
  const value = readValue<string>(KUI_STORAGE_KEYS.COMMENTS_LAYOUT, DEFAULT_LAYOUT);
  return LAYOUTS.some(({ id }) => id === value) ? (value as CommentsLayout) : DEFAULT_LAYOUT;
}

function readLimit(): number {
  const value = Number(readValue<number>(KUI_STORAGE_KEYS.COMMENTS_LIMIT, DEFAULT_LIMIT));
  return LIMIT_OPTIONS.includes(value) ? value : DEFAULT_LIMIT;
}

function getComments(container: Element): HTMLElement[] {
  return Array.from(container.children).filter((child): child is HTMLElement => child.classList.contains('comment'));
}

function findCommentsParts(node: Element): { container: HTMLElement; toolbar: HTMLElement } | null {
  const footer = node.closest(SELECTORS.postComments);
  const container = footer?.querySelector<HTMLElement>('.post__comments');
  const toolbar = footer?.querySelector<HTMLElement>('.kui-comments-toolbar');
  return container && toolbar ? { container, toolbar } : null;
}

function buildToolbar(): HTMLElement {
  return el('div', { className: 'kui-comments-toolbar' }, [
    el('span', { className: 'kui-comments-count' }),
    el('div', { className: 'kui-comments-layouts' }, LAYOUTS.map(({ id, icon, title }) =>
      el('button', { type: 'button', className: 'kui-comments-btn', title, dataset: { kuiCommentsLayout: id } }, [icon])
    )),
    el('label', { className: 'kui-comments-limit' }, [
      'Show',
      el('select', { dataset: { kuiCommentsLimit: 'true' } }, LIMIT_OPTIONS.map((limit) =>
        el('option', { value: String(limit) }, [limit === 0 ? 'All' : String(limit)])
      )),
    ]),
    el('div', { className: 'kui-comments-nav' }, [
      el('button', { type: 'button', className: 'kui-comments-btn', title: 'Previous', dataset: { kuiCommentsScroll: '-1' } }, ['‹']),
      el('button', { type: 'button', className: 'kui-comments-btn', title: 'Next', dataset: { kuiCommentsScroll: '1' } }, ['›']),
    ]),
  ]);
}

// Idempotent: safe to run on every re-init, after site re-renders and on restored history snapshots
function applyCommentsView(container: HTMLElement, toolbar: HTMLElement): void {
  const comments = getComments(container);
  const layout = readLayout();
  const limit = readLimit();
  const visibleCount = limit === 0 ? comments.length : Math.min(comments.length, Math.max(limit, revealedCounts.get(container) ?? 0));

  container.classList.remove(...LAYOUT_CLASSES);
  container.classList.add(`kui-comments--${layout}`);
  comments.forEach((comment, index) => comment.classList.toggle('kui-comment-hidden', index >= visibleCount));

  const count = toolbar.querySelector('.kui-comments-count');
  if (count) {
    count.textContent = visibleCount < comments.length
      ? `Showing ${visibleCount} of ${comments.length}`
      : `${comments.length} comment${comments.length === 1 ? '' : 's'}`;
  }
  toolbar.querySelectorAll<HTMLElement>('[data-kui-comments-layout]').forEach((button) => {
    button.classList.toggle('kui-active', button.dataset.kuiCommentsLayout === layout);
  });
  const limitSelect = toolbar.querySelector<HTMLSelectElement>('[data-kui-comments-limit]');
  if (limitSelect) limitSelect.value = String(limit);
  toolbar.classList.toggle('kui-comments-toolbar--carousel', layout === 'carousel');

  const next = container.nextElementSibling;
  let moreButton = next?.classList.contains('kui-comments-more') ? (next as HTMLElement) : null;
  const remaining = comments.length - visibleCount;
  if (remaining > 0) {
    if (!moreButton) {
      moreButton = el('button', { type: 'button', className: 'kui-comments-more', dataset: { kuiCommentsMore: 'true' } });
      container.after(moreButton);
    }
    moreButton.textContent = `Show ${Math.min(limit, remaining)} more (${remaining} left)`;
  } else {
    moreButton?.remove();
  }
}

function bindDelegatedListeners(): void {
  if (delegatedListenersBound) return;
  delegatedListenersBound = true;

  // Delegated to document: an htmx history snapshot can bring the toolbar back without any listeners,
  // and SPA re-renders replace the elements at will
  document.addEventListener('click', (event) => {
    const control = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      '[data-kui-comments-layout], [data-kui-comments-scroll], [data-kui-comments-more]'
    );
    const parts = control && findCommentsParts(control);
    if (!control || !parts) return;
    event.preventDefault();
    const { container, toolbar } = parts;

    if (control.dataset.kuiCommentsScroll) {
      container.scrollBy({ left: Number(control.dataset.kuiCommentsScroll) * container.clientWidth * 0.9, behavior: 'smooth' });
      return;
    }
    if (control.dataset.kuiCommentsLayout) {
      saveValue(KUI_STORAGE_KEYS.COMMENTS_LAYOUT, control.dataset.kuiCommentsLayout);
      container.scrollLeft = 0;
    } else {
      const shown = getComments(container).filter((comment) => !comment.classList.contains('kui-comment-hidden')).length;
      revealedCounts.set(container, shown + readLimit());
    }
    applyCommentsView(container, toolbar);
  });

  document.addEventListener('change', (event) => {
    const select = (event.target as HTMLElement | null)?.closest<HTMLSelectElement>('[data-kui-comments-limit]');
    const parts = select && findCommentsParts(select);
    if (!select || !parts) return;
    saveValue(KUI_STORAGE_KEYS.COMMENTS_LIMIT, Number(select.value));
    revealedCounts.delete(parts.container);
    applyCommentsView(parts.container, parts.toolbar);
  });
}

export function initializeComments(): void {
  const container = document.querySelector<HTMLElement>(`${SELECTORS.postComments} .post__comments`);
  if (!container || getComments(container).length === 0) return;
  bindDelegatedListeners();

  const footer = container.closest(SELECTORS.postComments)!;
  let toolbar = footer.querySelector<HTMLElement>('.kui-comments-toolbar');
  if (!toolbar) {
    toolbar = buildToolbar();
    container.before(toolbar);
  }
  applyCommentsView(container, toolbar);
}

// Leaves the site's own markup, so history snapshots and swaps never carry a half-applied layout
export function removeCommentsLayout(): void {
  document.querySelectorAll('.kui-comments-toolbar, .kui-comments-more').forEach((node) => node.remove());
  document.querySelectorAll('.post__comments').forEach((container) => container.classList.remove(...LAYOUT_CLASSES));
  document.querySelectorAll('.kui-comment-hidden').forEach((comment) => comment.classList.remove('kui-comment-hidden'));
}
