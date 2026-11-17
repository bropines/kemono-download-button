import { HOST_Z_INDEX } from './layers';
import { kitStyles } from './styles';
import type { KitTheme } from './tokens';

export const KIT_ROOT_ID = 'kdl-root';
const SHADOW_STYLE_ID = 'kdl-kit-shadow-styles';
let shadow: ShadowRoot | null = null;

function injectStyles(root: ShadowRoot): void {
  if (root.getElementById(SHADOW_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = SHADOW_STYLE_ID;
  style.textContent = kitStyles;
  root.prepend(style);
}

/**
 * The kit's shadow root, created on first use. The host is a zero-size fixed box on
 * document.body (outside #main, so HTMX swaps never remove it); overlays inside it use
 * position: fixed and their own z-index from LAYERS.
 */
export function getKitRoot(): ShadowRoot {
  let host = document.getElementById(KIT_ROOT_ID);
  if (!host) {
    host = document.createElement('div');
    host.id = KIT_ROOT_ID;
    Object.assign(host.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '0',
      height: '0',
      overflow: 'visible',
      zIndex: String(HOST_Z_INDEX),
    });
  }
  if (!host.isConnected) document.body.appendChild(host);
  shadow = host.shadowRoot ?? shadow ?? host.attachShadow({ mode: 'open' });
  injectStyles(shadow);
  return shadow;
}

/** Appends an element into the kit shadow root and returns it. */
export function portal<T extends Element>(element: T): T {
  getKitRoot().appendChild(element);
  return element;
}

/** Switches the theme of everything rendered in the kit root. */
export function setKitTheme(theme: KitTheme): void {
  (getKitRoot().host as HTMLElement).dataset.theme = theme;
}
