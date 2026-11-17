import { css } from '../../utils/cssBuilder';

/** Prefixes a selector for both the shadow root and light-DOM scopes. */
export const scoped = (sel: string) => `:host ${sel}, .kdl-scope ${sel}`;
const ALL = `${scoped('*')}, ${scoped('*::before')}, ${scoped('*::after')}`;

/** Scoped reset: shields kit markup in the page from site styles. */
export const baseStyles = css({
  ':host': { all: 'initial' },
  ':host, .kdl-scope': {
    fontFamily: 'var(--kdl-font)',
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: 'normal',
    textAlign: 'left',
    textTransform: 'none',
    color: 'var(--kdl-foreground)',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },
  [ALL]: {
    boxSizing: 'border-box',
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: 'var(--kdl-border)',
  },
  [scoped(':where(button, input, select, textarea)')]: {
    font: 'inherit',
    color: 'inherit',
    letterSpacing: 'inherit',
    textTransform: 'none',
    textShadow: 'none',
    boxShadow: 'none',
    margin: 0,
    padding: 0,
    background: 'transparent',
    minWidth: 0,
    minHeight: 0,
    maxWidth: 'none',
    float: 'none',
  },
  [scoped(':where(button)')]: { cursor: 'pointer', lineHeight: 'inherit' },
  [scoped(':where(h1, h2, h3, h4, h5, h6, p, ul, ol, figure)')]: { margin: 0, padding: 0, font: 'inherit' },
  [scoped(':where(a)')]: { color: 'inherit', textDecoration: 'inherit' },
  [scoped(':focus-visible')]: { outline: '2px solid var(--kdl-ring)', outlineOffset: '2px' },
  [scoped(':focus:not(:focus-visible)')]: { outline: 'none' },
  [scoped('svg.kdl-ui-icon')]: {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    flexShrink: 0,
    fill: 'none',
    stroke: 'currentColor',
    pointerEvents: 'none',
  },
  [scoped('.kdl-ui-spin')]: { animation: 'kdl-ui-spin 1s linear infinite' },
  [scoped('.kdl-ui-sr-only')]: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
  },
  [scoped('.kdl-ui-muted')]: { color: 'var(--kdl-muted-foreground)' },
  [scoped('.kdl-ui-stack')]: { display: 'flex', flexDirection: 'column', gap: '16px' },
  [scoped('.kdl-ui-row')]: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' },
  '@keyframes kdl-ui-spin': { to: { transform: 'rotate(360deg)' } },
  '@keyframes kdl-ui-fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
  '@keyframes kdl-ui-pop-in': {
    from: { opacity: 0, transform: 'scale(0.96)' },
    to: { opacity: 1, transform: 'scale(1)' },
  },
  '@keyframes kdl-ui-slide-up': {
    from: { opacity: 0, transform: 'translateY(16px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  '@media (prefers-reduced-motion: reduce)': {
    [ALL]: { animationDuration: '0.01ms !important', transitionDuration: '0.01ms !important' },
  },
});
