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
  '.user-header__manage': {
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
  '.user-header__manage:hover': {
    color: '#c084fc !important',
    textShadow: '0 0 10px rgba(192, 132, 252, 0.8), 0 1px 4px rgba(0, 0, 0, 0.9) !important',
    transform: 'translateY(-1px) !important',
    background: 'transparent !important',
    border: 'none !important',
    boxShadow: 'none !important',
    outline: 'none !important',
  },
  '.user-header__manage span': {
    fontFamily: 'Helvetica, sans-serif !important',
    fontSize: 'inherit !important',
    fontWeight: '700 !important',
    color: 'inherit !important',
    textShadow: 'inherit !important',
  },

  /* UserScript 2-Column Action Panel (kit buttons inside a .kdl-scope group) */
  '@media (min-width: 850px)': {
    '.post__header': {
      position: 'relative !important',
    },
    '.post__info': {
      paddingRight: '400px !important',
    },
    '.kdl-scope.kdl-actions-container': {
      position: 'absolute',
      top: '15px',
      right: '15px',
      width: '380px',
    },
  },
  '.kdl-scope.kdl-actions-container': {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginTop: '12px',
  },
  '@media (max-width: 849px)': {
    '.kdl-scope.kdl-actions-container': {
      width: '100%',
    },
  },
  '.kdl-actions-container .kdl-actions-col': {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  '.kdl-actions-container .kdl-ui-btn': {
    width: '100%',
  },
  // Queued / running: the queue disables the button and writes its status as the label
  '.kdl-scope .kdl-ui-btn[data-is-queued], .kdl-scope .kdl-ui-btn[data-is-downloading]': {
    opacity: 0.7,
  },
  '.post__flag:focus-visible, .post__fav:focus-visible, #kdl-author-manager-btn:focus-visible': {
    boxShadow: '0 0 0 3px rgba(56, 189, 248, 0.5) !important',
  },
});
