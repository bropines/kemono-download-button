import { showMessage } from '../ui/toast';
import { saveBlob } from '../utils/saveFile';
import { copyToClipboard } from '../utils/clipboard';
import { PostDetails } from '../types';
import { collectFilesForPost } from './collectorService';
import { state } from '../state/store';
import { debugLog } from '../utils/helpers';
import { t } from '../i18n';

export async function executeLinkAction(
  actionType: 'copy-aria' | 'download-txt' | 'share',
  postDetails: PostDetails,
  buttonEl: HTMLElement,
  originalText: string
): Promise<void> {
  const { files } = await collectFilesForPost(postDetails, { template: state.settings.fileNameTemplate });
  const urlFiles = files.filter((f) => f.source === 'url');

  if (urlFiles.length === 0) {
    showMessage(t('dl.links.none'), 'warning');
    return;
  }

  if (actionType === 'copy-aria') {
    const textToCopy = urlFiles.map((f) => `${f.data}\n  out=${f.name}`).join('\n');
    if (await copyToClipboard(textToCopy)) {
      showMessage(t('dl.links.copied', { count: urlFiles.length }), 'info');
    } else {
      showMessage(t('dl.links.copyFailed'), 'error');
    }
  } else if (actionType === 'download-txt') {
    const textContent = urlFiles.map((f) => f.data).join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const fileName = `${postDetails.authorName}_${postDetails.postTitle}_${postDetails.postID}_links.txt`;
    saveBlob(blob, fileName);
    showMessage(t('dl.links.txtSaved', { count: urlFiles.length }), 'info');
  } else if (actionType === 'share') {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: postDetails.postTitle,
          text: `${t('dl.links.shareText', { title: postDetails.postTitle, author: postDetails.authorName })}\n` + urlFiles.map((f) => f.data).join('\n')
        });
        showMessage(t('dl.links.shared'), 'info');
      } catch (err) {
        debugLog('Share cancelled or failed:', err);
      }
    } else {
      showMessage(t('dl.links.shareUnsupported'), 'warning');
    }
  }
}
