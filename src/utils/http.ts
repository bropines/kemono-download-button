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
      attempts++;

      // Try switching CDN node if file. or cX domain failed with 404 or network error
      const fileMatch = currentUrl.match(/https:\/\/(file|c\d+)\.([^/]+)(\/.*)/);
      if (fileMatch) {
        const prefix = fileMatch[1];
        const domain = fileMatch[2];
        const path = fileMatch[3];
        if (prefix === 'file') {
          currentUrl = `https://c1.${domain}${path}`;
        } else {
          const currentCdnNum = parseInt(prefix.replace('c', ''), 10);
          const nextCdnNum = (currentCdnNum % 6) + 1;
          currentUrl = `https://c${nextCdnNum}.${domain}${path}`;
        }
        debugLog(`CDN node fallback: switching to ${currentUrl}`);
      } else {
        const mainMatch = currentUrl.match(/https:\/\/([^/]+)(\/data\/.*)/);
        if (mainMatch && !mainMatch[1].startsWith('c') && !mainMatch[1].startsWith('file')) {
          currentUrl = `https://file.${mainMatch[1]}${mainMatch[2]}`;
          debugLog(`CDN fallback: switching from main domain to ${currentUrl}`);
        } else if (error.status === 404 || error.status === 401 || error.status === 403) {
          throw error;
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
