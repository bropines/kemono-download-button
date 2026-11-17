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
  /* Ensure injected sidebar & header buttons match native site cursor */
  '#kdl-settings-btn-sidebar, #kui-settings-btn-sidebar, #kdl-settings-btn-header, #kui-settings-btn-header': {
    cursor: 'pointer !important',
  },
});
