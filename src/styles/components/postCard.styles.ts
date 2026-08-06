import { css } from '../../utils/cssBuilder';
import { THEME } from '../theme';

export const postCardStyles = css({
  '.user-card, .post-card': {
    position: 'relative !important',
  },
  '.post-card .post-card-download-controls': {
    position: 'absolute',
    top: '5px',
    right: '5px',
    display: 'none',
    flexDirection: 'column',
    gap: '4px',
    backgroundColor: '#282828d9',
    padding: '5px',
    borderRadius: THEME.borderRadius.sm,
    zIndex: 10,
    border: '1px solid rgba(255,255,255,.1)',
  },
  '.post-card:hover .post-card-download-controls': {
    display: 'flex',
  },
  '.post-card .post-card-download-controls button': {
    padding: '4px 8px',
    fontSize: '.8em',
    minWidth: '65px',
    margin: 0,
    border: 'none',
    borderRadius: THEME.borderRadius.xs,
    color: '#fff',
    cursor: 'pointer',
    textAlign: 'center',
    opacity: 0.9,
    transition: 'opacity .2s, background-color .2s',
  },
  '.post-card .post-card-download-controls button:hover': {
    opacity: 1,
  },
  '.post-card .post-card-dl-zip': {
    backgroundColor: THEME.colors.success,
  },
  '.post-card .post-card-dl-zip:hover': {
    backgroundColor: THEME.colors.successDark,
  },
  '.post-card .post-card-dl-img': {
    backgroundColor: THEME.colors.info,
  },
  '.post-card .post-card-dl-img:hover': {
    backgroundColor: THEME.colors.infoDark,
  },
  '.post-card .post-card-dl-att': {
    backgroundColor: THEME.colors.warning,
    color: '#212529 !important',
  },
  '.post-card .post-card-dl-att:hover': {
    backgroundColor: THEME.colors.warningDark,
  },
  '.post-card .post-card-dl-pick': {
    backgroundColor: THEME.colors.purple,
  },
  '.post-card .post-card-dl-pick:hover': {
    backgroundColor: THEME.colors.purpleDark,
  },
  '.post-card .post-card-dl-info': {
    backgroundColor: THEME.colors.secondary,
  },
  '.post-card .post-card-dl-info:hover': {
    backgroundColor: THEME.colors.secondaryDark,
  },
  '.post-card .post-card-download-controls button:disabled, .post__actions button[data-is-downloading=true], .post__actions button[data-is-queued=true]': {
    opacity: '0.6 !important',
    cursor: 'not-allowed !important',
  },
  '.post-card .post-card-download-controls button[data-is-queued=true], .post__actions button[data-is-queued=true]': {
    backgroundColor: `${THEME.colors.orange} !important`,
  },
  '.post-card .post-card-download-controls button[data-is-downloading=true], .post__actions button[data-is-downloading=true]': {
    backgroundColor: `${THEME.colors.secondary} !important`,
  },
  '.kdl-post-checkbox': {
    position: 'absolute',
    top: '5px',
    left: '5px',
    zIndex: 11,
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    padding: '5px',
    margin: 0,
    backgroundClip: 'content-box',
  },
  '.kdl-quick-fav-btn': {
    position: 'absolute',
    top: '8px',
    right: '8px',
    zIndex: 12,
    background: '#141414b3',
    border: '1px solid rgba(255,255,255,.2)',
    color: '#fff',
    borderRadius: THEME.borderRadius.sm,
    width: '28px',
    height: '28px',
    fontSize: '16px',
    lineHeight: 1,
    padding: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform .2s, color .2s, opacity .2s',
    opacity: 0,
    pointerEvents: 'none',
  },
  '.user-card:hover .kdl-quick-fav-btn, .post-card:hover .kdl-quick-fav-btn': {
    opacity: 0.9,
    pointerEvents: 'auto',
  },
  '.kdl-quick-fav-btn:hover': {
    opacity: 1,
    transform: 'scale(1.1)',
  },
  '.kdl-quick-fav-btn.kdl-favorited': {
    color: '#ffeb3b',
  },
  '.kdl-quick-fav-btn:disabled': {
    cursor: 'wait',
    color: '#888',
  },
  '.kdl-post-info-tooltip': {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    backgroundColor: '#1a1a1a',
    color: '#f0f0f0',
    padding: '8px',
    borderRadius: THEME.borderRadius.sm,
    border: `1px solid ${THEME.colors.borderLight}`,
    zIndex: THEME.zIndex.dropdown,
    width: '200px',
    fontSize: '.85em',
    display: 'none',
    pointerEvents: 'none',
    boxShadow: '0 3px 10px #00000080',
  },
});
