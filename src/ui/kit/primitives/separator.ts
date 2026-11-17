import { el } from '../../../utils/dom';
import { cx } from '../utils';

export interface SeparatorOptions {
  orientation?: 'horizontal' | 'vertical';
  /** Purely visual (default true): hidden from assistive tech. */
  decorative?: boolean;
  className?: string;
}

export function separator(options: SeparatorOptions = {}): HTMLDivElement {
  const orientation = options.orientation ?? 'horizontal';
  const node = el('div', { className: cx('kdl-ui-separator', `kdl-ui-separator--${orientation}`, options.className) });
  if (options.decorative === false) {
    node.setAttribute('role', 'separator');
    node.setAttribute('aria-orientation', orientation);
  } else {
    node.setAttribute('role', 'none');
  }
  return node;
}
