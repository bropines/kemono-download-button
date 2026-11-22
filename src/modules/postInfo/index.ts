// Post and creator info: small muted badges from data the site's API already has.
// - creator page: posts / DMs / shares / chats counts under the name (profile endpoint, once per creator),
// - post page: edited (revisions), flagged, file count near the title, plus previous/next buttons when the
//   site shows none. Every field is optional: what is missing is simply not shown.
// Our nodes live in kitScopes with kdl-info ids; they are removed on unmount and before htmx snapshots.

import type { KdlModule } from '../../core/types';
import type { IconName } from '../../config/icons';
import { fetchProfile } from '../../api/kemonoApi';
import { getApiAdapter } from '../../api';
import { fetchAndCachePostData } from '../../services/collectorService';
import { el } from '../../utils/dom';
import { badge, button, collapseAway, ensureKit, kitScope, skeleton, swapIn, type BadgeVariant } from '../../ui/kit';
import { debugLog } from '../../utils/helpers';
import { t } from '../../i18n';
import { originalText } from '../../i18n/site';
import { holdCloak, isCloaked } from '../../core/cloak';
import { getSettings } from '../../state/store';

const CREATOR_ROW = 'kdl-info-creator';
const POST_ROW = 'kdl-info-post';

const profiles = new Map<string, Promise<any | null>>();
let postRequest: { key: string; data: Promise<any | null> } | null = null;
let creatorKey = '';
let snapshotTimer = 0;

function loadProfile(service: string, id: string): Promise<any | null> {
  const key = `${service}/${id}`;
  if (!profiles.has(key)) {
    profiles.set(
      key,
      fetchProfile(service, id).catch((error) => {
        debugLog('Creator profile failed:', error);
        profiles.delete(key);
        return null;
      })
    );
  }
  return profiles.get(key)!;
}

const num = (value: unknown): number | null => (typeof value === 'number' && value > 0 ? value : null);
const isId = (value: unknown): boolean => value !== null && value !== undefined && String(value) !== '' && String(value) !== 'null';

function chip(text: string, icon: IconName, variant: BadgeVariant = 'outline', href?: string, title?: string): HTMLElement {
  const node = badge({ text, icon, variant, title });
  return href ? el('a', { href, className: 'kdl-info__link' }, [node]) : node;
}

function row(id: string, key: string, children: HTMLElement[]): HTMLElement {
  ensureKit();
  const node = kitScope(children, { className: 'kdl-info' });
  node.id = id;
  node.dataset.kdlKey = key;
  return node;
}

// The row's place is taken at once, while its data is on its way, so the page under it does not move when the
// badges arrive: a badge-sized shimmer (or the badges already known), filled in place or folded away.
const PH = 'kdlPh';
function placeholderRow(id: string, key: string, known: HTMLElement[] = []): HTMLElement {
  const node = row(id, key, known.length ? known : [skeleton({ className: 'kdl-info__ph' })]);
  node.dataset[PH] = '';
  node.setAttribute('aria-busy', 'true');
  return node;
}

/** Puts `node` (or nothing) where the row of `id` is, after `anchor` when there is none */
function settle(id: string, anchor: Element, node: HTMLElement | null): void {
  const old = document.getElementById(id);
  const animate = !isCloaked();
  if (!node) {
    if (old) collapseAway(old, undefined, { animate });
    return;
  }
  if (old && old.parentElement) swapIn(old, node, { animate });
  else anchor.after(node);
}

// ---- Creator ----

// Post totals read from a creator's Posts tab (no search): the other tabs have no paginator count, and the row
// under the name must not come and go (the header changing height) as the user moves between the tabs
const totals = new Map<string, number>();

/** "Showing 1 - 50 of 656" in the paginator, for sites whose profile has no counts */
function paginatorTotal(key: string): number | null {
  // The site text may already be translated: read what the site wrote
  const text = originalText(document.querySelector('.paginator')).replace(/\s+/g, ' ');
  const match = /showing\s+[\d,.]+\s*[-–]\s*[\d,.]+\s+of\s+([\d,.]+)/i.exec(text);
  const value = match ? Number(match[1].replace(/[^\d]/g, '')) : NaN;
  const postsTab = /^\/[^/]+\/user\/[^/?#]+\/?$/.test(window.location.pathname) && !new URLSearchParams(window.location.search).has('q');
  if (Number.isFinite(value) && value > 0) {
    if (postsTab) totals.set(key, value);
    return value;
  }
  return totals.get(key) ?? null;
}

function tabHref(suffix: string): string | undefined {
  return document.querySelector<HTMLAnchorElement>(`.tabs a[href$="/${suffix}"]`)?.getAttribute('href') || undefined;
}

function creatorRow(service: string, id: string, profile: any, total: number | null): HTMLElement | null {
  const posts = num(profile?.post_count) ?? total;
  const dms = num(profile?.dm_count);
  const shares = num(profile?.share_count);
  const chats = num(profile?.chat_count);
  const nodes = [
    posts ? chip(t('info.posts', { count: posts.toLocaleString() }), 'file', 'outline', `/${service}/user/${id}`) : null,
    dms ? chip(t('info.dms', { count: dms.toLocaleString() }), 'message-square', 'outline', tabHref('dms')) : null,
    shares ? chip(t('info.shares', { count: shares.toLocaleString() }), 'share-2', 'outline', tabHref('shares')) : null,
    chats ? chip(t('info.chats', { count: chats.toLocaleString() }), 'message-square', 'outline', tabHref('chats')) : null,
  ].filter(Boolean) as HTMLElement[];
  return nodes.length ? row(CREATOR_ROW, `${service}/${id}|${total ?? ''}`, nodes) : null;
}

function syncCreator(): Promise<unknown> | void {
  const name = document.querySelector('h1.user-header__name');
  const match = /^\/([^/]+)\/user\/([^/?#]+)\/?$/.exec(window.location.pathname) || /^\/([^/]+)\/user\/([^/?#]+)/.exec(window.location.pathname);
  if (!name || !match) return;
  const [, service, id] = match;
  const key = `${service}/${id}`;
  creatorKey = key;
  const total = paginatorTotal(key);
  const rowKey = `${key}|${total ?? ''}`;
  const own = document.getElementById(CREATOR_ROW);
  if (own && own.dataset.kdlKey === rowKey && name.nextElementSibling === own) return;
  // Nothing of ours under the name yet: hold its place, with the post count already when the paginator has it.
  // Pawchive's profile carries no counts: without the paginator's there will be no row, so none is reserved.
  if (!own || own.parentElement !== name.parentElement) {
    own?.remove();
    const known = creatorRow(service, id, null, total);
    if (known || getApiAdapter().name !== 'pawchive') {
      name.after(placeholderRow(CREATOR_ROW, rowKey, known ? Array.from(known.children) as HTMLElement[] : []));
    }
  }
  return loadProfile(service, id).then((profile) => {
    if (creatorKey !== key) return;
    const current = document.querySelector('h1.user-header__name');
    if (!current) return;
    // Without a profile the paginator's count is still worth a badge
    settle(CREATOR_ROW, current, creatorRow(service, id, profile, paginatorTotal(key)));
  });
}

// ---- Post ----

function postRow(service: string, userId: string, postId: string, data: any): HTMLElement | null {
  const post = data?.post ?? data;
  if (!post || typeof post !== 'object') return null;
  const props = data?.props ?? post.props ?? {};
  const base = `/${service}/user/${userId}/post/${postId}`;
  const nodes: HTMLElement[] = [];

  // Kemono/Coomer list every version in props.revisions (the current one included); Pawchive only has `edited`
  const revisions: any[] = Array.isArray(props?.revisions) ? props.revisions : [];
  if (revisions.length > 1) {
    const last = revisions[revisions.length - 1];
    const href = Array.isArray(last) && last[0] !== undefined && service !== 'pawchive' ? `${base}/revision/${last[0]}` : undefined;
    nodes.push(chip(t('info.edited.revisions', { count: revisions.length - 1 }), 'refresh-cw', 'outline', href));
  } else if (post.edited) {
    nodes.push(chip(t('info.edited'), 'refresh-cw', 'outline', undefined, String(post.edited)));
  }
  if (props?.flagged) nodes.push(chip(t('info.flagged'), 'triangle-alert', 'warning'));

  const paths = new Set<string>();
  [data?.attachments, post.attachments].forEach((list) => Array.isArray(list) && list.forEach((item: any) => item?.path && paths.add(item.path)));
  if (post.file?.path) paths.add(post.file.path);
  if (paths.size) nodes.push(chip(t('info.files', { count: paths.size }), 'paperclip'));

  // The site's own prev/next links win; ours only fill in when it shows none
  const prev = post.prev ?? data?.prev;
  const next = post.next ?? data?.next;
  if (!document.querySelector('.post__nav-links')) {
    const go = (id: unknown, label: string, icon: IconName) =>
      button({ href: `/${service}/user/${userId}/post/${id}`, icon, label, variant: 'outline', size: 'sm' });
    const buttons = [isId(prev) ? go(prev, t('info.prev'), 'chevron-left') : null, isId(next) ? go(next, t('info.next'), 'chevron-right') : null];
    if (buttons.some(Boolean)) nodes.push(el('span', { className: 'kdl-info__nav' }, buttons.filter(Boolean) as HTMLElement[]));
  }
  return nodes.length ? row(POST_ROW, `${service}/${userId}/${postId}`, nodes) : null;
}

function postData(service: string, userId: string, postId: string): Promise<any | null> {
  const key = `${service}/${userId}/${postId}`;
  if (!postRequest || postRequest.key !== key) {
    postRequest = {
      key,
      data: fetchAndCachePostData(service, userId, postId).catch((error) => {
        debugLog('Post info failed:', error);
        return null;
      }),
    };
  }
  return postRequest.data;
}

function syncPost(): Promise<unknown> | void {
  const title = document.querySelector('.post__title');
  const match = /^\/([^/]+)\/user\/([^/?#]+)\/post\/([^/?#]+)/.exec(window.location.pathname);
  if (!title || !match) return;
  const [, service, userId, postId] = match;
  const key = `${service}/${userId}/${postId}`;
  const own = document.getElementById(POST_ROW);
  if (own) {
    if (own.dataset.kdlKey === key && title.nextElementSibling === own) {
      // The site's links rendered after ours: drop the duplicates
      if (document.querySelector('.post__nav-links')) own.querySelector('.kdl-info__nav')?.remove();
      return;
    }
    own.remove();
  }
  postData(service, userId, postId);
  const request = postRequest!;
  title.after(placeholderRow(POST_ROW, key));
  return request.data.then((data) => {
    if (postRequest !== request) return;
    const current = document.querySelector('.post__title');
    const held = document.getElementById(POST_ROW);
    // Already filled (another sync got here first), or the page went on
    if (!current || (held && held.dataset[PH] === undefined)) return;
    settle(POST_ROW, current, data ? postRow(service, userId, postId, data) : null);
  });
}

function sync(): Promise<unknown> {
  return Promise.all([syncCreator(), syncPost()]);
}

function undo(): void {
  document.getElementById(CREATOR_ROW)?.remove();
  document.getElementById(POST_ROW)?.remove();
}

const STYLES = `
.kdl-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 6px 0 8px;
  min-width: 0;
}
/* As tall as a badge (16px line, 2px padding, 1px border) */
.kdl-info .kdl-info__ph { width: 96px; height: 22px; border-radius: calc(var(--kdl-radius) - 2px); }
/* The creator's badges are links, whose line box is a little taller */
#${CREATOR_ROW} .kdl-info__ph { height: 26px; }
.kdl-info .kdl-info__link { text-decoration: none; color: inherit; }
.kdl-info .kdl-info__link:hover .kdl-ui-badge { background: var(--kdl-accent); }
.kdl-info .kdl-ui-badge--outline { color: var(--kdl-muted-foreground); }
.kdl-info .kdl-info__nav { display: inline-flex; gap: 6px; margin-left: auto; }
@media (max-width: 600px) {
  .kdl-info .kdl-info__nav { margin-left: 0; }
}
`;

export const postInfoModule: KdlModule = {
  id: 'info.badges',
  name: 'Post and creator info',
  description:
    'Small badges from the API: post, DM, share and chat counts under a creator name; edited, flagged and file count on posts; previous / next buttons where the site has none.',
  group: 'Interface',
  pages: ['creator', 'post'],
  defaultEnabled: true,
  // Part of the redesign: switched off with it
  requires: ['ui.shadcn'],
  styles: STYLES,
  // The URL already names the creator or post: the request starts while the page is still loading
  early() {
    const path = window.location.pathname;
    const post = /^\/([^/]+)\/user\/([^/?#]+)\/post\/([^/?#]+)/.exec(path);
    const creator = /^\/([^/]+)\/user\/([^/?#]+)/.exec(path);
    void getSettings().then(() => {
      if (post) void postData(post[1], post[2], post[3]);
      else if (creator) void loadProfile(creator[1], creator[2]);
    });
  },
  mount(ctx) {
    // Post data is usually cached (IndexedDB), so it is worth holding the cloak for; the creator profile always
    // comes from the network and would only delay the page
    void syncCreator();
    const post = syncPost();
    if (post) holdCloak(post);
    ctx.onCleanup(() => {
      clearTimeout(snapshotTimer);
      creatorKey = '';
      postRequest = null;
      undo();
    });
  },
  update() {
    void sync();
  },
  beforeSnapshot() {
    undo();
    snapshotTimer = window.setTimeout(() => void sync(), 0);
  },
};
