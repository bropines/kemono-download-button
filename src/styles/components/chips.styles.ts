import { css } from '../../utils/cssBuilder';
import { THEME } from '../theme';

export const chipsStyles = css({
  '.kdl-chips-container': {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: `1px solid ${THEME.colors.borderSubtle}`,
    borderRadius: THEME.borderRadius.lg,
    padding: '8px 10px',
    transition: 'all 0.2s ease',
  },
  '.kdl-chips-container:focus-within': {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: THEME.colors.primary,
    boxShadow: '0 0 0 3px rgba(56, 189, 248, 0.2)',
  },
  '.kdl-chips-wrapper': {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  '.kdl-chip': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.18), rgba(14, 165, 233, 0.22))',
    border: '1px solid rgba(56, 189, 248, 0.35)',
    color: THEME.colors.primary,
    padding: '3px 10px',
    borderRadius: '14px',
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  '.kdl-chip-remove': {
    cursor: 'pointer',
    fontSize: '0.75rem',
    opacity: 0.7,
    transition: 'opacity 0.2s, color 0.2s',
  },
  '.kdl-chip-remove:hover': {
    opacity: 1,
    color: THEME.colors.danger,
  },
  '.kdl-chips-input': {
    border: 'none !important',
    background: 'transparent !important',
    boxShadow: 'none !important',
    padding: '4px 0 !important',
    fontSize: '0.85rem !important',
    color: '#f8fafc !important',
    outline: 'none !important',
    width: '100% !important',
  },
});
