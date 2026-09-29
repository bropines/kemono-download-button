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

/**
 * Saves a blob as a file: GM_download where the host has it, an anchor download
 * where it does not. AdGuard's userscript API has no GM_download at all, and calling
 * it there throws, which used to lose a finished ZIP.
 */
export function saveBlob(blob: Blob, name: string, saveAs = false): void {
  if (typeof GM_download !== 'function') {
    saveBlobViaAnchor(blob, name);
    return;
  }
  const blobUrl = URL.createObjectURL(blob);
  // Revoke once saved or failed; multi-GB archives otherwise stay pinned in memory for the tab's lifetime
  const revoke = () => setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  GM_download({ url: blobUrl, name, saveAs, onload: revoke, onerror: revoke, ontimeout: revoke });
}
