import { css } from '../../utils/cssBuilder';
import { THEME } from '../theme';

/**
 * Kemono UI Refactor Application Styles.
 * Reuses central design tokens from THEME.
 */
export const kuiMainStyles = css({
  '#kui-settings-btn-sidebar': {
    cursor: 'pointer',
  },
  '.post__content > ._content_59c5c91': {
    marginTop: '0 !important',
    paddingTop: '0 !important',
  },

  /* Settings Panel */
  '#kui-settings-panel': {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '300px',
    height: '100%',
    backgroundColor: THEME.colors.panelBg,
    borderLeft: `1px solid ${THEME.colors.borderDark}`,
    boxShadow: '-5px 0 15px #0000004d',
    zIndex: THEME.zIndex.panel,
    transform: 'translate(100%)',
    transition: THEME.transitions.panel,
    padding: '20px',
    boxSizing: 'border-box',
    color: THEME.colors.textMain,
    fontFamily: 'sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },
  '#kui-settings-panel.kui-panel-active': {
    transform: 'translate(0)',
  },
  '.kui-settings-content': {
    flexGrow: 1,
    overflowY: 'auto',
    paddingRight: '5px',
  },
  '.kui-setting': {
    marginTop: '20px',
  },
  '.kui-setting label': {
    display: 'block',
    marginBottom: '8px',
  },
  '.kui-setting input[type="text"]': {
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: THEME.colors.inputBg,
    border: `1px solid ${THEME.colors.borderLight}`,
    color: '#fff',
    padding: '8px',
    borderRadius: THEME.borderRadius.sm,
  },
  '.kui-setting small': {
    color: THEME.colors.textMuted,
    marginTop: '5px',
    display: 'block',
  },

  /* Grid & Toggle Switches */
  '.kui-grid-size-control': {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  '.kui-toggle-switch': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  '.kui-switch': {
    position: 'relative',
    display: 'inline-block',
    width: '50px',
    height: '26px',
  },
  '.kui-switch input': {
    opacity: 0,
    width: 0,
    height: 0,
  },
  '.kui-slider': {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#555',
    transition: '0.4s',
    borderRadius: THEME.borderRadius.pill,
  },
  '.kui-slider:before': {
    position: 'absolute',
    content: '""',
    height: '20px',
    width: '20px',
    left: '3px',
    bottom: '3px',
    backgroundColor: '#fff',
    transition: '0.4s',
    borderRadius: THEME.borderRadius.full,
  },
  'input:checked + .kui-slider': {
    backgroundColor: THEME.colors.accentBlue,
  },
  'input:checked + .kui-slider:before': {
    transform: 'translate(24px)',
  },
  '.kui-viewed': {
    opacity: 0.5,
  },

  /* User Profile Header */
  'h1.user-header__name': {
    display: 'flex',
    alignItems: 'center',
  },
  '#kui-copy-username-btn': {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    marginLeft: '10px',
    backgroundColor: THEME.colors.buttonGradStart,
    border: '1px solid #4b5563',
    color: '#d1d5db',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: THEME.transitions.fast,
    verticalAlign: 'middle',
  },
  '#kui-copy-username-btn:hover': {
    backgroundColor: '#4b5563',
    color: '#f9fafb',
  },
  '#kui-copy-username-btn:active': {
    transform: 'scale(0.95)',
  },

  /* Post Sections */
  '.kui-post-section': {
    backgroundColor: THEME.colors.bgDark,
    border: `1px solid ${THEME.colors.borderDark}`,
    borderRadius: THEME.borderRadius.lg,
    padding: '15px',
    marginTop: '20px',
  },
  '.kui-post-section h2': {
    marginTop: '0 !important',
    marginBottom: '15px !important',
    paddingBottom: '10px !important',
    borderBottom: `1px solid ${THEME.colors.borderLight} !important`,
  },

  /* Action Buttons */
  '.kui-action-btn': {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#14141499',
    color: '#fff !important',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    cursor: 'pointer',
    textDecoration: 'none !important',
    borderRadius: THEME.borderRadius.lg,
    transition: 'background-color 0.2s, transform 0.2s',
  },
  '.kui-action-btn:hover': {
    background: '#000c',
    transform: 'scale(1.1)',
  },
  '.kui-action-btn svg': {
    width: '20px',
    height: '20px',
    fill: 'currentColor',
  },

  /* Image Gallery Component */
  '.kui-gallery-layout': {
    display: 'flex',
    gap: '15px',
    alignItems: 'stretch',
    height: '80vh',
    maxHeight: '80vh',
  },
  '.kui-gallery-thumbnails': {
    width: '200px',
    flexShrink: 0,
    height: '100%',
    maxHeight: '100%',
    overflowY: 'auto',
    paddingRight: '5px',
    transition: 'width 0.3s ease, opacity 0.3s ease, margin-left 0.3s ease, padding 0.3s ease',
  },
  '.kui-gallery-thumbnails.kui-collapsed': {
    width: 0,
    opacity: 0,
    marginLeft: '-15px',
    paddingRight: 0,
    pointerEvents: 'none',
  },
  '.kui-gallery-thumbnails a': {
    display: 'block',
    marginBottom: '10px',
    border: '2px solid transparent',
    borderRadius: THEME.borderRadius.sm,
  },
  '.kui-gallery-thumbnails img': {
    width: '100%',
    display: 'block',
    borderRadius: '2px',
  },
  '.kui-thumb-active': {
    borderColor: `${THEME.colors.accentBlue} !important`,
  },
  '.kui-gallery-preview': {
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: '100%',
    width: '100%',
    minWidth: 0,
    overflow: 'hidden',
  },
  '.kui-gallery-preview-image': {
    maxWidth: '100%',
    maxHeight: '100%',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
    cursor: 'zoom-in',
    touchAction: 'pan-y',
  },
  '.kui-gallery-thumb-toggle': {
    position: 'absolute',
    top: '10px',
    right: '10px',
    zIndex: 10,
    cursor: 'pointer',
    backgroundColor: '#3a3a3acc',
    border: `1px solid ${THEME.colors.borderLight}`,
    color: '#fff',
    borderRadius: THEME.borderRadius.sm,
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    transition: 'transform 0.2s ease, background-color 0.2s',
  },
  '.kui-gallery-thumb-toggle:hover': {
    transform: 'scale(1.1)',
    backgroundColor: '#505050e6',
  },
  '.kui-gallery-thumb-toggle:after': {
    content: '"✕"',
  },
  '.kui-gallery-thumbnails.kui-collapsed ~ .kui-gallery-preview .kui-gallery-thumb-toggle:after': {
    content: '"☰"',
  },
  '.kui-thumb-wrapper': {
    position: 'relative',
  },
  '.kui-thumb-actions': {
    position: 'absolute',
    top: '4px',
    right: '4px',
    zIndex: 2,
    display: 'flex',
    gap: '4px',
    opacity: 0,
    transition: 'opacity 0.2s',
  },
  '.kui-thumb-wrapper:hover .kui-thumb-actions': {
    opacity: 1,
  },
  '.kui-thumb-actions .kui-action-btn': {
    width: '28px',
    height: '28px',
    fontSize: '16px',
  },
  '.kui-thumb-actions .kui-action-btn svg': {
    width: '16px',
    height: '16px',
  },

  /* Video Gallery Component */
  '.kui-video-gallery-layout': {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
  },
  '.kui-video-list': {
    width: '300px',
    flexShrink: 0,
    maxHeight: '60vh',
    overflowY: 'auto',
    paddingRight: '5px',
    transition: 'width 0.3s ease, opacity 0.3s ease, margin-left 0.3s ease',
    marginLeft: 0,
  },
  '.kui-video-list.kui-collapsed': {
    width: 0,
    opacity: 0,
    marginLeft: '-10px',
    pointerEvents: 'none',
  },
  '.kui-video-list-item': {
    padding: '10px',
    backgroundColor: '#3a3a3a',
    borderRadius: THEME.borderRadius.sm,
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    border: `1px solid ${THEME.colors.borderLight}`,
    userSelect: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  '.kui-video-item-active': {
    backgroundColor: THEME.colors.accentOrange,
  },
  '.kui-video-player-area': {
    flexGrow: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
  '.kui-video-player-container': {
    position: 'relative',
    width: '100%',
    backgroundColor: '#000',
    borderRadius: THEME.borderRadius.sm,
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '150px',
  },
  '#kui-main-video-player': {
    width: '100% !important',
    height: '100% !important',
    objectFit: 'contain',
  },
  '.kui-video-player-area .plyr': {
    maxWidth: '100%',
    maxHeight: '85vh',
  },
  '.kui-video-playlist-toggle': {
    position: 'absolute',
    top: '10px',
    right: '10px',
    zIndex: 10,
    cursor: 'pointer',
    backgroundColor: '#3a3a3acc',
    border: `1px solid ${THEME.colors.borderLight}`,
    color: '#fff',
    borderRadius: THEME.borderRadius.sm,
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    transition: 'transform 0.2s ease, background-color 0.2s',
  },
  '.kui-video-playlist-toggle:hover': {
    transform: 'scale(1.1)',
    backgroundColor: '#505050e6',
  },
  '.kui-video-playlist-toggle:after': {
    content: '"✕"',
  },
  '.kui-video-list.kui-collapsed ~ .kui-video-player-area .kui-video-playlist-toggle:after': {
    content: '"☰"',
  },

  /* Embeds & Attachments Buttons */
  '.kui-embed-container, .post__attachments': {
    display: 'flex !important',
    flexWrap: 'wrap !important',
    gap: '10px !important',
    listStyle: 'none !important',
    padding: '0 !important',
    margin: '10px 0 15px 0 !important',
    paddingBottom: '10px !important',
    borderBottom: `1px solid ${THEME.colors.borderDark} !important`,
  },
  '.post__attachment': {
    margin: '0 !important',
    display: 'inline-block !important',
  },
  '.kui-embed-button, .post__attachment-link': {
    display: 'inline-flex !important',
    alignItems: 'center !important',
    gap: '8px !important',
    padding: '8px 14px !important',
    maxWidth: '320px !important',
    borderRadius: `${THEME.borderRadius.md} !important`,
    fontSize: '13px !important',
    fontWeight: '500 !important',
    textDecoration: 'none !important',
    boxShadow: '0 2px 4px #00000040 !important',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease !important',
    whiteSpace: 'nowrap !important',
    overflow: 'hidden !important',
    background: `linear-gradient(135deg, ${THEME.colors.buttonGradStart}, ${THEME.colors.buttonGradEnd})`,
    color: '#f3f4f6 !important',
    border: '1px solid #4b5563 !important',
  },
  '.kui-embed-button:hover, .post__attachment-link:hover': {
    transform: 'translateY(-2px) !important',
    boxShadow: '0 4px 10px #00000059 !important',
    filter: 'brightness(1.1) !important',
    color: '#fff !important',
  },
  '.kui-embed-button:active, .post__attachment-link:active': {
    transform: 'translateY(0) !important',
  },
  '.kui-embed-button img, .post__attachment-link img': {
    width: '16px !important',
    height: '16px !important',
    borderRadius: '3px !important',
    flexShrink: 0,
    objectFit: 'contain !important',
  },
  '.post__attachment-link span:first-child svg': {
    width: '14px !important',
    height: '14px !important',
    fill: 'currentColor',
  },
  '.kui-embed-button-text, .post__attachment-link span:last-child': {
    overflow: 'hidden !important',
    textOverflow: 'ellipsis !important',
    whiteSpace: 'nowrap !important',
  },

  /* Embed Rules UI */
  '.kui-rule-input-group': {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '8px',
  },
  '.kui-rule-input-group input, .kui-rule-input-group select, .kui-rule-input-group button': {
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: THEME.colors.inputBg,
    border: `1px solid ${THEME.colors.borderLight}`,
    color: '#fff',
    padding: '8px',
    borderRadius: THEME.borderRadius.sm,
  },
  '.kui-rule-input-group button': {
    backgroundColor: THEME.colors.accentBlue,
    borderColor: THEME.colors.accentBlue,
    cursor: 'pointer',
    fontSize: '18px',
    lineHeight: 1,
  },
  '#kui-rules-container': {
    marginTop: '15px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  '.kui-rule-tag': {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: THEME.colors.tagBg,
    padding: '5px 10px',
    borderRadius: THEME.borderRadius.sm,
    fontSize: '13px',
  },
  '.kui-rule-tag-action': {
    fontStyle: 'italic',
    color: '#ccc',
    marginRight: '8px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  '.kui-rule-tag-delete': {
    marginLeft: '8px',
    color: THEME.colors.danger,
    fontWeight: 'bold',
    cursor: 'pointer',
    userSelect: 'none',
  },
  '#kui-save-rules-btn': {
    width: '100%',
    padding: '10px',
    marginTop: '20px',
    backgroundColor: THEME.colors.success,
    border: 'none',
    color: '#fff',
    borderRadius: THEME.borderRadius.sm,
    cursor: 'pointer',
    fontSize: '16px',
  },
  '#kui-save-toast': {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: THEME.colors.success,
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '5px',
    zIndex: THEME.zIndex.toast,
    opacity: 0,
    transition: 'opacity 0.3s',
    pointerEvents: 'none',
  },
  '#kui-save-toast.show': {
    opacity: 1,
  },

  /* Lightbox Modal */
  '#kui-lightbox': {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: THEME.colors.overlayBg,
    zIndex: THEME.zIndex.lightbox,
    opacity: 0,
    visibility: 'hidden',
    transition: 'opacity 0.2s, visibility 0.2s',
  },
  '#kui-lightbox.kui-active': {
    opacity: 1,
    visibility: 'visible',
  },
  '.kui-lightbox-top-actions': {
    position: 'fixed',
    top: '15px',
    right: '15px',
    zIndex: THEME.zIndex.lightboxNav,
    display: 'flex',
    gap: '10px',
  },
  '.kui-lightbox-top-actions .kui-action-btn': {
    width: '40px',
    height: '40px',
    fontSize: '20px',
    borderRadius: THEME.borderRadius.lg,
    background: '#1e1e1ecc',
  },
  '.kui-lightbox-top-actions .kui-action-btn svg': {
    width: '22px',
    height: '22px',
    fill: 'currentColor',
  },
  '#kui-lightbox-img-container': {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    touchAction: 'none',
  },
  '#kui-image-canvas': {
    position: 'absolute',
    top: 0,
    left: 0,
    transformOrigin: '0 0',
    cursor: 'grab',
    transition: 'opacity 0.2s linear',
  },
  '#kui-image-canvas:active': {
    cursor: 'grabbing',
  },
  '.kui-lightbox-nav': {
    position: 'fixed',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '50px',
    height: '80px',
    background: '#0008',
    color: '#fff',
    border: '1px solid #ffffff33',
    borderRadius: THEME.borderRadius.md,
    fontSize: '32px',
    cursor: 'pointer',
    zIndex: THEME.zIndex.lightboxNav,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },
  '.kui-lightbox-nav:hover': {
    background: '#000c',
  },
  '.kui-lightbox-nav.prev': {
    left: '15px',
  },
  '.kui-lightbox-nav.next': {
    right: '15px',
  },

  /* Custom Scrollbars */
  '.kui-gallery-thumbnails::-webkit-scrollbar, .kui-video-list::-webkit-scrollbar, .kui-settings-content::-webkit-scrollbar': {
    width: THEME.scrollbars.width,
    height: THEME.scrollbars.width,
  },
  '.kui-gallery-thumbnails::-webkit-scrollbar-track, .kui-video-list::-webkit-scrollbar-track, .kui-settings-content::-webkit-scrollbar-track': {
    background: THEME.scrollbars.trackBg,
    borderRadius: '10px',
  },
  '.kui-gallery-thumbnails::-webkit-scrollbar-thumb, .kui-video-list::-webkit-scrollbar-thumb, .kui-settings-content::-webkit-scrollbar-thumb': {
    background: THEME.scrollbars.thumbBg,
    borderRadius: '10px',
  },
  '.kui-gallery-thumbnails::-webkit-scrollbar-thumb:hover, .kui-video-list::-webkit-scrollbar-thumb:hover, .kui-settings-content::-webkit-scrollbar-thumb:hover': {
    background: THEME.scrollbars.thumbHoverBg,
  },

  /* Responsive Media Queries */
  '@media (max-width: 768px)': {
    '.kui-gallery-layout': {
      flexDirection: 'column',
      height: 'auto',
      maxHeight: 'none',
    },
    '.kui-gallery-preview': {
      height: '60vh',
      order: 1,
    },
    '.kui-gallery-thumbnails': {
      order: 2,
      width: '100%',
      height: '120px',
      overflowY: 'hidden',
      overflowX: 'auto',
      display: 'flex',
      flexDirection: 'row',
      gap: '10px',
      paddingRight: 0,
    },
    '.kui-gallery-thumbnails a': {
      marginBottom: 0,
      flexShrink: 0,
      width: '100px',
    },
    '.kui-gallery-thumb-toggle': {
      display: 'none',
    },
    '.kui-thumb-actions': {
      flexDirection: 'column',
      gap: '2px',
    },
    '.kui-thumb-actions .kui-action-btn': {
      width: '22px',
      height: '22px',
      fontSize: '14px',
    },
    '.kui-thumb-actions .kui-action-btn svg': {
      width: '14px',
      height: '14px',
    },
    '.kui-video-gallery-layout': {
      flexDirection: 'column',
    },
    '.kui-video-gallery-layout .kui-video-list, .kui-video-gallery-layout .kui-video-player-area': {
      width: '100%',
      maxWidth: '100%',
    },
    '.kui-video-gallery-layout .kui-video-list': {
      order: 2,
      marginTop: '8px',
      marginLeft: 0,
      maxHeight: '30vh',
      transition: 'max-height 0.3s ease-in-out, padding 0.3s ease-in-out, margin 0.3s ease-in-out',
    },
    '.kui-video-gallery-layout .kui-video-player-area': {
      order: 1,
    },
    '.kui-video-gallery-layout .kui-video-list.kui-collapsed': {
      maxHeight: 0,
      paddingTop: 0,
      paddingBottom: 0,
      marginTop: 0,
      borderWidth: 0,
      transform: 'none',
    },
  },

  '.card-list__items, .card-list, .user-card-list': {
    gridTemplateColumns: 'repeat(auto-fill, minmax(var(--card-size, 180px), 1fr)) !important',
  },
  '.kui-hidden-original': {
    display: 'none !important',
  },
});
