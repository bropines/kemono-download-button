import { css } from '../../utils/cssBuilder';

const PANEL_WIDTH = 'min(320px, calc(100vw - 32px))';

/**
 * The translation display panel inside the image viewer. Like the viewer it renders in the kit's
 * shadow root, so it is injected by the lightbox together with lightboxStyles, not with the page styles.
 */
export const lensPanelStyles = css({
  // Styled like a kit popover / sheet, but non-modal: the picture behind it redraws live
  '.kui-lens-panel': {
    position: 'absolute',
    top: '68px',
    right: '16px',
    zIndex: 3,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: PANEL_WIDTH,
    maxHeight: 'calc(100% - 88px)',
    overflowY: 'auto',
    padding: '16px',
    border: '1px solid var(--kdl-border)',
    borderRadius: 'var(--kdl-radius)',
    background: 'var(--kdl-popover)',
    color: 'var(--kdl-popover-foreground)',
    boxShadow: 'var(--kdl-shadow)',
    fontSize: '13px',
    scrollbarWidth: 'thin',
    scrollbarColor: 'var(--kdl-border) transparent',
    animation: 'kdl-ui-pop-in 0.12s ease-out',
  },
  '.kui-lens-panel[hidden]': {
    display: 'none',
  },
  '.kui-lens-panel-header': {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  '.kui-lens-panel-header strong': {
    marginRight: 'auto',
    fontSize: '14px',
    fontWeight: 600,
  },
  '.kui-lens-panel .kui-lens-panel-btn': {
    width: '28px',
    height: '28px',
  },
  '.kui-lens-group': {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  '.kui-lens-group h4': {
    marginTop: '4px',
    color: 'var(--kdl-muted-foreground)',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  '.kui-lens-group .kdl-ui-label': {
    fontSize: '13px',
  },
  '.kui-lens-row': {
    transition: 'opacity 0.15s',
  },
  '.kui-lens-row.kui-lens-row--inactive': {
    opacity: 0.4,
  },
  '.kui-lens-row.kui-lens-row--check': {
    alignItems: 'center',
  },
  '.kui-lens-row--range': {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  '.kui-lens-panel .kdl-ui-field': {
    gap: '6px',
  },
  '.kui-lens-panel .kdl-ui-select, .kui-lens-panel .kdl-ui-input': {
    height: '32px',
    fontSize: '13px',
  },
  // The next-image arrow would sit on top of the panel
  '.kui-lightbox.kui-lens-panel-open .kui-lightbox-nav.next': {
    right: `calc(${PANEL_WIDTH} + 32px)`,
  },
  '@media (max-width: 600px)': {
    '.kui-lens-panel': {
      top: 'auto',
      right: 0,
      bottom: 0,
      left: 0,
      width: '100%',
      maxHeight: '55vh',
      borderRadius: 'var(--kdl-radius) var(--kdl-radius) 0 0',
      animation: 'kdl-ui-slide-up 0.2s ease-out',
    },
    '.kui-lightbox.kui-lens-panel-open .kui-lightbox-nav': {
      top: '25%',
    },
    '.kui-lightbox.kui-lens-panel-open .kui-lightbox-nav.next': {
      right: '16px',
    },
  },
});
