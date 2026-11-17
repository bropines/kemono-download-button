import { css } from '../../../utils/cssBuilder';

export const tabsStyles = css({
  '.kdl-ui-tabs': { display: 'flex', flexDirection: 'column', gap: '8px' },
  '.kdl-ui-tabs__list': {
    display: 'inline-flex',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    overflowX: 'auto',
    height: '36px',
    padding: '4px',
    borderRadius: 'var(--kdl-radius)',
    background: 'var(--kdl-muted)',
    color: 'var(--kdl-muted-foreground)',
  },
  '.kdl-ui-tabs__trigger': {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '0 12px',
    borderRadius: 'calc(var(--kdl-radius) - 2px)',
    fontSize: '14px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    transition: 'background-color 0.15s, color 0.15s',
  },
  '.kdl-ui-tabs__trigger:hover': { color: 'var(--kdl-foreground)' },
  '.kdl-ui-tabs__trigger[aria-selected="true"]': {
    background: 'var(--kdl-background)',
    color: 'var(--kdl-foreground)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
  '.kdl-ui-tabs__trigger:disabled': { opacity: 0.5, pointerEvents: 'none' },
  '.kdl-ui-tabs__panel': { outline: 'none' },
  '.kdl-ui-tabs__panel:focus-visible': { outline: '2px solid var(--kdl-ring)', outlineOffset: '2px' },
  '.kdl-ui-tabs__panel[hidden]': { display: 'none' },
});
