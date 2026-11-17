export type Side = 'top' | 'bottom' | 'left' | 'right';
export type Align = 'start' | 'center' | 'end';

export interface PositionOptions {
  side?: Side;
  align?: Align;
  /** Gap between anchor and floating element in px (default 6). */
  offset?: number;
  /** Minimum distance from the viewport edge in px (default 8). */
  padding?: number;
}

const OPPOSITE: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

/**
 * Places a position: fixed element next to an anchor. Flips to the opposite side
 * when the preferred one has no room, then clamps into the viewport.
 */
export function computePosition(
  anchor: Element | DOMRect,
  floating: HTMLElement,
  { side = 'bottom', align = 'center', offset = 6, padding = 8 }: PositionOptions = {}
): { x: number; y: number; side: Side } {
  const a = anchor instanceof Element ? anchor.getBoundingClientRect() : anchor;
  const w = floating.offsetWidth;
  const h = floating.offsetHeight;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const room: Record<Side, number> = {
    top: a.top - padding,
    bottom: vh - a.bottom - padding,
    left: a.left - padding,
    right: vw - a.right - padding,
  };
  const need = side === 'top' || side === 'bottom' ? h + offset : w + offset;
  const finalSide = room[side] < need && room[OPPOSITE[side]] > room[side] ? OPPOSITE[side] : side;

  const alignAxis = (start: number, size: number, length: number) =>
    align === 'start' ? start : align === 'end' ? start + size - length : start + (size - length) / 2;

  let x: number;
  let y: number;
  if (finalSide === 'top' || finalSide === 'bottom') {
    y = finalSide === 'top' ? a.top - offset - h : a.bottom + offset;
    x = alignAxis(a.left, a.width, w);
  } else {
    x = finalSide === 'left' ? a.left - offset - w : a.right + offset;
    y = alignAxis(a.top, a.height, h);
  }
  const clamp = (value: number, size: number, max: number) =>
    Math.max(padding, Math.min(value, max - size - padding));
  return { x: clamp(x, w, vw), y: clamp(y, h, vh), side: finalSide };
}

/** Positions now and on scroll/resize. Returns a cleanup function. */
export function autoPosition(anchor: Element, floating: HTMLElement, options: PositionOptions = {}): () => void {
  let frame = 0;
  const update = () => {
    frame = 0;
    const { x, y, side } = computePosition(anchor, floating, options);
    Object.assign(floating.style, { position: 'fixed', left: `${x}px`, top: `${y}px` });
    floating.dataset.side = side;
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  update();
  window.addEventListener('scroll', schedule, true);
  window.addEventListener('resize', schedule);
  return () => {
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener('scroll', schedule, true);
    window.removeEventListener('resize', schedule);
  };
}
