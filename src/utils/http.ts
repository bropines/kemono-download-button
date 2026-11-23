import { state } from '../state/store';
import { saveBlobViaAnchor } from './saveFile';
import { debugLog, sanitizeFilename } from './helpers';
import { isPawchiveFile, withPawchiveFileLimit } from './pawchiveRateLimit';
import { bytesLookLikePage, textLooksLikePage } from './pageBody';

declare const GM_info: { scriptHandler?: string } | undefined;

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
  try {
    const target = new URL(location, from);
    return target.protocol === 'https:' || target.protocol === 'http:' ? target.href : null;
  } catch { return null; }
}
/** The file asked for is itself a page (an .html attachment): its body is no sign of an error */
const expectsPage = (url: string): boolean => /\.html?(?:[?#]|$)/i.test(url);
/** The body of a file request is a web page (text/html, or bytes starting with an HTML tag) */
function isPageInsteadOfFile(response: any, url: string): boolean {
  if (expectsPage(url)) return false;
  if (/^text\/html\b/i.test(headerValue(response?.responseHeaders, 'content-type'))) return true;
  const body = response?.response;
  if (isKind(body, 'ArrayBuffer') || ArrayBuffer.isView(body)) return bytesLookLikePage(body as ArrayBuffer);
  return typeof body === 'string' && textLooksLikePage(body);
}
function fileError(message: string, flags: Record<string, unknown> = {}): any {
  return Object.assign(new Error(message), flags);
}
const pageError = (): any => fileError('The server sent a page instead of the file', { pageInsteadOfFile: true });
const emptyError = (): any => fileError('Downloaded file is empty');
const incompleteError = (received: number, expected: number): any =>
  fileError(`Downloaded file is incomplete (${received} of ${expected} bytes)`, { incomplete: true });

// Some hosts report no progress for GM_xmlhttpRequest (AdGuard: a file arrives whole or not at all). The inactivity
// deadline only hears about progress, so on a slow link a big file looked stalled, was cut off and started over,
// forever. Whether the host reports progress is learned while it works:
//  - any progress event: it does ('reports', final);
//  - a large file finished, or a file request timed out, without a single event: it does not ('silent').
// On a silent host the archive's files are read by the page's own fetch where the file host lets the page read
// them (CORS), as a stream: real progress and a deadline that only fires when no bytes come at all. Where the page
// cannot read them, the GM request gets a longer deadline, since nothing tells slow from stalled there.
type ProgressSupport = 'unknown' | 'reports' | 'silent';
const SILENT_PROOF_BYTES = 1024 * 1024;
const SILENT_DEADLINE_FACTOR = 4;
function hostIsAdGuard(): boolean {
  try {
    return typeof GM_info !== 'undefined' && /adguard/i.test(String(GM_info?.scriptHandler || ''));
  } catch {
    return false;
  }
}
let progressSupport: ProgressSupport = hostIsAdGuard() ? 'silent' : 'unknown';
function noteNoProgress(): void {
  if (progressSupport !== 'unknown') return;
  progressSupport = 'silent';
  debugLog('[download]', 'host-reports-no-progress');
}

// File hosts the page's fetch could not read (no CORS) are left to the GM request for the rest of the session;
// one that worked once is never given up on because of a network error.
const PAGE_FETCH_STRIKES = 2;
const pageFetchStrikes = new Map<string, number>();
const pageFetchRefused = (url: string): boolean => (pageFetchStrikes.get(downloadHost(url)) || 0) >= PAGE_FETCH_STRIKES;
function notePageFetch(url: string, worked: boolean): void {
  const host = downloadHost(url);
  const strikes = pageFetchStrikes.get(host) || 0;
  if (worked) pageFetchStrikes.set(host, -Infinity);
  else if (strikes >= 0) pageFetchStrikes.set(host, strikes + 1);
}
/** A file of the archive itself (its domain and file nodes): the only thing the page's fetch is tried on first */
function isArchiveFile(url: string): boolean {
  try {
    return isSiteUrl(url) && new URL(url, window.location.href).pathname.startsWith('/data/');
  } catch {
    return false;
  }
}

/** Reads a fetch body chunk by chunk. A known length is filled in place, so a big file is not held twice. */
async function readStream(response: Response, expected: number, onChunk: (loaded: number, total: number) => void): Promise<ArrayBuffer> {
  const reader = response.body?.getReader?.();
  if (!reader) return response.arrayBuffer();
  let total = expected;
  let whole: Uint8Array | null = null;
  if (total > 0) {
    try { whole = new Uint8Array(total); } catch { total = 0; }
  }
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value?.byteLength) continue;
    if (whole && loaded + value.byteLength > whole.byteLength) {
      // More than announced (the length was of a compressed body): collect the rest in chunks
      chunks.push(whole.subarray(0, loaded));
      whole = null;
      total = 0;
    }
    if (whole) whole.set(value, loaded);
    else chunks.push(value);
    loaded += value.byteLength;
    onChunk(loaded, total);
  }
  if (whole) return loaded === whole.byteLength ? (whole.buffer as ArrayBuffer) : (whole.slice(0, loaded).buffer as ArrayBuffer);
  const body = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return body.buffer as ArrayBuffer;
}

/**
 * The page's own fetch, read as a stream: it follows redirects and reports progress, and its deadline is re-armed by
 * every chunk. Rejects for anything that is not the whole file: an error status, a page, an empty or cut-off body.
 * `streamUnavailable` marks a fetch the page was not allowed to make or could not start (CORS, network).
 */
async function fetchFileStreaming(url: string, signal: AbortSignal | undefined, inactivityMs: number, onprogress?: (event: any) => void): Promise<any> {
  if (signal?.aborted) throw abortError();
  const controller = new AbortController();
  const onAbort = (): void => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stalled = false;
  let complete = false;
  const arm = (): void => {
    if (!(inactivityMs > 0)) return;
    clearTimeout(timer);
    timer = setTimeout(() => { stalled = true; controller.abort(); }, inactivityMs);
  };
  try {
    arm();
    let response: Response;
    try {
      response = await fetch(url, { credentials: 'omit', cache: 'no-store', signal: controller.signal });
    } catch (error) {
      throw fileError('The page could not read the file', { streamUnavailable: true });
    }
    if (!response.ok) throw fileError(`HTTP Status ${response.status}: ${response.statusText}`, { status: response.status });
    const header = (name: string): string => response.headers?.get?.(name) || '';
    if (!expectsPage(url) && /^text\/html\b/i.test(header('content-type'))) throw pageError();
    // The announced length is the compressed one when the body is encoded: no use as a size then
    const encoded = !!header('content-encoding') && !/^identity$/i.test(header('content-encoding'));
    const expected = encoded ? 0 : Number(header('content-length')) || 0;
    const body = await readStream(response, expected, (loaded, total) => {
      arm();
      onprogress?.({ loaded, total, lengthComputable: total > 0 });
    });
    if (!body || body.byteLength === 0) throw emptyError();
    if (!expectsPage(url) && bytesLookLikePage(body)) throw pageError();
    if (expected > 0 && body.byteLength < expected) throw incompleteError(body.byteLength, expected);
    complete = true;
    return { status: response.status, statusText: response.statusText, finalUrl: response.url, responseHeaders: '', responseText: '', response: body };
  } catch (error) {
    if (signal?.aborted) throw abortError();
    if (stalled) throw new Error('Request Timeout');
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
    // Anything but the whole file: stop the transfer instead of leaving the body to download unread
    if (!complete) controller.abort();
  }
}

export async function gmXmlhttpRequestWithRetries(details: any): Promise<any> {
  const maxRetries = state.settings.enableDownloadRetries ? Number(state.settings.downloadRetryCount) || 0 : 0;
  const retryDelay = state.settings.downloadRetryDelay;
  let retries = 0;
  let redirects = 0;
  // The address the page's fetch already failed on: the GM request has it from then on
  let pageFetchFailedFor: string | null = null;
  let usingStream = false;
  let currentUrl = details.url;
  const visited = new Set<string>([currentUrl]);
  // The signal is ours, not a GM_xmlhttpRequest option (and it can't be cloned into the extension)
  const { signal, ...requestDetails } = details as { signal?: AbortSignal; [key: string]: any };
  const wantsBytes = requestDetails.responseType === 'arraybuffer';
  const canPageFetch = wantsBytes && typeof fetch === 'function' && /^get$/i.test(String(requestDetails.method || 'GET'));
  const inactivity = Number(requestDetails.timeout) > 0 ? Number(requestDetails.timeout) : 0;
  const streamFile = (): Promise<any> =>
    withPawchiveFileLimit(currentUrl, signal, () => fetchFileStreaming(currentUrl, signal, inactivity, requestDetails.onprogress));

  while (true) {
    if (signal?.aborted) throw abortError();
    usingStream = canPageFetch && progressSupport === 'silent' && pageFetchFailedFor !== currentUrl
      && isArchiveFile(currentUrl) && !pageFetchRefused(currentUrl);
    try {
      if (usingStream) {
        debugLog('[download]', 'request-start', { host: downloadHost(currentUrl), transport: 'page-fetch-stream', attempt: retries + 1 });
        const streamed = await streamFile();
        notePageFetch(currentUrl, true);
        return streamed;
      }
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

        const trace = !!state.settings.enableDebugLogging && (wantsBytes || isPawchiveFile(currentUrl));
        const requestId = trace ? ++diagnosticSequence : 0;
        const host = trace ? downloadHost(currentUrl) : '';
        const startedAt = trace ? Date.now() : 0;
        if (trace) debugLog('[download]', 'request-start', { requestId, host, transport: 'GM_xmlhttpRequest',
          responseType: wantsBytes ? 'arraybuffer' : 'other',
          userAgentRequested: Object.keys(headers).some((key) => key.toLowerCase() === 'user-agent'), attempt: retries + 1 });

        // Some hosts never call ontimeout. Keep our own inactivity deadline, with exactly one
        // terminal callback even when abort() synchronously triggers onabort or an old onload arrives.
        const isFile = wantsBytes || isPawchiveFile(currentUrl);
        const requestedTimeout = Number(requestDetails.timeout);
        const timeout = Number.isFinite(requestedTimeout) && requestedTimeout > 0 ? requestedTimeout : 0;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let request: { abort?: () => void } | undefined;
        let done = false;
        let processing = false;
        let lastLoaded = -1;
        let progressEvents = 0;
        let lastActivity = 0;
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
          // Not one progress event before the deadline: the host may report none at all
          if (isFile && !processing && progressEvents === 0) noteNoProgress();
          try { request?.abort?.(); } catch { /* already finished by the host */ }
          reject(new Error('Request Timeout'));
        });
        // The deadline is judged when it comes due, by what is known of the host by then: silence from a host
        // that reports no progress says nothing about the transfer, so a file gets a longer wait there
        const onDeadline = (): void => {
          const allowed = timeout * (isFile && !processing && progressSupport === 'silent' ? SILENT_DEADLINE_FACTOR : 1);
          const left = lastActivity + allowed - Date.now();
          if (left > 0) timer = setTimeout(onDeadline, left);
          else onTimeout();
        };
        const arm = (): void => {
          if (!(timeout > 0) || done) return;
          clearTimeout(timer);
          lastActivity = Date.now();
          timer = setTimeout(onDeadline, timeout);
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
                const err = pageError();
                err.location = redirectTarget(response, currentUrl);
                if (trace) debugLog('[download]', 'page-instead-of-file', { requestId, host, redirect: !!err.location });
                finish(() => reject(err));
                return;
              }
              if (wantsBytes) {
                // Never hand back less than the file: nothing at all, or fewer bytes than the server announced
                const received = Number(normalized?.response?.byteLength) || 0;
                const responseHeaders = response?.responseHeaders;
                const expected = headerValue(responseHeaders, 'content-encoding') ? 0 : Number(headerValue(responseHeaders, 'content-length')) || 0;
                if (received === 0 || received < expected) {
                  if (trace) debugLog('[download]', 'incomplete-body', { requestId, host, bytes: received, expected });
                  finish(() => reject(received === 0 ? emptyError() : incompleteError(received, expected)));
                  return;
                }
                if (progressEvents === 0 && received >= SILENT_PROOF_BYTES) noteNoProgress();
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
          ...(wantsBytes && !requestDetails.overrideMimeType
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
            if (Number.isFinite(loaded) && loaded > lastLoaded) {
              lastLoaded = loaded;
              if (loaded > 0) {
                progressEvents++;
                if (isFile) progressSupport = 'reports';
              }
              arm();
            }
            requestDetails.onprogress?.(event);
          },
          ontimeout: onTimeout,
          onabort: () => finish(() => reject(abortError()))
        }); } catch (error) { finish(() => reject(error)); }
      }));
    } catch (error: any) {
      if (wantsBytes || isPawchiveFile(currentUrl)) {
        debugLog('[download]', 'request-failed', { host: downloadHost(currentUrl), status: statusCode(error?.status), aborted: !!signal?.aborted });
      }
      if (signal?.aborted) throw abortError();
      if (usingStream) {
        // The page was not let through (CORS, a challenge page, a refusal the GM request's own headers may
        // avoid), or got less than the announced size: the GM request takes this file over, without using up a retry
        const refused = error?.streamUnavailable || error?.pageInsteadOfFile || error?.status === 401 || error?.status === 403;
        if (refused) notePageFetch(currentUrl, false);
        if (refused || error?.incomplete) {
          pageFetchFailedFor = currentUrl;
          debugLog('[download]', 'stream-fallback-gm', { host: downloadHost(currentUrl) });
          continue;
        }
      }
      // A redirect the host handed back unfollowed: follow it (doesn't use up a retry), unless it leads back
      if (error?.location && redirects < MAX_REDIRECTS && !visited.has(error.location)) {
        redirects++;
        currentUrl = error.location;
        visited.add(currentUrl);
        debugLog('[download]', 'redirect-followed', { host: downloadHost(currentUrl) });
        continue;
      }
      // A page instead of the file and nowhere to go: the page's own fetch follows redirects itself
      if (!usingStream && canPageFetch && pageFetchFailedFor !== currentUrl && (error?.pageInsteadOfFile || (error?.status >= 300 && error?.status < 400))) {
        try {
          const fetched = await streamFile();
          debugLog('[download]', 'page-fetch-fallback', { host: downloadHost(currentUrl) });
          return fetched;
        } catch {
          if (signal?.aborted) throw abortError();
          pageFetchFailedFor = currentUrl;
        }
      }
      // pawchive serves /data/ only from file.<domain> (its main domain 404s, while kemono/coomer redirect
      // to the right n1-n4 node themselves). Switching hosts doesn't use up a retry.
      const mainDataMatch = String(currentUrl).match(/^https:\/\/([^/]+)(\/data\/.*)$/);
      if (error?.status === 404 && mainDataMatch && !/^(file|n\d+)\./.test(mainDataMatch[1])) {
        currentUrl = `https://file.${mainDataMatch[1]}${mainDataMatch[2]}`;
        visited.add(currentUrl);
        debugLog('[download]', 'host-fallback', { host: downloadHost(currentUrl), status: 404 });
        continue;
      }
      // A missing or forbidden file won't appear on a retry
      if (error?.status === 404 || error?.status === 401 || error?.status === 403 || retries >= maxRetries) {
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
