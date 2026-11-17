import { css } from '../../../utils/cssBuilder';

export const fieldStyles = css({
  '.kdl-ui-label': {
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: 1,
    color: 'var(--kdl-foreground)',
    cursor: 'default',
  },
  '.kdl-ui-label[for]': { cursor: 'pointer' },
  '.kdl-ui-label__required': { color: 'var(--kdl-danger)' },
  '.kdl-ui-field': { display: 'flex', flexDirection: 'column', gap: '8px' },
  '.kdl-ui-field--horizontal': { flexDirection: 'row', alignItems: 'flex-start', gap: '12px' },
  '.kdl-ui-field--horizontal > .kdl-ui-checkbox': { marginTop: '1px' },
  '.kdl-ui-field__text': { display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0, paddingTop: '1px' },
  '.kdl-ui-field__description': { fontSize: '13px', lineHeight: 1.4, color: 'var(--kdl-muted-foreground)' },
  '.kdl-ui-field__error': { fontSize: '13px', fontWeight: 500, lineHeight: 1.4, color: 'var(--kdl-danger)' },
  '.kdl-ui-field__error[hidden]': { display: 'none' },
});
