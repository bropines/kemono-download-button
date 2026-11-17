import { SELECTORS } from '../../config/selectors';
import { readStored, writeStored } from '../../state/gmStorage';
import { KUI_STORAGE_KEYS } from '../../config/storage';
import type { KdlModule } from '../../core/types';
import { onPageChange } from '../../core/router';
import { t } from '../../i18n';

// Post ids are only unique per service and creator, so the key carries all three
const MAX_VIEWED_POSTS = 5000;

// Read once and kept in sync by rememberViewed; markViewedPosts runs on every update.
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

function rememberViewed(key: string): void {
  const viewedPosts = getViewedPosts();
  if (viewedPosts[key]) return;
  viewedPosts[key] = true;
  const keys = Object.keys(viewedPosts);
  for (let i = 0; i < keys.length - MAX_VIEWED_POSTS; i++) delete viewedPosts[keys[i]];
  writeStored(KUI_STORAGE_KEYS.POSTS, viewedPosts);
}

// A post counts as viewed once its page actually opens (plain click, new tab or a pasted link),
// so ticking a checkbox or pressing a card button no longer dims the card
function rememberCurrentPost(): void {
  const match = window.location.pathname.match(/^\/([^/]+)\/user\/([^/]+)\/post\/([^/?#]+)/);
  if (match) rememberViewed(`${decodeURIComponent(match[1])}:${decodeURIComponent(match[2])}:${decodeURIComponent(match[3])}`);
}

type ViewedLook = 'dim' | 'label' | 'none';

const LOOK_ATTR = 'data-kdl-viewed';

const viewedStyles = `
html[${LOOK_ATTR}="dim"] .post-card.kui-viewed { opacity: 0.5; transition: opacity 0.15s ease; }
html[${LOOK_ATTR}="dim"] .post-card.kui-viewed:hover,
html[${LOOK_ATTR}="dim"] .post-card.kui-viewed:focus-within { opacity: 1; }
html[${LOOK_ATTR}="label"] .post-card.kui-viewed .post-card__header::before {
  content: var(--kdl-viewed-label, 'Viewed');
  display: inline-block;
  margin-right: 4px;
  padding: 0 5px;
  border-radius: 4px;
  background: rgba(250, 250, 250, 0.9);
  color: #18181b;
  font-size: 80%;
  font-weight: 600;
  text-shadow: none;
}
`;

export const viewedPostsModule: KdlModule = {
  id: 'viewedPosts',
  name: 'Mark viewed posts',
  description: 'Marks post cards whose post page you have already opened.',
  group: 'Lists',
  pages: 'any',
  defaultEnabled: true,
  styles: viewedStyles,
  settings: [
    {
      key: 'look',
      label: 'How viewed posts look',
      type: 'select',
      default: 'dim',
      options: [
        { value: 'dim', label: 'Dimmed (clear on hover)' },
        { value: 'label', label: '"Viewed" tag' },
        { value: 'none', label: 'No change (only remembered)' }
      ]
    }
  ],
  mount(ctx) {
    const applyLook = (value: unknown) => {
      document.documentElement.setAttribute(LOOK_ATTR, String(value as ViewedLook || 'dim'));
      document.documentElement.style.setProperty('--kdl-viewed-label', JSON.stringify(t('kui.viewed.tag')));
    };
    applyLook(ctx.settings.get('look'));
    ctx.settings.onChange('look', applyLook);
    ctx.onCleanup(() => {
      document.documentElement.removeAttribute(LOOK_ATTR);
      document.documentElement.style.removeProperty('--kdl-viewed-label');
    });
    // 'any'-page modules stay mounted across navigations, so the post page is caught here
    ctx.onCleanup(onPageChange(() => {
      rememberCurrentPost();
      markViewedPosts();
    }));
    rememberCurrentPost();
    markViewedPosts();
  },
  update() {
    rememberCurrentPost();
    markViewedPosts();
  },
  unmount() {
    document.querySelectorAll(".kui-viewed").forEach((card) => card.classList.remove("kui-viewed"));
  }
};

export function getViewedPostsCount(): number {
  return Object.keys(getViewedPosts()).length;
}

/** Forgets every viewed post and unmarks the cards on the page. */
export function clearViewedPosts(): void {
  viewedPostsCache = {};
  writeStored(KUI_STORAGE_KEYS.POSTS, viewedPostsCache);
  document.querySelectorAll('.kui-viewed').forEach((card) => card.classList.remove('kui-viewed'));
}
