import { el } from '../../../utils/dom';
import { dismissable } from '../behaviors/dismissable';
import { getFocusable } from '../behaviors/focusTrap';
import { autoPosition, type PositionOptions } from '../behaviors/position';
import { portal } from '../root';
import { cx, resolveContent, uid, type Content } from '../utils';

export interface PopoverOptions extends PositionOptions {
  /** Element that toggles the popover on click; may live in the page or the kit root. */
  trigger: HTMLElement;
  /** Content; a function is called once, on first open. */
  content: Content;
  /** Accessible name when the content has no heading. */
  ariaLabel?: string;
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

export interface PopoverHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
  element: HTMLDivElement;
}

/** Non-modal floating panel anchored to a trigger. Escape / outside click close it and return focus. */
export function popover(options: PopoverOptions): PopoverHandle {
  const { trigger } = options;
  const element = el('div', { id: uid('kdl-ui-popover'), className: cx('kdl-ui-popover', options.className) });
  element.setAttribute('role', 'dialog');
  element.tabIndex = -1;
  if (options.ariaLabel) element.setAttribute('aria-label', options.ariaLabel);
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', element.id);

  let rendered = false;
  let cleanup: Array<() => void> = [];

  const close = (restoreFocus = true) => {
    if (!cleanup.length) return;
    cleanup.forEach((fn) => fn());
    cleanup = [];
    element.remove();
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger.focus({ preventScroll: true });
    options.onOpenChange?.(false);
  };

  const open = () => {
    if (cleanup.length) return;
    if (!rendered) {
      element.append(...resolveContent(options.content).filter((c): c is string | Node => !!c));
      rendered = true;
    }
    portal(element);
    trigger.setAttribute('aria-expanded', 'true');
    cleanup.push(
      autoPosition(trigger, element, { side: 'bottom', align: 'center', ...options }),
      dismissable(element, {
        ignore: [trigger],
        onDismiss: (reason) => close(reason === 'escape'),
      })
    );
    requestAnimationFrame(() => (getFocusable(element)[0] ?? element).focus({ preventScroll: true }));
    options.onOpenChange?.(true);
  };

  const toggle = () => (cleanup.length ? close() : open());
  trigger.addEventListener('click', toggle);
  return { open, close: () => close(), toggle, isOpen: () => cleanup.length > 0, element };
}
