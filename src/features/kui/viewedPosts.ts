import { SELECTORS } from '../../config/selectors';
import { KUI_STORAGE_KEYS } from '../../config/storage';

// Read once and kept in sync by the click listener; markViewedPosts runs on every re-init
let viewedPostsCache: Record<string, boolean> | null = null;

function getViewedPosts(): Record<string, boolean> {
  if (!viewedPostsCache) {
    viewedPostsCache = typeof GM_getValue === 'function' ? GM_getValue<Record<string, boolean>>(KUI_STORAGE_KEYS.POSTS, {}) : {};
  }
  return viewedPostsCache;
}

export function markViewedPosts(): void {
  const unmarkedCards = document.querySelectorAll(`${SELECTORS.postCard}:not(.kui-viewed)`);
  if (unmarkedCards.length === 0) return;
  const viewedPosts = getViewedPosts();
  unmarkedCards.forEach((card) => {
    const postId = card.getAttribute("data-id");
    if (postId && viewedPosts[postId]) {
      card.classList.add("kui-viewed");
    }
  });
}

export function setupGlobalClickListener(): void {
  document.body.addEventListener("click", (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const link = target.closest(SELECTORS.postLink);
    if (!link) return;
    const card = link.closest(SELECTORS.postCard);
    const postId = card?.getAttribute("data-id");
    if (!card || !postId) return;
    const viewedPosts = getViewedPosts();
    viewedPosts[postId] = true;
    if (typeof GM_setValue === 'function') GM_setValue(KUI_STORAGE_KEYS.POSTS, viewedPosts);
    card.classList.add("kui-viewed");
  }, true);
}
