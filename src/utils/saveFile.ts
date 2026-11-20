import { debugLog } from './helpers';

export function saveBlobViaAnchor(blob: Blob, name: string): void {
  debugLog('[download]', 'browser-save-triggered', { transport: 'anchor', bytes: blob.size });
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

/**
 * Saves a blob as a file: GM_download where the host has it, an anchor download
 * where it does not. AdGuard's userscript API has no GM_download at all, and calling
 * it there throws, which used to lose a finished ZIP.
 */
export function saveBlob(blob: Blob, name: string, saveAs = false): void {
  if (typeof GM_download !== 'function') {
    debugLog('[download]', 'save-fallback', { reason: 'gm-download-unavailable', bytes: blob.size });
    saveBlobViaAnchor(blob, name);
    return;
  }
  const blobUrl = URL.createObjectURL(blob);
  // Revoke once settled; multi-GB archives otherwise stay pinned in memory for the tab's lifetime
  const revoke = () => setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  let settled = false;
  // A failed GM_download (blocked extension, disallowed name, timeout) must not lose the file
  const fallBack = (reason: string) => {
    if (settled) return;
    settled = true;
    console.warn('[Kemono DL] GM_download failed, saving through the browser instead.');
    debugLog('[download]', 'save-fallback', { reason, bytes: blob.size });
    revoke();
    saveBlobViaAnchor(blob, name);
  };
  try {
    debugLog('[download]', 'save-start', { transport: 'GM_download', bytes: blob.size, saveAs });
    GM_download({
      url: blobUrl,
      name,
      saveAs,
      onload: () => {
        if (settled) return;
        settled = true;
        debugLog('[download]', 'save-complete', { transport: 'GM_download', bytes: blob.size });
        revoke();
      },
      onerror: (error: any) => {
        // Cancelling the Save As dialog is a choice, not a failure
        if (/cancel/i.test(JSON.stringify(error ?? ''))) {
          settled = true;
          debugLog('[download]', 'save-cancelled', { transport: 'GM_download' });
          revoke();
          return;
        }
        fallBack('error');
      },
      ontimeout: () => fallBack('timeout')
    });
  } catch {
    fallBack('exception');
  }
}
