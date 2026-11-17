import { SELECTORS } from '../../config/selectors';
import { readStored, writeStored } from '../../state/gmStorage';
import { KUI_STORAGE_KEYS } from '../../config/storage';

// Post ids are only unique per service and creator, so the key carries all three
const MAX_VIEWED_POSTS = 5000;

// Read once and kept in sync by the click listener; markViewedPosts runs on every re-init.
// Keys keep insertion order (the new keys are never integer-like), so the oldest come first
let viewedPostsCache: Record<string, boolean> | null = null;

function getViewedPosts(): Record<string, boolean> {
  if (!viewedPostsCache) {
    viewedPostsCache = readStored<Record<string, boolean>>(KUI_STORAGE_KEYS.POSTS, {});
  }
  return viewedPostsCache;
}

function viewedKey(card: Element): string | null {
  const postId = card.getAttribute("data-id");
  if (!postId) return null;
  return `${card.getAttribute("data-service") || ""}:${card.getAttribute("data-user") || ""}:${postId}`;
}

function isViewed(viewedPosts: Record<string, boolean>, card: Element): boolean {
  const key = viewedKey(card);
  // Older versions keyed by the bare post id
  return !!key && (!!viewedPosts[key] || !!viewedPosts[card.getAttribute("data-id")!]);
}

export function markViewedPosts(): void {
  const unmarkedCards = document.querySelectorAll(`${SELECTORS.postCard}:not(.kui-viewed)`);
  if (unmarkedCards.length === 0) return;
  const viewedPosts = getViewedPosts();
  unmarkedCards.forEach((card) => {
    if (isViewed(viewedPosts, card)) card.classList.add("kui-viewed");
  });
}

export function setupGlobalClickListener(): void {
  document.body.addEventListener("click", (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const link = target.closest(SELECTORS.postLink);
    if (!link) return;
    const card = link.closest(SELECTORS.postCard);
    const key = card && viewedKey(card);
    if (!card || !key) return;
    card.classList.add("kui-viewed");
    const viewedPosts = getViewedPosts();
    if (viewedPosts[key]) return;
    viewedPosts[key] = true;
    const keys = Object.keys(viewedPosts);
    for (let i = 0; i < keys.length - MAX_VIEWED_POSTS; i++) delete viewedPosts[keys[i]];
    writeStored(KUI_STORAGE_KEYS.POSTS, viewedPosts);
  }, true);
}

export function getViewedPostsCount(): number {
  return Object.keys(getViewedPosts()).length;
}

/** Forgets every viewed post and unmarks the cards on the page. */
export function clearViewedPosts(): void {
  viewedPostsCache = {};
  writeStored(KUI_STORAGE_KEYS.POSTS, viewedPostsCache);
  document.querySelectorAll('.kui-viewed').forEach((card) => card.classList.remove('kui-viewed'));
}
