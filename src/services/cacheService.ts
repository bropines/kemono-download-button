import { debugLog } from '../utils/helpers';

const DB_NAME = 'KemonoDownloaderCache';
const DB_VERSION = 1;
const STORE_FILES = 'files';
const STORE_POSTS = 'posts';

let dbPromise: Promise<IDBDatabase> | null = null;
const inMemoryPostCache = new Map<string, any>();
const inMemoryFileCache = new Map<string, { data: ArrayBuffer; completed: boolean }>();

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not supported in this browser.'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        const fileStore = db.createObjectStore(STORE_FILES, { keyPath: 'url' });
        fileStore.createIndex('completed', 'completed', { unique: false });
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

export async function getCachedFile(url: string): Promise<ArrayBuffer | null> {
  if (inMemoryFileCache.has(url)) {
    const item = inMemoryFileCache.get(url)!;
    if (item.completed) return item.data;
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
          inMemoryFileCache.set(url, { data: result.data, completed: true });
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

export async function setCachedFile(url: string, data: ArrayBuffer, completed: boolean): Promise<void> {
  inMemoryFileCache.set(url, { data, completed });

  try {
    const db = await getDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_FILES, 'readwrite');
      const store = tx.objectStore(STORE_FILES);
      store.put({
        url,
        data,
        completed,
        size: data.byteLength,
        timestamp: Date.now()
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
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
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_POSTS, 'readwrite');
      const store = tx.objectStore(STORE_POSTS);
      store.put({ key, data, timestamp: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (e) {
    debugLog('Failed to set cached post in IndexedDB:', e);
  }
}

export async function clearIncompleteCache(): Promise<number> {
  let deletedCount = 0;
  for (const [url, item] of inMemoryFileCache.entries()) {
    if (!item.completed) inMemoryFileCache.delete(url);
  }

  try {
    const db = await getDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_FILES, 'readwrite');
      const store = tx.objectStore(STORE_FILES);
      const req = store.openCursor();
      req.onsuccess = (e: any) => {
        const cursor = e.target.result;
        if (cursor) {
          if (!cursor.value.completed) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => resolve();
    });
  } catch (e) {
    debugLog('Failed to clear incomplete cache in IndexedDB:', e);
  }
  return deletedCount;
}

export async function clearAllCache(): Promise<void> {
  inMemoryPostCache.clear();
  inMemoryFileCache.clear();

  try {
    const db = await getDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction([STORE_FILES, STORE_POSTS], 'readwrite');
      tx.objectStore(STORE_FILES).clear();
      tx.objectStore(STORE_POSTS).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (e) {
    debugLog('Failed to clear all cache in IndexedDB:', e);
  }
}

export async function getCacheStats(): Promise<{ count: number; totalSizeBytes: number }> {
  let count = 0;
  let totalSizeBytes = 0;

  try {
    const db = await getDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_FILES, 'readonly');
      const store = tx.objectStore(STORE_FILES);
      const req = store.openCursor();
      req.onsuccess = (e: any) => {
        const cursor = e.target.result;
        if (cursor) {
          count++;
          totalSizeBytes += cursor.value.size || (cursor.value.data ? cursor.value.data.byteLength : 0);
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => resolve();
    });
  } catch (e) {
    debugLog('Failed to get cache stats from IndexedDB:', e);
  }

  return { count, totalSizeBytes };
}
