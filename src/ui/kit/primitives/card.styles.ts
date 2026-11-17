import { css } from '../../../utils/cssBuilder';

export const cardStyles = css({
  '.kdl-ui-card': {
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid var(--kdl-border)',
    borderRadius: 'calc(var(--kdl-radius) + 4px)',
    background: 'var(--kdl-card)',
    color: 'var(--kdl-card-foreground)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  '.kdl-ui-card__header': {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '24px',
  },
  '.kdl-ui-card__heading': { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 },
  '.kdl-ui-card__title': { fontSize: '16px', fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.01em' },
  '.kdl-ui-card__description': { fontSize: '14px', color: 'var(--kdl-muted-foreground)' },
  '.kdl-ui-card__content': { padding: '0 24px 24px' },
  '.kdl-ui-card__footer': { display: 'flex', alignItems: 'center', gap: '8px', padding: '0 24px 24px' },
  '.kdl-ui-card > .kdl-ui-card__content:first-child': { paddingTop: '24px' },
});
