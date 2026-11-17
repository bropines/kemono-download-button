import { css } from '../../../utils/cssBuilder';

const mix = (color: string, pct: number) => `color-mix(in srgb, var(${color}) ${pct}%, transparent)`;

export const buttonStyles = css({
  '.kdl-ui-btn': {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    height: '36px',
    padding: '0 16px',
    borderRadius: 'calc(var(--kdl-radius) - 2px)',
    border: '1px solid transparent',
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    userSelect: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.15s, color 0.15s, border-color 0.15s, opacity 0.15s',
  },
  '.kdl-ui-btn:disabled, .kdl-ui-btn[aria-disabled="true"]': { opacity: 0.5, pointerEvents: 'none' },
  '.kdl-ui-btn[data-loading]': { opacity: 0.7 },
  '.kdl-ui-btn--default': {
    background: 'var(--kdl-primary)',
    color: 'var(--kdl-primary-foreground)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  '.kdl-ui-btn--default:hover': { background: mix('--kdl-primary', 90) },
  '.kdl-ui-btn--secondary': { background: 'var(--kdl-secondary)', color: 'var(--kdl-secondary-foreground)' },
  '.kdl-ui-btn--secondary:hover': { background: mix('--kdl-secondary', 80) },
  '.kdl-ui-btn--outline': {
    background: 'var(--kdl-background)',
    color: 'var(--kdl-foreground)',
    borderColor: 'var(--kdl-input)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  '.kdl-ui-btn--outline:hover, .kdl-ui-btn--ghost:hover': {
    background: 'var(--kdl-accent)',
    color: 'var(--kdl-accent-foreground)',
  },
  '.kdl-ui-btn--ghost': { background: 'transparent', color: 'var(--kdl-foreground)' },
  '.kdl-ui-btn--destructive': {
    background: 'var(--kdl-destructive)',
    color: 'var(--kdl-destructive-foreground)',
  },
  '.kdl-ui-btn--destructive:hover': { background: mix('--kdl-destructive', 90) },
  '.kdl-ui-btn--link': {
    background: 'transparent',
    color: 'var(--kdl-primary)',
    textUnderlineOffset: '4px',
    padding: '0 4px',
  },
  '.kdl-ui-btn--link:hover': { textDecoration: 'underline' },
  '.kdl-ui-btn--size-sm': { height: '32px', padding: '0 12px', fontSize: '13px', gap: '6px' },
  '.kdl-ui-btn--size-lg': { height: '40px', padding: '0 32px' },
  '.kdl-ui-btn--size-icon': { width: '36px', padding: 0 },
  '.kdl-ui-btn__spinner + .kdl-ui-icon': { display: 'none' },
});
