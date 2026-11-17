import { css } from '../../utils/cssBuilder';
import { LAYERS } from '../../ui/kit/layers';

/** Light DOM: the settings entries injected into the site's sidebar and header. */
export const fixedControlsStyles = css({
  '#kdl-settings-btn-sidebar, #kui-settings-btn-sidebar, #kdl-settings-btn-header, #kui-settings-btn-header': {
    cursor: 'pointer !important',
  },
});

/**
 * Kit shadow root: the bottom dock that stacks progress tasks, the queue badge and the bulk bar,
 * so none of them covers another.
 */
export const dockStyles = css({
  '#kdl-fixed-controls': {
    position: 'fixed',
    left: '50%',
    bottom: '16px',
    transform: 'translateX(-50%)',
    zIndex: LAYERS.base,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    width: 'min(760px, calc(100vw - 32px))',
    pointerEvents: 'none',
  },
  '#kdl-fixed-controls [hidden]': { display: 'none !important' },
  '.kdl-ov-dock__slot': {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  '.kdl-ov-dock__slot:empty': { display: 'none' },
  '#kdl-queue-indicator': {
    pointerEvents: 'auto',
    boxShadow: 'var(--kdl-shadow)',
  },
  '@media (max-width: 600px)': {
    '#kdl-fixed-controls': { bottom: '8px', width: 'calc(100vw - 16px)' },
  },
});
