import { state } from '../state/store';
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

        const request = GM_xmlhttpRequest({
          ...requestDetails,
          url: currentUrl,
          headers,
          onload: (response: any) => {
            if (response.status >= 200 && response.status < 300) {
              resolve(response);
            } else {
              const err: any = new Error(`HTTP Status ${response.status}: ${response.statusText}`);
              err.status = response.status;
              reject(err);
            }
          },
          onerror: (error: any) => {
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

export function saveBlobViaAnchor(blob: Blob, name: string): void {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = name;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
}

export function downloadBlobWithGm(blob: Blob, name: string): void {
  const blobUrl = URL.createObjectURL(blob);
  // Revoke once saved or failed; multi-GB archives otherwise stay pinned in memory for the tab's lifetime
  const revoke = () => setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  GM_download({ url: blobUrl, name, saveAs: false, onload: revoke, onerror: revoke, ontimeout: revoke });
}
