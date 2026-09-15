import { css } from '../../utils/cssBuilder';
import { THEME } from '../theme';

export const commentsStyles = css({
  '.kui-comments-toolbar': {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '8px 12px',
    margin: '8px 0 12px',
  },
  '.kui-comments-count': {
    marginRight: 'auto',
    color: THEME.colors.textMuted,
    fontSize: '0.9em',
  },
  '.kui-comments-layouts, .kui-comments-nav': {
    display: 'inline-flex',
    gap: '4px',
  },
  '.kui-comments-nav': {
    display: 'none',
  },
  '.kui-comments-toolbar--carousel .kui-comments-nav': {
    display: 'inline-flex',
  },
  '.kui-comments-btn': {
    minWidth: '32px',
    height: '30px',
    padding: '0 8px',
    border: `1px solid ${THEME.colors.borderSubtle}`,
    borderRadius: THEME.borderRadius.md,
    background: THEME.colors.cardBg,
    color: THEME.colors.textMain,
    fontSize: '15px',
    lineHeight: 1,
    cursor: 'pointer',
    transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
  },
  '.kui-comments-btn:hover': {
    background: THEME.colors.cardHoverBg,
  },
  '.kui-comments-btn.kui-active': {
    borderColor: THEME.colors.primary,
    color: THEME.colors.primary,
  },
  '.kui-comments-limit': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: THEME.colors.textMuted,
    fontSize: '0.9em',
  },
  '.kui-comments-limit select': {
    padding: '3px 6px',
    border: `1px solid ${THEME.colors.borderSubtle}`,
    borderRadius: THEME.borderRadius.sm,
    background: THEME.colors.inputBg,
    color: THEME.colors.textMain,
  },
  '.kui-comment-hidden': {
    display: 'none !important',
  },

  '.post__comments.kui-comments--grid': {
    display: 'grid !important',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    alignItems: 'start',
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
    maxHeight: '320px',
    overflowY: 'auto',
    scrollSnapAlign: 'start',
  },

  '.kui-comment-translate': {
    marginLeft: '10px',
    padding: '2px 8px',
    border: `1px solid ${THEME.colors.borderSubtle}`,
    borderRadius: THEME.borderRadius.pill,
    background: 'transparent',
    color: THEME.colors.textMuted,
    fontSize: '0.8em',
    lineHeight: 1.4,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'color 0.2s, border-color 0.2s',
  },
  '.kui-comment-translate:hover:not(:disabled)': {
    borderColor: THEME.colors.primary,
    color: THEME.colors.primary,
  },
  '.kui-comment-translate:disabled': {
    opacity: 0.6,
    cursor: 'wait',
  },
  '.kui-comments--grid .comment__footer, .kui-comments--carousel .comment__footer': {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '4px 10px',
  },
  '.kui-comments--grid .kui-comment-translate, .kui-comments--carousel .kui-comment-translate': {
    marginLeft: 0,
  },
  // Only the comment text decides a carousel card's width, not its timestamp + button row
  '.kui-comments--carousel .comment__footer': {
    contain: 'inline-size',
  },

  '.kui-comments-more': {
    display: 'block',
    margin: '12px auto 0',
    padding: '7px 16px',
    border: `1px solid ${THEME.colors.borderSubtle}`,
    borderRadius: THEME.borderRadius.pill,
    background: THEME.colors.cardBg,
    color: THEME.colors.textMain,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  '.kui-comments-more:hover': {
    background: THEME.colors.cardHoverBg,
  },
});
