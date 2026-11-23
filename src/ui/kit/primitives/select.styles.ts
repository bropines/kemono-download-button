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
  // Customizable select (Chrome 135+): the open list is styled like a popover menu; other engines keep theirs
  '@supports (appearance: base-select)': {
    '.kdl-ui-select, .kdl-ui-select::picker(select)': { appearance: 'base-select' },
    '.kdl-ui-select': { display: 'flex', alignItems: 'center' },
    '.kdl-ui-select::picker-icon': { display: 'none' },
    '.kdl-ui-select::picker(select)': {
      marginBlock: '4px',
      padding: '4px',
      border: '1px solid var(--kdl-border)',
      borderRadius: 'var(--kdl-radius)',
      background: 'var(--kdl-popover)',
      color: 'var(--kdl-popover-foreground)',
      boxShadow: 'var(--kdl-shadow)',
      maxHeight: 'min(320px, calc(60 * var(--kdl-vh, 1vh)))',
      overflowY: 'auto',
      scrollbarWidth: 'thin',
    },
    '.kdl-ui-select option': {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      minHeight: '32px',
      padding: '6px 8px',
      borderRadius: 'calc(var(--kdl-radius) - 2px)',
      background: 'transparent',
      fontSize: '14px',
      cursor: 'pointer',
    },
    '.kdl-ui-select option:is(:hover, :focus-visible)': { background: 'var(--kdl-accent)', color: 'var(--kdl-accent-foreground)', outline: 'none' },
    '.kdl-ui-select option:checked': { fontWeight: 500 },
    '.kdl-ui-select option::checkmark': { order: 1, marginLeft: 'auto', color: 'var(--kdl-primary)' },
    '.kdl-ui-select option:disabled': { opacity: 0.5, cursor: 'default' },
  },
});
