import { css } from '../../../utils/cssBuilder';
import { LAYERS } from '../layers';

const slide = (name: string, from: string) => ({
  [`@keyframes ${name}`]: { from: { transform: from }, to: { transform: 'none' } },
});

export const sheetStyles = css({
  '.kdl-ui-sheet': {
    position: 'fixed',
    zIndex: LAYERS.modal,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '24px',
    background: 'var(--kdl-background)',
    color: 'var(--kdl-foreground)',
    boxShadow: 'var(--kdl-shadow)',
    outline: 'none',
    animationDuration: '0.25s',
    animationTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
  },
  '.kdl-ui-sheet--left, .kdl-ui-sheet--right': { top: 0, bottom: 0, width: '75%', maxWidth: '384px' },
  '.kdl-ui-sheet--left': { left: 0, borderRight: '1px solid var(--kdl-border)', animationName: 'kdl-ui-sheet-left' },
  '.kdl-ui-sheet--right': {
    right: 0,
    borderLeft: '1px solid var(--kdl-border)',
    animationName: 'kdl-ui-sheet-right',
  },
  '.kdl-ui-sheet--top, .kdl-ui-sheet--bottom': { left: 0, right: 0, maxHeight: '85vh' },
  '.kdl-ui-sheet--top': { top: 0, borderBottom: '1px solid var(--kdl-border)', animationName: 'kdl-ui-sheet-top' },
  '.kdl-ui-sheet--bottom': {
    bottom: 0,
    borderTop: '1px solid var(--kdl-border)',
    borderRadius: 'var(--kdl-radius) var(--kdl-radius) 0 0',
    animationName: 'kdl-ui-sheet-bottom',
  },
  ...slide('kdl-ui-sheet-left', 'translateX(-100%)'),
  ...slide('kdl-ui-sheet-right', 'translateX(100%)'),
  ...slide('kdl-ui-sheet-top', 'translateY(-100%)'),
  ...slide('kdl-ui-sheet-bottom', 'translateY(100%)'),
});
