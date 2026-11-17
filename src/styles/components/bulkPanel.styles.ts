import { css } from '../../utils/cssBuilder';

/** Kit shadow root: the floating bulk-selection bar at the bottom of the dock. */
export const bulkPanelStyles = css({
  '.kdl-ov-bulkbar': {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    maxWidth: '100%',
    padding: '8px 12px',
    border: '1px solid var(--kdl-border)',
    borderRadius: 'calc(var(--kdl-radius) + 4px)',
    background: 'var(--kdl-background)',
    color: 'var(--kdl-foreground)',
    boxShadow: 'var(--kdl-shadow)',
    opacity: 0,
    visibility: 'hidden',
    transform: 'translateY(16px)',
    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease, visibility 0s linear 0.3s',
  },
  '.kdl-ov-bulkbar[data-state="open"]': {
    pointerEvents: 'auto',
    opacity: 1,
    visibility: 'visible',
    transform: 'none',
    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease',
  },
  '.kdl-ov-bulkbar__sep': { width: '1px', height: '24px', background: 'var(--kdl-border)' },
  '.kdl-ov-bulkbar .kdl-ui-select': { width: 'auto', height: '32px' },
  '@media (max-width: 600px)': {
    '.kdl-ov-bulkbar': { gap: '6px', padding: '8px' },
    '.kdl-ov-bulkbar__sep': { display: 'none' },
  },
});
