import { css } from '../../utils/cssBuilder';
import { THEME } from '../theme';

export const bulkPanelStyles = css({
  '#kdl-bulk-panel': {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%) translateY(140%)',
    opacity: 0,
    pointerEvents: 'none',
    backgroundColor: THEME.colors.bgDark,
    padding: '10px 20px',
    borderRadius: '30px',
    zIndex: THEME.zIndex.bulkPanel,
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${THEME.colors.borderDark}`,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    WebkitBackdropFilter: 'blur(12px)',
    backdropFilter: 'blur(12px)',
    transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
  },
  '#kdl-bulk-panel.kdl-visible': {
    transform: 'translateX(-50%) translateY(0)',
    opacity: 1,
    pointerEvents: 'auto',
  },
  '#kdl-bulk-panel button': {
    padding: '8px 14px',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '.9em',
    fontWeight: '500',
    color: '#fff',
    transition: 'background-color .2s, transform .1s',
  },
  '#kdl-bulk-panel button:active': {
    transform: 'scale(0.96)',
  },
  '#kdl-bulk-download-btn': {
    backgroundColor: THEME.colors.success,
  },
  '#kdl-bulk-download-btn:hover': {
    filter: 'brightness(1.15)',
  },
  '#kdl-bulk-download-btn:disabled': {
    backgroundColor: 'var(--colour0-tertirary, #555)',
    cursor: 'not-allowed',
    opacity: 0.7,
  },
  '#kdl-bulk-select-all': {
    backgroundColor: THEME.colors.primary,
    color: 'var(--colour1-primary, #17191a)',
  },
  '#kdl-bulk-select-all:hover': {
    filter: 'brightness(1.15)',
  },
  '#kdl-bulk-deselect-all': {
    backgroundColor: THEME.colors.danger,
  },
  '#kdl-bulk-deselect-all:hover': {
    filter: 'brightness(1.15)',
  },
});
