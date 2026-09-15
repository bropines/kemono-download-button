import { css } from '../../utils/cssBuilder';
import { THEME } from '../theme';

export const postActionsStyles = css({
  '.post__actions': {
    display: 'flex !important',
    flexWrap: 'wrap !important',
    gap: '8px !important',
    alignItems: 'center !important',
    marginTop: '8px !important',
    padding: '0 !important',
  },
  '.post__actions > *': {
    margin: '0 !important',
  },
  '.post__flag, .post__fav': {
    padding: '6px 14px !important',
    borderRadius: `${THEME.borderRadius.sm} !important`,
    fontSize: '0.88em !important',
    fontWeight: '600 !important',
    lineHeight: '1.3 !important',
    cursor: 'pointer !important',
    transition: 'all 0.2s ease !important',
    boxShadow: `${THEME.shadows.subtle} !important`,
    display: 'inline-flex !important',
    alignItems: 'center !important',
    gap: '6px !important',
    outline: 'none !important',
    textShadow: 'none !important',
    opacity: '1 !important',
  },
  '.post__flag, .post__flag span, .post__flag-icon': {
    color: '#f1f5f9 !important',
  },
  '.post__flag': {
    backgroundColor: `${THEME.colors.nordBg} !important`,
    border: `1px solid ${THEME.colors.nordBorder} !important`,
  },
  '.post__flag .post__flag-icon': {
    color: `${THEME.colors.danger} !important`,
  },
  '.post__flag:hover': {
    backgroundColor: `${THEME.colors.dangerDark} !important`,
    borderColor: `${THEME.colors.dangerDark} !important`,
    transform: 'translateY(-1px) !important',
    boxShadow: '0 4px 10px rgba(220, 53, 69, 0.35) !important',
    outline: 'none !important',
    textShadow: 'none !important',
  },
  '.post__flag:hover, .post__flag:hover span, .post__flag:hover .post__flag-icon': {
    color: '#ffffff !important',
  },
  '.post__fav, .post__fav span, .post__fav-icon': {
    color: '#f1f5f9 !important',
  },
  '.post__fav': {
    backgroundColor: `${THEME.colors.nordBg} !important`,
    border: `1px solid ${THEME.colors.nordBorder} !important`,
  },
  '.post__fav .post__fav-icon': {
    color: '#fbbf24 !important',
  },
  '.post__fav:hover': {
    backgroundColor: `${THEME.colors.warning} !important`,
    borderColor: `${THEME.colors.warning} !important`,
    transform: 'translateY(-1px) !important',
    boxShadow: '0 4px 10px rgba(255, 193, 7, 0.35) !important',
    outline: 'none !important',
    textShadow: 'none !important',
  },
  '.post__fav:hover, .post__fav:hover span, .post__fav:hover .post__fav-icon': {
    color: '#111827 !important',
  },
  '.user-header__manage, #kdl-author-manager-btn': {
    display: 'inline-flex !important',
    alignItems: 'center !important',
    justifyContent: 'center !important',
    gap: '0.4rem !important',
    background: 'transparent !important',
    border: 'none !important',
    outline: 'none !important',
    padding: '0 !important',
    margin: '0 !important',
    fontFamily: 'Helvetica, sans-serif !important',
    fontSize: '1.1rem !important',
    fontWeight: '700 !important',
    color: '#f1f5f9 !important',
    textShadow: '0 1px 4px rgba(0, 0, 0, 0.9), 0 2px 8px rgba(0, 0, 0, 0.8) !important',
    cursor: 'pointer !important',
    transition: 'color 0.2s ease, transform 0.1s ease !important',
    textDecoration: 'none !important',
    boxShadow: 'none !important',
    borderRadius: '0 !important',
    height: 'auto !important',
  },
  '.user-header__manage:hover, #kdl-author-manager-btn:hover': {
    color: '#c084fc !important',
    textShadow: '0 0 10px rgba(192, 132, 252, 0.8), 0 1px 4px rgba(0, 0, 0, 0.9) !important',
    transform: 'translateY(-1px) !important',
    background: 'transparent !important',
    border: 'none !important',
    boxShadow: 'none !important',
    outline: 'none !important',
  },
  '.user-header__manage span, #kdl-author-manager-btn span': {
    fontFamily: 'Helvetica, sans-serif !important',
    fontSize: 'inherit !important',
    fontWeight: '700 !important',
    color: 'inherit !important',
    textShadow: 'inherit !important',
  },

  /* UserScript 2-Column Action Panel */
  '@media (min-width: 850px)': {
    '.post__header': {
      position: 'relative !important',
    },
    '.post__info': {
      paddingRight: '400px !important',
    },
    '.kdl-actions-container': {
      position: 'absolute !important',
      top: '15px !important',
      right: '15px !important',
      display: 'grid !important',
      gridTemplateColumns: '1fr 1fr !important',
      gap: '10px !important',
      width: '380px !important',
    },
  },

  '@media (max-width: 849px)': {
    '.kdl-actions-container': {
      display: 'grid !important',
      gridTemplateColumns: '1fr 1fr !important',
      gap: '8px !important',
      marginTop: '12px !important',
      width: '100% !important',
    },
  },

  '.kdl-actions-col': {
    display: 'flex !important',
    flexDirection: 'column !important',
    gap: '8px !important',
  },

  '.kdl-button': {
    padding: '7px 12px !important',
    border: 'none !important',
    borderRadius: `${THEME.borderRadius.md} !important`,
    cursor: 'pointer !important',
    fontSize: '0.86rem !important',
    fontWeight: '600 !important',
    lineHeight: '1.3 !important',
    color: '#fff !important',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2) !important',
    width: '100% !important',
    boxSizing: 'border-box !important',
    display: 'inline-flex !important',
    alignItems: 'center !important',
    justifyContent: 'center !important',
    gap: '5px !important',
    outline: 'none !important',
    textShadow: 'none !important',
    transition: 'opacity 0.2s ease, transform 0.15s ease, filter 0.2s ease !important',
  },
  // outline is suppressed above; keep a visible ring for keyboard users
  '.kdl-button:focus-visible, .post__flag:focus-visible, .post__fav:focus-visible, #kdl-author-manager-btn:focus-visible': {
    boxShadow: '0 0 0 3px rgba(56, 189, 248, 0.5) !important',
  },
  '.kdl-button:hover': {
    opacity: '0.95 !important',
    filter: 'brightness(1.1) !important',
    transform: 'translateY(-1px) !important',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3) !important',
  },
  '.kdl-button:active': {
    transform: 'translateY(0) !important',
  },
});
