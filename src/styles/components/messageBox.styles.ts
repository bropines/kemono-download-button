import { css } from '../../utils/cssBuilder';
import { THEME } from '../theme';

export const messageBoxStyles = css({
  '#kemono-download-message-box': {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '10px 20px',
    backgroundColor: '#333',
    color: THEME.colors.textMain,
    borderRadius: THEME.borderRadius.sm,
    zIndex: THEME.zIndex.toast,
    opacity: 0,
    transition: 'opacity .5s ease-in-out, transform .3s ease-in-out',
    boxShadow: '0 2px 10px #0003',
    transform: 'translate(110%)',
  },
});
