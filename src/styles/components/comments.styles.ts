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
    gap: '10px',
    overflowX: 'auto',
    overscrollBehaviorX: 'contain',
    scrollSnapType: 'x mandatory',
    paddingBottom: '8px',
    scrollbarWidth: 'thin',
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
  // Replies from the post author are flat siblings marked comment--user
  '.kui-comments--grid > .comment--user, .kui-comments--carousel > .comment--user': {
    borderColor: THEME.colors.primary,
  },
  '.kui-comments--carousel > .comment': {
    flex: '0 0 min(320px, 85%)',
    maxHeight: '320px',
    overflowY: 'auto',
    scrollSnapAlign: 'start',
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
