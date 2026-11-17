import { postCardStyles } from './components/postCard.styles';
import { postActionsStyles } from './components/postActions.styles';
import { fixedControlsStyles } from './components/fixedControls.styles';
import { bulkPanelStyles } from './components/bulkPanel.styles';
import { filePickerModalStyles } from './components/filePickerModal.styles';
import { authorManagerModalStyles } from './components/authorManagerModal.styles';
import { progressBarStyles } from './components/progressBar.styles';

/**
 * Downloader Component Styles for Kemono, Coomer, and Pawchive.
 * Assembled from modular component style builders.
 */
export const downloadButtonStyles = [
  postCardStyles,
  postActionsStyles,
  fixedControlsStyles,
  bulkPanelStyles,
  filePickerModalStyles,
  authorManagerModalStyles,
  progressBarStyles,
].join('\n\n');
