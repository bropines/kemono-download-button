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

export async function gmXmlhttpRequestWithRetries(details: any): Promise<any> {
  const maxRetries = state.settings.enableDownloadRetries ? Number(state.settings.downloadRetryCount) || 0 : 0;
  const retryDelay = state.settings.downloadRetryDelay;
  let retries = 0;
  let currentUrl = details.url;

  while (true) {
    try {
      return await new Promise((resolve, reject) => {
        const headers = { ...(details.headers || {}) };
        // Never send the session to third parties (translation APIs, external file hosts)
        if (state.settings.sessionCookie && isSiteUrl(currentUrl)) {
          headers['Cookie'] = state.settings.sessionCookie;
        }
        // kemono/coomer answer API requests without this exact Accept header with 403
        if (isSiteUrl(currentUrl) && currentUrl.includes('/api/') && !headers['Accept']) {
          headers['Accept'] = 'text/css';
        }

        GM_xmlhttpRequest({
          ...details,
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
          ontimeout: () => reject(new Error('Request Timeout'))
        });
      });
    } catch (error: any) {
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
      await new Promise((res) => setTimeout(res, retryDelay));
    }
  }
}

export async function downloadFileWithFallback(url: string, fileName: string, progressCallback?: (percent: number) => void): Promise<void> {
  const cleanName = sanitizeFilename(fileName);

  if (typeof GM_download === 'function') {
    const tryGmDownload = (): Promise<boolean> => {
      return new Promise((resolve) => {
        try {
          let isDone = false;
          GM_download({
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
        } catch (e) {
          debugLog('GM_download exception:', e);
          resolve(false);
        }
      });
    };

    const success = await tryGmDownload();
    if (success) return;
  }

  debugLog(`GM_download fallback activated for ${url}. Fetching via gmXmlhttpRequest...`);
  const response = await gmXmlhttpRequestWithRetries({
    method: 'GET',
    url,
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
