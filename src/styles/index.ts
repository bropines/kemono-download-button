import { downloadButtonStyles } from './downloadButton.styles';
import { kuiMainStyles } from './components/kuiMain.styles';
import { kuiPlyrStyles } from './components/kuiPlyr.styles';
import { commentsStyles } from './components/comments.styles';

export { downloadButtonStyles } from './downloadButton.styles';
export { kuiMainStyles } from './components/kuiMain.styles';
export { kuiPlyrStyles } from './components/kuiPlyr.styles';
export { THEME } from './theme';

export const KEMONO_DOWNLOADER_STYLES = downloadButtonStyles;
export const KUI_STYLES = kuiMainStyles;
export const KUI_PLYR_STYLES = kuiPlyrStyles;

export const CSS_STYLES = [
  KEMONO_DOWNLOADER_STYLES,
  KUI_STYLES,
  KUI_PLYR_STYLES,
  commentsStyles,
].join('\n\n');
