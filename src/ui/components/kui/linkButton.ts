import type { IconName } from '../../../config/icons';
import { cx, kitIcon, type ButtonSize, type ButtonVariant } from '../../kit';
import { el } from '../../../utils/dom';

export interface LinkButtonOptions {
  href: string;
  id?: string;
  icon?: IconName | SVGElement;
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  ariaLabel?: string;
  /** Opens in a new tab (default true). */
  external?: boolean;
  download?: boolean;
  className?: string;
}

/** An <a> that looks like a kit button: the kit's button() only builds <button>s. */
export function linkButton(options: LinkButtonOptions): HTMLAnchorElement {
  const link = el('a', {
    href: options.href,
    className: cx(
      'kdl-ui-btn',
      `kdl-ui-btn--${options.variant ?? 'default'}`,
      `kdl-ui-btn--size-${options.size ?? 'default'}`,
      options.className
    ),
  });
  if (options.id) link.id = options.id;
  if (options.external !== false) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  if (options.download) link.setAttribute('download', '');
  if (options.ariaLabel) link.setAttribute('aria-label', options.ariaLabel);
  if (options.icon) link.append(typeof options.icon === 'string' ? kitIcon(options.icon) : options.icon);
  if (options.label) link.append(el('span', { textContent: options.label }));
  return link;
}

const LENS_PATH =
  'M480-320q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35Zm240 160q-33 0-56.5-23.5T640-240q0-33 23.5-56.5T720-320q33 0 56.5 23.5T800-240q0 33-23.5 56.5T720-160Zm-440 40q-66 0-113-47t-47-113v-80h80v80q0 33 23.5 56.5T280-200h200v80H280Zm480-320v-160q0-33-23.5-56.5T680-680H280q-33 0-56.5 23.5T200-600v120h-80v-120q0-66 47-113t113-47h80l40-80h160l40 80h80q66 0 113 47t47 113v160h-80Z';

/** Google Lens glyph sized like a kit icon (a filled path, unlike the stroked Lucide set). */
export function lensIcon(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 -960 960 960');
  svg.setAttribute('class', 'kdl-ui-icon');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.stroke = 'none';
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill', 'currentColor');
  path.setAttribute('d', LENS_PATH);
  svg.append(path);
  return svg;
}
