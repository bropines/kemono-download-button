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

/**
 * Attaches a tooltip to a target (page or kit root) and returns the target.
 * Shown on hover / keyboard focus, hidden on leave, blur, Escape or click.
 */
export function tooltip<T extends HTMLElement>(target: T, options: TooltipOptions): T {
  const tip = el('div', {
    id: uid('kdl-ui-tooltip'),
    className: cx('kdl-ui-tooltip', options.className),
    textContent: options.text,
  });
  tip.setAttribute('role', 'tooltip');
  let timer = 0;

  const hide = () => {
    clearTimeout(timer);
    if (!tip.isConnected) return;
    tip.remove();
    target.removeAttribute('aria-describedby');
    document.removeEventListener('keydown', onKey, true);
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') hide();
  };
  const show = () => {
    if (tip.isConnected || !target.isConnected) return;
    portal(tip);
    const { x, y, side } = computePosition(target, tip, { side: 'top', offset: 6, ...options });
    Object.assign(tip.style, { left: `${x}px`, top: `${y}px` });
    tip.dataset.side = side;
    target.setAttribute('aria-describedby', tip.id);
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
