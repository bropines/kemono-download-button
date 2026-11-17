import { el } from '../../../utils/dom';
import { cx, type Child } from '../utils';

export interface ScrollAreaOptions {
  children?: Child[];
  /** CSS max-height, e.g. "320px" or "50vh". */
  maxHeight?: string;
  orientation?: 'vertical' | 'horizontal' | 'both';
  /** Makes the area a focusable, named region so keyboard users can scroll it. */
  ariaLabel?: string;
  className?: string;
}

/** Native scrolling with thin themed scrollbars. */
export function scrollArea(options: ScrollAreaOptions = {}): HTMLDivElement {
  const node = el(
    'div',
    { className: cx('kdl-ui-scroll', `kdl-ui-scroll--${options.orientation ?? 'vertical'}`, options.className) },
    options.children ?? []
  );
  if (options.maxHeight) node.style.maxHeight = options.maxHeight;
  if (options.ariaLabel) {
    node.setAttribute('role', 'region');
    node.setAttribute('aria-label', options.ariaLabel);
    node.tabIndex = 0;
  }
  return node;
}
