import { el } from '../../../utils/dom';
import type { IconName } from '../../../config/icons';
import { cx, kitIcon } from '../utils';

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
export type ButtonSize = 'sm' | 'default' | 'lg' | 'icon';

export interface ButtonOptions {
  label?: string;
  /** A Lucide name, or a ready SVG (e.g. a brand glyph sized with the kdl-ui-icon class). */
  icon?: IconName | SVGElement;
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

export interface LinkButtonOptions extends Omit<ButtonOptions, 'type' | 'loading'> {
  /** Renders an <a> styled as a button. */
  href: string;
  /** "_blank" also sets rel="noopener noreferrer". */
  target?: string;
  /** true for a bare `download` attribute, a string to suggest a file name. */
  download?: boolean | string;
}

/** A <button>, or with `href` an <a> that looks the same (disabled links get aria-disabled). */
export function button(options: LinkButtonOptions): HTMLAnchorElement;
export function button(options?: ButtonOptions): HTMLButtonElement;
export function button(options: ButtonOptions | LinkButtonOptions = {}): HTMLButtonElement | HTMLAnchorElement {
  const { variant = 'default', size = 'default' } = options;
  const className = cx('kdl-ui-btn', `kdl-ui-btn--${variant}`, `kdl-ui-btn--size-${size}`, options.className);
  let btn: HTMLButtonElement | HTMLAnchorElement;
  if ('href' in options && options.href !== undefined) {
    const link = el('a', { href: options.href, className });
    if (options.target) link.target = options.target;
    if (options.target === '_blank') link.rel = 'noopener noreferrer';
    if (options.download) link.setAttribute('download', options.download === true ? '' : options.download);
    if (options.disabled) link.setAttribute('aria-disabled', 'true');
    btn = link;
  } else {
    const o = options as ButtonOptions;
    btn = el('button', { type: o.type ?? 'button', className, disabled: !!o.disabled });
  }
  if (options.id) btn.id = options.id;
  if (options.title) btn.title = options.title;
  if (options.ariaLabel) btn.setAttribute('aria-label', options.ariaLabel);
  if (options.onClick) (btn as HTMLElement).addEventListener('click', options.onClick);
  if (options.icon) btn.append(typeof options.icon === 'string' ? kitIcon(options.icon) : options.icon);
  if (options.label) btn.append(el('span', { textContent: options.label }));
  if (options.iconRight) btn.append(kitIcon(options.iconRight));
  if (btn instanceof HTMLButtonElement && (options as ButtonOptions).loading) setButtonLoading(btn, true);
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
