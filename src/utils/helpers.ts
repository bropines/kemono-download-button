import { state } from '../state/store';

export function debugLog(...args: any[]): void {
  if (state.settings.enableDebugLogging) {
    console.log('[Kemono DL Debug]', ...args);
  }
}

export function getFullUrl(path: string): string {
  return path.startsWith('/') ? window.location.origin + path : path;
}

/**
 * `server`: the node the API names for the file (pawchive: https://n2.pawchive.pw). Downloading from it directly
 * skips file.<domain>, a balancer that sometimes answers with a redirect to that node, which some hosts (AdGuard)
 * do not follow. Only a node of the site's own domain is taken.
 */
export function resolveMediaUrl(path: string, originalFileName?: string, server?: string): string {
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

  const node = siteNode(server, baseDomain);
  if (node) return `${node}${cleanPath}${querySuffix}`;
  if (hostname.match(/^(c\d+|file)\./)) {
    return `${window.location.origin}${cleanPath}${querySuffix}`;
  }
  if (baseDomain.includes('pawchive')) {
    return `https://file.${baseDomain}${cleanPath}${querySuffix}`;
  }
  // kemono/coomer: cN./file. hosts no longer resolve; the main domain redirects /data/ to the node holding the file
  return `https://${baseDomain}${cleanPath}${querySuffix}`;
}

function siteNode(server: string | undefined, baseDomain: string): string | null {
  if (!server) return null;
  try {
    const url = new URL(server);
    const own = url.hostname === baseDomain || url.hostname.endsWith(`.${baseDomain}`);
    return url.protocol === 'https:' && own ? url.origin : null;
  } catch {
    return null;
  }
}

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return `${window.location.origin}${cleanPath}`;
}

export function getThumbnailUrl(path: string): string {
  if (!path) return '';
  let cleanPath = path.startsWith('/') ? path : '/' + path;
  if (!cleanPath.startsWith('/data/')) {
    cleanPath = '/data' + cleanPath;
  }
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const baseDomain = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
  return `https://img.${baseDomain}/thumbnail${cleanPath}`;
}

// Windows refuses these device names regardless of extension
const WINDOWS_RESERVED_NAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i;
const MAX_FILENAME_LENGTH = 180;

export function sanitizeFilename(filename: string): string {
  let name = String(filename || 'untitled')
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    // Windows drops trailing dots/spaces, so the saved name would differ from the requested one
    .replace(/[. ]+$/, '');
  if (WINDOWS_RESERVED_NAME.test(name)) name = `_${name}`;
  if (name.length > MAX_FILENAME_LENGTH) {
    const ext = name.match(/\.[A-Za-z0-9]{1,8}$/)?.[0] || '';
    name = name.slice(0, MAX_FILENAME_LENGTH - ext.length).trimEnd() + ext;
  }
  return name || 'untitled';
}

const MEDIA_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif', 'jxl', 'heic', 'heif', 'apng',
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

/** tags.txt for the savePostTags setting: one tag per line, or null when the post has none. */
export function formatPostTagsText(tags: unknown): string | null {
  // Some API versions send a Postgres array literal ("{a,b}") instead of an array
  const list = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.replace(/^\{|\}$/g, '').split(/[,\n]/) : [];
  const lines = [...new Set(list.map((tag) => String(tag ?? '').trim()).filter(Boolean))];
  return lines.length ? lines.join('\n') + '\n' : null;
}

/** comments.txt for the savePostComments setting, from the comments API; null when there are none. */
export function formatPostCommentsText(comments: unknown): string | null {
  if (!Array.isArray(comments) || comments.length === 0) return null;
  const blocks = comments.map((comment: any) => {
    const author = comment?.commenter_name || comment?.commenter || 'Anonymous';
    const date = comment?.published ? ` (${comment.published})` : '';
    const reply = comment?.parent_id ? ` [reply to ${comment.parent_id}]` : '';
    const body = htmlToFormattedText(String(comment?.content ?? '')).trim();
    return `${author}${date}${reply}:\n${body}`;
  });
  return blocks.join('\n\n---\n\n') + '\n';
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
