import { showMessage } from '../ui/toast';
import { saveBlob } from '../utils/saveFile';
import { PostDetails } from '../types';
import { collectFilesForPost } from './collectorService';
import { state } from '../state/store';
import { debugLog } from '../utils/helpers';

export async function executeLinkAction(
  actionType: 'copy-aria' | 'download-txt' | 'share',
  postDetails: PostDetails,
  buttonEl: HTMLElement,
  originalText: string
): Promise<void> {
  const { files } = await collectFilesForPost(postDetails, { template: state.settings.fileNameTemplate });
  const urlFiles = files.filter((f) => f.source === 'url');

  if (urlFiles.length === 0) {
    showMessage('No download links found for this post.', 'warning');
    return;
  }

  if (actionType === 'copy-aria') {
    const textToCopy = urlFiles.map((f) => `${f.data}\n  out=${f.name}`).join('\n');
    GM_setClipboard(textToCopy);
    showMessage(`Copied ${urlFiles.length} links formatted for aria2c/IDM!`, 'info');
  } else if (actionType === 'download-txt') {
    const textContent = urlFiles.map((f) => f.data).join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const fileName = `${postDetails.authorName}_${postDetails.postTitle}_${postDetails.postID}_links.txt`;
    saveBlob(blob, fileName);
    showMessage(`Downloaded ${urlFiles.length} links as text file for ADM!`, 'info');
  } else if (actionType === 'share') {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: postDetails.postTitle,
          text: `Download links for ${postDetails.postTitle} by ${postDetails.authorName}:\n` + urlFiles.map((f) => f.data).join('\n')
        });
        showMessage('Links shared successfully!', 'info');
      } catch (err) {
        debugLog('Share cancelled or failed:', err);
      }
    } else {
      showMessage('Web Share API is not supported in this browser.', 'warning');
    }
  }
}
