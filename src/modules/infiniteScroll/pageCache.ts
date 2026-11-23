// Persistent cache of the pages infinite scroll fetched for a creator's post list, so scrolling the same creator
// again costs the site nothing. Lives in IndexedDB of the site's origin (shared by its tabs).
//
// Small on disk: a page is the card markup the server sent (whitespace between tags dropped), deflated with fflate,
// about 5-8 KB for 50 cards. The whole store has a byte budget; past it the least recently scrolled creators go
// first, whole lists at a time.
// Never wrong for long: a list record keeps the first cards of page one. When the live page one starts with
// other cards (new posts shifted every offset), all cached pages of that creator are dropped. Entries also expire.
// IndexedDB is optional: any error there means "not cached".

import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate';

const DB_NAME = 'KdlListPages';
const PAGES = 'pages';
const LISTS = 'lists';
const DB_WAIT_MS = 1500;
const HEAD_CARDS = 3;
const DAY = 24 * 60 * 60 * 1000;

export interface CachedPage {
  html: string[];
  next: string | null;
  range: { from: number; to: number; total: number | null } | null;
}

interface PageRecord extends Omit<CachedPage, 'html'> {
  key: string;
  list: string;
  saved: number;
  size: number;
  data: Uint8Array;
}

interface ListRecord {
  key: string;
  head: string[];
  used: number;
  size: number;
}

export interface PageCacheLimits {
  /** Byte budget of the whole store; 0 = cache off */
  maxBytes: number;
  /** How long a page may be served */
  ttlMs: number;
}

/** Creator post lists only (no in-creator search): other lists change by the minute */
const CREATOR_LIST = /^\/[^/]+\/user\/[^/?#]+\/?$/;

/** The list a page address belongs to (its address without the offset), or null when it is not cached */
export function listKeyOf(href: string): string | null {
  try {
    const url = new URL(href, window.location.href);
    if (!CREATOR_LIST.test(url.pathname) || url.searchParams.has('q')) return null;
    return url.pathname.replace(/\/$/, '');
  } catch {
    return null;
  }
}

function pageKeyOf(list: string, href: string): string {
  let offset = '0';
  try { offset = new URL(href, window.location.href).searchParams.get('o') || '0'; } catch { /* first page */ }
  return `${list}|${offset}`;
}

let dbPromise: Promise<IDBDatabase | null> | undefined;

function openDb(): Promise<IDBDatabase | null> {
  dbPromise ??= new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(PAGES)) db.createObjectStore(PAGES, { keyPath: 'key' });
        if (!db.objectStoreNames.contains(LISTS)) db.createObjectStore(LISTS, { keyPath: 'key' });
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => { db.close(); dbPromise = undefined; };
        resolve(db);
      };
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch { resolve(null); }
  });
  return withDeadline(dbPromise, null);
}

function withDeadline<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), DB_WAIT_MS);
    promise.then((value) => { clearTimeout(timer); resolve(value); }, () => { clearTimeout(timer); resolve(fallback); });
  });
}

const req = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });

const done = (tx: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => reject(tx.error); });

const listRange = (list: string): IDBKeyRange => IDBKeyRange.bound(`${list}|`, `${list}|￿`);

async function dropList(db: IDBDatabase, list: string): Promise<void> {
  const tx = db.transaction([PAGES, LISTS], 'readwrite');
  tx.objectStore(PAGES).delete(listRange(list));
  tx.objectStore(LISTS).delete(list);
  await done(tx);
}

/** Removes markup noise that deflate would still pay for */
const squeeze = (html: string): string => html.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();

/**
 * Checks the cached pages of a list against the live first page (the keys of its first cards): when they differ,
 * the list is dropped. Resolves once checked, so a lookup never serves pages of an outdated list.
 */
export async function checkHead(list: string, liveKeys: string[], limits: PageCacheLimits): Promise<void> {
  const head = liveKeys.slice(0, HEAD_CARDS);
  try {
    const db = await openDb();
    if (!db) return;
    if (!limits.maxBytes) {
      // Cache switched off: nothing of it stays on disk
      const tx = db.transaction([PAGES, LISTS], 'readwrite');
      tx.objectStore(PAGES).clear();
      tx.objectStore(LISTS).clear();
      return await done(tx);
    }
    const record = await req<ListRecord | undefined>(db.transaction(LISTS).objectStore(LISTS).get(list));
    if (record && head.length && record.head.join('\n') !== head.join('\n')) await dropList(db, list);
  } catch { /* not cached */ }
}

/** A cached page of the list, or null (missing, expired, unreadable) */
export async function getPage(list: string, href: string, limits: PageCacheLimits): Promise<CachedPage | null> {
  if (!limits.maxBytes) return null;
  try {
    const db = await openDb();
    if (!db) return null;
    const record = await req<PageRecord | undefined>(db.transaction(PAGES).objectStore(PAGES).get(pageKeyOf(list, href)));
    if (!record) return null;
    if (Date.now() - record.saved > limits.ttlMs) {
      db.transaction(PAGES, 'readwrite').objectStore(PAGES).delete(record.key);
      return null;
    }
    const html = JSON.parse(strFromU8(inflateSync(record.data))) as string[];
    if (!Array.isArray(html)) return null;
    void touch(db, list, 0);
    return { html, next: record.next, range: record.range };
  } catch {
    return null;
  }
}

async function touch(db: IDBDatabase, list: string, added: number, head?: string[]): Promise<void> {
  const tx = db.transaction(LISTS, 'readwrite');
  const store = tx.objectStore(LISTS);
  const record = await req<ListRecord | undefined>(store.get(list));
  if (!record && !head) return;
  store.put({ key: list, head: head ?? record!.head, used: Date.now(), size: Math.max(0, (record?.size ?? 0) + added) });
  await done(tx);
}

/** Stores a fetched page of the list; `head` is the first cards of the live page one */
export async function putPage(list: string, href: string, page: CachedPage, head: string[], limits: PageCacheLimits): Promise<void> {
  if (!limits.maxBytes || !page.html.length) return;
  try {
    const db = await openDb();
    if (!db) return;
    const data = deflateSync(strToU8(JSON.stringify(page.html.map(squeeze))), { level: 6 });
    if (data.byteLength > limits.maxBytes / 4) return;
    const key = pageKeyOf(list, href);
    const old = await req<PageRecord | undefined>(db.transaction(PAGES).objectStore(PAGES).get(key));
    const record: PageRecord = { key, list, saved: Date.now(), size: data.byteLength, data, next: page.next, range: page.range };
    const tx = db.transaction(PAGES, 'readwrite');
    tx.objectStore(PAGES).put(record);
    await done(tx);
    await touch(db, list, data.byteLength - (old?.size ?? 0), head.slice(0, HEAD_CARDS));
    await evict(db, limits.maxBytes, list);
  } catch { /* not cached */ }
}

/** Least recently scrolled lists go first until the store fits its budget (the list being scrolled stays) */
async function evict(db: IDBDatabase, maxBytes: number, keep: string): Promise<void> {
  const lists = await req<ListRecord[]>(db.transaction(LISTS).objectStore(LISTS).getAll());
  let total = lists.reduce((sum, record) => sum + record.size, 0);
  const victims = lists.filter((record) => record.key !== keep).sort((a, b) => a.used - b.used);
  for (const record of victims) {
    if (total <= maxBytes) break;
    await dropList(db, record.key);
    total -= record.size;
  }
}

export const PAGE_CACHE_DAY = DAY;
