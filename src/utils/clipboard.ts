/**
 * Copies text: GM_setClipboard where the host has it (works without page focus or
 * permissions), the async Clipboard API where it does not. Resolves false when neither worked.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof GM_setClipboard === 'function') {
      GM_setClipboard(text);
      return true;
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    // Falls through: the caller tells the user it failed
  }
  return false;
}
