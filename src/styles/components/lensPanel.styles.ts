import { css } from '../../utils/cssBuilder';
import { THEME } from '../theme';

const PANEL_WIDTH = 'min(320px, calc(100vw - 32px))';

export const lensPanelStyles = css({
  '.kui-lens-panel': {
    position: 'absolute',
    top: '70px',
    right: '15px',
    zIndex: 5,
    boxSizing: 'border-box',
    width: PANEL_WIDTH,
    maxHeight: 'calc(100% - 90px)',
    overflowY: 'auto',
    padding: '10px 14px 14px',
    border: `1px solid ${THEME.colors.borderSubtle}`,
    borderRadius: THEME.borderRadius.lg,
    background: 'rgba(18, 20, 22, 0.92)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
    color: THEME.colors.textMain,
    fontSize: '13px',
    lineHeight: 1.35,
    scrollbarWidth: 'thin',
    scrollbarColor: `${THEME.scrollbars.thumbBg} transparent`,
  },
  '.kui-lens-panel[hidden]': {
    display: 'none',
  },
  '.kui-lens-panel-header': {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '4px',
  },
  '.kui-lens-panel-header strong': {
    marginRight: 'auto',
    fontSize: '14px',
  },
  '.kui-lens-panel-btn': {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    padding: 0,
    border: `1px solid ${THEME.colors.borderSubtle}`,
    borderRadius: THEME.borderRadius.md,
    background: 'transparent',
    color: THEME.colors.textMuted,
    fontSize: '15px',
    cursor: 'pointer',
  },
  '.kui-lens-panel-btn:hover': {
    borderColor: THEME.colors.primary,
    color: THEME.colors.primary,
  },
  '.kui-lens-group h4': {
    margin: '12px 0 4px',
    color: THEME.colors.textMuted,
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  '.kui-lens-row': {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    alignItems: 'center',
    gap: '4px 10px',
    margin: '6px 0',
    transition: 'opacity 0.15s',
  },
  '.kui-lens-row--inactive': {
    opacity: 0.4,
  },
  '.kui-lens-row--check': {
    gridTemplateColumns: 'auto 1fr',
    cursor: 'pointer',
  },
  '.kui-lens-row input[type="checkbox"], .kui-lens-row input[type="range"]': {
    margin: 0,
    accentColor: THEME.colors.primary,
  },
  '.kui-lens-row--range input[type="range"]': {
    gridColumn: '1 / -1',
    width: '100%',
  },
  '.kui-lens-value': {
    color: THEME.colors.textMuted,
    fontVariantNumeric: 'tabular-nums',
  },
  '.kui-lens-row select, .kui-lens-row input[type="text"]': {
    boxSizing: 'border-box',
    width: '160px',
    padding: '4px 6px',
    border: `1px solid ${THEME.colors.borderSubtle}`,
    borderRadius: THEME.borderRadius.sm,
    background: THEME.colors.inputBg,
    color: THEME.colors.textMain,
    fontSize: '12px',
  },
  // The next-image arrow would sit on top of the panel
  '#kui-lightbox.kui-lens-panel-open .kui-lightbox-nav.next': {
    right: `calc(${PANEL_WIDTH} + 30px)`,
  },
  '@media (max-width: 600px)': {
    '.kui-lens-panel': {
      top: 'auto',
      right: 0,
      bottom: 0,
      left: 0,
      width: '100%',
      maxHeight: '55vh',
      borderRadius: `${THEME.borderRadius.lg} ${THEME.borderRadius.lg} 0 0`,
    },
    '#kui-lightbox.kui-lens-panel-open .kui-lightbox-nav': {
      top: '25%',
    },
    '#kui-lightbox.kui-lens-panel-open .kui-lightbox-nav.next': {
      right: '15px',
    },
  },
});
