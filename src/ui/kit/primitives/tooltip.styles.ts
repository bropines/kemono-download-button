import { css } from '../../../utils/cssBuilder';
import { LAYERS } from '../layers';

export const tooltipStyles = css({
  '.kdl-ui-tooltip': {
    position: 'fixed',
    zIndex: LAYERS.tooltip,
    maxWidth: '280px',
    padding: '6px 12px',
    borderRadius: 'calc(var(--kdl-radius) - 2px)',
    background: 'var(--kdl-primary)',
    color: 'var(--kdl-primary-foreground)',
    fontSize: '12px',
    lineHeight: 1.4,
    pointerEvents: 'none',
    overflowWrap: 'break-word',
    animation: 'kdl-ui-fade-in 0.1s ease-out',
  },
});
