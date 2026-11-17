import { css } from '../../../utils/cssBuilder';

export const progressStyles = css({
  '.kdl-ui-progress': {
    position: 'relative',
    width: '100%',
    height: '8px',
    overflow: 'hidden',
    borderRadius: '9999px',
    background: 'color-mix(in srgb, var(--kdl-primary) 20%, transparent)',
  },
  '.kdl-ui-progress__indicator': {
    width: '100%',
    height: '100%',
    background: 'var(--kdl-primary)',
    transition: 'transform 0.3s ease',
  },
  '.kdl-ui-progress[data-state="indeterminate"] .kdl-ui-progress__indicator': {
    width: '40%',
    animation: 'kdl-ui-progress-slide 1.2s ease-in-out infinite',
  },
  '@keyframes kdl-ui-progress-slide': {
    from: { transform: 'translateX(-100%)' },
    to: { transform: 'translateX(250%)' },
  },
});
