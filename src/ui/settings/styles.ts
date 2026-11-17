import { css } from '../../utils/cssBuilder';
import { getKitRoot, LAYERS } from '../kit';

const STYLE_ID = 'kdl-settings-styles';

/** Layout of the Settings dialog; everything else comes from the kit primitives. */
export const settingsStyles = css({
  '.kdl-settings': { height: 'min(760px, calc(100vh - 32px))' },
  '.kdl-settings [hidden]': { display: 'none !important' },
  '.kdl-settings .kdl-ui-dialog__body': { display: 'flex', flexDirection: 'column' },
  '.kdl-settings .kdl-ui-tabs': { flex: '1 1 auto', minHeight: 0, gap: '12px' },
  '.kdl-settings .kdl-ui-tabs__list': { flexShrink: 0, position: 'sticky', top: 0, zIndex: LAYERS.base },
  '.kdl-settings .kdl-ui-tabs__trigger': { gap: '6px' },
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
  '@media (max-width: 640px)': {
    '.kdl-settings': { height: 'calc(100vh - 32px)', padding: '16px' },
    '.kdl-settings__footer-spacer': { display: 'none' },
  },
});

/** Adds the dialog layout CSS to the kit shadow root once. */
export function ensureSettingsStyles(): void {
  const root = getKitRoot();
  if (root.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = settingsStyles;
  root.appendChild(style);
}
