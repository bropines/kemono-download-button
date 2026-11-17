import { el } from '../../../utils/dom';
import { cx } from '../utils';

export interface SliderOptions {
  id?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  disabled?: boolean;
  ariaLabel?: string;
  /** Show the current value next to the track; a function formats it. */
  showValue?: boolean | ((value: number) => string);
  className?: string;
  onInput?: (value: number) => void;
  onChange?: (value: number) => void;
}

/** Native range input with a filled track. Returns a wrapper; the input is `.kdl-ui-slider__input`. */
export function slider(options: SliderOptions = {}): HTMLDivElement {
  const { min = 0, max = 100, step = 1 } = options;
  const range = el('input', { type: 'range', className: 'kdl-ui-slider__input', disabled: !!options.disabled });
  range.min = String(min);
  range.max = String(max);
  range.step = String(step);
  range.value = String(options.value ?? min);
  if (options.id) range.id = options.id;
  if (options.ariaLabel) range.setAttribute('aria-label', options.ariaLabel);

  const format = typeof options.showValue === 'function' ? options.showValue : (v: number) => String(v);
  const output = options.showValue ? el('output', { className: 'kdl-ui-slider__value' }) : null;
  const sync = () => {
    const value = Number(range.value);
    range.style.setProperty('--kdl-ui-fill', `${((value - min) / (max - min || 1)) * 100}%`);
    if (output) output.textContent = format(value);
  };
  range.addEventListener('input', () => {
    sync();
    options.onInput?.(Number(range.value));
  });
  if (options.onChange) range.addEventListener('change', () => options.onChange!(Number(range.value)));
  sync();
  return el('div', { className: cx('kdl-ui-slider', options.className) }, [range, output]);
}
