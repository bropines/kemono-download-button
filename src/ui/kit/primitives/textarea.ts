import { el } from '../../../utils/dom';
import { cx } from '../utils';
import { applyControlOptions, type ControlOptions } from './input';

export interface TextareaOptions extends ControlOptions {
  rows?: number;
  /** CSS resize value (default "vertical"). */
  resize?: 'none' | 'vertical' | 'both';
}

export function textarea(options: TextareaOptions = {}): HTMLTextAreaElement {
  const node = el('textarea', { className: cx('kdl-ui-textarea', options.className), rows: options.rows ?? 3 });
  if (options.resize) node.style.resize = options.resize;
  applyControlOptions(node, options);
  return node;
}
