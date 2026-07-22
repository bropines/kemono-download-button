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
    const attachments = files.filter((t) => !t.isMedia && t.source === 'url');

    if (attachments.length === 0) {
      modal.innerHTML = '<h4>No attachments found for this post.</h4>';
      return;
    }

    modal.innerHTML = '<h4>Select an attachment to download</h4><ul id="kdl-file-picker-list"></ul>';
    const list = modal.querySelector('#kdl-file-picker-list') as HTMLUListElement;

    attachments.forEach((file) => {
      const li = el('li');
      const a = el('a', { href: '#', dataset: { url: file.data, name: file.name } }, [file.name.split('/').pop()]);
      li.appendChild(a);
      list.appendChild(li);
    });

    list.addEventListener('click', (e: MouseEvent) => {
      e.preventDefault();
      const link = (e.target as HTMLElement).closest('a');
      if (link) {
        const fileName = link.dataset.name!.split('/').pop();
        showMessage(`Starting download for ${fileName}`, 'info');
        GM_download({ url: link.dataset.url!, name: link.dataset.name!, saveAs: false });
        overlay.remove();
      }
    });
  } catch (error: any) {
    modal.innerHTML = `<h4>Failed to load attachments.</h4><p style="color:#ccc;font-size:0.9em;">${error.message}</p>`;
  }
}
