import { el } from '../../../utils/dom';
import { portal } from '../root';
import { dismissable } from './dismissable';
import { trapFocus } from './focusTrap';

export interface ModalOptions {
  /** Close when clicking the overlay (default true). */
  closeOnOverlay?: boolean;
  /** Close on Escape (default true). */
  closeOnEscape?: boolean;
  initialFocus?: HTMLElement | null;
  onOpen?: () => void;
  onClose?: () => void;
}

export interface ModalHandle {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
}

let scrollLocks = 0;
let savedOverflow = '';

function lockScroll(lock: boolean): void {
  const html = document.documentElement;
  if (lock && scrollLocks++ === 0) {
    savedOverflow = html.style.overflow;
    html.style.overflow = 'hidden';
  } else if (!lock && scrollLocks > 0 && --scrollLocks === 0) {
    html.style.overflow = savedOverflow;
  }
}

/**
 * Shared mechanics for dialog and sheet: overlay, portal into the kit root,
 * focus trap, Escape / outside click, page scroll lock.
 */
export function createModal(panel: HTMLElement, options: ModalOptions = {}): ModalHandle {
  const overlay = el('div', { className: 'kdl-ui-overlay' });
  overlay.setAttribute('aria-hidden', 'true');
  let cleanup: Array<() => void> = [];
  let opened = false;

  const close = () => {
    if (!opened) return;
    opened = false;
    cleanup.forEach((fn) => fn());
    cleanup = [];
    overlay.remove();
    panel.remove();
    lockScroll(false);
    options.onClose?.();
  };

  const open = () => {
    if (opened) return;
    opened = true;
    portal(overlay);
    portal(panel);
    lockScroll(true);
    cleanup.push(
      trapFocus(panel, { initialFocus: options.initialFocus }),
      dismissable(panel, {
        escape: options.closeOnEscape !== false,
        outside: options.closeOnOverlay !== false,
        onDismiss: close,
      })
    );
    options.onOpen?.();
  };

  return { open, close, isOpen: () => opened };
}
