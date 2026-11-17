import { css } from '../../../utils/cssBuilder';

export const emptyStateStyles = css({
  '.kdl-ui-empty': {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '32px 24px',
    border: '1px dashed var(--kdl-border)',
    borderRadius: 'var(--kdl-radius)',
    textAlign: 'center',
  },
  '.kdl-ui-empty__icon': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    marginBottom: '8px',
    borderRadius: '9999px',
    background: 'var(--kdl-muted)',
    color: 'var(--kdl-muted-foreground)',
  },
  '.kdl-ui-empty__icon svg.kdl-ui-icon': { width: '24px', height: '24px' },
  '.kdl-ui-empty__title': { fontSize: '16px', fontWeight: 600 },
  '.kdl-ui-empty__description': { maxWidth: '360px', fontSize: '14px', color: 'var(--kdl-muted-foreground)' },
  '.kdl-ui-empty__action': { marginTop: '8px' },
});
