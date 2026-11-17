import { css } from '../../utils/cssBuilder';

export const postCardStyles = css({
  '.user-card, .post-card': {
    position: 'relative !important',
    containerType: 'inline-size',
  },
  // Kit icon buttons in a .kdl-scope column, shown on hover
  '.post-card .kdl-scope.post-card-download-controls': {
    position: 'absolute',
    top: '6px',
    right: '6px',
    zIndex: 10,
    display: 'none',
    flexDirection: 'column',
    gap: '4px',
    padding: '4px',
    border: '1px solid var(--kdl-border)',
    borderRadius: 'var(--kdl-radius)',
    background: 'var(--kdl-popover)',
    boxShadow: 'var(--kdl-shadow)',
  },
  // Also while the info popover is open, which stays anchored to its button
  '.post-card:hover .kdl-scope.post-card-download-controls, .post-card .kdl-scope.post-card-download-controls:focus-within, .post-card .kdl-scope.post-card-download-controls:has([aria-expanded="true"])': {
    display: 'flex',
  },
  '.post-card-download-controls .kdl-ui-btn--size-icon': {
    width: 'clamp(26px, 16cqw, 32px)',
    height: 'clamp(26px, 16cqw, 32px)',
  },
  // The queue writes "Queued..." / "Processing..." as the label: let the button grow for it
  '.post-card-download-controls .kdl-ui-btn[data-is-queued], .post-card-download-controls .kdl-ui-btn[data-is-downloading]': {
    width: 'auto',
    padding: '0 8px',
    fontSize: '12px',
  },
  // Kit checkbox in a .kdl-scope; the scope gives it a backdrop so it reads on any thumbnail
  '.post-card .kdl-scope.kdl-post-checkbox-scope': {
    position: 'absolute',
    top: '6px',
    left: '6px',
    zIndex: 11,
    display: 'flex',
    padding: '4px',
    borderRadius: 'calc(var(--kdl-radius) - 2px)',
    background: 'color-mix(in srgb, var(--kdl-background) 70%, transparent)',
    lineHeight: 0,
  },
  '.kdl-post-checkbox-scope .kdl-ui-checkbox.kdl-post-checkbox': {
    width: 'clamp(16px, 10cqw, 22px)',
    height: 'clamp(16px, 10cqw, 22px)',
    backgroundSize: '75%',
  },
  // Self-scoped kit icon button (.kdl-scope.kdl-ui-btn)
  '.kdl-scope.kdl-quick-fav-btn': {
    position: 'absolute',
    top: '6px',
    right: '6px',
    zIndex: 12,
    width: 'clamp(24px, 14cqw, 32px)',
    height: 'clamp(24px, 14cqw, 32px)',
    opacity: 0,
    pointerEvents: 'none',
    transition: 'opacity 0.15s, background-color 0.15s',
  },
  '.user-card:hover .kdl-scope.kdl-quick-fav-btn, .post-card:hover .kdl-scope.kdl-quick-fav-btn, .kdl-scope.kdl-quick-fav-btn:focus-visible': {
    opacity: 1,
    pointerEvents: 'auto',
  },
  '.kdl-scope.kdl-quick-fav-btn.kdl-favorited': {
    color: 'var(--kdl-warning)',
  },
  '.kdl-quick-fav-btn.kdl-favorited svg': {
    fill: 'currentColor',
  },
  // toggleFavorite swaps in a spinner and disables the button while it works
  '.kdl-scope.kdl-quick-fav-btn:disabled': {
    opacity: 1,
    cursor: 'wait',
  },
  // List cards carry both the download column (top right) and the star: the star moves to the free corner
  '.post-card:has(> .post-card-download-controls) > .kdl-scope.kdl-quick-fav-btn': {
    right: 'auto',
    left: '6px',
  },
  // Touch screens have no hover: keep the star and the download buttons visible, as a row
  '@media (hover: none)': {
    '.user-card .kdl-scope.kdl-quick-fav-btn, .post-card .kdl-scope.kdl-quick-fav-btn': {
      opacity: 0.92,
      pointerEvents: 'auto',
    },
    // One row along the bottom edge of the thumbnail (100cqw tall when square; the skin's shape setting
    // gives its height per width), clear of the checkbox and star
    '.post-card .kdl-scope.post-card-download-controls': {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'nowrap',
      top: 'calc(100cqw * var(--kdl-sk-thumb-h, 1) - 40px)',
      right: '6px',
      gap: '3px',
      padding: '3px',
    },
    '.post-card-download-controls .kdl-ui-btn--size-icon': {
      width: '28px',
      height: '28px',
    },
  },
});
