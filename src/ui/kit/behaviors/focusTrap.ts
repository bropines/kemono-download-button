import { deepActiveElement } from '../utils';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Visible, tabbable descendants in DOM order. */
export function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (node) => node.getClientRects().length > 0 && !node.closest('[inert]')
  );
}

export interface FocusTrapOptions {
  /** Element focused on activation; defaults to the first focusable, then the container. */
  initialFocus?: HTMLElement | null;
  /** Return focus to the element focused before the trap (default true). */
  restoreFocus?: boolean;
}

/** Keeps Tab / Shift+Tab inside the container. Returns a release function. */
export function trapFocus(container: HTMLElement, options: FocusTrapOptions = {}): () => void {
  const previous = deepActiveElement();
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    const items = getFocusable(container);
    if (!items.length) {
      event.preventDefault();
      container.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = deepActiveElement();
    const inside = !!active && container.contains(active);
    if (event.shiftKey && (active === first || !inside)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !inside)) {
      event.preventDefault();
      first.focus();
    }
  };
  container.addEventListener('keydown', onKeyDown);
  if (!container.hasAttribute('tabindex')) container.tabIndex = -1;
  requestAnimationFrame(() => {
    (options.initialFocus ?? getFocusable(container)[0] ?? container).focus({ preventScroll: true });
  });
  return () => {
    container.removeEventListener('keydown', onKeyDown);
    if (options.restoreFocus !== false && previous?.isConnected) previous.focus({ preventScroll: true });
  };
}
