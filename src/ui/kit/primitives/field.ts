import { el } from '../../../utils/dom';
import { cx, uid } from '../utils';

export interface LabelOptions {
  text: string;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}

export function label(options: LabelOptions): HTMLLabelElement {
  const node = el('label', { className: cx('kdl-ui-label', options.className) }, [options.text]);
  if (options.htmlFor) node.htmlFor = options.htmlFor;
  if (options.required) node.append(el('span', { className: 'kdl-ui-label__required', textContent: ' *' }));
  return node;
}

export interface FieldOptions {
  label?: string;
  description?: string;
  error?: string;
  /** The control; gets an id, aria-describedby and aria-invalid wired up. */
  control: HTMLElement;
  /** "horizontal" puts the control before the label (checkbox / switch rows). */
  orientation?: 'vertical' | 'horizontal';
  required?: boolean;
  /** The control is a composite widget (a list with its own buttons): the label names it as a group instead of pointing at its first input */
  group?: boolean;
  className?: string;
}

/** The element ARIA attributes belong on: the control itself, or the input inside a slider wrapper. */
function focusTarget(control: HTMLElement): HTMLElement {
  return control.matches('input, select, textarea, button')
    ? control
    : control.querySelector<HTMLElement>('input, select, textarea, button') ?? control;
}

/** Label + control + description + error, with ids linked. */
export function field(options: FieldOptions): HTMLDivElement {
  const target = options.group ? options.control : focusTarget(options.control);
  if (!target.id) target.id = uid('kdl-ui-field');
  const descId = `${target.id}-desc`;
  const errId = `${target.id}-err`;
  const lbl = options.label ? label({ text: options.label, htmlFor: options.group ? undefined : target.id, required: options.required }) : null;
  if (options.group) {
    target.setAttribute('role', target.getAttribute('role') || 'group');
    if (lbl) {
      lbl.id = `${target.id}-label`;
      target.setAttribute('aria-labelledby', lbl.id);
    }
  }
  // buttons are labelable (a click on the label toggles a switch), but name them explicitly too
  else if (lbl && target.tagName === 'BUTTON') {
    lbl.id = `${target.id}-label`;
    target.setAttribute('aria-labelledby', lbl.id);
  }
  const description = options.description
    ? el('p', { id: descId, className: 'kdl-ui-field__description', textContent: options.description })
    : null;
  const error = el('p', { id: errId, className: 'kdl-ui-field__error' });
  error.setAttribute('role', 'alert');

  const horizontal = options.orientation === 'horizontal';
  const text = horizontal ? el('div', { className: 'kdl-ui-field__text' }, [lbl, description, error]) : null;
  const node = el(
    'div',
    { className: cx('kdl-ui-field', horizontal && 'kdl-ui-field--horizontal', options.className) },
    horizontal ? [options.control, text] : [lbl, options.control, description, error]
  );
  node.dataset.control = target.id;
  setFieldError(node, options.error ?? null);
  return node;
}

/** Shows or clears a field's error message and the control's aria-invalid. */
export function setFieldError(fieldNode: HTMLElement, message: string | null): void {
  const target = fieldNode.dataset.control ? fieldNode.querySelector<HTMLElement>(`#${CSS.escape(fieldNode.dataset.control)}`) : null;
  const error = fieldNode.querySelector<HTMLElement>('.kdl-ui-field__error');
  if (!target || !error) return;
  error.textContent = message ?? '';
  error.hidden = !message;
  const ids = [fieldNode.querySelector('.kdl-ui-field__description')?.id, message ? error.id : null].filter(Boolean);
  if (ids.length) target.setAttribute('aria-describedby', ids.join(' '));
  else target.removeAttribute('aria-describedby');
  if (message) target.setAttribute('aria-invalid', 'true');
  else target.removeAttribute('aria-invalid');
}
