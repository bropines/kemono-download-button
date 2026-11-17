import { el } from '../../../utils/dom';
import { cx } from '../utils';

export interface KbdOptions {
  className?: string;
}

/** One key ("Esc") or a combo (["Ctrl", "K"]) rendered as <kbd> elements. */
export function kbd(keys: string | string[], options: KbdOptions = {}): HTMLElement {
  const list = Array.isArray(keys) ? keys : [keys];
  if (list.length === 1) return el('kbd', { className: cx('kdl-ui-kbd', options.className), textContent: list[0] });
  return el(
    'kbd',
    { className: cx('kdl-ui-kbd-group', options.className) },
    list.map((key) => el('kbd', { className: 'kdl-ui-kbd', textContent: key }))
  );
}
