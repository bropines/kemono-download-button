import { el } from '../../../utils/dom';
import { cx } from '../utils';

export interface ProgressOptions {
  /** 0..max; omit or null for an indeterminate bar. */
  value?: number | null;
  max?: number;
  ariaLabel?: string;
  className?: string;
}

export function progress(options: ProgressOptions = {}): HTMLDivElement {
  const node = el('div', { className: cx('kdl-ui-progress', options.className) }, [
    el('div', { className: 'kdl-ui-progress__indicator' }),
  ]);
  node.setAttribute('role', 'progressbar');
  node.setAttribute('aria-valuemin', '0');
  node.setAttribute('aria-valuemax', String(options.max ?? 100));
  if (options.ariaLabel) node.setAttribute('aria-label', options.ariaLabel);
  setProgress(node, options.value ?? null);
  return node;
}

/** Updates the bar; null switches to indeterminate. */
export function setProgress(node: HTMLElement, value: number | null): void {
  const max = Number(node.getAttribute('aria-valuemax')) || 100;
  const indicator = node.firstElementChild as HTMLElement | null;
  if (value === null) {
    node.removeAttribute('aria-valuenow');
    node.dataset.state = 'indeterminate';
    if (indicator) indicator.style.transform = '';
    return;
  }
  const clamped = Math.max(0, Math.min(max, value));
  node.setAttribute('aria-valuenow', String(clamped));
  node.dataset.state = clamped >= max ? 'complete' : 'loading';
  if (indicator) indicator.style.transform = `translateX(-${100 - (clamped / max) * 100}%)`;
}
