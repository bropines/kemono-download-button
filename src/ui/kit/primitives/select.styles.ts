import { css } from '../../../utils/cssBuilder';
import { controlBase, controlStates } from './input.styles';

export const selectStyles = css({
  '.kdl-ui-select': {
    ...controlBase,
    appearance: 'none',
    WebkitAppearance: 'none',
    paddingRight: '32px',
    backgroundImage: 'var(--kdl-chevron)',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    backgroundSize: '16px',
    cursor: 'pointer',
    textOverflow: 'ellipsis',
  },
  ...controlStates('.kdl-ui-select'),
  '.kdl-ui-select option': { background: 'var(--kdl-popover)', color: 'var(--kdl-popover-foreground)' },
});
