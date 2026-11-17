import { css } from '../../../utils/cssBuilder';

const track = {
  height: '6px',
  borderRadius: '9999px',
  background:
    'linear-gradient(to right, var(--kdl-primary) var(--kdl-ui-fill, 0%), var(--kdl-secondary) var(--kdl-ui-fill, 0%))',
};
const thumb = {
  width: '16px',
  height: '16px',
  border: '1px solid var(--kdl-primary)',
  borderRadius: '9999px',
  background: 'var(--kdl-background)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  cursor: 'pointer',
};

// webkit and moz pseudo-elements must stay in separate rules: one unknown selector drops the whole rule
export const sliderStyles = css({
  '.kdl-ui-slider': { display: 'flex', alignItems: 'center', gap: '12px', width: '100%' },
  '.kdl-ui-slider__input': {
    appearance: 'none',
    WebkitAppearance: 'none',
    flex: 1,
    width: '100%',
    height: '16px',
    margin: 0,
    background: 'transparent',
    cursor: 'pointer',
  },
  '.kdl-ui-slider__input:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  '.kdl-ui-slider__input::-webkit-slider-runnable-track': track,
  '.kdl-ui-slider__input::-webkit-slider-thumb': { ...thumb, WebkitAppearance: 'none', marginTop: '-5px' },
  '.kdl-ui-slider__input::-moz-range-track': track,
  '.kdl-ui-slider__input::-moz-range-thumb': thumb,
  '.kdl-ui-slider__value': {
    minWidth: '36px',
    textAlign: 'right',
    fontSize: '13px',
    fontVariantNumeric: 'tabular-nums',
    color: 'var(--kdl-muted-foreground)',
  },
});
