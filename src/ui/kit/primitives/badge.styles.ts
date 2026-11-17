import { css } from '../../../utils/cssBuilder';

const tint = (color: string) => ({
  background: `color-mix(in srgb, var(${color}) 15%, transparent)`,
  color: `var(${color})`,
  borderColor: `color-mix(in srgb, var(${color}) 30%, transparent)`,
});

export const badgeStyles = css({
  '.kdl-ui-badge': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 10px',
    border: '1px solid transparent',
    borderRadius: 'calc(var(--kdl-radius) - 2px)',
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: '16px',
    whiteSpace: 'nowrap',
  },
  '.kdl-ui-badge svg.kdl-ui-icon': { width: '12px', height: '12px' },
  '.kdl-ui-badge--default': { background: 'var(--kdl-primary)', color: 'var(--kdl-primary-foreground)' },
  '.kdl-ui-badge--secondary': { background: 'var(--kdl-secondary)', color: 'var(--kdl-secondary-foreground)' },
  '.kdl-ui-badge--outline': { borderColor: 'var(--kdl-border)', color: 'var(--kdl-foreground)' },
  '.kdl-ui-badge--destructive': {
    background: 'var(--kdl-destructive)',
    color: 'var(--kdl-destructive-foreground)',
  },
  '.kdl-ui-badge--success': tint('--kdl-success'),
  '.kdl-ui-badge--warning': tint('--kdl-warning'),
});
