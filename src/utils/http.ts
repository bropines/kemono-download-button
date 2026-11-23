import { state } from '../state/store';
import { saveBlobViaAnchor } from './saveFile';
import { debugLog, sanitizeFilename } from './helpers';
import { isPawchiveFile, withPawchiveFileLimit } from './pawchiveRateLimit';

// The session cookie belongs to the archive site only (incl. its file/cN subdomains)
function isSiteUrl(url: string): boolean {
  try {
    const siteDomain = window.location.hostname.split('.').slice(-2).join('.');
    const { hostname } = new URL(url, window.location.href);
    return hostname === siteDomain || hostname.endsWith(`.${siteDomain}`);
  } catch (e) {
    return false;
  }
}

export function abortError(): DOMException {
  return new DOMException('Download cancelled', 'AbortError');
}

export function isAbortError(error: unknown): boolean {
  return (error as { name?: string } | null)?.name === 'AbortError';
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

// A host that ignores responseType (AdGuard) hands bytes back as text. With this charset every
// byte becomes one code unit instead of going through a lossy UTF-8 decode; a host that honours
// responseType ignores it, since it only governs how text is decoded
const BINARY_MIME = 'text/plain; charset=x-user-defined';
// Pawchive asks automated downloaders to identify themselves rather than impersonate a browser.
const PAWCHIVE_DOWNLOADER_UA = 'KemonoDownloadButton/1 (+https://github.com/bropines/kemono-download-button)';

// toString rather than instanceof: a sandboxed host can hand back a buffer from another realm
const isKind = (value: unknown, kind: string): boolean => Object.prototype.toString.call(value) === `[object ${kind}]`;

// Diagnostic fields deliberately exclude paths, query strings, headers, bodies and error messages.
let diagnosticSequence = 0;
function downloadHost(url: unknown): string {
  try {
    const parsed = new URL(String(url), window.location.href);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.hostname : 'unknown';
  } catch { return 'unknown'; }
}
function responseSummary(value: unknown): { kind: string; bytes: number | null; textUnits: number | null } {
  if (isKind(value, 'ArrayBuffer')) return { kind: 'arraybuffer', bytes: (value as ArrayBuffer).byteLength, textUnits: null };
  if (ArrayBuffer.isView(value)) return { kind: 'view', bytes: value.byteLength, textUnits: null };
  if (isKind(value, 'Blob')) return { kind: 'blob', bytes: (value as Blob).size, textUnits: null };
  if (typeof value === 'string') return { kind: 'text', bytes: null, textUnits: value.length };
  return { kind: value == null ? 'empty' : 'other', bytes: null, textUnits: null };
}
function statusCode(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

async function toArrayBuffer(body: unknown, text: unknown): Promise<ArrayBuffer | null> {
  if (isKind(body, 'ArrayBuffer')) return body as ArrayBuffer;
  if (ArrayBuffer.isView(body)) return body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer;
  if (body && typeof (body as Blob).arrayBuffer === 'function') return (body as Blob).arrayBuffer();
  const latin1 = typeof body === 'string' ? body : typeof text === 'string' ? text : null;
  if (latin1 === null) return null;
  const bytes = new Uint8Array(latin1.length);
  for (let i = 0; i < latin1.length; i++) bytes[i] = latin1.charCodeAt(i) & 0xff;
  return bytes.buffer;
}

// Callers read response.response in the type they asked for. A host loose about responseType
// gets its answer converted here, once; a host that honours it gets its own response object back
async function normalizeResponse(response: any, responseType?: string): Promise<any> {
  let body: unknown = response.response;
  let text = '';
  if (responseType === 'arraybuffer' && !isKind(body, 'ArrayBuffer')) {
    body = await toArrayBuffer(body, response.responseText);
  } else if (responseType === 'json' && (body === null || body === undefined || typeof body !== 'object')) {
    text = typeof body === 'string' ? body : response.responseText;
    try {
      body = JSON.parse(text);
    } catch {
      return response;
    }
  } else {
    return response;
  }
  return {
    status: response.status,
    statusText: response.statusText,
    finalUrl: response.finalUrl,
    responseHeaders: response.responseHeaders,
    responseText: text,
    response: body
  };
}

// A file request answered with a page instead of the file: a redirect the host did not follow (AdGuard's request
// engine hands back nginx's "302 Found" page, 138 bytes, as if it were the image) or an error page. Saving that
// would leave a broken file behind; the request follows the redirect itself, or fetches the file another way.
const MAX_REDIRECTS = 5;
function headerValue(headers: unknown, name: string): string {
  const line = String(headers || '').split(/\r?\n/).find((row) => row.toLowerCase().startsWith(`${name.toLowerCase()}:`));
  return line ? line.slice(name.length + 1).trim() : '';
}
function redirectTarget(response: any, from: string): string | null {
  const location = headerValue(response?.responseHeaders, 'location');
  if (!location) return null;
  try { return new URL(location, from).href; } catch { return null; }
}
/** The body of a file request is a web page (text/html, or bytes starting with an HTML tag) */
function isPageInsteadOfFile(response: any, url: string): boolean {
  if (/\.html?(?:[?#]|$)/i.test(url)) return false;
  if (/^text\/html\b/i.test(headerValue(response?.responseHeaders, 'content-type'))) return true;
  const body = response?.response;
  let head = '';
  if (isKind(body, 'ArrayBuffer')) {
    const bytes = new Uint8Array(body as ArrayBuffer, 0, Math.min(64, (body as ArrayBuffer).byteLength));
    head = String.fromCharCode(...bytes);
  } else if (typeof body === 'string') head = body.slice(0, 64);
  return /^\s*<(?:!doctype\s+html|html|head|body|center|h1)\b/i.test(head);
}
/** The page's own fetch: it follows redirects; the archives' file hosts allow it (CORS) */
async function fetchFileInPage(url: string, signal?: AbortSignal): Promise<any | null> {
  if (typeof fetch !== 'function') return null;
  try {
    const response = await fetch(url, { credentials: 'omit', cache: 'no-store', signal });
    if (!response.ok || /^text\/html\b/i.test(response.headers.get('content-type') || '')) return null;
    const body = await response.arrayBuffer();
    return { status: response.status, statusText: response.statusText, finalUrl: response.url, responseHeaders: '', responseText: '', response: body };
  } catch {
    if (signal?.aborted) throw abortError();
    return null;
  }
}

export async function gmXmlhttpRequestWithRetries(details: any): Promise<any> {
  const maxRetries = state.settings.enableDownloadRetries ? Number(state.settings.downloadRetryCount) || 0 : 0;
  const retryDelay = state.settings.downloadRetryDelay;
  let retries = 0;
  let redirects = 0;
  let currentUrl = details.url;
  // The signal is ours, not a GM_xmlhttpRequest option (and it can't be cloned into the extension)
  const { signal, ...requestDetails } = details as { signal?: AbortSignal; [key: string]: any };

  while (true) {
    if (signal?.aborted) throw abortError();
    try {
      return await withPawchiveFileLimit(currentUrl, signal, () => new Promise((resolve, reject) => {
        const headers = { ...(details.headers || {}) };
        if (isPawchiveFile(currentUrl) && !Object.keys(headers).some((key) => key.toLowerCase() === 'user-agent')) {
          headers['User-Agent'] = PAWCHIVE_DOWNLOADER_UA;
        }
        // Never send the session to third parties (translation APIs, external file hosts)
        // An explicit Cookie from the caller (KUI session key) wins over the downloader setting
        if (state.settings.sessionCookie && isSiteUrl(currentUrl) && !headers['Cookie']) {
          headers['Cookie'] = state.settings.sessionCookie;
        }
        // kemono/coomer answer API requests without this exact Accept header with 403
        if (isSiteUrl(currentUrl) && currentUrl.includes('/api/') && !headers['Accept']) {
          headers['Accept'] = 'text/css';
        }

        const trace = !!state.settings.enableDebugLogging && (requestDetails.responseType === 'arraybuffer' || isPawchiveFile(currentUrl));
        const requestId = trace ? ++diagnosticSequence : 0;
        const host = trace ? downloadHost(currentUrl) : '';
        const startedAt = trace ? Date.now() : 0;
        if (trace) debugLog('[download]', 'request-start', { requestId, host, transport: 'GM_xmlhttpRequest',
          responseType: requestDetails.responseType === 'arraybuffer' ? 'arraybuffer' : 'other',
          userAgentRequested: Object.keys(headers).some((key) => key.toLowerCase() === 'user-agent'), attempt: retries + 1 });

        // Some hosts never call ontimeout. Keep our own inactivity deadline, with exactly one
        // terminal callback even when abort() synchronously triggers onabort or an old onload arrives.
        const isFile = requestDetails.responseType === 'arraybuffer' || isPawchiveFile(currentUrl);
        const requestedTimeout = Number(requestDetails.timeout);
        const timeout = Number.isFinite(requestedTimeout) && requestedTimeout > 0 ? requestedTimeout : 0;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let request: { abort?: () => void } | undefined;
        let done = false;
        let processing = false;
        let lastLoaded = -1;
        const finish = (action: () => void): void => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          signal?.removeEventListener('abort', onAbort);
          action();
        };
        const onAbort = (): void => finish(() => {
          if (trace) debugLog('[download]', 'request-aborted', { requestId, host });
          try { request?.abort?.(); } catch { /* already finished by the host */ }
          reject(abortError());
        });
        const onTimeout = (): void => finish(() => {
          if (trace) debugLog('[download]', 'request-timeout', { requestId, host });
          try { request?.abort?.(); } catch { /* already finished by the host */ }
          reject(new Error('Request Timeout'));
        });
        const arm = (): void => {
          if (!(timeout > 0) || !Number.isFinite(timeout) || done) return;
          clearTimeout(timer);
          timer = setTimeout(onTimeout, timeout);
        };
        const settle = (response: any) => {
          if (done || processing) return;
          if (trace) debugLog('[download]', 'response', { requestId, host, status: statusCode(response?.status), elapsedMs: Date.now() - startedAt, ...responseSummary(response?.response) });
          if (response.status >= 200 && response.status < 300) {
            processing = true;
            // The bytes are here: converting them gets a full window of its own (a conversion that never settles
            // still times out), instead of whatever was left of the transfer's
            arm();
            normalizeResponse(response, requestDetails.responseType).then((normalized) => {
              if (isFile && isPageInsteadOfFile(normalized, currentUrl)) {
                const err: any = new Error('The server sent a page instead of the file');
                err.pageInsteadOfFile = true;
                err.location = redirectTarget(response, currentUrl);
                if (trace) debugLog('[download]', 'page-instead-of-file', { requestId, host, redirect: !!err.location });
                finish(() => reject(err));
                return;
              }
              finish(() => {
                if (trace) debugLog('[download]', 'normalized', { requestId, ...responseSummary(normalized?.response) });
                resolve(normalized);
              });
            }, (error) => {
              finish(() => {
                if (trace) debugLog('[download]', 'normalization-error', { requestId });
                reject(error);
              });
            });
          } else {
            const err: any = new Error(`HTTP Status ${response.status}: ${response.statusText}`);
            err.status = response.status;
            if (response.status >= 300 && response.status < 400) err.location = redirectTarget(response, currentUrl);
            finish(() => reject(err));
          }
        };

        signal?.addEventListener('abort', onAbort, { once: true });
        if (signal?.aborted) return onAbort();
        arm();
        try { request = GM_xmlhttpRequest({
          ...requestDetails,
          // Native GM deadlines are absolute; a progressing multi-GB transfer must not be cut off.
          ...(isFile && timeout > 0 ? { timeout: 0 } : {}),
          ...(requestDetails.responseType === 'arraybuffer' && !requestDetails.overrideMimeType
            ? { overrideMimeType: BINARY_MIME }
            : {}),
          url: currentUrl,
          headers,
          onload: settle,
          onerror: (error: any) => {
            if (done || processing) return;
            // AdGuard routes every non-2xx through onerror. A status means the request was answered,
            // so a 404 still fails fast and still moves /data/ over to the file host
            if (error && typeof error === 'object' && error.status > 0) {
              settle(error);
              return;
            }
            if (trace) debugLog('[download]', 'request-error', { requestId, host, status: statusCode(error?.status) });
            let errStr = '';
            if (typeof error === 'string') {
              errStr = error;
            } else if (error && typeof error === 'object') {
              errStr = error.error || error.statusText || error.responseText || (error.status ? `Status ${error.status}` : '') || JSON.stringify(error);
            } else {
              errStr = String(error || 'Network Error');
            }

            if (errStr.includes('BLOCKED') || errStr.includes('blocked')) {
              finish(() => reject(new Error(`Blocked by browser/AdBlocker extension (${errStr})`)));
            } else {
              finish(() => reject(new Error(errStr || 'Network Error')));
            }
          },
          onprogress: (event: any) => {
            if (done || processing) return;
            const loaded = Number(event?.loaded);
            if (Number.isFinite(loaded) && loaded > lastLoaded) { lastLoaded = loaded; arm(); }
            requestDetails.onprogress?.(event);
          },
          ontimeout: onTimeout,
          onabort: () => finish(() => reject(abortError()))
        }); } catch (error) { finish(() => reject(error)); }
      }));
    } catch (error: any) {
      if (requestDetails.responseType === 'arraybuffer' || isPawchiveFile(currentUrl)) {
        debugLog('[download]', 'request-failed', { host: downloadHost(currentUrl), status: statusCode(error?.status), aborted: !!signal?.aborted });
      }
      if (signal?.aborted) throw abortError();
      // A redirect the host handed back unfollowed: follow it (doesn't use up a retry)
      if (error?.location && redirects < MAX_REDIRECTS) {
        redirects++;
        currentUrl = error.location;
        debugLog('[download]', 'redirect-followed', { host: downloadHost(currentUrl) });
        continue;
      }
      // A page instead of the file and nowhere to go: the page's own fetch follows redirects itself
      if (error?.pageInsteadOfFile || (error?.status >= 300 && error?.status < 400)) {
        const fetched = await fetchFileInPage(currentUrl, signal);
        if (fetched) {
          debugLog('[download]', 'page-fetch-fallback', { host: downloadHost(currentUrl) });
          return fetched;
        }
      }
      // pawchive serves /data/ only from file.<domain> (its main domain 404s, while kemono/coomer redirect
      // to the right n1-n4 node themselves). Switching hosts doesn't use up a retry.
      const mainDataMatch = currentUrl.match(/^https:\/\/([^/]+)(\/data\/.*)$/);
      if (error.status === 404 && mainDataMatch && !/^(file|n\d+)\./.test(mainDataMatch[1])) {
        currentUrl = `https://file.${mainDataMatch[1]}${mainDataMatch[2]}`;
        debugLog('[download]', 'host-fallback', { host: downloadHost(currentUrl), status: 404 });
        continue;
      }
      // A missing or forbidden file won't appear on a retry
      if (error.status === 404 || error.status === 401 || error.status === 403 || retries >= maxRetries) {
        throw error;
      }
      retries++;
      debugLog('[download]', 'retry', { host: downloadHost(currentUrl), attempt: retries, status: statusCode(error?.status), delayMs: Number(retryDelay) || 0 });
      await sleep(retryDelay, signal);
    }
  }
}

export async function downloadFileWithFallback(
  url: string,
  fileName: string,
  progressCallback?: (percent: number) => void,
  signal?: AbortSignal,
  onFetched?: (data: ArrayBuffer) => Promise<void>
): Promise<void> {
  if (signal?.aborted) throw abortError();
  const cleanName = sanitizeFilename(fileName);
  const host = downloadHost(url);

  if (typeof GM_download === 'function') {
    const tryGmDownload = (): Promise<'success' | 'failed' | 'timeout'> => {
      return new Promise((resolve) => {
        let isDone = false;
        let onAbort: (() => void) | undefined;
        let handle: { abort?: () => void } | undefined;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let lastLoaded = -1;
        const timeout = Number(state.settings.zipFileDownloadTimeout) || 120000;
        const finish = (result: 'success' | 'failed' | 'timeout', abort = false) => {
          if (isDone) return;
          isDone = true;
          clearTimeout(timer);
          if (onAbort) signal?.removeEventListener('abort', onAbort);
          if (abort) { try { handle?.abort?.(); } catch { /* already finished by the host */ } }
          resolve(result);
        };
        const arm = () => {
          if (isDone) return;
          clearTimeout(timer);
          timer = setTimeout(() => {
            debugLog('[download]', 'gm-download-timeout', { host });
            finish('timeout', true);
          }, timeout);
        };
        try {
          debugLog('[download]', 'request-start', { host, transport: 'GM_download' });
          onAbort = () => finish('failed', true);
          signal?.addEventListener('abort', onAbort, { once: true });
          if (signal?.aborted) return onAbort();
          arm();
          handle = GM_download({
            url,
            name: cleanName,
            saveAs: false,
            onload: () => { if (!isDone) debugLog('[download]', 'gm-download-complete', { host }); finish('success'); },
            onerror: () => {
              if (!isDone) debugLog('[download]', 'gm-download-error', { host });
              finish('failed');
            },
            ontimeout: () => {
              if (!isDone) debugLog('[download]', 'gm-download-timeout', { host });
              finish('timeout', true);
            },
            onprogress: (e: any) => {
              if (isDone) return;
              const loaded = Number(e?.loaded);
              if (Number.isFinite(loaded) && loaded > lastLoaded) { lastLoaded = loaded; arm(); }
              if (progressCallback && e.lengthComputable && e.total > 0) {
                progressCallback((e.loaded / e.total) * 100);
              }
            }
          });
        } catch {
          if (!isDone) debugLog('[download]', 'gm-download-exception', { host });
          finish('failed');
        }
      });
    };

    const maxRetries = state.settings.enableDownloadRetries ? Number(state.settings.downloadRetryCount) || 0 : 0;
    for (let retries = 0; ; retries++) {
      const result = await withPawchiveFileLimit(url, signal, tryGmDownload);
      if (result === 'success') return;
      if (signal?.aborted) throw abortError();
      if (result !== 'timeout' || retries >= maxRetries) break;
      await sleep(Number(state.settings.downloadRetryDelay) || 0, signal);
    }
  }

  if (signal?.aborted) throw abortError();

  debugLog('[download]', 'gm-request-fallback', { host });
  const response = await gmXmlhttpRequestWithRetries({
    method: 'GET',
    url,
    signal,
    responseType: 'arraybuffer',
    timeout: state.settings.zipFileDownloadTimeout || 120000,
    onprogress: (e: ProgressEvent) => {
      if (progressCallback && e.lengthComputable && e.total > 0) {
        progressCallback((e.loaded / e.total) * 100);
      }
    }
  });

  const arrayBuffer = response.response;
  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error('Downloaded file array buffer is empty');
  }

  saveBlobViaAnchor(new Blob([arrayBuffer]), cleanName);
  // The fallback already has the bytes: let the caller reuse them for a later ZIP.
  if (onFetched) {
    try { await onFetched(arrayBuffer); }
    catch { debugLog('[download]', 'cache-write-failed'); }
  }
}

export { saveBlobViaAnchor };
