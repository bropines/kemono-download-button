import { css } from '../../utils/cssBuilder';
import { THEME } from '../theme';

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
  // Lucide icons are strokes; older rules fill every svg inside action buttons
  '.kui-action-btn svg.kdl-icon, .kui-lightbox-top-actions .kui-action-btn svg.kdl-icon': {
    fill: 'none',
  },
  '.kdl-quick-fav-btn.kdl-favorited svg': {
    fill: 'currentColor',
  },

  '.kui-translate-btn': {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '26px',
    height: '26px',
    marginLeft: '8px',
    padding: 0,
    border: `1px solid ${THEME.colors.borderSubtle}`,
    borderRadius: THEME.borderRadius.full,
    background: 'transparent',
    color: THEME.colors.textMuted,
    fontSize: '14px',
    lineHeight: 1,
    verticalAlign: 'middle',
    cursor: 'pointer',
    transition: 'color 0.2s, border-color 0.2s',
  },
  '.kui-translate-btn:hover:not(:disabled), .kui-translate-btn[data-state="translated"]': {
    borderColor: THEME.colors.primary,
    color: THEME.colors.primary,
  },
  '.kui-translate-btn:disabled': {
    cursor: 'wait',
  },
});
