import { el } from '../../../utils/dom';
import { createModal } from '../behaviors/modal';
import { cx } from '../utils';
import { buildPanel, type DialogHandle, type DialogOptions } from './dialog';

export interface SheetOptions extends Omit<DialogOptions, 'size'> {
  side?: 'left' | 'right' | 'bottom' | 'top';
}

/** Modal panel sliding in from a screen edge. Same handle and behaviour as dialog(). */
export function sheet(options: SheetOptions): DialogHandle {
  const element = el('div', {
    className: cx('kdl-ui-sheet', `kdl-ui-sheet--${options.side ?? 'right'}`, options.className),
  });
  const modal = createModal(element, options);
  const { body, footer } = buildPanel(element, options, modal.close);
  return { ...modal, element, body, footer };
}
