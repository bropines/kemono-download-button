// Faster navigation: the next page starts loading when a link is pressed, not when it is released.
//
// The sites navigate with htmx (hx-boost): a click on a link sends a request and swaps the answer into #main.
// Between pressing a button (or touching the screen) and the click the browser reports ~100 ms pass; with the
// optional hover setting it is more. This module asks for the page at that earlier moment, with the same headers
// htmx would send, and when htmx then makes its request for the same address the answer already in hand is
// given to it instead of asking the server again.
//
// htmx is private to the site's bundle, so the answer is handed over through the one seam it offers: the
// XMLHttpRequest of a request is in `htmx:beforeSend` before it is sent. Only that one object is touched (never
// XMLHttpRequest itself): its send() waits for our fetch and then reports the fetched page as its own response.
// Whatever goes wrong (the fetch fails, the answer is not a 200, a redirect elsewhere), the real send() runs
// and htmx gets its answer from the server as if this module were not there.
//
// One request per press, used by the click that follows: the server sees the same number of requests. The
// site's pages are not cacheable by the browser (and vary on HX-Request), so a <link rel="prefetch"> would not
// be reused; that is why the request is made here.

import type { KdlModule, ModuleContext } from '../../core/types';

const ID = 'nav.prefetch';
// A pressed link is followed within moments; a hovered one may be after a while
const FRESH_MS = 15000;
const MAX_KEPT = 4;
const MAX_LOADING = 2;
const HOVER_MS = 110;
// Same-origin addresses that are files or endpoints, not pages; and links that do something when followed
const NOT_A_PAGE = /^\/(data|thumbnail|api|static|icons|banners)\/|\.[a-z0-9]{2,5}$/i;
const HAS_EFFECT = /log-?out|sign-?out|delete|remove|revoke|unlink/i;

interface Page {
  status: number;
  url: string;
  body: string;
  headers: Headers;
}

interface Entry {
  at: number;
  loading: boolean;
  page: Promise<Page | null>;
  controller: AbortController;
}

const entries = new Map<string, Entry>();

const keyOf = (url: URL): string => url.pathname + url.search;

function prune(): void {
  const now = Date.now();
  entries.forEach((entry, key) => {
    if (now - entry.at > FRESH_MS) drop(key);
  });
  // Oldest first
  while (entries.size > MAX_KEPT) drop(entries.keys().next().value as string);
}

function drop(key: string): void {
  const entry = entries.get(key);
  if (!entry) return;
  if (entry.loading) entry.controller.abort();
  entries.delete(key);
}

function saveData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}

/** The link's address when a plain click on it makes htmx load a page into the site's content */
function pageUrl(link: HTMLAnchorElement): URL | null {
  if (document.body?.getAttribute('hx-boost') !== 'true') return null;
  if (!link.hasAttribute('href') || link.hasAttribute('download') || (link.target && link.target !== '_self')) return null;
  if (link.closest('[hx-boost="false"]') || link.hasAttribute('hx-get') || link.hasAttribute('hx-post')) return null;
  let url: URL;
  try {
    url = new URL(link.href, window.location.href);
  } catch {
    return null;
  }
  if (url.origin !== window.location.origin || !/^https?:$/.test(url.protocol)) return null;
  if (NOT_A_PAGE.test(url.pathname) || HAS_EFFECT.test(url.pathname) || link.classList.contains('logout')) return null;
  // The page that is open, or a jump within it
  if (url.pathname === window.location.pathname && url.search === window.location.search) return null;
  return url;
}

// What htmx sends for a boosted link: the server answers these with the page's content only
function requestHeaders(link: HTMLAnchorElement): Record<string, string> {
  const headers: Record<string, string> = { 'HX-Request': 'true', 'HX-Boosted': 'true', 'HX-Current-URL': window.location.href };
  const target = link.closest('[hx-target]')?.getAttribute('hx-target') || '';
  if (/^#[\w-]+$/.test(target)) headers['HX-Target'] = target.slice(1);
  return headers;
}

// The hand-over needs htmx's own objects: only where the script runs in the page's world (as the link boost in
// src/core/boostLinks.ts does). htmx keeps its data on the elements it processed; seeing it proves the world is
// shared. Elsewhere (Firefox sandboxes) nothing is fetched ahead: it would only be a second request.
let sharedWorld: boolean | null = null;
function sharesPageWorld(link: HTMLAnchorElement): boolean {
  if (sharedWorld !== null) return sharedWorld;
  if ((window as unknown as { wrappedJSObject?: unknown }).wrappedJSObject) return (sharedWorld = false);
  const seen = (node: Element | null): boolean => !!node && !!(node as unknown as Record<string, unknown>)['htmx-internal-data'];
  // Not decided while htmx has not started yet
  if (seen(link) || seen(document.body)) sharedWorld = true;
  return sharedWorld === true;
}

function prefetch(link: HTMLAnchorElement): void {
  const url = pageUrl(link);
  if (!url || !sharesPageWorld(link)) return;
  const key = keyOf(url);
  prune();
  if (entries.has(key)) return;
  let loading = 0;
  entries.forEach((entry) => {
    if (entry.loading) loading++;
  });
  if (loading >= MAX_LOADING) return;
  const controller = new AbortController();
  const entry: Entry = {
    at: Date.now(),
    loading: true,
    controller,
    page: fetch(url.pathname + url.search, { headers: requestHeaders(link), credentials: 'same-origin', signal: controller.signal })
      .then(async (response): Promise<Page | null> => {
        // Anything but a plain page of this site is left to htmx and the server
        if (response.status !== 200 || new URL(response.url).origin !== window.location.origin) return null;
        if (!/text\/html/i.test(response.headers.get('content-type') || '')) return null;
        return { status: response.status, url: response.url, body: await response.text(), headers: response.headers };
      })
      .catch(() => null)
      .then((page) => {
        entry.loading = false;
        if (!page) entries.delete(key);
        return page;
      }),
  };
  entries.set(key, entry);
}

const define = (target: object, name: string, value: unknown): void => {
  Object.defineProperty(target, name, { configurable: true, get: () => value });
};

/** Makes this one request object report the fetched page as its response, then announces it the way a real one does */
function deliver(xhr: XMLHttpRequest, page: Page): void {
  const lines: string[] = [];
  page.headers.forEach((value, name) => lines.push(`${name}: ${value}`));
  define(xhr, 'readyState', 4);
  define(xhr, 'status', page.status);
  define(xhr, 'statusText', 'OK');
  define(xhr, 'responseURL', page.url);
  define(xhr, 'response', page.body);
  define(xhr, 'responseText', page.body);
  xhr.getResponseHeader = (name: string) => page.headers.get(name);
  xhr.getAllResponseHeaders = () => lines.join('\r\n');
  xhr.dispatchEvent(new ProgressEvent('load'));
  xhr.dispatchEvent(new ProgressEvent('loadend'));
}

function onBeforeSend(event: Event): void {
  const detail = (event as CustomEvent).detail as
    | { xhr?: XMLHttpRequest; boosted?: boolean; requestConfig?: { verb?: string }; pathInfo?: { finalRequestPath?: string; requestPath?: string } }
    | undefined;
  const xhr = detail?.xhr;
  const path = detail?.pathInfo?.finalRequestPath || detail?.pathInfo?.requestPath;
  // Only the request a followed link makes: the same address asked for in another way is not ours to answer
  if (!xhr || !path || !detail?.boosted || String(detail?.requestConfig?.verb || '').toLowerCase() !== 'get') return;
  let key: string;
  try {
    key = keyOf(new URL(path, window.location.href));
  } catch {
    return;
  }
  const entry = entries.get(key);
  if (!entry) return;
  // Used once: the next visit to the address asks the server again
  entries.delete(key);
  if (Date.now() - entry.at > FRESH_MS) return;

  const send = xhr.send;
  const abort = xhr.abort;
  let aborted = false;
  let sent = false;
  xhr.send = function (this: XMLHttpRequest, body?: Document | XMLHttpRequestBodyInit | null): void {
    if (sent) return;
    sent = true;
    xhr.dispatchEvent(new ProgressEvent('loadstart'));
    void entry.page.then((page) => {
      if (aborted) return;
      // Back to being an ordinary request
      xhr.abort = abort;
      if (!page) {
        send.call(xhr, body);
        return;
      }
      try {
        deliver(xhr, page);
      } catch (error) {
        console.error('[KDL] prefetched page could not be handed to htmx:', error);
      }
    });
  };
  // htmx aborts a request another one replaces: a request that was never sent would not say so by itself
  xhr.abort = function (this: XMLHttpRequest): void {
    if (aborted) return;
    aborted = true;
    abort.call(xhr);
    if (sent) {
      xhr.dispatchEvent(new ProgressEvent('abort'));
      xhr.dispatchEvent(new ProgressEvent('loadend'));
    }
  };
}

function linkOf(event: Event): HTMLAnchorElement | null {
  return (event.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href]') ?? null;
}

function onPointerDown(event: PointerEvent): void {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = linkOf(event);
  if (link) prefetch(link);
}

let hoverTimer: ReturnType<typeof setTimeout> | undefined;
let hovered: HTMLAnchorElement | null = null;

function onPointerOver(ctx: ModuleContext, event: PointerEvent): void {
  if (event.pointerType !== 'mouse' || !ctx.settings.get<boolean>('hover') || saveData()) return;
  const link = linkOf(event);
  if (link === hovered) return;
  hovered = link;
  clearTimeout(hoverTimer);
  // Resting on the link, not passing over it
  if (link) hoverTimer = setTimeout(() => hovered === link && link.isConnected && prefetch(link), HOVER_MS);
}

export const navPrefetchModule: KdlModule = {
  id: ID,
  name: 'Faster navigation',
  description:
    'Starts loading the next page the moment you press a link, instead of when you release it, and hands the result to the site when it asks for that page. The site receives the same number of requests.',
  group: 'Interface',
  pages: 'any',
  defaultEnabled: true,
  settings: [
    {
      key: 'hover',
      label: 'Also when the pointer rests on a link',
      hint: 'Pages you point at start loading before you click. Faster, but the site gets requests for pages you may not open. Off with the browser data saver.',
      type: 'boolean',
      default: false,
    },
  ],
  mount(ctx) {
    // Sites without htmx navigation (kemono.cr is a single-page app): nothing to speed up this way
    if (document.body?.getAttribute('hx-boost') !== 'true' || typeof fetch !== 'function' || typeof AbortController !== 'function') return;
    const over = (event: PointerEvent): void => onPointerOver(ctx, event);
    document.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true });
    document.addEventListener('pointerover', over, { capture: true, passive: true });
    document.addEventListener('htmx:beforeSend', onBeforeSend, true);
    ctx.onCleanup(() => {
      document.removeEventListener('pointerdown', onPointerDown, { capture: true });
      document.removeEventListener('pointerover', over, { capture: true });
      document.removeEventListener('htmx:beforeSend', onBeforeSend, true);
      clearTimeout(hoverTimer);
      hovered = null;
      Array.from(entries.keys()).forEach(drop);
    });
  },
};
