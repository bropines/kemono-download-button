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
  '.kdl-post-checkbox': {
    position: 'absolute',
    top: '6px',
    left: '6px',
    zIndex: 11,
    width: 'clamp(16px, 10cqw, 22px)',
    height: 'clamp(16px, 10cqw, 22px)',
    cursor: 'pointer',
    padding: '4px',
    margin: 0,
    backgroundClip: 'content-box',
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
});
