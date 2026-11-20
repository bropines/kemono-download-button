import { el } from '../../../utils/dom';
import { computePosition, type PositionOptions } from '../behaviors/position';
import { portal } from '../root';
import { cx, uid } from '../utils';

export interface TooltipOptions extends PositionOptions {
  text: string;
  /** Hover delay in ms (default 400); focus shows it immediately. */
  delay?: number;
  className?: string;
}

const tips = new WeakMap<HTMLElement, HTMLElement>();

/**
 * Attaches a tooltip to a target (page or kit root) and returns the target.
 * Shown on hover / keyboard focus, hidden on leave, blur, Escape or click.
 * Change the text later with setTooltip().
 */
export function tooltip<T extends HTMLElement>(target: T, options: TooltipOptions): T {
  const existing = tips.get(target);
  if (existing) {
    existing.textContent = options.text;
    return target;
  }
  const tip = el('div', {
    id: uid('kdl-ui-tooltip'),
    className: cx('kdl-ui-tooltip', options.className),
    textContent: options.text,
  });
  tip.setAttribute('role', 'tooltip');
  tips.set(target, tip);
  let timer = 0;
  let anchorObserver: MutationObserver | undefined;

  const hide = () => {
    clearTimeout(timer);
    if (!anchorObserver) return;
    anchorObserver.disconnect();
    anchorObserver = undefined;
    tip.remove();
    const otherIds = target.getAttribute('aria-describedby')?.split(/\s+/).filter((id) => id && id !== tip.id);
    if (otherIds?.length) target.setAttribute('aria-describedby', otherIds.join(' '));
    else target.removeAttribute('aria-describedby');
    document.removeEventListener('keydown', onKey, true);
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') hide();
  };
  const show = () => {
    if (anchorObserver || !target.isConnected || !tip.textContent || !target.getClientRects().length) return;
    portal(tip);
    const { x, y, side } = computePosition(target, tip, { side: 'top', offset: 6, ...options });
    Object.assign(tip.style, { left: `${x}px`, top: `${y}px` });
    tip.dataset.side = side;
    target.setAttribute('aria-describedby', [target.getAttribute('aria-describedby'), tip.id].filter(Boolean).join(' '));
    // A page swap can remove a hovered or focused target without dispatching leave or blur.
    anchorObserver = new MutationObserver(() => {
      if (!target.isConnected || !tip.isConnected) hide();
    });
    anchorObserver.observe(document, { childList: true, subtree: true });
    const root = target.getRootNode();
    if (root !== document) anchorObserver.observe(root, { childList: true, subtree: true });
    document.addEventListener('keydown', onKey, true);
  };
  const showLater = () => {
    clearTimeout(timer);
    timer = window.setTimeout(show, options.delay ?? 400);
  };

  target.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && showLater());
  target.addEventListener('pointerleave', hide);
  target.addEventListener('focusin', () => target.matches(':focus-visible') && show());
  target.addEventListener('focusout', hide);
  target.addEventListener('pointerdown', hide);
  return target;
}

/**
 * Sets the text of a target's tooltip, attaching one if it has none yet (for instance a node that
 * came back from an htmx history snapshot without its listeners). An open tooltip updates in place.
 */
export function setTooltip<T extends HTMLElement>(target: T, text: string, options: Omit<TooltipOptions, 'text'> = {}): T {
  const tip = tips.get(target);
  if (tip) tip.textContent = text;
  else tooltip(target, { ...options, text });
  return target;
}
