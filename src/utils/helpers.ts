import { state } from '../state/store';

export function debugLog(...args: any[]): void {
  if (state.settings.enableDebugLogging) {
    console.log('[Kemono DL Debug]', ...args);
  }
}

export function getFullUrl(path: string): string {
  return path.startsWith('/') ? window.location.origin + path : path;
}

export function resolveMediaUrl(path: string, originalFileName?: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/data/')
    ? path
    : path.startsWith('data/')
    ? '/' + path
    : path.startsWith('/')
    ? '/data' + path
    : '/data/' + path;

  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const baseDomain = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;

  let querySuffix = '';
  if (originalFileName && !cleanPath.includes('?f=')) {
    querySuffix = `?f=${encodeURIComponent(originalFileName)}`;
  }

  if (hostname.match(/^(c\d+|file)\./)) {
    return `${window.location.origin}${cleanPath}${querySuffix}`;
  }
  if (baseDomain.includes('pawchive')) {
    return `https://file.${baseDomain}${cleanPath}${querySuffix}`;
  }
  return `https://c1.${baseDomain}${cleanPath}${querySuffix}`;
}

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return `${window.location.origin}${cleanPath}`;
}

export function getThumbnailUrl(path: string): string {
  if (!path) return '';
  let cleanPath = path.startsWith('/') ? path.slice(1) : path;
  if (cleanPath.startsWith('data/')) {
    cleanPath = cleanPath.slice(5);
  }
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const baseDomain = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
  return `https://img.${baseDomain}/thumbnail/${cleanPath}`;
}

export function sanitizeFilename(filename: string): string {
  return String(filename || 'untitled')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim() || 'untitled';
}

const MEDIA_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif',
  'mp4', 'webm', 'mkv', 'mov', 'avi', 'wmv', 'm4v',
  'mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac'
]);

export function isMediaFile(filename: string): boolean {
  if (!filename) return false;
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return MEDIA_EXTENSIONS.has(ext);
}

export function isFileExtensionIgnored(filename: string, ignoredExts: string[]): boolean {
  if (!ignoredExts || ignoredExts.length === 0 || !filename) return false;
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ignoredExts.some((ignored) => ignored.toLowerCase().replace(/^\./, '').trim() === ext);
}

export function generateRandomId(length: number): string {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function htmlToFormattedText(html: string): string {
  if (!html) return '';
  const processedHtml = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n\s*\n/g, '\n\n');
  const textarea = document.createElement('textarea');
  textarea.innerHTML = processedHtml;
  return textarea.value.trim();
}

export function waitForElement(selector: string, timeout = 5000): Promise<Element> {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) return resolve(element);
    const observer = new MutationObserver(() => {
      const el2 = document.querySelector(selector);
      if (el2) {
        observer.disconnect();
        resolve(el2);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout: Element ${selector} not found`));
    }, timeout);
  });
}
