// Cache for read-only API answers: an in-memory LRU per tab over an IndexedDB store shared by the site's tabs.
// Every entry carries the TTL of its endpoint class (API_TTL_RULES); the "API cache lifetime" setting scales all of
// them (off = no cache at all). A fresh entry is served at once; a stale one within its stale window is served at
// once too while one background request refreshes it (callers may pass onUpdate to hear about changed data).
// Concurrent callers of one key share one request. Account data (favourites) is never stored, failed or malformed
// answers are never stored, empty lists only briefly. IndexedDB is optional: any error there means "not cached".

import { getSettings, state } from '../state/store';
import { abortError, gmXmlhttpRequestWithRetries } from '../utils/http';

export type ApiCacheLifetime = 'off' | 'short' | 'normal' | 'long';
const MULTIPLIER: Record<ApiCacheLifetime, number> = { off: 0, short: 0.25, normal: 1, long: 4 };

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** ttl: how long an entry is fresh; stale: how much longer it may still be served while it is refreshed */
export interface CachePolicy { cls: string; ttl: number; stale: number }

// First match wins; tested against the request URL. ttl 0 = never stored.
export const API_TTL_RULES: Array<CachePolicy & { test: RegExp }> = [
  { cls: 'account', test: /\/api\/v\d+\/(account|favorites)\b/, ttl: 0, stale: 0 },
  { cls: 'search', test: /[?&]q=/, ttl: 5 * MIN, stale: 0 },
  { cls: 'hash', test: /\/api\/v\d+\/search_hash\//, ttl: DAY, stale: 7 * DAY },
  { cls: 'comments', test: /\/user\/[^/]+\/post\/[^/?#]+\/comments/, ttl: HOUR, stale: DAY },
  { cls: 'post', test: /\/user\/[^/]+\/post\/[^/?#]+\/?(?:[?#]|$)/, ttl: DAY, stale: 7 * DAY },
  { cls: 'profile', test: /\/user\/[^/]+\/profile\b/, ttl: 6 * HOUR, stale: 7 * DAY },
  { cls: 'overview', test: /\/user\/[^/]+\/(?:tags|links|announcements|recommended)\/?(?:[?#]|$)/, ttl: 12 * HOUR, stale: 7 * DAY },
  { cls: 'creatorPosts', test: /\/api\/v\d+\/[^/]+\/user\/[^/?#]+(?:\/posts)?\/?(?:[?#]|$)/, ttl: 10 * MIN, stale: HOUR },
  { cls: 'posts', test: /\/api\/v\d+\/posts(?:\/popular)?\/?(?:[?#]|$)/, ttl: 5 * MIN, stale: 30 * MIN },
  { cls: 'creators', test: /\/api\/v\d+\/creators\b/, ttl: DAY, stale: 7 * DAY },
  { cls: 'default', test: /^/, ttl: 10 * MIN, stale: HOUR },
];
const SESSION_POLICY: CachePolicy = { cls: 'account', ttl: 0, stale: 0 };
// An empty list may only mean "not indexed yet": kept briefly and never served stale
const EMPTY_TTL = 5 * MIN;

const DB_NAME = 'KdlApiCache';
const LEGACY_DB = 'KdlCreatorOverviewCache';
const STORE = 'responses';
const META = 'meta';
const MAX_ENTRIES = 1000;
const MAX_BYTES = 16 * 1024 * 1024;
const MAX_ITEM_BYTES = 1024 * 1024;
const MEMORY_ENTRIES = 200;
const MEMORY_BYTES = 8 * 1024 * 1024;
// A host whose IndexedDB hangs (blocked upgrade, private mode quirks) must not hold the page
const DB_WAIT_MS = 1500;
const EVICT_DELAY_MS = 3000;

interface Meta { key: string; url: string; saved: number; ttl: number; stale: number; size: number }
interface Entry extends Meta { sig: number; data: unknown }

const memory = new Map<string, Entry>();
let memoryBytes = 0;
const lookups = new Map<string, Promise<unknown>>();
const network = new Map<string, Promise<unknown>>();
const listeners = new Map<string, Set<(data: any) => void>>();
let generation = 0;
let dbPromise: Promise<IDBDatabase | null> | undefined;
let evictTimer: ReturnType<typeof setTimeout> | null = null;

export function policyFor(url: string): CachePolicy {
  const rule = API_TTL_RULES.find((item) => item.test.test(url))!;
  return { cls: rule.cls, ttl: rule.ttl, stale: rule.stale };
}

function multiplier(): number {
  const value = state.settings?.apiCacheLifetime as ApiCacheLifetime | undefined;
  return value && value in MULTIPLIER ? MULTIPLIER[value] : MULTIPLIER.normal;
}

// UTF-16 length is a conservative size and needs no TextEncoder; the hash tells a changed answer from the same one
function measure(data: unknown): { size: number; sig: number } | null {
  let text: string;
  try { text = JSON.stringify(data); } catch { return null; }
  if (typeof text !== 'string') return null;
  let sig = 5381;
  for (let i = 0; i < text.length; i++) sig = ((sig * 33) ^ text.charCodeAt(i)) >>> 0;
  return { size: text.length * 2, sig };
}

const defaultValid = (data: unknown): boolean => data !== null && typeof data === 'object';

// ---- memory tier ----

function remember(entry: Entry): void {
  forget(entry.key);
  memory.set(entry.key, entry);
  memoryBytes += entry.size;
  for (const [key, item] of memory) {
    if (memory.size <= MEMORY_ENTRIES && memoryBytes <= MEMORY_BYTES) break;
    memory.delete(key);
    memoryBytes -= item.size;
  }
}

function forget(key: string): void {
  const old = memory.get(key);
  if (!old) return;
  memory.delete(key);
  memoryBytes -= old.size;
}

// ---- IndexedDB tier ----

function database(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames?.contains?.(STORE)) db.createObjectStore(STORE, { keyPath: 'key' });
        if (!db.objectStoreNames?.contains?.(META)) db.createObjectStore(META, { keyPath: 'key' });
        // Its creator overview answers now live here
        try { indexedDB.deleteDatabase(LEGACY_DB); } catch { /* optional */ }
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
  return dbPromise;
}

function withDeadline<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), DB_WAIT_MS);
    promise.then((value) => { clearTimeout(timer); resolve(value); }, () => { clearTimeout(timer); resolve(fallback); });
  });
}

function validEntry(entry: Entry | undefined, key: string): entry is Entry {
  return !!entry && entry.key === key && typeof entry.saved === 'number' && typeof entry.ttl === 'number' &&
    typeof entry.stale === 'number' && typeof entry.size === 'number' && entry.size >= 0 && entry.size <= MAX_ITEM_BYTES && 'data' in entry;
}

async function read(key: string): Promise<Entry | undefined> {
  const item = memory.get(key);
  if (item) {
    remember(item); // most recently used
    return item;
  }
  const version = generation;
  const entry = await withDeadline((async () => {
    const db = await database();
    if (!db) return undefined;
    return new Promise<Entry | undefined>((resolve) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
      request.onsuccess = () => resolve(request.result as Entry | undefined);
      request.onerror = () => resolve(undefined);
    });
  })(), undefined);
  if (version !== generation || !validEntry(entry, key)) return undefined;
  remember(entry);
  return entry;
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve) => { tx.oncomplete = tx.onerror = tx.onabort = () => resolve(); });
}

async function persist(entry: Entry, version: number): Promise<void> {
  try {
    const db = await database();
    if (!db || version !== generation) return;
    const tx = db.transaction([STORE, META], 'readwrite');
    tx.objectStore(STORE).put(entry);
    const meta: Meta = { key: entry.key, url: entry.url, saved: entry.saved, ttl: entry.ttl, stale: entry.stale, size: entry.size };
    tx.objectStore(META).put(meta);
    await done(tx);
    scheduleEviction();
  } catch { /* Caching never prevents showing the answer */ }
}

function readMeta(db: IDBDatabase, tx?: IDBTransaction): Promise<Meta[]> {
  return new Promise((resolve) => {
    const items: Meta[] = [];
    const request = (tx || db.transaction(META, 'readonly')).objectStore(META).openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return resolve(items);
      items.push(cursor.value as Meta);
      cursor.continue();
    };
    request.onerror = () => resolve(items);
  });
}

/** Deletes entries past their stale window, then the oldest ones beyond the entry and byte budgets */
async function evict(): Promise<void> {
  try {
    const db = await database();
    if (!db) return;
    const tx = db.transaction([STORE, META], 'readwrite');
    const items = (await readMeta(db, tx)).sort((a, b) => a.saved - b.saved);
    const now = Date.now();
    const scale = Math.max(multiplier(), 1);
    let count = items.length;
    let bytes = items.reduce((sum, item) => sum + (Number(item.size) || 0), 0);
    for (const item of items) {
      const expired = !(now - item.saved < (item.ttl + item.stale) * scale);
      if (!expired && count <= MAX_ENTRIES && bytes <= MAX_BYTES) continue;
      tx.objectStore(STORE).delete(item.key);
      tx.objectStore(META).delete(item.key);
      count--;
      bytes -= Number(item.size) || 0;
    }
    await done(tx);
  } catch { /* optional */ }
}

function scheduleEviction(): void {
  if (evictTimer) return;
  evictTimer = setTimeout(() => { evictTimer = null; void evict(); }, EVICT_DELAY_MS);
}

// ---- requests ----

function share<T>(map: Map<string, Promise<unknown>>, key: string, start: () => Promise<T>): Promise<T> {
  const running = map.get(key);
  if (running) return running as Promise<T>;
  const request = start();
  map.set(key, request);
  const clear = () => { if (map.get(key) === request) map.delete(key); };
  request.then(clear, clear);
  return request;
}

/** Stores a valid answer (no-op for failed/malformed ones or after a clear/invalidate that started later) */
function store(key: string, url: string, policy: CachePolicy, data: unknown, valid: (data: unknown) => boolean, version: number): Entry | null {
  if (version !== generation || policy.ttl <= 0 || !valid(data)) return null;
  const measured = measure(data);
  if (!measured || measured.size > MAX_ITEM_BYTES) return null;
  const empty = Array.isArray(data) && data.length === 0;
  const entry: Entry = {
    key, url, data, sig: measured.sig, size: measured.size, saved: Date.now(),
    ttl: empty ? Math.min(policy.ttl, EMPTY_TTL) : policy.ttl,
    stale: empty ? 0 : policy.stale,
  };
  remember(entry);
  void persist(entry, version);
  return entry;
}

function notify(key: string, data: unknown): void {
  const set = listeners.get(key);
  listeners.delete(key);
  set?.forEach((listener) => { try { listener(data); } catch { /* a listener's error is its own */ } });
}

function revalidate<T>(options: CachedOptions<T>, policy: CachePolicy, old: Entry): void {
  const version = generation;
  const valid = options.validate || defaultValid;
  void share(network, options.key, options.load).then((data) => {
    const entry = store(options.key, options.url ?? options.key, policy, data, valid, version);
    if (entry && entry.sig !== old.sig) notify(options.key, data);
    else listeners.delete(options.key);
  }, () => listeners.delete(options.key)); // the stale copy stays until it runs out
}

function withSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(abortError());
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (value) => { signal.removeEventListener('abort', onAbort); resolve(value); },
      (error) => { signal.removeEventListener('abort', onAbort); reject(error); }
    );
  });
}

export interface CachedOptions<T> {
  /** Unique per answer: origin, method and URL (see apiGet) */
  key: string;
  /** Matched against API_TTL_RULES (defaults to key) and kept for invalidation */
  url?: string;
  policy?: CachePolicy;
  load: () => Promise<T>;
  /** Answers it rejects are returned but never stored (default: any object or array) */
  validate?: (data: unknown) => boolean;
  /** false: an entry past its TTL is not served while refreshing (downloads want current data). Default true */
  allowStale?: boolean;
  /** Called once when a stale answer this call returned was refreshed and turned out different */
  onUpdate?: (data: T) => void;
  /** Aborts this caller's wait only: the shared request continues for the others (and the cache) */
  signal?: AbortSignal;
}

export function cached<T>(options: CachedOptions<T>): Promise<T> {
  const url = options.url ?? options.key;
  const policy = options.policy || policyFor(url);
  const lookup = async (): Promise<T> => {
    try { await getSettings(); } catch { /* defaults */ }
    const scale = multiplier();
    if (scale <= 0 || policy.ttl <= 0) return share(network, options.key, options.load);
    const version = generation;
    const entry = await read(options.key);
    if (entry) {
      const age = Date.now() - entry.saved;
      if (age >= 0 && age < entry.ttl * scale) return entry.data as T;
      if (options.allowStale !== false && entry.stale > 0 && age >= 0 && age < (entry.ttl + entry.stale) * scale) {
        revalidate(options, policy, entry);
        return entry.data as T;
      }
    }
    const data = await share(network, options.key, options.load);
    store(options.key, url, policy, data, options.validate || defaultValid, version);
    return data;
  };
  // Stale-tolerant and strict callers must not share a lookup: a strict one would get the stale copy
  const lookupKey = `${options.allowStale === false ? 'strict' : 'swr'} ${options.key}`;
  const { onUpdate, key } = options;
  if (onUpdate) {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key)!.add(onUpdate);
  }
  const result = share(lookups, lookupKey, lookup);
  if (onUpdate) {
    // Kept only while a background refresh of a stale answer runs
    const drop = () => { if (!network.has(key)) listeners.get(key)?.delete(onUpdate); };
    result.then(drop, drop);
  }
  return withSignal(result, options.signal);
}

export interface ApiGetOptions {
  timeout?: number;
  headers?: Record<string, string>;
  validate?: (data: unknown) => boolean;
  allowStale?: boolean;
  onUpdate?: (data: any) => void;
  signal?: AbortSignal;
  /** The answer depends on who is logged in: never stored, only shared while in flight */
  session?: boolean;
}

/** AdGuard ignores responseType: a JSON answer may arrive as text */
export function normalizeJson(response: any): unknown {
  let body = response?.response;
  if (body === null || body === undefined || typeof body === 'string') {
    const text = typeof body === 'string' && body ? body : response?.responseText;
    if (typeof text === 'string' && text.trim()) {
      try { body = JSON.parse(text); } catch { /* not JSON: returned as is, never stored */ }
    }
  }
  return body;
}

export const apiCacheKey = (method: string, url: string): string => `${method.toUpperCase()} ${url}`;

/** GET a JSON API URL (absolute, see getApiUrl) through the cache */
export function apiGet<T = any>(url: string, options: ApiGetOptions = {}): Promise<T> {
  return cached<T>({
    key: apiCacheKey('GET', url),
    url,
    policy: options.session ? SESSION_POLICY : policyFor(url),
    validate: options.validate,
    allowStale: options.allowStale,
    onUpdate: options.onUpdate,
    signal: options.signal,
    load: async () => normalizeJson(await gmXmlhttpRequestWithRetries({
      method: 'GET', url, responseType: 'json', timeout: options.timeout ?? 30000, headers: options.headers,
    })) as T,
  });
}

/** Drops matching entries (by URL) from both tiers; answers in flight when this runs are not stored */
export async function invalidateApiCache(match: (url: string) => boolean): Promise<void> {
  generation++;
  for (const [key, entry] of [...memory]) if (match(entry.url)) forget(key);
  try {
    const db = await database();
    if (!db) return;
    const tx = db.transaction([STORE, META], 'readwrite');
    for (const item of await readMeta(db, tx)) {
      if (!match(String(item.url))) continue;
      tx.objectStore(STORE).delete(item.key);
      tx.objectStore(META).delete(item.key);
    }
    await done(tx);
  } catch { /* optional */ }
}

/** Empties both tiers; requests started before this cannot repopulate it */
export async function clearApiCache(): Promise<void> {
  generation++;
  memory.clear();
  memoryBytes = 0;
  lookups.clear();
  network.clear();
  listeners.clear();
  try {
    const db = await database();
    if (!db) return;
    const tx = db.transaction([STORE, META], 'readwrite');
    tx.objectStore(STORE).clear();
    tx.objectStore(META).clear();
    await done(tx);
  } catch { /* optional */ }
}

export async function getApiCacheStats(): Promise<{ count: number; totalSizeBytes: number }> {
  try {
    const db = await withDeadline(database(), null);
    if (db) {
      const items = await withDeadline(readMeta(db), [] as Meta[]);
      return { count: items.length, totalSizeBytes: items.reduce((sum, item) => sum + (Number(item.size) || 0), 0) };
    }
  } catch { /* fall back to this tab's memory */ }
  return { count: memory.size, totalSizeBytes: memoryBytes };
}
