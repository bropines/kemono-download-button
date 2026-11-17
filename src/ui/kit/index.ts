import { el } from '../../utils/dom';
import { getKitRoot } from './root';
import { kitStyles } from './styles';
import type { KitTheme } from './tokens';
import { cx, type Child } from './utils';

export { kitStyles } from './styles';
export { tokenStyles, type KitTheme } from './tokens';
export { getKitRoot, portal, setKitTheme, KIT_ROOT_ID } from './root';
export { LAYERS, HOST_Z_INDEX } from './layers';
export { cx, uid, kitIcon, type Child, type Content } from './utils';

export * from './behaviors/focusTrap';
export * from './behaviors/dismissable';
export * from './behaviors/position';
export * from './behaviors/modal';

export * from './primitives/button';
export * from './primitives/input';
export * from './primitives/textarea';
export * from './primitives/select';
export * from './primitives/checkbox';
export * from './primitives/switch';
export * from './primitives/slider';
export * from './primitives/field';
export * from './primitives/card';
export * from './primitives/badge';
export * from './primitives/separator';
export * from './primitives/tabs';
export * from './primitives/dialog';
export * from './primitives/sheet';
export * from './primitives/popover';
export * from './primitives/tooltip';
export * from './primitives/toast';
export * from './primitives/progress';
export * from './primitives/scrollArea';
export * from './primitives/kbd';
export * from './primitives/emptyState';

const LIGHT_STYLE_ID = 'kdl-kit-styles';

/**
 * Creates the #kdl-root shadow host and injects the kit CSS into document.head once,
 * so inline widgets wrapped in kitScope() render in the page's light DOM too.
 */
export function ensureKit(): ShadowRoot {
  if (!document.getElementById(LIGHT_STYLE_ID)) {
    const style = document.createElement('style');
    style.id = LIGHT_STYLE_ID;
    style.textContent = kitStyles;
    (document.head ?? document.documentElement).appendChild(style);
  }
  return getKitRoot();
}

export interface ScopeOptions {
  theme?: KitTheme;
  /** Tag of the wrapper (default div; use span inside inline content). */
  tag?: 'div' | 'span';
  className?: string;
}

/** Light-DOM wrapper that carries the kit tokens and reset (`.kdl-scope`). */
export function kitScope(children: Child[] = [], options: ScopeOptions = {}): HTMLElement {
  const node = el(options.tag ?? 'div', { className: cx('kdl-scope', options.className) }, children);
  if (options.theme) node.dataset.theme = options.theme;
  return node;
}
