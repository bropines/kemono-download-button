import { debugLog } from '../utils/helpers';

const DB_NAME = 'KemonoDownloaderCache';
const DB_VERSION = 2;
const STORE_FILES = 'files';
// Size/age per cached file, so eviction and stats never have to load the file bodies
const STORE_FILE_META = 'fileMeta';
const STORE_POSTS = 'posts';

// Downloaded files are kept for re-downloads; the oldest ones are evicted beyond this budget
const MAX_FILE_CACHE_BYTES = 2 * 1024 * 1024 * 1024;
// Buffers kept in memory for instant reuse within the tab
const MAX_MEMORY_CACHE_BYTES = 256 * 1024 * 1024;
const EVICTION_DELAY_MS = 5000;

interface FileMeta {
  url: string;
  size: number;
  timestamp: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;
const inMemoryPostCache = new Map<string, any>();
const inMemoryFileCache = new Map<string, ArrayBuffer>();
let inMemoryFileBytes = 0;
let evictionTimer: ReturnType<typeof setTimeout> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not supported in this browser.'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      // v1 had no metadata store to size the cache by; cached files are disposable, so start over
      if (event.oldVersion < 2 && db.objectStoreNames.contains(STORE_FILES)) {
        db.deleteObjectStore(STORE_FILES);
      }
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        const fileStore = db.createObjectStore(STORE_FILES, { keyPath: 'url' });
        fileStore.createIndex('completed', 'completed', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_FILE_META)) {
        db.createObjectStore(STORE_FILE_META, { keyPath: 'url' }).createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_POSTS)) {
        db.createObjectStore(STORE_POSTS, { keyPath: 'key' });
      }
    };
    request.onsuccess = (event: any) => resolve(event.target.result);
    request.onerror = (event: any) => {
      console.error('Failed to open IndexedDB:', event.target.error);
      reject(event.target.error);
    };
  });
  return dbPromise;
}

function awaitTransaction(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
    tx.onabort = () => resolve();
  });
}

function rememberInMemory(url: string, data: ArrayBuffer): void {
  const existing = inMemoryFileCache.get(url);
  if (existing) {
    inMemoryFileCache.delete(url);
    inMemoryFileBytes -= existing.byteLength;
  }
  if (data.byteLength > MAX_MEMORY_CACHE_BYTES) return;
  // Re-inserting moves the entry to the end, so iteration order is least recently used first
  inMemoryFileCache.set(url, data);
  inMemoryFileBytes += data.byteLength;
  for (const [key, value] of inMemoryFileCache) {
    if (inMemoryFileBytes <= MAX_MEMORY_CACHE_BYTES) break;
    inMemoryFileCache.delete(key);
    inMemoryFileBytes -= value.byteLength;
  }
}

function readFileMeta(db: IDBDatabase): Promise<FileMeta[]> {
  return new Promise((resolve) => {
    const entries: FileMeta[] = [];
    const request = db.transaction(STORE_FILE_META, 'readonly').objectStore(STORE_FILE_META).index('timestamp').openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        entries.push(cursor.value);
        cursor.continue();
      } else {
        resolve(entries);
      }
    };
    request.onerror = () => resolve(entries);
  });
}

async function evictOldFiles(): Promise<void> {
  try {
    const db = await getDB();
    const entries = await readFileMeta(db); // oldest first
    let totalBytes = entries.reduce((sum, entry) => sum + entry.size, 0);
    const evicted: string[] = [];
    for (const entry of entries) {
      if (totalBytes <= MAX_FILE_CACHE_BYTES) break;
      evicted.push(entry.url);
      totalBytes -= entry.size;
    }
    if (evicted.length === 0) return;

    const tx = db.transaction([STORE_FILES, STORE_FILE_META], 'readwrite');
    evicted.forEach((url) => {
      tx.objectStore(STORE_FILES).delete(url);
      tx.objectStore(STORE_FILE_META).delete(url);
    });
    await awaitTransaction(tx);
    debugLog(`File cache over budget: evicted ${evicted.length} oldest files.`);
  } catch (e) {
    debugLog('Failed to evict cached files from IndexedDB:', e);
  }
}

function scheduleEviction(): void {
  if (evictionTimer) return;
  evictionTimer = setTimeout(() => {
    evictionTimer = null;
    evictOldFiles();
  }, EVICTION_DELAY_MS);
}

export async function getCachedFile(url: string): Promise<ArrayBuffer | null> {
  const inMemory = inMemoryFileCache.get(url);
  if (inMemory) {
    rememberInMemory(url, inMemory);
    return inMemory;
  }

  try {
    const db = await getDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_FILES, 'readonly');
      const store = tx.objectStore(STORE_FILES);
      const req = store.get(url);
      req.onsuccess = () => {
        const result = req.result;
        if (result && result.completed && result.data) {
          rememberInMemory(url, result.data);
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    debugLog('Failed to get cached file from IndexedDB:', e);
    return null;
  }
}

export async function setCachedFile(url: string, data: ArrayBuffer, completed = true): Promise<void> {
  if (completed) rememberInMemory(url, data);

  try {
    const db = await getDB();
    const timestamp = Date.now();
    const tx = db.transaction([STORE_FILES, STORE_FILE_META], 'readwrite');
    tx.objectStore(STORE_FILES).put({ url, data, completed, size: data.byteLength, timestamp });
    tx.objectStore(STORE_FILE_META).put({ url, size: data.byteLength, timestamp });
    await awaitTransaction(tx);
    scheduleEviction();
  } catch (e) {
    debugLog('Failed to set cached file in IndexedDB:', e);
  }
}

export async function getCachedPost(key: string): Promise<any | null> {
  if (inMemoryPostCache.has(key)) {
    return inMemoryPostCache.get(key);
  }

  try {
    const db = await getDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_POSTS, 'readonly');
      const store = tx.objectStore(STORE_POSTS);
      const req = store.get(key);
      req.onsuccess = () => {
        const result = req.result;
        if (result && result.data) {
          inMemoryPostCache.set(key, result.data);
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    debugLog('Failed to get cached post from IndexedDB:', e);
    return null;
  }
}

export async function setCachedPost(key: string, data: any): Promise<void> {
  inMemoryPostCache.set(key, data);

  try {
    const db = await getDB();
    const tx = db.transaction(STORE_POSTS, 'readwrite');
    tx.objectStore(STORE_POSTS).put({ key, data, timestamp: Date.now() });
    await awaitTransaction(tx);
  } catch (e) {
    debugLog('Failed to set cached post in IndexedDB:', e);
  }
}

export async function clearIncompleteCache(): Promise<number> {
  let deletedCount = 0;

  try {
    const db = await getDB();
    const tx = db.transaction([STORE_FILES, STORE_FILE_META], 'readwrite');
    const request = tx.objectStore(STORE_FILES).openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      if (!cursor.value.completed) {
        tx.objectStore(STORE_FILE_META).delete(cursor.value.url);
        cursor.delete();
        deletedCount++;
      }
      cursor.continue();
    };
    await awaitTransaction(tx);
  } catch (e) {
    debugLog('Failed to clear incomplete cache in IndexedDB:', e);
  }
  return deletedCount;
}

export async function clearAllCache(): Promise<void> {
  inMemoryPostCache.clear();
  inMemoryFileCache.clear();
  inMemoryFileBytes = 0;

  try {
    const db = await getDB();
    const tx = db.transaction([STORE_FILES, STORE_FILE_META, STORE_POSTS], 'readwrite');
    tx.objectStore(STORE_FILES).clear();
    tx.objectStore(STORE_FILE_META).clear();
    tx.objectStore(STORE_POSTS).clear();
    await awaitTransaction(tx);
  } catch (e) {
    debugLog('Failed to clear all cache in IndexedDB:', e);
  }
}

export async function getCacheStats(): Promise<{ count: number; totalSizeBytes: number }> {
  try {
    const entries = await readFileMeta(await getDB());
    return { count: entries.length, totalSizeBytes: entries.reduce((sum, entry) => sum + entry.size, 0) };
  } catch (e) {
    debugLog('Failed to get cache stats from IndexedDB:', e);
    return { count: 0, totalSizeBytes: 0 };
  }
}
