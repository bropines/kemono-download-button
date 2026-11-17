import { css } from '../../../utils/cssBuilder';
import { LAYERS } from '../layers';

export const popoverStyles = css({
  '.kdl-ui-popover': {
    position: 'fixed',
    zIndex: LAYERS.popover,
    width: '288px',
    maxWidth: 'calc(100vw - 16px)',
    maxHeight: 'calc(100vh - 16px)',
    overflowY: 'auto',
    padding: '16px',
    border: '1px solid var(--kdl-border)',
    borderRadius: 'calc(var(--kdl-radius) - 2px)',
    background: 'var(--kdl-popover)',
    color: 'var(--kdl-popover-foreground)',
    boxShadow: 'var(--kdl-shadow)',
    outline: 'none',
    animation: 'kdl-ui-pop-in 0.12s ease-out',
  },
});
