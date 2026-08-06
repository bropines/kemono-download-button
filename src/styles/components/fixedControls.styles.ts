import { css } from '../../utils/cssBuilder';
import { THEME } from '../theme';

export const fixedControlsStyles = css({
  '#kdl-fixed-controls': {
    position: 'fixed',
    bottom: '15px',
    right: '15px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px',
    zIndex: THEME.zIndex.fixedControls,
  },
  '#kdl-queue-indicator': {
    backgroundColor: '#000000b3',
    color: '#fff',
    padding: '5px 10px',
    borderRadius: THEME.borderRadius.sm,
    fontSize: '.9em',
    boxShadow: '0 1px 5px #0000004d',
  },
  '#kdl-settings-btn': {
    backgroundColor: THEME.colors.info,
    color: '#fff',
    border: 'none',
    padding: '8px',
    borderRadius: THEME.borderRadius.full,
    cursor: 'pointer',
    fontSize: '1.2em',
    lineHeight: 1,
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 5px #0000004d',
  },
  '#kdl-settings-btn:hover': {
    backgroundColor: THEME.colors.infoDark,
  },

  /* Navigation Sidebar & Header Settings Items */
  '.kdl-sidebar-link, #kdl-settings-btn-sidebar, #kui-settings-btn-sidebar': {
    display: 'flex !important',
    alignItems: 'center !important',
    padding: '8px 12px !important',
    borderRadius: '6px !important',
    transition: 'all 0.2s ease !important',
    color: '#cbd5e1 !important',
    textDecoration: 'none !important',
    lineHeight: '1.25 !important',
    whiteSpace: 'normal !important',
  },
  '.kdl-sidebar-link:hover, #kdl-settings-btn-sidebar:hover, #kui-settings-btn-sidebar:hover': {
    backgroundColor: 'rgba(56, 189, 248, 0.16) !important',
    color: '#38bdf8 !important',
    transform: 'translateX(2px)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  '.header-link.kdl-settings-header-link, .header-link.kui-settings-header-link': {
    display: 'inline-flex !important',
    alignItems: 'center !important',
    padding: '4px 10px !important',
    borderRadius: '4px !important',
    cursor: 'pointer !important',
    transition: 'all 0.2s ease !important',
    userSelect: 'none',
  },
  '.header-link.kdl-settings-header-link:hover, .header-link.kui-settings-header-link:hover': {
    backgroundColor: 'rgba(56, 189, 248, 0.2) !important',
    color: '#38bdf8 !important',
    textShadow: '0 0 8px rgba(56, 189, 248, 0.5)',
  },
});
