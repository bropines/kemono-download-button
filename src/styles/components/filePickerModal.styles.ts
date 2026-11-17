import { css } from '../../utils/cssBuilder';

/** Kit shadow root: attachment picker dialog (single post and multi-post). */
export const filePickerModalStyles = css({
  '.kdl-ov-picker__status': { fontSize: '14px', color: 'var(--kdl-muted-foreground)' },
  '.kdl-ov-picker__status--error': { color: 'var(--kdl-danger)' },
  '.kdl-ov-picker__toolbar': { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '12px' },
  '.kdl-ov-picker__list': { display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '55vh' },
  '.kdl-ov-picker__group': {
    flexShrink: 0,
    border: '1px solid var(--kdl-border)',
    borderRadius: 'var(--kdl-radius)',
    overflow: 'hidden',
  },
  '.kdl-ov-picker__group-header': {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    background: 'var(--kdl-muted)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  '.kdl-ov-picker__group-title, .kdl-ov-picker__name': {
    flex: '1 1 auto',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  '.kdl-ov-picker__date': { fontSize: '12px', fontWeight: 400, color: 'var(--kdl-muted-foreground)' },
  '.kdl-ov-picker__row': {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    flexShrink: 0,
    padding: '8px 12px',
    borderTop: '1px solid var(--kdl-border)',
    fontSize: '13px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  '.kdl-ov-picker__list > .kdl-ov-picker__row': {
    border: '1px solid var(--kdl-border)',
    borderRadius: 'var(--kdl-radius)',
  },
  '.kdl-ov-picker__row:hover': { background: 'var(--kdl-accent)', color: 'var(--kdl-accent-foreground)' },
  '.kdl-ov-picker__row svg.kdl-ui-icon': { color: 'var(--kdl-muted-foreground)' },
});
