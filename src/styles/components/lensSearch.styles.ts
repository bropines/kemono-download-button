import { css } from '../../utils/cssBuilder';

/** The "Ask AI" popover of the Lens search buttons. It renders in the kit's shadow root. */
export const lensSearchStyles = css({
  '.kdl-ui-popover.kui-lens-ask': {
    width: '320px',
    padding: '12px',
  },
  '.kui-lens-ask__form': {
    display: 'flex',
    gap: '8px',
    margin: 0,
  },
  '.kui-lens-ask__form .kdl-ui-input': {
    flex: 1,
    minWidth: 0,
  },
});
