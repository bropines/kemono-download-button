import { css } from '../../../utils/cssBuilder';

export const separatorStyles = css({
  '.kdl-ui-separator': { flexShrink: 0, background: 'var(--kdl-border)' },
  '.kdl-ui-separator--horizontal': { width: '100%', height: '1px' },
  '.kdl-ui-separator--vertical': { width: '1px', alignSelf: 'stretch', minHeight: '16px' },
});
