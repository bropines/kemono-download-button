import { awaitTransaction, getDB, STORE_HISTORY } from './cacheService';
import { debugLog } from '../utils/helpers';

// Remembers which files were downloaded, by content hash: file URLs end in /<sha256>.<ext>, so the same file
// under another post, name or domain is recognised. Hashes live in IndexedDB (GM storage is no place for
// thousands of keys); the set in memory answers lookups synchronously once loaded.

const HASH_IN_URL = /\/([0-9a-f]{64})\.[a-z0-9]+(?:[?#]|$)/i;
const FLUSH_DELAY_MS = 1000;

let known: Set<string> | null = null;
let loading: Promise<Set<string>> | null = null;
let pending = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

/** The file's sha256 from its URL, or null when the URL has no such stem (the feature ignores those). */
export function hashFromUrl(url: unknown): string | null {
  return typeof url === 'string' ? HASH_IN_URL.exec(url)?.[1].toLowerCase() ?? null : null;
}

/** Loads the remembered hashes (once); resolves with an empty set when IndexedDB is unavailable. */
export function loadDownloadHistory(): Promise<Set<string>> {
  if (known) return Promise.resolve(known);
  loading ??= (async () => {
    const set = new Set<string>();
    try {
      const db = await getDB();
      await new Promise<void>((resolve) => {
        const request = db.transaction(STORE_HISTORY, 'readonly').objectStore(STORE_HISTORY).getAllKeys();
        request.onsuccess = () => {
          (request.result as IDBValidKey[]).forEach((key) => set.add(String(key)));
          resolve();
        };
        request.onerror = () => resolve();
      });
    } catch (error) {
      debugLog('Failed to load download history:', error);
    }
    pending.forEach((hash) => set.add(hash));
    known = set;
    return set;
  })();
  return loading;
}

/** Synchronous check; false until the history has been loaded. */
export function isUrlDownloaded(url: unknown): boolean {
  const hash = hashFromUrl(url);
  return !!hash && !!known?.has(hash);
}

export const downloadedCount = async (): Promise<number> => (await loadDownloadHistory()).size;

export async function flushDownloadHistory(): Promise<void> {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = null;
  const batch = pending;
  pending = new Set();
  if (batch.size === 0) return;
  try {
    const tx = (await getDB()).transaction(STORE_HISTORY, 'readwrite');
    const store = tx.objectStore(STORE_HISTORY);
    const now = Date.now();
    batch.forEach((hash) => store.put(now, hash));
    await awaitTransaction(tx);
  } catch (error) {
    debugLog('Failed to save download history:', error);
  }
}

/** Remembers a finished download. Writes are batched into one transaction. */
export function recordDownloaded(url: unknown): void {
  const hash = hashFromUrl(url);
  if (!hash || known?.has(hash) || pending.has(hash)) return;
  pending.add(hash);
  known?.add(hash);
  listeners.forEach((fn) => fn());
  flushTimer ??= setTimeout(() => void flushDownloadHistory(), FLUSH_DELAY_MS);
}

export async function clearDownloadHistory(): Promise<void> {
  pending = new Set();
  known = new Set();
  loading = Promise.resolve(known);
  try {
    const tx = (await getDB()).transaction(STORE_HISTORY, 'readwrite');
    tx.objectStore(STORE_HISTORY).clear();
    await awaitTransaction(tx);
  } catch (error) {
    debugLog('Failed to clear download history:', error);
  }
  listeners.forEach((fn) => fn());
}

/** Fires after a hash is added or the history is cleared. Returns an unsubscribe. */
export function onDownloadHistoryChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Splits files into the ones to download and the count skipped as already downloaded (when the setting is on). */
export async function dropDownloaded<T>(items: T[], urlOf: (item: T) => unknown, enabled: boolean): Promise<{ items: T[]; skipped: number }> {
  if (!enabled || items.length === 0) return { items, skipped: 0 };
  const history = await loadDownloadHistory();
  const kept = items.filter((item) => {
    const hash = hashFromUrl(urlOf(item));
    return !hash || !history.has(hash);
  });
  return { items: kept, skipped: items.length - kept.length };
}
