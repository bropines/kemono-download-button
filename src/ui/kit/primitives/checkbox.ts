import { el } from '../../../utils/dom';
import { cx } from '../utils';

export interface CheckboxOptions {
  id?: string;
  name?: string;
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  onChange?: (checked: boolean, event: Event) => void;
}

/** Native checkbox (keeps form + keyboard behaviour), drawn shadcn-style. Pair with field() for a label. */
export function checkbox(options: CheckboxOptions = {}): HTMLInputElement {
  const node = el('input', {
    type: 'checkbox',
    className: cx('kdl-ui-checkbox', options.className),
    checked: !!options.checked,
    disabled: !!options.disabled,
  });
  node.indeterminate = !!options.indeterminate;
  if (options.id) node.id = options.id;
  if (options.name) node.name = options.name;
  if (options.ariaLabel) node.setAttribute('aria-label', options.ariaLabel);
  if (options.onChange) node.addEventListener('change', (e) => options.onChange!(node.checked, e));
  return node;
}
