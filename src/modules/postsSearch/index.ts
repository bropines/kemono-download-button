// In-place post search: typing in the site's "search for posts..." box (creator page, /posts) fetches
// results from the API after a short pause and shows them in the existing card list, with a status line,
// "Load more" and Clear/Esc. Enter still submits the site's own form (a full search with pagination).
//
// Live cards copy the site's `article.post-card` markup (data-id/-service/-user), so the downloader's card
// buttons and checkboxes, viewed marks and themes apply to them. The original cards are detached while
// live results show and put back on clear, unmount and before every htmx snapshot.

import type { KdlModule, ModuleContext } from '../../core/types';
import { el } from '../../utils/dom';
import { getApiUrl, getThumbnailUrl } from '../../utils/helpers';
import { gmXmlhttpRequestWithRetries, isAbortError } from '../../utils/http';
import { button, ensureKit, kitIcon, kitScope } from '../../ui/kit';
import { t } from '../../i18n';

export const POSTS_SEARCH_ID = 'posts.search';

const PAGE_SIZE = 50;
const MIN_QUERY = 2;
const REQUEST_TIMEOUT_MS = 20000;
const LIVE_ATTR = 'data-kdl-live';
const HIDE_ATTR = 'data-kdl-live-hidden';
const STATUS_ID = 'kdl-live-search-status';
const MORE_ID = 'kdl-live-search-more';
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|bmp)$/i;

interface ApiFile {
  name?: string;
  path?: string;
}

interface ApiPost {
  id: string | number;
  user: string | number;
  service: string;
  title?: string;
  published?: string;
  added?: string;
  file?: ApiFile;
  attachments?: ApiFile[];
}

interface Target {
  input: HTMLInputElement;
  form: HTMLFormElement;
  list: HTMLElement;
  /** null on /posts */
  creator: { service: string; id: string } | null;
}

// ---- helpers ----

function findTarget(): Target | null {
  const input = document.querySelector<HTMLInputElement>('#main form input[name="q"].search-input, form input[name="q"].search-input');
  const form = input?.form;
  const list = document.querySelector<HTMLElement>('.card-list .card-list__items');
  if (!input || !form || !list) return null;
  const match = window.location.pathname.match(/^\/([^/]+)\/user\/([^/]+)\/?$/);
  if (match) return { input, form, list, creator: { service: decodeURIComponent(match[1]), id: decodeURIComponent(match[2]) } };
  if (/^\/posts\/?$/.test(window.location.pathname)) return { input, form, list, creator: null };
  return null;
}

/**
 * Thumbnail path from a stored file path. Pawchive prefixes the first segment with a node digit
 * (`/20d/d4/0dd4…png`), the thumbnail host wants the plain hash layout (`/0d/d4/0dd4…png`).
 */
export function thumbnailPath(path: string | undefined): string | null {
  if (!path || !IMAGE_EXT.test(path)) return null;
  const name = path.split('/').pop() ?? '';
  if (/^[0-9a-f]{64}\./i.test(name)) return `/${name.slice(0, 2)}/${name.slice(2, 4)}/${name}`;
  return path;
}

function previewOf(post: ApiPost): string | null {
  const candidates = [post.file, ...(post.attachments ?? [])];
  for (const file of candidates) {
    const path = thumbnailPath(file?.path);
    if (path) return getThumbnailUrl(path);
  }
  return null;
}

function formatDate(raw: string | undefined): { attr: string; text: string } | null {
  if (!raw) return null;
  const attr = raw.replace('T', ' ').replace(/\.\d+.*$/, '');
  return { attr, text: attr.slice(0, 16) };
}

/** The site's own card markup (see paw-user.html / paw-posts.html) */
export function buildCard(post: ApiPost): HTMLElement {
  const id = String(post.id);
  const user = String(post.user);
  const service = String(post.service);
  const title = (post.title ?? '').trim();
  const thumb = previewOf(post);
  const date = formatDate(post.published || post.added);
  const attachments = post.attachments?.length ?? 0;
  const href = `/${encodeURIComponent(service)}/user/${encodeURIComponent(user)}/post/${encodeURIComponent(id)}`;

  const footerInfo = el('div', {}, [
    date ? el('time', { className: 'timestamp', dateTime: date.attr, textContent: date.text }) : null,
    el('div', { textContent: attachments ? `${attachments} attachment${attachments === 1 ? '' : 's'}` : 'No attachments' }),
  ]);
  const icon = el('img', { src: `/static/small_icons/${encodeURIComponent(service)}.png`, alt: service });
  const card = el('article', { className: `post-card${thumb ? ' post-card--preview' : ''}` }, [
    el('a', { href }, [
      el('header', { className: 'post-card__header', textContent: title || t('search.untitled') }),
      thumb
        ? el('div', { className: 'post-card__image-container' }, [
            el('img', { className: 'post-card__image', src: thumb, alt: title, loading: 'lazy' }),
          ])
        : null,
      el('footer', { className: 'post-card__footer' }, [el('div', {}, [footerInfo, icon])]),
    ]),
  ]);
  card.dataset.id = id;
  card.dataset.service = service;
  card.dataset.user = user;
  card.setAttribute(LIVE_ATTR, '');
  return card;
}

function endpoint(target: Target, query: string, offset: number, legacy = false): string {
  const params = `q=${encodeURIComponent(query)}${offset ? `&o=${offset}` : ''}`;
  if (!target.creator) return getApiUrl(`/api/v1/posts?${params}`);
  const base = `/api/v1/${encodeURIComponent(target.creator.service)}/user/${encodeURIComponent(target.creator.id)}`;
  return getApiUrl(legacy ? `${base}?${params}` : `${base}/posts?${params}`);
}

/** Kemono answers `[…]` or `{ count, posts }` depending on the endpoint and version */
function parsePosts(body: unknown): { posts: ApiPost[]; total: number | null } {
  if (Array.isArray(body)) return { posts: body as ApiPost[], total: null };
  if (body && typeof body === 'object') {
    const b = body as { posts?: unknown; results?: unknown; count?: unknown; true_count?: unknown };
    const list = Array.isArray(b.posts) ? b.posts : Array.isArray(b.results) ? b.results : [];
    const total = typeof b.true_count === 'number' ? b.true_count : typeof b.count === 'number' ? b.count : null;
    return { posts: list as ApiPost[], total };
  }
  return { posts: [], total: null };
}

async function fetchPage(target: Target, query: string, offset: number, signal: AbortSignal): Promise<{ posts: ApiPost[]; total: number | null }> {
  const get = async (url: string) => {
    const response = await gmXmlhttpRequestWithRetries({
      method: 'GET',
      url,
      responseType: 'json',
      timeout: REQUEST_TIMEOUT_MS,
      headers: { Accept: 'text/css' },
      signal,
    });
    let body = response.response;
    if (typeof body === 'string') body = JSON.parse(body);
    return parsePosts(body);
  };
  try {
    return await get(endpoint(target, query, offset));
  } catch (error) {
    // Pawchive's creator listing also exists without the /posts suffix
    if (target.creator && (error as { status?: number }).status === 404) return get(endpoint(target, query, offset, true));
    throw error;
  }
}

// ---- state ----

let ctxRef: ModuleContext | null = null;
let target: Target | null = null;
let originalValue = '';
let stash: Node[] | null = null;
let hidden: HTMLElement[] = [];
let controller: AbortController | null = null;
let debounceTimer = 0;
let query = '';
let offset = 0;
let shown = 0;
let total: number | null = null;
let hasMore = false;
let seq = 0;
let cleanupInput: (() => void) | null = null;

let statusBox: HTMLElement | null = null;
let statusText: HTMLElement | null = null;
let statusSpinner: SVGElement | null = null;
let moreBox: HTMLElement | null = null;
let moreBtn: HTMLButtonElement | null = null;

const isLive = () => stash !== null;

function setStatus(text: string, busy: boolean, error = false): void {
  if (!statusBox || !statusText || !statusSpinner) return;
  statusBox.hidden = false;
  statusText.textContent = text;
  statusSpinner.style.display = busy ? '' : 'none';
  statusBox.toggleAttribute('data-error', error);
}

function resultLabel(): string {
  if (!shown) return t('search.noResults', { query });
  if (total !== null) return t('search.results', { count: total });
  return hasMore ? t('search.resultsMore', { count: shown }) : t('search.results', { count: shown });
}

function ensureUi(tg: Target): void {
  ensureKit();
  if (!statusBox?.isConnected) {
    statusSpinner = kitIcon('loader-circle', 'kdl-ui-spin');
    statusText = el('span', { className: 'kdl-live-search__text' });
    statusText.setAttribute('role', 'status');
    statusBox = kitScope(
      [
        statusSpinner,
        statusText,
        el('span', { className: 'kdl-live-search__hint', textContent: t('search.hint') }),
        button({ label: t('search.clear'), icon: 'x', variant: 'ghost', size: 'sm', onClick: () => clearSearch(true) }),
      ],
      { className: 'kdl-live-search' }
    );
    statusBox.id = STATUS_ID;
    statusBox.hidden = true;
    tg.form.after(statusBox);
  }
  if (!moreBox?.isConnected) {
    moreBtn = button({ label: t('search.loadMore'), icon: 'chevron-down', variant: 'outline', onClick: () => void loadMore() });
    moreBox = kitScope([moreBtn], { className: 'kdl-live-search-more' });
    moreBox.id = MORE_ID;
    moreBox.hidden = true;
    (tg.list.closest('.card-list') ?? tg.list).after(moreBox);
  }
}

/** Detach the server-rendered cards and hide the site's pagination (the search box stays) */
function enterLive(tg: Target): void {
  if (isLive()) return;
  stash = Array.from(tg.list.childNodes);
  stash.forEach((node) => node.parentNode?.removeChild(node));
  hidden = Array.from(document.querySelectorAll<HTMLElement>('.paginator > menu, .paginator > small, #paginator-bottom'));
  hidden.forEach((node) => node.setAttribute(HIDE_ATTR, ''));
}

function exitLive(): void {
  if (!isLive()) return;
  const tg = target;
  if (tg?.list.isConnected) {
    tg.list.querySelectorAll(`[${LIVE_ATTR}]`).forEach((node) => node.remove());
    tg.list.append(...stash!);
  }
  stash = null;
  hidden.forEach((node) => node.removeAttribute(HIDE_ATTR));
  hidden = [];
}

function abort(): void {
  clearTimeout(debounceTimer);
  controller?.abort();
  controller = null;
  seq++;
}

/** Back to the page as the server rendered it */
function clearSearch(resetInput: boolean): void {
  abort();
  exitLive();
  query = '';
  if (statusBox) statusBox.hidden = true;
  if (moreBox) moreBox.hidden = true;
  if (resetInput && target) {
    target.input.value = originalValue;
    target.input.focus();
  }
}

async function runSearch(text: string, append: boolean): Promise<void> {
  const tg = target;
  if (!tg) return;
  abort();
  const mySeq = seq;
  controller = new AbortController();
  if (!append) {
    query = text;
    offset = 0;
    total = null;
  }
  ensureUi(tg);
  setStatus(append ? t('search.loadingMore', { results: resultLabel() }) : t('search.searching'), true);
  if (moreBtn) moreBtn.disabled = true;
  try {
    const page = await fetchPage(tg, query, offset, controller.signal);
    if (mySeq !== seq || target !== tg) return;
    enterLive(tg);
    if (!append) {
      tg.list.querySelectorAll(`[${LIVE_ATTR}]`).forEach((node) => node.remove());
      shown = 0;
    }
    const seen = new Set(Array.from(tg.list.querySelectorAll<HTMLElement>(`[${LIVE_ATTR}]`)).map((n) => `${n.dataset.service}:${n.dataset.id}`));
    const fresh = page.posts.filter((p) => p && p.id != null && !seen.has(`${p.service}:${p.id}`));
    tg.list.append(...fresh.map(buildCard));
    shown += fresh.length;
    total = page.total ?? total;
    hasMore = page.posts.length >= PAGE_SIZE && (total === null || offset + page.posts.length < total);
    offset += PAGE_SIZE;
    setStatus(resultLabel(), false);
    if (moreBox) moreBox.hidden = !hasMore;
  } catch (error) {
    if (isAbortError(error) || mySeq !== seq) return;
    const status = (error as { status?: number }).status;
    // A 400 past the last page is the API's "no more"
    if (append && status === 400) {
      hasMore = false;
      setStatus(resultLabel(), false);
      if (moreBox) moreBox.hidden = true;
      return;
    }
    setStatus(t('search.failed', { error: (error as Error).message || t('search.networkError') }), false, true);
  } finally {
    if (mySeq === seq) {
      controller = null;
      if (moreBtn) moreBtn.disabled = false;
    }
  }
}

function loadMore(): Promise<void> {
  return runSearch(query, true);
}

function onInput(): void {
  const tg = target;
  if (!tg) return;
  clearTimeout(debounceTimer);
  const text = tg.input.value.trim();
  // Too short, or back to what the server already shows: the page's own cards
  if (text.length < MIN_QUERY || text === originalValue.trim()) {
    clearSearch(false);
    return;
  }
  if (text === query && isLive()) return;
  debounceTimer = window.setTimeout(() => void runSearch(text, false), ctxRef?.settings.get<number>('delay') ?? 300);
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && (isLive() || target?.input.value !== originalValue)) {
    event.preventDefault();
    event.stopPropagation();
    clearSearch(true);
  } else if (event.key === 'Enter') {
    // The site's form takes it from here
    abort();
  }
}

function attach(tg: Target): void {
  target = tg;
  originalValue = tg.input.value;
  tg.input.addEventListener('input', onInput);
  tg.input.addEventListener('keydown', onKeydown);
  tg.input.setAttribute('data-kdl-live-search', '');
  cleanupInput = () => {
    tg.input.removeEventListener('input', onInput);
    tg.input.removeEventListener('keydown', onKeydown);
    tg.input.removeAttribute('data-kdl-live-search');
  };
}

function detach(): void {
  clearSearch(false);
  cleanupInput?.();
  cleanupInput = null;
  statusBox?.remove();
  moreBox?.remove();
  document.getElementById(STATUS_ID)?.remove();
  document.getElementById(MORE_ID)?.remove();
  statusBox = statusText = moreBox = null;
  statusSpinner = null;
  moreBtn = null;
  target = null;
}

function sync(): void {
  const next = findTarget();
  if (target && next && next.input === target.input && next.list === target.list) return;
  if (target) {
    // A swap replaced the list: the stashed cards belong to the old page
    if (!target.list.isConnected) stash = null;
    detach();
  }
  if (next) attach(next);
}

const styles = `
.kdl-live-search {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 4px 10px;
  margin: 6px auto;
  padding: 2px 4px 2px 12px;
  width: fit-content;
  max-width: 100%;
  border: 1px solid var(--kdl-border);
  border-radius: 9999px;
  background: var(--kdl-card);
  color: var(--kdl-card-foreground);
  font-size: 13px;
  box-sizing: border-box;
}
.kdl-live-search[hidden], .kdl-live-search-more[hidden] { display: none; }
.kdl-live-search > .kdl-ui-icon { width: 14px; height: 14px; color: var(--kdl-muted-foreground); }
.kdl-live-search[data-error] .kdl-live-search__text { color: var(--kdl-danger); }
.kdl-live-search__hint { color: var(--kdl-muted-foreground); font-size: 12px; }
.kdl-live-search-more { display: flex; justify-content: center; margin: 12px 0; }
[${HIDE_ATTR}] { display: none !important; }
@media (max-width: 640px) {
  .kdl-live-search__hint { display: none; }
}
`;

export const postsSearchModule: KdlModule = {
  id: POSTS_SEARCH_ID,
  name: 'Live post search',
  description: 'The “search for posts…” box on creator pages and /posts shows results in place as you type, with “Load more”. Enter still runs the site’s full search; Esc or Clear brings the page back.',
  group: 'Lists',
  pages: ['creator', 'list'],
  defaultEnabled: true,
  settings: [{ key: 'delay', label: 'Typing pause before searching (ms)', type: 'number', default: 300, min: 150, max: 1500 }],
  styles,
  mount(ctx) {
    ctxRef = ctx;
    sync();
    ctx.onCleanup(() => {
      detach();
      ctxRef = null;
    });
  },
  update() {
    sync();
  },
  beforeSnapshot() {
    // The snapshot must hold the server's cards, not ours (they would come back without listeners)
    if (target) {
      clearSearch(false);
      target.input.value = originalValue;
    }
    // Rebuilt on the next search
    statusBox?.remove();
    moreBox?.remove();
  },
};
