// GM storage that survives every userscript host.
//
// Tampermonkey keeps any JSON value, but GM4 only promises strings, numbers and booleans,
// and AdGuard for Android takes that literally in the worst way: an object written with
// GM_setValue reads back fine until the page reloads, then the key is empty. So objects
// and arrays go in as JSON text. A reader whose fallback is not a primitive decodes it,
// and still accepts the object an older version (or Tampermonkey) stored as is.

const isPrimitive = (value: unknown): boolean =>
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';

export function readStored<T>(key: string, fallback: T): T {
  if (typeof GM_getValue !== 'function') return fallback;
  const raw = GM_getValue<unknown>(key, fallback);
  if (typeof raw === 'string' && !isPrimitive(fallback)) {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
  return raw as T;
}

export function writeStored(key: string, value: unknown): void {
  if (typeof GM_setValue !== 'function') return;
  GM_setValue(key, value !== null && typeof value === 'object' ? JSON.stringify(value) : value);
}
