// Post and creator info: small muted badges from data the site's API already has.
// - creator page: posts / DMs / shares / chats counts under the name (profile endpoint, once per creator),
// - post page: edited (revisions), flagged, file count near the title, plus previous/next buttons when the
//   site shows none. Every field is optional: what is missing is simply not shown.
// Our nodes live in kitScopes with kdl-info ids; they are removed on unmount and before htmx snapshots.

import type { KdlModule } from '../../core/types';
import type { IconName } from '../../config/icons';
import { fetchProfile } from '../../api/kemonoApi';
import { fetchAndCachePostData } from '../../services/collectorService';
import { el } from '../../utils/dom';
import { badge, button, ensureKit, kitScope, type BadgeVariant } from '../../ui/kit';
import { debugLog } from '../../utils/helpers';
import { t } from '../../i18n';
import { originalText } from '../../i18n/site';

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

// ---- Creator ----

/** "Showing 1 - 50 of 656" in the paginator, for sites whose profile has no counts */
function paginatorTotal(): number | null {
  // The site text may already be translated: read what the site wrote
  const text = originalText(document.querySelector('.paginator')).replace(/\s+/g, ' ');
  const match = /showing\s+[\d,.]+\s*[-–]\s*[\d,.]+\s+of\s+([\d,.]+)/i.exec(text);
  const value = match ? Number(match[1].replace(/[^\d]/g, '')) : NaN;
  return Number.isFinite(value) && value > 0 ? value : null;
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

function syncCreator(): void {
  const name = document.querySelector('h1.user-header__name');
  const match = /^\/([^/]+)\/user\/([^/?#]+)\/?$/.exec(window.location.pathname) || /^\/([^/]+)\/user\/([^/?#]+)/.exec(window.location.pathname);
  if (!name || !match) return;
  const [, service, id] = match;
  const key = `${service}/${id}`;
  creatorKey = key;
  const total = paginatorTotal();
  const own = document.getElementById(CREATOR_ROW);
  if (own && own.dataset.kdlKey === `${key}|${total ?? ''}` && name.nextElementSibling === own) return;
  void loadProfile(service, id).then((profile) => {
    if (creatorKey !== key || !profile) return;
    const current = document.querySelector('h1.user-header__name');
    if (!current) return;
    const node = creatorRow(service, id, profile, paginatorTotal());
    document.getElementById(CREATOR_ROW)?.remove();
    if (node) current.after(node);
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

function syncPost(): void {
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
  if (!postRequest || postRequest.key !== key) {
    postRequest = {
      key,
      data: fetchAndCachePostData(service, userId, postId).catch((error) => {
        debugLog('Post info failed:', error);
        return null;
      }),
    };
  }
  const request = postRequest;
  void request.data.then((data) => {
    if (postRequest !== request || !data) return;
    const current = document.querySelector('.post__title');
    if (!current || document.getElementById(POST_ROW)) return;
    const node = postRow(service, userId, postId, data);
    if (node) current.after(node);
  });
}

function sync(): void {
  syncCreator();
  syncPost();
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
  styles: STYLES,
  mount(ctx) {
    sync();
    ctx.onCleanup(() => {
      clearTimeout(snapshotTimer);
      creatorKey = '';
      postRequest = null;
      undo();
    });
  },
  update() {
    sync();
  },
  beforeSnapshot() {
    undo();
    snapshotTimer = window.setTimeout(sync, 0);
  },
};
