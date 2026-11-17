import { css } from '../../utils/cssBuilder';

/** Kit shadow root: the author manager sheet. */
export const authorManagerModalStyles = css({
  '.kdl-ui-sheet.kdl-ov-manager': { width: 'min(720px, 100vw)', maxWidth: 'none' },
  '.kdl-ov-manager .kdl-ui-dialog__body': {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflow: 'hidden',
  },
  '.kdl-ov-manager__toolbar': { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' },
  '.kdl-ov-manager__search.kdl-ui-input': { flex: '1 1 200px', width: 'auto' },
  '.kdl-ov-manager__toolbar .kdl-ui-select': { width: 'auto' },
  '.kdl-ov-manager__loading': { display: 'flex', flexDirection: 'column', gap: '8px' },
  '.kdl-ov-manager__status': { fontSize: '13px', color: 'var(--kdl-muted-foreground)' },
  '.kdl-ov-manager__list': { flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '2px' },
  '.kdl-ov-manager__item': {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
    padding: '6px 8px',
    borderRadius: 'calc(var(--kdl-radius) - 2px)',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background-color 0.15s',
  },
  '.kdl-ov-manager__item:hover': { background: 'var(--kdl-accent)' },
  '.kdl-ov-manager [hidden]': { display: 'none !important' },
  '.kdl-ov-manager__thumb': {
    width: '48px',
    height: '48px',
    flexShrink: 0,
    objectFit: 'cover',
    borderRadius: 'calc(var(--kdl-radius) - 2px)',
    background: 'var(--kdl-muted)',
  },
  '.kdl-ov-manager__text': { display: 'flex', flexDirection: 'column', flex: '1 1 auto', minWidth: 0 },
  '.kdl-ov-manager__title': { fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  '.kdl-ov-manager__meta': { fontSize: '12px', color: 'var(--kdl-muted-foreground)' },
  '.kdl-ov-manager__count': { marginRight: 'auto', alignSelf: 'center' },
});
