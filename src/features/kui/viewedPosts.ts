import { SELECTORS } from '../../config/selectors';
import { readStored, writeStored } from '../../state/gmStorage';
import { KUI_STORAGE_KEYS } from '../../config/storage';
import type { KdlModule } from '../../core/types';

// Post ids are only unique per service and creator, so the key carries all three
const MAX_VIEWED_POSTS = 5000;

// Read once and kept in sync by the click listener; markViewedPosts runs on every update.
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

function onPostClick(e: MouseEvent): void {
  const target = e.target as HTMLElement | null;
  if (!target || typeof target.closest !== 'function') return;
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
}

export const viewedPostsModule: KdlModule = {
  id: 'viewedPosts',
  name: 'Mark viewed posts',
  description: 'Dims post cards you have already opened.',
  group: 'Lists',
  pages: 'any',
  defaultEnabled: true,
  mount(ctx) {
    // On document, not body: an htmx body swap keeps listeners on document either way
    document.addEventListener("click", onPostClick, true);
    ctx.onCleanup(() => document.removeEventListener("click", onPostClick, true));
    markViewedPosts();
  },
  update() {
    markViewedPosts();
  },
  unmount() {
    document.querySelectorAll(".kui-viewed").forEach((card) => card.classList.remove("kui-viewed"));
  }
};
