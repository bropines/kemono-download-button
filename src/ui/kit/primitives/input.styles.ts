import { css } from '../../../utils/cssBuilder';

/** Look shared by input, textarea and select. */
export const controlBase = {
  display: 'flex',
  width: '100%',
  height: '36px',
  padding: '4px 12px',
  border: '1px solid var(--kdl-input)',
  borderRadius: 'calc(var(--kdl-radius) - 2px)',
  background: 'transparent',
  color: 'var(--kdl-foreground)',
  fontSize: '14px',
  lineHeight: '20px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

export const controlStates = (sel: string) => ({
  [`${sel}::placeholder`]: { color: 'var(--kdl-muted-foreground)', opacity: 1 },
  [`${sel}:focus-visible`]: {
    outline: 'none',
    borderColor: 'var(--kdl-ring)',
    boxShadow: '0 0 0 1px var(--kdl-ring)',
  },
  [`${sel}:disabled`]: { cursor: 'not-allowed', opacity: 0.5 },
  [`${sel}[aria-invalid="true"]`]: { borderColor: 'var(--kdl-danger)' },
  [`${sel}[aria-invalid="true"]:focus-visible`]: { boxShadow: '0 0 0 1px var(--kdl-danger)' },
});

export const inputStyles = css({
  '.kdl-ui-input': controlBase,
  ...controlStates('.kdl-ui-input'),
  '.kdl-ui-input[type="file"]': { padding: '6px 12px', fontSize: '13px' },
  '.kdl-ui-input::file-selector-button': {
    border: 0,
    background: 'transparent',
    color: 'var(--kdl-foreground)',
    fontWeight: 500,
    marginRight: '8px',
  },
});
