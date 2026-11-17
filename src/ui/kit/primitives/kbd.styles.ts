import { css } from '../../../utils/cssBuilder';

export const kbdStyles = css({
  '.kdl-ui-kbd-group': { display: 'inline-flex', alignItems: 'center', gap: '4px', font: 'inherit' },
  '.kdl-ui-kbd': {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '20px',
    height: '20px',
    padding: '0 4px',
    border: '1px solid var(--kdl-border)',
    borderRadius: '4px',
    background: 'var(--kdl-muted)',
    color: 'var(--kdl-muted-foreground)',
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: '11px',
    fontWeight: 500,
    lineHeight: 1,
    userSelect: 'none',
  },
});
