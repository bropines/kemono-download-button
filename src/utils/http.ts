import { state } from '../state/store';
import { saveBlobViaAnchor } from './saveFile';
import { debugLog, sanitizeFilename } from './helpers';

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
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(abortError());
    }, { once: true });
  });
}

// A host that ignores responseType (AdGuard) hands bytes back as text. With this charset every
// byte becomes one code unit instead of going through a lossy UTF-8 decode; a host that honours
// responseType ignores it, since it only governs how text is decoded
const BINARY_MIME = 'text/plain; charset=x-user-defined';

// toString rather than instanceof: a sandboxed host can hand back a buffer from another realm
const isKind = (value: unknown, kind: string): boolean => Object.prototype.toString.call(value) === `[object ${kind}]`;

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

export async function gmXmlhttpRequestWithRetries(details: any): Promise<any> {
  const maxRetries = state.settings.enableDownloadRetries ? Number(state.settings.downloadRetryCount) || 0 : 0;
  const retryDelay = state.settings.downloadRetryDelay;
  let retries = 0;
  let currentUrl = details.url;
  // The signal is ours, not a GM_xmlhttpRequest option (and it can't be cloned into the extension)
  const { signal, ...requestDetails } = details as { signal?: AbortSignal; [key: string]: any };

  while (true) {
    if (signal?.aborted) throw abortError();
    let onAbort: (() => void) | undefined;
    try {
      return await new Promise((resolve, reject) => {
        const headers = { ...(details.headers || {}) };
        // Never send the session to third parties (translation APIs, external file hosts)
        // An explicit Cookie from the caller (KUI session key) wins over the downloader setting
        if (state.settings.sessionCookie && isSiteUrl(currentUrl) && !headers['Cookie']) {
          headers['Cookie'] = state.settings.sessionCookie;
        }
        // kemono/coomer answer API requests without this exact Accept header with 403
        if (isSiteUrl(currentUrl) && currentUrl.includes('/api/') && !headers['Accept']) {
          headers['Accept'] = 'text/css';
        }

        const settle = (response: any) => {
          if (response.status >= 200 && response.status < 300) {
            normalizeResponse(response, requestDetails.responseType).then(resolve, reject);
          } else {
            const err: any = new Error(`HTTP Status ${response.status}: ${response.statusText}`);
            err.status = response.status;
            reject(err);
          }
        };

        const request = GM_xmlhttpRequest({
          ...requestDetails,
          ...(requestDetails.responseType === 'arraybuffer' && !requestDetails.overrideMimeType
            ? { overrideMimeType: BINARY_MIME }
            : {}),
          url: currentUrl,
          headers,
          onload: settle,
          onerror: (error: any) => {
            // AdGuard routes every non-2xx through onerror. A status means the request was answered,
            // so a 404 still fails fast and still moves /data/ over to the file host
            if (error && typeof error === 'object' && error.status > 0) {
              settle(error);
              return;
            }
            let errStr = '';
            if (typeof error === 'string') {
              errStr = error;
            } else if (error && typeof error === 'object') {
              errStr = error.error || error.statusText || error.responseText || (error.status ? `Status ${error.status}` : '') || JSON.stringify(error);
            } else {
              errStr = String(error || 'Network Error');
            }

            if (errStr.includes('BLOCKED') || errStr.includes('blocked')) {
              reject(new Error(`Blocked by browser/AdBlocker extension (${errStr})`));
            } else {
              reject(new Error(errStr || 'Network Error'));
            }
          },
          ontimeout: () => reject(new Error('Request Timeout')),
          onabort: () => reject(abortError())
        });
        onAbort = () => {
          request?.abort?.();
          reject(abortError());
        };
        signal?.addEventListener('abort', onAbort, { once: true });
      });
    } catch (error: any) {
      if (signal?.aborted) throw abortError();
      // pawchive serves /data/ only from file.<domain> (its main domain 404s, while kemono/coomer redirect
      // to the right n1-n4 node themselves). Switching hosts doesn't use up a retry.
      const mainDataMatch = currentUrl.match(/^https:\/\/([^/]+)(\/data\/.*)$/);
      if (error.status === 404 && mainDataMatch && !/^(file|n\d+)\./.test(mainDataMatch[1])) {
        currentUrl = `https://file.${mainDataMatch[1]}${mainDataMatch[2]}`;
        debugLog(`Main domain returned 404, retrying on ${currentUrl}`);
        continue;
      }
      // A missing or forbidden file won't appear on a retry
      if (error.status === 404 || error.status === 401 || error.status === 403 || retries >= maxRetries) {
        throw error;
      }
      retries++;
      debugLog(`Attempt ${retries} failed for ${currentUrl}: ${error.message}. Retrying in ${retryDelay}ms...`);
      await sleep(retryDelay, signal);
    } finally {
      if (onAbort) signal?.removeEventListener('abort', onAbort);
    }
  }
}

export async function downloadFileWithFallback(
  url: string,
  fileName: string,
  progressCallback?: (percent: number) => void,
  signal?: AbortSignal
): Promise<void> {
  if (signal?.aborted) throw abortError();
  const cleanName = sanitizeFilename(fileName);

  if (typeof GM_download === 'function') {
    const tryGmDownload = (): Promise<boolean> => {
      return new Promise((resolve) => {
        try {
          let isDone = false;
          const handle = GM_download({
            url,
            name: cleanName,
            saveAs: false,
            onload: () => {
              if (!isDone) { isDone = true; resolve(true); }
            },
            onerror: (err) => {
              debugLog('GM_download failed:', err);
              if (!isDone) { isDone = true; resolve(false); }
            },
            ontimeout: () => {
              debugLog('GM_download timed out');
              if (!isDone) { isDone = true; resolve(false); }
            },
            onprogress: (e: any) => {
              if (progressCallback && e.lengthComputable && e.total > 0) {
                progressCallback((e.loaded / e.total) * 100);
              }
            }
          });
          signal?.addEventListener('abort', () => {
            handle?.abort?.();
            if (!isDone) { isDone = true; resolve(false); }
          }, { once: true });
        } catch (e) {
          debugLog('GM_download exception:', e);
          resolve(false);
        }
      });
    };

    const success = await tryGmDownload();
    if (success) return;
  }

  if (signal?.aborted) throw abortError();

  debugLog(`GM_download fallback activated for ${url}. Fetching via gmXmlhttpRequest...`);
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
}

export { saveBlobViaAnchor };
