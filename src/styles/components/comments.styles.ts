import { css } from '../../utils/cssBuilder';
import { THEME } from '../theme';

export const commentsStyles = css({
  /* Toolbar: kit controls in a .kdl-scope */
  '.kdl-scope.kui-comments-toolbar': {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '8px 12px',
    margin: '8px 0 12px',
  },
  '.kui-comments-toolbar .kui-comments-count': {
    marginRight: 'auto',
    color: 'var(--kdl-muted-foreground)',
    fontSize: '13px',
  },
  '.kui-comments-toolbar .kui-comments-layouts, .kui-comments-toolbar.kui-comments-toolbar--carousel .kui-comments-nav': {
    display: 'inline-flex',
    gap: '2px',
    padding: '2px',
    borderRadius: 'var(--kdl-radius)',
    background: 'var(--kdl-muted)',
  },
  '.kui-comments-toolbar .kui-comments-nav': {
    display: 'none',
  },
  '.kui-comments-toolbar .kui-comments-btn': {
    width: '30px',
    height: '30px',
  },
  '.kui-comments-toolbar .kui-comments-btn.kui-active': {
    background: 'var(--kdl-background)',
    color: 'var(--kdl-foreground)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
  },
  '.kui-comments-toolbar .kui-comments-limit': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  '.kui-comments-toolbar .kui-comments-limit .kdl-ui-label': {
    color: 'var(--kdl-muted-foreground)',
    fontSize: '13px',
    fontWeight: 400,
  },
  '.kui-comments-toolbar .kui-comments-limit-select': {
    width: 'auto',
    height: '32px',
    fontSize: '13px',
  },
  '.kui-comment-hidden': {
    display: 'none !important',
  },

  '.post__comments.kui-comments--grid': {
    display: 'grid !important',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    // Every card gets the same height; a longer one expands over its neighbours instead of stretching the row
    gridAutoRows: '11em',
    gap: '10px',
  },
  '.post__comments.kui-comments--carousel': {
    // Without it the row of cards reports its full width upwards and widens the whole page
    contain: 'inline-size',
    display: 'flex !important',
    alignItems: 'flex-start',
    gap: '10px',
    overflowX: 'auto',
    overscrollBehaviorX: 'contain',
    scrollSnapType: 'x mandatory',
    paddingBottom: '8px',
    scrollbarWidth: 'thin',
    scrollbarColor: `${THEME.scrollbars.thumbBg} transparent`,
  },
  '.kui-comments--grid > .comment, .kui-comments--carousel > .comment': {
    boxSizing: 'border-box',
    minWidth: 0,
    margin: '0 !important',
    padding: '10px 12px',
    border: `1px solid ${THEME.colors.borderSubtle}`,
    borderRadius: THEME.borderRadius.lg,
    background: THEME.colors.cardBg,
    overflowWrap: 'anywhere',
  },
  '.kui-comment-replies': {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: '8px',
    paddingLeft: '10px',
    borderLeft: `2px solid ${THEME.colors.primary}`,
  },
  '.kui-comment-replies > .comment': {
    margin: '0 !important',
    padding: '6px 10px',
    borderRadius: THEME.borderRadius.md,
    background: 'rgba(56, 189, 248, 0.06)',
  },
  // The ">>id" back-reference is redundant once a reply sits under its parent
  '.kui-comment-replies .comment__reply': {
    display: 'none',
  },
  // Author comments that aren't replies stay top-level cards with an accent
  '.kui-comments--grid > .comment--user, .kui-comments--carousel > .comment--user': {
    borderColor: THEME.colors.primary,
  },
  '.kui-comments--carousel > .comment': {
    flex: '0 0 auto',
    // Cards follow their text: a short comment gets a compact card instead of a wall of empty space
    width: 'max-content',
    minWidth: '200px',
    maxWidth: 'min(360px, 85%)',
    // Same height as grid cards; a long one expands in place
    height: '11em',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    scrollSnapAlign: 'start',
  },

  '.kui-comments--grid .comment__footer, .kui-comments--carousel .comment__footer': {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '4px 10px',
  },
  '.kui-comments--grid .kdl-scope.kui-translate-btn, .kui-comments--carousel .kdl-scope.kui-translate-btn': {
    marginLeft: 0,
    flexShrink: 0,
  },
  // Only the comment text decides a carousel card's width, not its timestamp + button row
  '.kui-comments--carousel .comment__footer': {
    contain: 'inline-size',
  },

  '.kui-comments--grid > .comment': {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  '.kui-comments--grid > .comment > .comment__header, .kui-comments--carousel > .comment > .comment__header': {
    flex: 'none',
  },
  '.kui-comments--grid > .comment > .comment__body, .kui-comments--carousel > .comment > .comment__body': {
    flex: '1 1 auto',
    minHeight: 0,
    overflow: 'hidden',
  },
  // One footer line keeps the text area the same in every card
  '.kui-comments--grid > .comment > .comment__footer, .kui-comments--carousel > .comment > .comment__footer': {
    flex: 'none',
    flexWrap: 'nowrap',
    marginTop: 'auto',
  },
  '.kui-comments--grid > .comment > .comment__footer .timestamp, .kui-comments--carousel > .comment > .comment__footer .timestamp': {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  '.kui-comments--grid > .kui-comment-clipped:not(.kui-comment-expanded) > .comment__body, .kui-comments--carousel > .kui-comment-clipped:not(.kui-comment-expanded) > .comment__body': {
    WebkitMaskImage: 'linear-gradient(to bottom, #000 60%, transparent)',
    maskImage: 'linear-gradient(to bottom, #000 60%, transparent)',
  },
  '.kui-comments--grid > .comment:not(.kui-comment-expanded) > .kui-comment-replies, .kui-comments--carousel > .comment:not(.kui-comment-expanded) > .kui-comment-replies': {
    display: 'none',
  },
  '.kui-comments--grid > .kui-comment-expanded': {
    alignSelf: 'start',
    minHeight: '100%',
    zIndex: 5,
    borderColor: THEME.colors.primary,
    // Opaque, since the card lies over the ones below
    background: `linear-gradient(${THEME.colors.cardBg}, ${THEME.colors.cardBg}), ${THEME.colors.panelBg}`,
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6)',
  },
  // A carousel card grows in place, its neighbours keep their height
  '.kui-comments--carousel > .kui-comment-expanded': {
    height: 'auto',
    borderColor: THEME.colors.primary,
  },
  '.kui-comments--grid > .kui-comment-expanded > .comment__body, .kui-comments--carousel > .kui-comment-expanded > .comment__body': {
    flex: 'none',
  },
  /* Expand toggle: a self-scoped kit ghost button, shown only on cards that need it */
  '.comment__footer > .kui-comment-expand-btn': {
    display: 'none',
    order: 10,
    flex: 'none',
    height: '26px',
    minWidth: '26px',
    padding: '0 8px',
    gap: '4px',
    marginLeft: 'auto',
    color: 'var(--kdl-muted-foreground)',
    fontSize: '12px',
  },
  '.kui-comment-expandable > .comment__footer > .kui-comment-expand-btn': {
    display: 'inline-flex',
  },
  '.kui-comment-expanded > .comment__footer > .kui-comment-expand-btn': {
    color: 'var(--kdl-foreground)',
    background: 'var(--kdl-accent)',
  },
  '.kdl-scope.kui-comments-more': {
    display: 'flex',
    width: 'fit-content',
    margin: '12px auto 0',
  },

  /* Translate buttons (post title, Content heading, comment footers): self-scoped kit ghost icon buttons */
  '.kdl-scope.kui-translate-btn': {
    width: '28px',
    height: '28px',
    marginLeft: '8px',
    verticalAlign: 'middle',
    color: 'var(--kdl-muted-foreground)',
  },
  '.kdl-scope.kui-translate-btn[data-state="translated"]': {
    background: 'var(--kdl-accent)',
    color: 'var(--kdl-accent-foreground)',
  },
  // Loading disables it: keep it visible and say it's busy rather than fading it out
  '.kdl-scope.kui-translate-btn:disabled': {
    opacity: 1,
    cursor: 'wait',
  },
});
