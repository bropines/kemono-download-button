import { css } from '../../../utils/cssBuilder';

export const switchStyles = css({
  '.kdl-ui-switch': {
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
    width: '36px',
    height: '20px',
    border: '2px solid transparent',
    borderRadius: '9999px',
    background: 'var(--kdl-input)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  '.kdl-ui-switch[aria-checked="true"]': { background: 'var(--kdl-primary)' },
  '.kdl-ui-switch:disabled': { cursor: 'not-allowed', opacity: 0.5 },
  '.kdl-ui-switch__thumb': {
    display: 'block',
    width: '16px',
    height: '16px',
    borderRadius: '9999px',
    background: 'var(--kdl-background)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    pointerEvents: 'none',
    transition: 'transform 0.15s',
  },
  '.kdl-ui-switch[aria-checked="true"] .kdl-ui-switch__thumb': { transform: 'translateX(16px)' },
});
