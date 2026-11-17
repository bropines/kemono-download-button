import { icon, type IconName } from '../../config/icons';

/** Anything el() accepts as a child. */
export type Child = string | Node | null | undefined;
/** Content given as nodes or a factory that builds them on first use. */
export type Content = Child | Child[] | (() => Child | Child[]);

/** Joins class names, skipping empty ones. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

let counter = 0;
/** Unique id for ARIA wiring. */
export function uid(prefix = 'kdl-ui'): string {
  return `${prefix}-${++counter}`;
}

/** Kit-styled Lucide icon. */
export function kitIcon(name: IconName, extra?: string): SVGSVGElement {
  return icon(name, cx('kdl-ui-icon', extra));
}

/** Resolves Content into a flat child list. */
export function resolveContent(content: Content): Child[] {
  const value = typeof content === 'function' ? content() : content;
  return Array.isArray(value) ? value : [value];
}

/** Focused element, looking through shadow roots. */
export function deepActiveElement(): HTMLElement | null {
  let active: Element | null = document.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active as HTMLElement | null;
}
