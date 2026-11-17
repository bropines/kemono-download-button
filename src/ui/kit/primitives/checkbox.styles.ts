import { css } from '../../../utils/cssBuilder';

export const checkboxStyles = css({
  '.kdl-ui-checkbox': {
    appearance: 'none',
    WebkitAppearance: 'none',
    flexShrink: 0,
    width: '16px',
    height: '16px',
    margin: 0,
    border: '1px solid var(--kdl-primary)',
    borderRadius: '4px',
    background: 'transparent',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  '.kdl-ui-checkbox:checked, .kdl-ui-checkbox:indeterminate': {
    background: 'var(--kdl-primary)',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: '12px',
  },
  '.kdl-ui-checkbox:checked': { backgroundImage: 'var(--kdl-check)' },
  '.kdl-ui-checkbox:indeterminate': { backgroundImage: 'var(--kdl-dash)' },
  '.kdl-ui-checkbox:disabled': { cursor: 'not-allowed', opacity: 0.5 },
});
