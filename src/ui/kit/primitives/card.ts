import { el } from '../../../utils/dom';
import { cx, type Child } from '../utils';

interface PartOptions {
  className?: string;
}

const part =
  <K extends 'div' | 'h3' | 'p'>(tag: K, base: string) =>
  (children: Child[] | string = [], options: PartOptions = {}): HTMLElementTagNameMap[K] =>
    el(tag, { className: cx(base, options.className) }, typeof children === 'string' ? [children] : children);

export const cardHeader = part('div', 'kdl-ui-card__header');
export const cardTitle = part('h3', 'kdl-ui-card__title');
export const cardDescription = part('p', 'kdl-ui-card__description');
export const cardContent = part('div', 'kdl-ui-card__content');
export const cardFooter = part('div', 'kdl-ui-card__footer');

export interface CardOptions {
  title?: string;
  description?: string;
  /** Extra nodes in the header row, right of the title (e.g. an action button). */
  headerAction?: Child;
  content?: Child[];
  footer?: Child[];
  className?: string;
}

/** Card with optional header/content/footer; or compose the parts yourself and pass them as content. */
export function card(options: CardOptions = {}): HTMLDivElement {
  const hasHeader = options.title || options.description || options.headerAction;
  const header = hasHeader
    ? cardHeader([
        el('div', { className: 'kdl-ui-card__heading' }, [
          options.title ? cardTitle(options.title) : null,
          options.description ? cardDescription(options.description) : null,
        ]),
        options.headerAction,
      ])
    : null;
  return el('div', { className: cx('kdl-ui-card', options.className) }, [
    header,
    options.content ? cardContent(options.content) : null,
    options.footer ? cardFooter(options.footer) : null,
  ]);
}
