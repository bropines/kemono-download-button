import { el } from '../../../utils/dom';
import type { IconName } from '../../../config/icons';
import { cx, kitIcon } from '../utils';

export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning';

export interface BadgeOptions {
  text: string;
  variant?: BadgeVariant;
  icon?: IconName;
  title?: string;
  className?: string;
}

export function badge(options: BadgeOptions): HTMLSpanElement {
  const node = el('span', {
    className: cx('kdl-ui-badge', `kdl-ui-badge--${options.variant ?? 'default'}`, options.className),
  }, [options.icon ? kitIcon(options.icon) : null, options.text]);
  if (options.title) node.title = options.title;
  return node;
}
