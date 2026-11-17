import { css } from '../../utils/cssBuilder';

// Legacy `kdl-icon` markup (iconSvg()) still rendered outside the kit, e.g. the favourite spinner
export const iconStyles = css({
  '@keyframes kdl-spin': {
    to: { transform: 'rotate(360deg)' },
  },
  '.kdl-icon': {
    display: 'inline-block',
    width: '1em',
    height: '1em',
    flexShrink: 0,
    verticalAlign: '-0.125em',
  },
  '.kdl-spin': {
    animation: 'kdl-spin 0.9s linear infinite',
  },
  // A kit button whose icon was swapped for legacy markup (toggleFavorite) keeps the kit's icon size
  '.kdl-ui-btn svg.kdl-icon': {
    width: '16px',
    height: '16px',
    verticalAlign: 'middle',
  },
});
