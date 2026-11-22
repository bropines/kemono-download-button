import { css } from '../../../utils/cssBuilder';

export const skeletonStyles = css({
  '.kdl-ui-skeleton': {
    display: 'block',
    flex: '0 0 auto',
    borderRadius: 'var(--kdl-radius)',
    background: 'linear-gradient(90deg, var(--kdl-muted) 0%, color-mix(in srgb, var(--kdl-muted) 55%, var(--kdl-foreground) 8%) 50%, var(--kdl-muted) 100%) 0 0 / 200% 100%',
    animation: 'kdl-ui-skeleton-shimmer 1.4s ease-in-out infinite',
  },
  '.kdl-ui-skeleton--pill': { borderRadius: '9999px' },
  '@keyframes kdl-ui-skeleton-shimmer': {
    from: { backgroundPosition: '100% 0' },
    to: { backgroundPosition: '-100% 0' },
  },
  '@media (prefers-reduced-motion: reduce)': {
    '.kdl-ui-skeleton': { animation: 'none' },
  },
});
