import { state } from '../state/store';
import { debugLog } from './helpers';

export async function gmXmlhttpRequestWithRetries(details: any): Promise<any> {
  const maxRetries = state.settings.enableDownloadRetries ? state.settings.downloadRetryCount : 0;
  const retryDelay = state.settings.downloadRetryDelay;
  let attempts = 0;
  let currentUrl = details.url;

  while (attempts <= maxRetries + 4) {
    try {
      return await new Promise((resolve, reject) => {
        const headers = details.headers || {};
        if (state.settings.sessionCookie) {
          headers['Cookie'] = state.settings.sessionCookie;
        }

        GM_xmlhttpRequest({
          ...details,
          url: currentUrl,
          headers,
          onload: (response: any) => {
            if (response.status >= 200 && response.status < 300) {
              resolve(response);
            } else {
              reject(new Error(`HTTP Status ${response.status}: ${response.statusText}`));
            }
          },
          onerror: (error: any) => {
            const errStr = String(error?.error || error?.statusText || error || '');
            if (errStr.includes('BLOCKED') || errStr.includes('blocked')) {
              reject(new Error(`Blocked by browser/AdBlocker extension (${errStr || 'ERR_BLOCKED_BY_CLIENT'})`));
            } else {
              reject(error instanceof Error ? error : new Error(errStr || 'Network Error'));
            }
          },
          ontimeout: () => reject(new Error('Request Timeout'))
        });
      });
    } catch (error: any) {
      attempts++;

      // Try switching CDN node if cX domain failed with 404 or network error
      const cdnMatch = currentUrl.match(/https:\/\/(c\d+)\.([^/]+)(\/.*)/);
      if (cdnMatch) {
        const currentCdnNum = parseInt(cdnMatch[1].replace('c', ''), 10);
        const nextCdnNum = (currentCdnNum % 6) + 1;
        const domain = cdnMatch[2];
        const path = cdnMatch[3];
        currentUrl = `https://c${nextCdnNum}.${domain}${path}`;
        debugLog(`CDN node fallback: switching to ${currentUrl}`);
      } else {
        const mainMatch = currentUrl.match(/https:\/\/([^/]+)(\/data\/.*)/);
        if (mainMatch && !mainMatch[1].startsWith('c')) {
          currentUrl = `https://c1.${mainMatch[1]}${mainMatch[2]}`;
          debugLog(`CDN fallback: switching from main domain to ${currentUrl}`);
        }
      }

      if (attempts > maxRetries + 4) {
        throw error;
      }
      debugLog(`Attempt ${attempts} failed for ${details.url}: ${error.message}. Retrying in ${retryDelay}ms...`);
      await new Promise((res) => setTimeout(res, retryDelay));
    }
  }
}
