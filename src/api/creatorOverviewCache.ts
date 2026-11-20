// Disposable cache for public creator overview responses only. Never put account or download data here.
const DB_NAME = 'KdlCreatorOverviewCache';
const STORE = 'responses';
const TTL_MS = 48 * 60 * 60 * 1000;
const MAX_ENTRIES = 100;
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_ITEM_BYTES = 256 * 1024;

type Kind = 'announcements' | 'tags' | 'links';
interface Entry { key: string; saved: number; size: number; data: unknown[] }
const memory = new Map<string, Entry>();
const pending = new Map<string, Promise<unknown>>();
let dbPromise: Promise<IDBDatabase | null> | undefined;
let generation = 0;

function valid(kind: Kind, data: unknown): data is unknown[] {
  return Array.isArray(data) && data.every((value) => {
    if (!value || typeof value !== 'object') return false;
    const row = value as Record<string, unknown>;
    if (kind === 'announcements') return typeof row.content === 'string';
    if (kind === 'tags') return typeof row.tag === 'string' && row.tag.length > 0;
    return typeof row.service === 'string' && row.service.length > 0 &&
      (typeof row.id === 'string' || typeof row.id === 'number') && String(row.id).length > 0;
  });
}

function database(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore(STORE, { keyPath: 'key' });
        store.createIndex('saved', 'saved');
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

function fresh(entry: Entry | undefined, key: string): entry is Entry {
  if (!entry || entry.key !== key || !Array.isArray(entry.data) || typeof entry.saved !== 'number') return false;
  const age = Date.now() - entry.saved;
  return age >= 0 && age < TTL_MS;
}

function remember(entry: Entry): void {
  memory.delete(entry.key);
  memory.set(entry.key, entry);
  let size = [...memory.values()].reduce((sum, item) => sum + item.size, 0);
  while (memory.size > MAX_ENTRIES || size > MAX_BYTES) {
    const oldest = memory.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    size -= memory.get(oldest)!.size;
    memory.delete(oldest);
  }
}

async function read(key: string, version: number): Promise<Entry | undefined> {
  const item = memory.get(key);
  if (fresh(item, key)) return item;
  memory.delete(key);
  try {
    const db = await database();
    if (!db) return undefined;
    return await new Promise((resolve) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
      request.onsuccess = () => {
        const entry = request.result as Entry | undefined;
        if (version === generation && fresh(entry, key) && typeof entry.size === 'number' && entry.size >= 0 && entry.size <= MAX_ITEM_BYTES) {
          remember(entry);
          resolve(entry);
        } else resolve(undefined);
      };
      request.onerror = () => resolve(undefined);
    });
  } catch { return undefined; }
}

async function persist(entry: Entry, version: number): Promise<void> {
  try {
    const db = await database();
    if (!db || version !== generation) return;
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      store.put(entry);
      const items: Entry[] = [];
      const request = store.index('saved').openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          items.push(cursor.value as Entry);
          cursor.continue();
          return;
        }
        let bytes = items.reduce((sum, item) => sum + (Number(item.size) || 0), 0);
        let count = items.length;
        for (const item of items) {
          if (fresh(item, item.key) && count <= MAX_ENTRIES && bytes <= MAX_BYTES) break;
          store.delete(item.key);
          bytes -= Number(item.size) || 0;
          count--;
        }
      };
      tx.oncomplete = tx.onerror = tx.onabort = () => resolve();
    });
  } catch { /* Caching must never prevent displaying the API response. */ }
}

/** Fresh cached public data or one shared request. Failed/invalid responses are never cached. */
export function cachedCreatorOverview<T>(kind: Kind, service: string, id: string, fetch: () => Promise<T>): Promise<T> {
  const key = JSON.stringify([window.location.origin, service, id, kind]);
  const existing = pending.get(key);
  if (existing) return existing as Promise<T>;
  const version = generation;
  const request = (async () => {
    const cached = await read(key, version);
    if (cached && valid(kind, cached.data)) return cached.data as T;
    const data = await fetch();
    if (version === generation && valid(kind, data)) {
      try {
        // UTF-16 is a conservative size estimate and does not require TextEncoder in older hosts.
        const size = JSON.stringify(data).length * 2;
        if (size <= MAX_ITEM_BYTES) {
          const entry: Entry = { key, saved: Date.now(), size, data };
          remember(entry);
          void persist(entry, version);
        }
      } catch { /* Non-serializable data is not cached. */ }
    }
    return data;
  })();
  pending.set(key, request);
  const done = () => { if (pending.get(key) === request) pending.delete(key); };
  void request.then(done, done);
  return request;
}

/** Clear the disposable cache; in-flight requests started before this cannot repopulate it. */
export async function clearCreatorOverviewCache(): Promise<void> {
  generation++;
  memory.clear();
  pending.clear();
  try {
    const db = await database();
    if (!db) return;
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = tx.onerror = tx.onabort = () => resolve();
    });
  } catch { /* Optional cache. */ }
}
