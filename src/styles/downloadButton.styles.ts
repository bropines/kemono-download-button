import { messageBoxStyles } from './components/messageBox.styles';
import { postCardStyles } from './components/postCard.styles';
import { postActionsStyles } from './components/postActions.styles';
import { fixedControlsStyles } from './components/fixedControls.styles';
import { settingsModalStyles } from './components/settingsModal.styles';
import { bulkPanelStyles } from './components/bulkPanel.styles';
import { filePickerModalStyles } from './components/filePickerModal.styles';
import { authorManagerModalStyles } from './components/authorManagerModal.styles';
import { progressBarStyles } from './components/progressBar.styles';
import { chipsStyles } from './components/chips.styles';

/**
 * Downloader Component Styles for Kemono, Coomer, and Pawchive.
 * Assembled from modular component style builders.
 */
export const downloadButtonStyles = [
  messageBoxStyles,
  postCardStyles,
  postActionsStyles,
  fixedControlsStyles,
  settingsModalStyles,
  bulkPanelStyles,
  filePickerModalStyles,
  authorManagerModalStyles,
  progressBarStyles,
  chipsStyles,
].join('\n\n');
