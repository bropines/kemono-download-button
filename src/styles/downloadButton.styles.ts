import { postCardStyles } from './components/postCard.styles';
import { postActionsStyles } from './components/postActions.styles';
import { fixedControlsStyles } from './components/fixedControls.styles';

/**
 * Downloader styles for the parts injected into the site's own layout.
 * Floating surfaces (settings, bulk bar, file picker, author manager, progress) style themselves
 * inside the kit shadow root.
 */
export const downloadButtonStyles = [
  postCardStyles,
  postActionsStyles,
  fixedControlsStyles,
].join('\n\n');
