import { el } from '../../../utils/dom';
import { cx } from '../utils';

/** Options shared by text-like controls. */
export interface ControlOptions {
  id?: string;
  name?: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
  className?: string;
  onInput?: (value: string, event: Event) => void;
  onChange?: (value: string, event: Event) => void;
}

export interface InputOptions extends ControlOptions {
  type?: 'text' | 'number' | 'password' | 'search' | 'email' | 'url' | 'file';
  min?: number;
  max?: number;
  step?: number;
  autocomplete?: string;
}

/** Applies ControlOptions to an input/textarea/select. */
export function applyControlOptions(
  node: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  o: ControlOptions
): void {
  if (o.id) node.id = o.id;
  if (o.name) node.name = o.name;
  if (o.value !== undefined) node.value = o.value;
  if (o.disabled) node.disabled = true;
  if (o.required) node.required = true;
  if (o.readOnly && !(node instanceof HTMLSelectElement)) node.readOnly = true;
  if (o.placeholder && !(node instanceof HTMLSelectElement)) node.placeholder = o.placeholder;
  if (o.invalid) node.setAttribute('aria-invalid', 'true');
  if (o.ariaLabel) node.setAttribute('aria-label', o.ariaLabel);
  if (o.onInput) node.addEventListener('input', (e) => o.onInput!(node.value, e));
  if (o.onChange) node.addEventListener('change', (e) => o.onChange!(node.value, e));
}

export function input(options: InputOptions = {}): HTMLInputElement {
  const node = el('input', { type: options.type ?? 'text', className: cx('kdl-ui-input', options.className) });
  if (options.min !== undefined) node.min = String(options.min);
  if (options.max !== undefined) node.max = String(options.max);
  if (options.step !== undefined) node.step = String(options.step);
  if (options.autocomplete) node.autocomplete = options.autocomplete as AutoFill;
  applyControlOptions(node, options);
  return node;
}
