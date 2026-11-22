import { el } from '../../../utils/dom';
import { cx } from '../utils';

export interface SkeletonOptions {
  /** CSS width / height (any length); unset: the class or the content decides */
  width?: string;
  height?: string;
  /** Fully rounded ends (chips, badges) */
  pill?: boolean;
  tag?: 'span' | 'div';
  className?: string;
}

/**
 * A shimmering stand-in for content that is still loading. Size it like what will replace it, so the page does
 * not move when the content arrives (see `swapIn` / `collapseAway` in `behaviors/reserve.ts`).
 */
export function skeleton(options: SkeletonOptions = {}): HTMLElement {
  const node = el(options.tag ?? 'span', { className: cx('kdl-ui-skeleton', options.pill && 'kdl-ui-skeleton--pill', options.className) });
  node.setAttribute('aria-hidden', 'true');
  if (options.width) node.style.width = options.width;
  if (options.height) node.style.height = options.height;
  return node;
}
