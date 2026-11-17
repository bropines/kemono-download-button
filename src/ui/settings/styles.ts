import { css } from '../../utils/cssBuilder';
import { addKitStyles, LAYERS } from '../kit';

const STYLE_ID = 'kdl-settings-styles';

/** Layout of the Settings dialog; everything else comes from the kit primitives. */
export const settingsStyles = css({
  '.kdl-settings': { height: 'min(760px, calc(100vh - 32px))' },
  '.kdl-settings [hidden]': { display: 'none !important' },
  '.kdl-settings .kdl-ui-dialog__body': { display: 'flex', flexDirection: 'column' },
  '.kdl-settings .kdl-ui-tabs': { flex: '1 1 auto', minHeight: 0, gap: '12px' },
  '.kdl-settings .kdl-ui-tabs__list': { flexShrink: 0, position: 'sticky', top: 0, zIndex: LAYERS.base, overflowY: 'hidden', scrollbarWidth: 'none' },
  // Triggers keep their width and the list scrolls sideways: shrunk triggers spilled their labels over each
  // other and onto the panel on phones
  '.kdl-settings .kdl-ui-tabs__trigger': { gap: '6px', flexShrink: 0 },
  '.kdl-settings .kdl-ui-tabs__list::-webkit-scrollbar': { display: 'none' },
  '.kdl-settings .kdl-ui-tabs__trigger .kdl-ui-icon': { width: '14px', height: '14px' },
  '.kdl-settings .kdl-ui-tabs__panel': { paddingBottom: '4px' },
  '.kdl-settings__panel': { display: 'flex', flexDirection: 'column', gap: '12px' },
  '.kdl-settings__section': { gap: '0' },
  '.kdl-settings__section-head': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '16px 16px 0',
    color: 'var(--kdl-foreground)',
  },
  '.kdl-settings__section-head .kdl-ui-icon': { width: '16px', height: '16px', color: 'var(--kdl-muted-foreground)' },
  '.kdl-settings__section-title': { fontSize: '15px', fontWeight: 600, lineHeight: 1.2 },
  '.kdl-settings__section-description': {
    padding: '6px 16px 0',
    fontSize: '13px',
    color: 'var(--kdl-muted-foreground)',
  },
  '.kdl-settings__section > .kdl-ui-card__content': {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '16px',
  },
  '.kdl-settings__grid': {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  '.kdl-settings__group': { display: 'flex', flexDirection: 'column', gap: '16px' },
  '.kdl-settings__nested': {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    paddingLeft: '16px',
    borderLeft: '2px solid var(--kdl-border)',
  },
  '.kdl-settings__row': { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
  '.kdl-settings__row > .kdl-ui-input, .kdl-settings__row > .kdl-ui-select': { flex: '1 1 160px', width: 'auto' },
  '.kdl-settings__note': { fontSize: '13px', lineHeight: 1.4, color: 'var(--kdl-muted-foreground)' },
  '.kdl-settings__stat': { fontSize: '14px', fontVariantNumeric: 'tabular-nums' },
  '.kdl-settings__chips': { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  '.kdl-settings__chips:empty': { display: 'none' },
  '.kdl-settings__chip': { gap: '4px', paddingRight: '4px' },
  '.kdl-settings__chip-remove': {
    display: 'inline-flex',
    borderRadius: '999px',
    opacity: 0.7,
    cursor: 'pointer',
  },
  '.kdl-settings__chip-remove:hover': { opacity: 1 },
  '.kdl-settings__chip-remove .kdl-ui-icon': { width: '12px', height: '12px' },
  '.kdl-settings__chip-toggle': { cursor: 'pointer', fontStyle: 'italic' },
  '.kdl-settings__footer-spacer': { flex: '1 1 auto' },
  '.kdl-settings__module-search': { position: 'relative', display: 'flex', alignItems: 'center' },
  '.kdl-settings__module-search > .kdl-ui-icon': {
    position: 'absolute',
    left: '10px',
    width: '14px',
    height: '14px',
    color: 'var(--kdl-muted-foreground)',
  },
  '.kdl-settings__module-search > .kdl-ui-input': { paddingLeft: '32px' },
  '.kdl-settings__module-group': { display: 'flex', flexDirection: 'column', gap: '8px' },
  '.kdl-settings__module-group-title': {
    marginTop: '4px',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: 'var(--kdl-muted-foreground)',
  },
  '.kdl-settings__module-toggle': { marginLeft: 'auto' },
  '.kdl-settings__module-badges': { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  '.kdl-settings__module-notice': {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: 'var(--kdl-warning)',
  },
  '.kdl-settings__module-notice .kdl-ui-icon': { width: '14px', height: '14px' },
  '.kdl-settings__module[data-state="off"] .kdl-settings__module-settings': { opacity: 0.6 },
  '@media (max-width: 640px)': {
    '.kdl-settings': { height: 'calc(100vh - 32px)', padding: '16px' },
    '.kdl-settings__footer-spacer': { display: 'none' },
    // Export / Import / Reset share one row under a full-width Done instead of four stacked rows
    '.kdl-settings .kdl-ui-dialog__footer': { flexDirection: 'row', flexWrap: 'wrap', gap: '8px' },
    '.kdl-settings .kdl-ui-dialog__footer > .kdl-ui-btn': { flex: '1 1 0', minWidth: 0, padding: '0 8px' },
    '.kdl-settings .kdl-ui-dialog__footer > .kdl-ui-btn--default': { flex: '1 0 100%', order: -1 },
  },
});

/** Adds the dialog layout CSS to the kit shadow root once. */
export function ensureSettingsStyles(): void {
  addKitStyles(STYLE_ID, settingsStyles);
}
