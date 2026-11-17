import { el } from '../../../utils/dom';
import type { IconName } from '../../../config/icons';
import { cx, kitIcon } from '../utils';

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
export type ButtonSize = 'sm' | 'default' | 'lg' | 'icon';

export interface ButtonOptions {
  label?: string;
  icon?: IconName;
  iconRight?: IconName;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
  /** Required for size "icon" (no visible text). */
  ariaLabel?: string;
  id?: string;
  className?: string;
  onClick?: (event: MouseEvent) => void;
}

export function button(options: ButtonOptions = {}): HTMLButtonElement {
  const { variant = 'default', size = 'default' } = options;
  const btn = el('button', {
    type: options.type ?? 'button',
    className: cx('kdl-ui-btn', `kdl-ui-btn--${variant}`, `kdl-ui-btn--size-${size}`, options.className),
    disabled: !!options.disabled,
  });
  if (options.id) btn.id = options.id;
  if (options.title) btn.title = options.title;
  if (options.ariaLabel) btn.setAttribute('aria-label', options.ariaLabel);
  if (options.onClick) btn.addEventListener('click', options.onClick);
  if (options.icon) btn.append(kitIcon(options.icon));
  if (options.label) btn.append(el('span', { textContent: options.label }));
  if (options.iconRight) btn.append(kitIcon(options.iconRight));
  if (options.loading) setButtonLoading(btn, true);
  return btn;
}

/** Shows a spinner in place of the leading icon and blocks clicks while loading. */
export function setButtonLoading(btn: HTMLButtonElement, loading: boolean): void {
  const spinner = btn.querySelector(':scope > .kdl-ui-btn__spinner');
  if (loading && !spinner) {
    btn.dataset.wasDisabled = String(btn.disabled);
    btn.prepend(kitIcon('loader-circle', 'kdl-ui-spin kdl-ui-btn__spinner'));
    btn.disabled = true;
  } else if (!loading && spinner) {
    spinner.remove();
    btn.disabled = btn.dataset.wasDisabled === 'true';
    delete btn.dataset.wasDisabled;
  }
  btn.toggleAttribute('data-loading', loading);
  btn.setAttribute('aria-busy', String(loading));
}
