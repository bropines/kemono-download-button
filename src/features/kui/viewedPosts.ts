import { SELECTORS } from '../../config/selectors';
import { KUI_STORAGE_KEYS } from '../../config/storage';

export function markViewedPosts(): void {
  const viewedPosts = typeof GM_getValue === 'function' ? (GM_getValue<Record<string, boolean>>(KUI_STORAGE_KEYS.POSTS, {}) as any) : {};
  document.querySelectorAll(SELECTORS.postCard).forEach((card) => {
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
    const viewedPosts = typeof GM_getValue === 'function' ? (GM_getValue<Record<string, boolean>>(KUI_STORAGE_KEYS.POSTS, {}) as any) : {};
    viewedPosts[postId] = true;
    if (typeof GM_setValue === 'function') GM_setValue(KUI_STORAGE_KEYS.POSTS, viewedPosts);
    card.classList.add("kui-viewed");
  }, true);
}
