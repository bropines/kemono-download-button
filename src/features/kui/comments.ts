import type { IconName } from '../../config/icons';
import { readStored, writeStored } from '../../state/gmStorage';
import { SELECTORS } from '../../config/selectors';
import { KUI_STORAGE_KEYS } from '../../config/storage';
import { el } from '../../utils/dom';
import { button, ensureKit, kitIcon, kitScope, label, select } from '../../ui/kit';
import { syncTranslateButton } from './translateButtons';
import { t, type UiKey } from '../../i18n';

type CommentsLayout = 'list' | 'grid' | 'carousel';

const LAYOUTS: Array<{ id: CommentsLayout; iconName: IconName; title: UiKey }> = [
  { id: 'list', iconName: 'list', title: 'kui.comments.layout.list' },
  { id: 'grid', iconName: 'layout-grid', title: 'kui.comments.layout.grid' },
  { id: 'carousel', iconName: 'gallery-horizontal-end', title: 'kui.comments.layout.carousel' },
];
const LAYOUT_CLASSES = LAYOUTS.map(({ id }) => `kui-comments--${id}`);
const LIMIT_OPTIONS = [4, 10, 20, 50, 100, 0]; // 0 = all
const DEFAULT_LAYOUT: CommentsLayout = 'grid';
// The list takes far more room per comment, so it keeps its own, shorter limit
const LIMITS = {
  list: { key: KUI_STORAGE_KEYS.COMMENTS_LIST_LIMIT, fallback: 4 },
  cards: { key: KUI_STORAGE_KEYS.COMMENTS_LIMIT, fallback: 20 },
};

// Comments revealed by "Show more", per container element (a new page brings a new element)
const revealedCounts = new WeakMap<Element, number>();
// Re-measures grid cards when the column width changes
const resizeObservers = new WeakMap<Element, ResizeObserver>();
const CARD_CLASSES = ['kui-comment-clipped', 'kui-comment-expandable', 'kui-comment-expanded'];
let delegatedListenersBound = false;

function readLayout(): CommentsLayout {
  const value = readStored<string>(KUI_STORAGE_KEYS.COMMENTS_LAYOUT, DEFAULT_LAYOUT);
  return LAYOUTS.some(({ id }) => id === value) ? (value as CommentsLayout) : DEFAULT_LAYOUT;
}

function limitSetting(layout: CommentsLayout): { key: string; fallback: number } {
  return layout === 'list' ? LIMITS.list : LIMITS.cards;
}

function readLimit(layout: CommentsLayout): number {
  const { key, fallback } = limitSetting(layout);
  const value = Number(readStored<number>(key, fallback));
  return LIMIT_OPTIONS.includes(value) ? value : fallback;
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

// Author replies are flat siblings that point at their parent via .comment__reply > a[href="#<id>"]:
// move each one under its parent. data-kui-index keeps the original order for removeCommentsLayout.
function threadReplies(container: HTMLElement): void {
  const direct = getComments(container);
  let nextIndex = container.querySelectorAll('.comment[data-kui-index]').length;
  direct.forEach((comment) => {
    if (comment.dataset.kuiIndex === undefined) comment.dataset.kuiIndex = String(nextIndex++);
  });

  direct.forEach((comment) => {
    const href = comment.querySelector(':scope > .comment__body > .comment__reply a')?.getAttribute('href') || '';
    const parentId = href.match(/^#([\w-]+)$/)?.[1];
    if (!parentId || parentId === comment.id) return;
    const parent = container.querySelector<HTMLElement>(`.comment[id="${parentId}"]`);
    if (!parent || comment.contains(parent)) return;

    let replies = parent.querySelector<HTMLElement>(':scope > .kui-comment-replies');
    if (!replies) {
      replies = el('div', { className: 'kui-comment-replies' });
      parent.appendChild(replies);
    }
    replies.appendChild(comment);
  });
}

// "2026-01-25 07:37:26.735000" -> "2026-01-25 07:37"; the full value stays in the tooltip
function shortenTimestamps(container: HTMLElement): void {
  container.querySelectorAll<HTMLElement>('.comment__footer .timestamp:not([data-kui-full-time])').forEach((time) => {
    const full = time.textContent?.trim() || '';
    const match = full.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
    if (!match) return;
    time.dataset.kuiFullTime = full;
    time.title = full;
    time.textContent = `${match[1]} ${match[2]}`;
  });
}

function countReplies(comment: HTMLElement): number {
  return comment.querySelectorAll(':scope > .kui-comment-replies > .comment').length;
}

function renderExpandButton(button: HTMLElement, expanded: boolean, replyCount: number): void {
  const state = `${expanded}:${replyCount}`;
  // Re-rendering on every tick would feed the MutationObserver that runs the tick
  if (button.dataset.state === state) return;
  button.dataset.state = state;
  button.title = expanded ? t('kui.comments.collapse') : replyCount ? t('kui.comments.expandReplies', { count: replyCount }) : t('kui.comments.expand');
  button.setAttribute('aria-expanded', String(expanded));
  button.replaceChildren(...(replyCount && !expanded
    ? [kitIcon('message-square'), el('span', { textContent: String(replyCount) })]
    : [kitIcon(expanded ? 'chevron-up' : 'chevron-down')]));
}

function setExpanded(comment: HTMLElement, expanded: boolean): void {
  comment.classList.toggle('kui-comment-expanded', expanded);
  const button = comment.querySelector<HTMLElement>(':scope > .comment__footer > .kui-comment-expand-btn');
  if (button) renderExpandButton(button, expanded, countReplies(comment));
}

// Grid and carousel cards share one height: a card whose text is cut off or that holds a thread gets an expand toggle
function syncExpanders(container: HTMLElement, layout: CommentsLayout): void {
  // Measure every card before changing classes or adding buttons. Interleaving reads
  // and writes forces a full layout for each comment on long threads.
  const cards = getComments(container).map((comment) => {
    const footer = comment.querySelector<HTMLElement>(':scope > .comment__footer');
    const button = footer?.querySelector<HTMLElement>(':scope > .kui-comment-expand-btn') ?? null;
    const replyCount = countReplies(comment);
    const body = comment.querySelector<HTMLElement>(':scope > .comment__body');
    const expanded = comment.classList.contains('kui-comment-expanded');
    const measurable = !!footer && layout !== 'list' && !expanded && (!body || body.getClientRects().length > 0);
    const clipped = measurable && !!body && body.scrollHeight > body.clientHeight + 1;
    return { comment, footer, button, replyCount, expanded, measurable, clipped };
  });
  cards.forEach(({ comment, footer, button: existingButton, replyCount, expanded, measurable, clipped }) => {
    let button = existingButton;
    if (!footer || layout === 'list') {
      button?.remove();
      comment.classList.remove(...CARD_CLASSES);
      return;
    }
    // Expanded and hidden cards can't be measured, they keep their last state.
    if (measurable) {
      comment.classList.toggle('kui-comment-clipped', clipped);
      comment.classList.toggle('kui-comment-expandable', clipped || replyCount > 0);
    }
    if (!button) {
      button = el('button', {
        type: 'button',
        className: 'kdl-scope kdl-ui-btn kdl-ui-btn--ghost kdl-ui-btn--size-sm kui-comment-expand-btn',
        dataset: { kuiCommentExpand: 'true' },
      });
      footer.appendChild(button);
    }
    renderExpandButton(button, expanded, replyCount);
  });
}

// Kit controls; their handlers are delegated to document (see bindDelegatedListeners), so a toolbar
// restored from a history snapshot keeps working. Hence data attributes rather than onClick options.
function buildToolbar(): HTMLElement {
  ensureKit();
  const iconButton = (iconName: IconName, title: string, data: Record<string, string>) => {
    const btn = button({ icon: iconName, variant: 'ghost', size: 'icon', ariaLabel: title, title, className: 'kui-comments-btn' });
    Object.assign(btn.dataset, data);
    return btn;
  };
  const limit = select({
    options: LIMIT_OPTIONS.map((value) => ({ value: String(value), label: value === 0 ? t('kui.comments.limitAll') : String(value) })),
    className: 'kui-comments-limit-select',
  });
  limit.dataset.kuiCommentsLimit = 'true';
  if (!limit.id) limit.id = 'kui-comments-limit';
  const layouts = el('div', { className: 'kui-comments-layouts' }, LAYOUTS.map(({ id, iconName, title }) =>
    iconButton(iconName, t(title), { kuiCommentsLayout: id })
  ));
  layouts.setAttribute('role', 'group');
  layouts.setAttribute('aria-label', t('kui.comments.layout'));
  return kitScope([
    el('span', { className: 'kui-comments-count' }),
    layouts,
    el('div', { className: 'kui-comments-limit' }, [label({ text: t('kui.comments.show'), htmlFor: limit.id }), limit]),
    el('div', { className: 'kui-comments-nav' }, [
      iconButton('chevron-left', t('kui.comments.previous'), { kuiCommentsScroll: '-1' }),
      iconButton('chevron-right', t('kui.comments.next'), { kuiCommentsScroll: '1' }),
    ]),
  ], { className: 'kui-comments-toolbar' });
}

// Idempotent: safe to run on every re-init, after site re-renders and on restored history snapshots
function applyCommentsView(container: HTMLElement, toolbar: HTMLElement): void {
  threadReplies(container);
  shortenTimestamps(container);
  // Top-level threads are what the layout and the limit work with
  const comments = getComments(container);
  const allComments = Array.from(container.querySelectorAll<HTMLElement>('.comment'));
  container.querySelectorAll('.kui-comment-replies > .kui-comment-hidden').forEach((reply) => reply.classList.remove('kui-comment-hidden'));
  const layout = readLayout();
  const limit = readLimit(layout);
  const visibleCount = limit === 0 ? comments.length : Math.min(comments.length, Math.max(limit, revealedCounts.get(container) ?? 0));

  LAYOUT_CLASSES.forEach((name) => container.classList.toggle(name, name === `kui-comments--${layout}`));
  container.classList.add('kdl-tokens');
  comments.forEach((comment, index) => comment.classList.toggle('kui-comment-hidden', index >= visibleCount));

  const count = toolbar.querySelector('.kui-comments-count');
  if (count) {
    const total = allComments.length;
    const hasThreads = total > comments.length;
    const text = visibleCount < comments.length
      ? t(hasThreads ? 'kui.comments.showingThreads' : 'kui.comments.showingComments', { shown: visibleCount, count: comments.length })
      : hasThreads ? t('kui.comments.totalInThreads', { count: total, threads: comments.length }) : t('kui.comments.total', { count: total });
    if (count.textContent !== text) count.textContent = text;
  }
  toolbar.querySelectorAll<HTMLElement>('[data-kui-comments-layout]').forEach((button) => {
    button.classList.toggle('kui-active', button.dataset.kuiCommentsLayout === layout);
    const pressed = String(button.dataset.kuiCommentsLayout === layout);
    if (button.getAttribute('aria-pressed') !== pressed) button.setAttribute('aria-pressed', pressed);
  });
  const limitSelect = toolbar.querySelector<HTMLSelectElement>('[data-kui-comments-limit]');
  if (limitSelect) limitSelect.value = String(limit);
  toolbar.classList.toggle('kui-comments-toolbar--carousel', layout === 'carousel');

  const next = container.nextElementSibling;
  let moreButton = next?.classList.contains('kui-comments-more') ? (next as HTMLElement) : null;
  const remaining = comments.length - visibleCount;
  if (remaining > 0) {
    if (!moreButton) {
      moreButton = el('button', {
        type: 'button',
        className: 'kdl-scope kdl-ui-btn kdl-ui-btn--outline kdl-ui-btn--size-sm kui-comments-more',
        dataset: { kuiCommentsMore: 'true' },
      });
      container.after(moreButton);
    }
    const text = t('kui.comments.showMore', { count: Math.min(limit, remaining), left: remaining });
    if (moreButton.textContent !== text) moreButton.textContent = text;
  } else {
    moreButton?.remove();
  }

  // One translate button per comment (and reply), next to its timestamp
  allComments.forEach((comment) => {
    syncTranslateButton(
      comment.querySelector(':scope > .comment__footer') || comment,
      'comment',
      !!comment.querySelector(':scope > .comment__body .comment__message')
    );
  });

  // Measured last, once the footer holds all its buttons. The first time, the new ResizeObserver's initial
  // callback does it: it runs on the browser's own layout before the first paint, whereas measuring here
  // forced an extra layout of the whole page in the middle of the mount (~45 ms on a post with comments)
  if (!resizeObservers.has(container) && typeof ResizeObserver === 'function') {
    const observer = new ResizeObserver(() => syncExpanders(container, readLayout()));
    observer.observe(container);
    resizeObservers.set(container, observer);
  } else {
    syncExpanders(container, layout);
  }
}

function bindDelegatedListeners(): void {
  if (delegatedListenersBound) return;
  delegatedListenersBound = true;

  // Delegated to document: an htmx history snapshot can bring the toolbar back without any listeners,
  // and SPA re-renders replace the elements at will
  document.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    // An expanded grid card lies over its neighbours: a click anywhere else folds it back
    document.querySelectorAll<HTMLElement>('.kui-comments--grid > .kui-comment-expanded').forEach((comment) => {
      if (!target || !comment.contains(target)) setExpanded(comment, false);
    });
    const control = target?.closest<HTMLElement>(
      '[data-kui-comments-layout], [data-kui-comments-scroll], [data-kui-comments-more], [data-kui-comment-expand]'
    );
    const parts = control && findCommentsParts(control);
    if (!control || !parts) return;
    event.preventDefault();
    const { container, toolbar } = parts;

    if (control.dataset.kuiCommentExpand) {
      const comment = control.closest<HTMLElement>('.comment');
      if (comment) setExpanded(comment, !comment.classList.contains('kui-comment-expanded'));
      return;
    }

    if (control.dataset.kuiCommentsScroll) {
      container.scrollBy({ left: Number(control.dataset.kuiCommentsScroll) * container.clientWidth * 0.9, behavior: 'smooth' });
      return;
    }
    if (control.dataset.kuiCommentsLayout) {
      writeStored(KUI_STORAGE_KEYS.COMMENTS_LAYOUT, control.dataset.kuiCommentsLayout);
      container.scrollLeft = 0;
      container.querySelectorAll('.kui-comment-expanded').forEach((comment) => comment.classList.remove('kui-comment-expanded'));
      // Each layout has its own limit, so "Show more" starts over
      revealedCounts.delete(container);
    } else {
      const shown = getComments(container).filter((comment) => !comment.classList.contains('kui-comment-hidden')).length;
      revealedCounts.set(container, shown + readLimit(readLayout()));
    }
    applyCommentsView(container, toolbar);
  });

  document.addEventListener('change', (event) => {
    const select = (event.target as HTMLElement | null)?.closest<HTMLSelectElement>('[data-kui-comments-limit]');
    const parts = select && findCommentsParts(select);
    if (!select || !parts) return;
    writeStored(limitSetting(readLayout()).key, Number(select.value));
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

// Leaves the site's own markup, so history snapshots and swaps never carry a half-applied layout.
// Translations are restored separately by removeTranslateButtons(), which must run first.
export function removeCommentsLayout(): void {
  document.querySelectorAll<HTMLElement>('[data-kui-full-time]').forEach((time) => {
    time.textContent = time.dataset.kuiFullTime || time.textContent;
    time.removeAttribute('title');
    delete time.dataset.kuiFullTime;
  });
  document.querySelectorAll('.kui-comments-toolbar, .kui-comments-more, .kui-comment-expand-btn').forEach((node) => node.remove());
  document.querySelectorAll<HTMLElement>('.post__comments').forEach((container) => {
    resizeObservers.get(container)?.disconnect();
    resizeObservers.delete(container);
    container.classList.remove(...LAYOUT_CLASSES, 'kdl-tokens');
    // Put threaded replies back into the site's original flat order
    Array.from(container.querySelectorAll<HTMLElement>('.comment[data-kui-index]'))
      .sort((a, b) => Number(a.dataset.kuiIndex) - Number(b.dataset.kuiIndex))
      .forEach((comment) => {
        container.appendChild(comment);
        delete comment.dataset.kuiIndex;
      });
    container.querySelectorAll('.kui-comment-replies').forEach((node) => node.remove());
  });
  document.querySelectorAll('.kui-comment-hidden, .kui-comment-clipped, .kui-comment-expandable, .kui-comment-expanded')
    .forEach((comment) => comment.classList.remove('kui-comment-hidden', ...CARD_CLASSES));
}
