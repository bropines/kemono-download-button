import { css } from '../../utils/cssBuilder';
import { THEME } from '../theme';
import { LAYERS } from '../../ui/kit/layers';

/**
 * Kemono UI Refactor Application Styles.
 * Reuses central design tokens from THEME.
 */
export const kuiMainStyles = css({
  '.post__content > ._content_59c5c91': {
    marginTop: '0 !important',
    paddingTop: '0 !important',
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
  // No frame of its own: boxed sections looked heavy; the heading underline separates them
  '.kui-post-section': {
    padding: '15px 0',
    marginTop: '20px',
  },
  // pawchive frames the comments footer itself (.post__footer { border: 0.125em solid grey; padding: 0.5em })
  '.kui-post-section > footer.post__footer': {
    border: 'none',
    borderRadius: 0,
    padding: 0,
  },
  '.kui-post-section h2': {
    marginTop: '0 !important',
    marginBottom: '15px !important',
    paddingBottom: '10px !important',
    borderBottom: `1px solid ${THEME.colors.borderLight} !important`,
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
    borderRadius: 'calc(var(--kdl-radius) - 2px)',
    overflow: 'hidden',
  },
  '.kui-gallery-thumbnails img': {
    width: '100%',
    display: 'block',
  },
  '.kui-thumb-active': {
    borderColor: 'var(--kdl-ring) !important',
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
  '.kui-gallery-preview-actions': {
    position: 'absolute',
    top: '10px',
    left: '10px',
    zIndex: 10,
    display: 'flex',
    gap: '6px',
  },
  // Overlay chrome on the preview and the video: the kit buttons, positioned
  '.kui-gallery-preview > .kui-gallery-thumb-toggle, .kui-video-player-container > .kui-video-playlist-toggle': {
    position: 'absolute',
    top: '10px',
    right: '10px',
    zIndex: 10,
  },
  // A translated image is showing
  '.kui-gallery-preview-actions .kdl-ui-btn[data-state="on"]': {
    background: 'var(--kdl-primary)',
    color: 'var(--kdl-primary-foreground)',
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
  '.kui-thumb-actions .kdl-ui-btn': {
    width: '28px',
    height: '28px',
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
    padding: '8px 12px',
    marginBottom: '6px',
    border: '1px solid var(--kdl-border)',
    borderRadius: 'calc(var(--kdl-radius) - 2px)',
    background: 'var(--kdl-card)',
    color: 'var(--kdl-card-foreground)',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'background-color 0.15s, border-color 0.15s',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  '.kui-video-list-item:hover': {
    background: 'var(--kdl-accent)',
  },
  '.kui-video-list-item.kui-video-item-active': {
    borderColor: 'var(--kdl-ring)',
    background: 'var(--kdl-secondary)',
  },
  '.kui-video-player-area': {
    flexGrow: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
  '.kui-video-player-container': {
    position: 'relative',
    width: '100%',
    backgroundColor: 'var(--kdl-background)',
    borderRadius: 'var(--kdl-radius)',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '150px',
  },
  '.kui-video-player-container video': {
    width: '100% !important',
    height: '100% !important',
    objectFit: 'contain',
  },
  '.kui-video-player-area .plyr': {
    width: '100%',
    maxWidth: '100%',
    maxHeight: '85vh',
  },
  /* Embeds & Attachments Buttons (kit outline buttons; the host keeps only a favicon or a dot in its colour) */
  '.kui-embed-container': {
    display: 'flex !important',
    flexWrap: 'wrap !important',
    gap: '8px !important',
    listStyle: 'none !important',
    padding: '0 !important',
    margin: '10px 0 15px 0 !important',
  },
  '.post__attachments': {
    display: 'grid !important',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))',
    gap: '8px !important',
    listStyle: 'none !important',
    padding: '0 !important',
    margin: '10px 0 15px 0 !important',
  },
  '.post__attachments > .post__attachment': {
    display: 'grid !important',
    gridTemplateColumns: 'minmax(0, 1fr)',
    alignItems: 'start',
    gap: '8px',
    minWidth: '0',
    margin: '0 !important',
    padding: '0',
  },
  '.post__attachments > .post__attachment:has(> .kdl-hist-own)': {
    gridTemplateColumns: 'minmax(0, 1fr) auto',
  },
  '.post__attachment .kui-attachment-styled.kdl-ui-btn': {
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: 'none',
    minWidth: '0',
    minHeight: '40px',
    height: 'auto',
    justifyContent: 'flex-start',
    padding: '8px 12px',
    textDecoration: 'none',
  },
  '.post__attachment .kui-attachment-styled > span': {
    minWidth: '0',
    whiteSpace: 'normal',
    overflowWrap: 'anywhere',
    textAlign: 'left',
    lineHeight: '1.35',
  },
  '.kui-embed-container .kui-embed-button': {
    maxWidth: '320px',
    textDecoration: 'none',
  },
  '.kui-embed-button img, .kui-embed-button .kui-embed-dot': {
    width: '16px',
    height: '16px',
    flexShrink: 0,
    borderRadius: '4px',
    objectFit: 'contain',
  },
  '.kui-embed-button .kui-embed-dot': {
    width: '8px',
    height: '8px',
    margin: '0 4px',
    borderRadius: '9999px',
    background: 'var(--kui-brand, var(--kdl-muted-foreground))',
  },
  '.kui-embed-button-text': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  '@media (max-width: 600px), (pointer: coarse)': {
    '.post__attachment .kui-attachment-styled.kdl-ui-btn': { minHeight: '44px' },
  },
  '.kui-embed-button .kui-embed-password': {
    maxWidth: '140px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
    fontWeight: 500,
  },

  /* Custom Scrollbars */
  '.kui-gallery-thumbnails::-webkit-scrollbar, .kui-video-list::-webkit-scrollbar': {
    width: THEME.scrollbars.width,
    height: THEME.scrollbars.width,
  },
  '.kui-gallery-thumbnails::-webkit-scrollbar-track, .kui-video-list::-webkit-scrollbar-track': {
    background: THEME.scrollbars.trackBg,
    borderRadius: '10px',
  },
  '.kui-gallery-thumbnails::-webkit-scrollbar-thumb, .kui-video-list::-webkit-scrollbar-thumb': {
    background: THEME.scrollbars.thumbBg,
    borderRadius: '10px',
  },
  '.kui-gallery-thumbnails::-webkit-scrollbar-thumb:hover, .kui-video-list::-webkit-scrollbar-thumb:hover': {
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
    '.kui-gallery-preview > .kui-gallery-thumb-toggle': {
      display: 'none',
    },
    '.kui-thumb-actions': {
      flexDirection: 'column',
      gap: '2px',
    },
    '.kui-thumb-actions .kdl-ui-btn': {
      width: '22px',
      height: '22px',
    },
    '.kui-thumb-actions .kdl-ui-btn svg.kdl-ui-icon': {
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
    // Volume slider otherwise squeezes the seek bar to a few pixels; mute button stays
    '.kui-video-player-area .plyr__volume input[type=range]': {
      display: 'none',
    },
  },

  '.site-section--user .card-list__items, .site-section--user .card-list, .site-section--posts .card-list__items, .card-list__items:has(article.post-card), .card-list:has(article.post-card)': {
    gridTemplateColumns: 'repeat(auto-fill, minmax(var(--card-size, 180px), 1fr)) !important',
  },
  'article.post-card': {
    width: '100% !important',
    maxWidth: '100% !important',
    boxSizing: 'border-box !important',
  },
  '.kui-hidden-original': {
    display: 'none !important',
  },
});

/**
 * The image viewer, rendered in the kit's shadow root (so only kit tokens and these rules apply there).
 * Injected by the lightbox itself, not with the page styles.
 */
export const lightboxStyles = css({
  '.kui-lightbox': {
    position: 'fixed',
    inset: 0,
    zIndex: LAYERS.overlay,
    background: 'var(--kdl-overlay)',
    opacity: 0,
    visibility: 'hidden',
    transition: 'opacity 0.2s, visibility 0.2s',
  },
  '.kui-lightbox.kui-active': {
    opacity: 1,
    visibility: 'visible',
  },
  '.kui-lightbox-top-actions': {
    position: 'absolute',
    top: '16px',
    right: '16px',
    zIndex: 2,
    display: 'flex',
    gap: '8px',
  },
  '.kui-lightbox .kui-action-btn[data-state="on"]': {
    background: 'var(--kdl-primary)',
    color: 'var(--kdl-primary-foreground)',
  },
  '.kui-lightbox .kui-lightbox-nav': {
    position: 'absolute',
    top: '50%',
    zIndex: 2,
    width: '44px',
    height: '72px',
    transform: 'translateY(-50%)',
  },
  '.kui-lightbox .kui-lightbox-nav svg.kdl-ui-icon': {
    width: '24px',
    height: '24px',
  },
  '.kui-lightbox-nav.prev': { left: '16px' },
  '.kui-lightbox-nav.next': { right: '16px' },
  '#kui-lightbox-img-container': {
    position: 'absolute',
    inset: 0,
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
});
