import { el } from '../../../utils/dom';
import type { IconName } from '../../../config/icons';
import { cx, kitIcon, type Child } from '../utils';

export interface EmptyStateOptions {
  title: string;
  description?: string;
  icon?: IconName;
  /** Usually a button(). */
  action?: Child;
  className?: string;
}

export function emptyState(options: EmptyStateOptions): HTMLDivElement {
  return el('div', { className: cx('kdl-ui-empty', options.className) }, [
    options.icon ? el('div', { className: 'kdl-ui-empty__icon' }, [kitIcon(options.icon)]) : null,
    el('p', { className: 'kdl-ui-empty__title', textContent: options.title }),
    options.description ? el('p', { className: 'kdl-ui-empty__description', textContent: options.description }) : null,
    options.action ? el('div', { className: 'kdl-ui-empty__action' }, [options.action]) : null,
  ]);
}
