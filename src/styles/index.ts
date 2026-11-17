import { downloadButtonStyles } from './downloadButton.styles';
import { kuiMainStyles } from './components/kuiMain.styles';
import { kuiPlyrStyles } from './components/kuiPlyr.styles';
import { commentsStyles } from './components/comments.styles';
import { iconStyles } from './components/icons.styles';

export const CSS_STYLES = [
  downloadButtonStyles,
  kuiMainStyles,
  kuiPlyrStyles,
  commentsStyles,
  // Last, so its icon rules win over older "svg { fill }" rules
  iconStyles,
].join('\n\n');
