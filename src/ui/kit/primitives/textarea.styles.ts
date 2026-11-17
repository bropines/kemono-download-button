import { css } from '../../../utils/cssBuilder';
import { controlBase, controlStates } from './input.styles';

export const textareaStyles = css({
  '.kdl-ui-textarea': {
    ...controlBase,
    height: 'auto',
    minHeight: '60px',
    padding: '8px 12px',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  ...controlStates('.kdl-ui-textarea'),
});
