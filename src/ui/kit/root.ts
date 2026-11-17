import { HOST_Z_INDEX } from './layers';
import { kitStyles } from './styles';
import type { KitTheme } from './tokens';

export const KIT_ROOT_ID = 'kdl-root';
const SHADOW_STYLE_ID = 'kdl-kit-shadow-styles';

// Kept so a removed host can be put back (with its open overlays) and a recreated one restyled
let host: HTMLElement | null = null;
let theme: KitTheme | null = null;
const extraStyles = new Map<string, string>();

function addStyle(root: ShadowRoot, id: string, cssText: string, first = false): void {
  if (root.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = cssText;
  if (first) root.prepend(style);
  else root.appendChild(style);
}

function createHost(): HTMLElement {
  const node = document.createElement('div');
  node.id = KIT_ROOT_ID;
  Object.assign(node.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '0',
    height: '0',
    overflow: 'visible',
    zIndex: String(HOST_Z_INDEX),
  });
  return node;
}

/**
 * The kit's shadow root, created on first use. The host is a zero-size fixed box on
 * document.body (outside #main, so HTMX swaps never remove it); overlays inside it use
 * position: fixed and their own z-index from LAYERS. If the page removes the host, the
 * next call puts it back; if something else now owns the id, a fresh host replaces it.
 */
export function getKitRoot(): ShadowRoot {
  const current = document.getElementById(KIT_ROOT_ID);
  if (current && current !== host && current.shadowRoot) host = current;
  else if (current && current !== host) current.remove();
  if (!host) host = createHost();
  if (!host.isConnected) document.body.appendChild(host);
  const root = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
  addStyle(root, SHADOW_STYLE_ID, kitStyles, true);
  extraStyles.forEach((cssText, id) => addStyle(root, id, cssText));
  if (theme && host.dataset.theme !== theme) host.dataset.theme = theme;
  return root;
}

/**
 * Adds a screen's own CSS to the kit shadow root (the kit only ships its primitives' CSS).
 * Idempotent per id, and re-applied if the root is ever recreated. Returns the root.
 */
export function addKitStyles(id: string, cssText: string): ShadowRoot {
  extraStyles.set(id, cssText);
  return getKitRoot();
}

/** Appends an element into the kit shadow root and returns it. */
export function portal<T extends Element>(element: T): T {
  getKitRoot().appendChild(element);
  return element;
}

/** Switches the theme of everything rendered in the kit root. */
export function setKitTheme(next: KitTheme): void {
  theme = next;
  (getKitRoot().host as HTMLElement).dataset.theme = next;
}
