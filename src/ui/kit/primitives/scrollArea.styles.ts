import { css } from '../../../utils/cssBuilder';

export const scrollAreaStyles = css({
  '.kdl-ui-scroll': {
    position: 'relative',
    overflow: 'hidden',
    scrollbarWidth: 'thin',
    scrollbarColor: 'var(--kdl-border) transparent',
    overscrollBehavior: 'contain',
  },
  '.kdl-ui-scroll--vertical': { overflowY: 'auto' },
  '.kdl-ui-scroll--horizontal': { overflowX: 'auto' },
  '.kdl-ui-scroll--both': { overflow: 'auto' },
  '.kdl-ui-scroll::-webkit-scrollbar': { width: '10px', height: '10px' },
  '.kdl-ui-scroll::-webkit-scrollbar-track': { background: 'transparent' },
  '.kdl-ui-scroll::-webkit-scrollbar-thumb': {
    background: 'var(--kdl-border)',
    borderRadius: '9999px',
    border: '3px solid transparent',
    backgroundClip: 'padding-box',
  },
  '.kdl-ui-scroll::-webkit-scrollbar-thumb:hover': { backgroundColor: 'var(--kdl-muted-foreground)' },
});
