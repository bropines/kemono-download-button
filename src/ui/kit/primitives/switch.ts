import { el } from '../../../utils/dom';
import { cx } from '../utils';

export interface SwitchOptions {
  id?: string;
  checked?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  onChange?: (checked: boolean) => void;
}

/** role="switch" button; read state with isSwitchOn(), set it with setSwitch(). */
export function switchControl(options: SwitchOptions = {}): HTMLButtonElement {
  const node = el(
    'button',
    { type: 'button', className: cx('kdl-ui-switch', options.className), disabled: !!options.disabled },
    [el('span', { className: 'kdl-ui-switch__thumb' })]
  );
  node.setAttribute('role', 'switch');
  if (options.id) node.id = options.id;
  if (options.ariaLabel) node.setAttribute('aria-label', options.ariaLabel);
  setSwitch(node, !!options.checked);
  node.addEventListener('click', () => {
    setSwitch(node, !isSwitchOn(node));
    options.onChange?.(isSwitchOn(node));
  });
  return node;
}

export function isSwitchOn(node: HTMLElement): boolean {
  return node.getAttribute('aria-checked') === 'true';
}

export function setSwitch(node: HTMLElement, checked: boolean): void {
  node.setAttribute('aria-checked', String(checked));
  node.dataset.state = checked ? 'checked' : 'unchecked';
}
