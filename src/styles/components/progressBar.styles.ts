import { css } from '../../utils/cssBuilder';
import { THEME } from '../theme';

export const progressBarStyles = css({
  '#kdl-progress-container': {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translate(-50%)',
    width: '80vw',
    maxWidth: '800px',
    maxHeight: '40vh',
    overflowY: 'auto',
    zIndex: THEME.zIndex.lightboxNav,
    display: 'flex',
    flexDirection: 'column-reverse',
    gap: '8px',
    paddingBottom: '10px',
  },
  '.kdl-progress-task': {
    backgroundColor: '#282b30e6',
    WebkitBackdropFilter: 'blur(5px)',
    backdropFilter: 'blur(5px)',
    color: '#f0f0f0',
    borderRadius: THEME.borderRadius.md,
    padding: '8px 12px',
    boxShadow: '0 2px 8px #0000004d',
    border: '1px solid rgba(255,255,255,.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  '.kdl-task-header': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: '700',
  },
  '.kdl-task-title': {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '.95em',
  },
  '.kdl-task-status': {
    fontSize: '.85em',
    color: '#ccc',
  },
  '.kdl-task-files': {
    maxHeight: '150px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    paddingRight: '5px',
  },
  '.kdl-progress-bar-wrapper': {
    width: '100%',
  },
  '.kdl-progress-bar-label': {
    color: '#ddd',
    fontSize: '.8em',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginBottom: '2px',
  },
  '.kdl-progress-bar-label.kdl-success': {
    color: THEME.colors.success,
  },
  '.kdl-progress-bar-label.kdl-error': {
    color: THEME.colors.danger,
  },
  '.kdl-progress-bar': {
    width: '100%',
    height: '8px',
    backgroundColor: '#555',
    borderRadius: THEME.borderRadius.sm,
    overflow: 'hidden',
  },
  '.kdl-progress-bar-inner': {
    width: '0%',
    height: '100%',
    backgroundColor: THEME.colors.info,
    transition: 'width .1s linear, background-color .3s',
  },
  '.kdl-progress-bar-inner.kdl-success': {
    backgroundColor: `${THEME.colors.success} !important`,
  },
  '.kdl-progress-bar-inner.kdl-error': {
    backgroundColor: `${THEME.colors.danger} !important`,
  },
});
