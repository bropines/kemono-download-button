import { collectFilesForPost } from '../../services/collectorService';
import { state } from '../../state/store';
import { PostDetails } from '../../types';
import { el } from '../../utils/dom';
import { showMessage } from '../toast';

export async function showFilePickerModal(postDetails: PostDetails): Promise<void> {
  const overlay = el('div', {
    id: 'kdl-file-picker-overlay',
    onClick: (e: MouseEvent) => {
      if (e.target === overlay) overlay.remove();
    }
  });

  const modal = el('div', { id: 'kdl-file-picker-modal' }, [el('h4', {}, ['Loading attachments...'])]);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  try {
    const { files } = await collectFilesForPost(postDetails, { template: state.settings.fileNameTemplate });
    const attachments = files.filter((t) => t.source === 'url');

    if (attachments.length === 0) {
      modal.replaceChildren(el('h4', {}, ['No attachments found for this post.']));
      return;
    }

    const list = el('ul', { id: 'kdl-file-picker-list' });
    attachments.forEach((file) => {
      const fileName = file.name.split('/').pop() || file.name;
      const a = el('a', { href: '#', dataset: { url: file.data, name: file.name } }, [fileName]);
      list.appendChild(el('li', {}, [a]));
    });

    list.addEventListener('click', (e: MouseEvent) => {
      e.preventDefault();
      const link = (e.target as HTMLElement).closest('a');
      if (link) {
        const fullPath = link.dataset.name!;
        const fileName = fullPath.split('/').pop() || fullPath;
        showMessage(`Starting download for ${fileName}`, 'info');
        GM_download({ url: link.dataset.url!, name: fileName, saveAs: false });
        overlay.remove();
      }
    });

    modal.replaceChildren(el('h4', {}, [`Select a file to download (${attachments.length})`]), list);
  } catch (error: any) {
    modal.replaceChildren(
      el('h4', {}, ['Failed to load attachments.']),
      el('p', { style: { color: '#ccc', fontSize: '0.9em' } }, [error.message])
    );
  }
}
