import { el } from '../../../utils/dom';
import { cx } from '../utils';
import { applyControlOptions, type ControlOptions } from './input';

export type SelectOption = string | { value: string; label?: string; disabled?: boolean };

export interface SelectOptions extends ControlOptions {
  options: SelectOption[];
}

/** Native <select> styled like shadcn's trigger; keeps native keyboard and mobile pickers. */
export function select(options: SelectOptions): HTMLSelectElement {
  const node = el(
    'select',
    { className: cx('kdl-ui-select', options.className) },
    options.options.map((opt) => {
      const o = typeof opt === 'string' ? { value: opt } : opt;
      return el('option', { value: o.value, textContent: o.label ?? o.value, disabled: !!o.disabled });
    })
  );
  applyControlOptions(node, options);
  return node;
}
