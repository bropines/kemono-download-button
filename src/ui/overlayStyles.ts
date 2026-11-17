import { getKitRoot } from './kit';

/**
 * Adds a screen's own CSS to the kit shadow root once (the kit only ships its primitives' CSS).
 * Returns the root so callers can mount into it.
 */
export function mountOverlayStyles(id: string, cssText: string): ShadowRoot {
  const root = getKitRoot();
  if (!root.getElementById(id)) {
    const style = document.createElement('style');
    style.id = id;
    style.textContent = cssText;
    root.appendChild(style);
  }
  return root;
}
