import { collectFilesForPost } from '../../services/collectorService';
import { state } from '../../state/store';
import { PostDetails } from '../../types';
import { el } from '../../utils/dom';
import { showMessage } from '../toast';

export async function showFilePickerModal(postDetails: PostDetails): Promise<void> {
  const closeOverlay = () => overlay.remove();

  const closeBtn = el('button', {
    className: 'kdl-modal-close',
    title: 'Close',
    onClick: closeOverlay
  }, ['✕']);

  const header = el('div', { className: 'kdl-modal-header' }, [
    el('h4', {}, ['📎 Loading attachments...']),
    closeBtn
  ]);

  const overlay = el('div', {
    id: 'kdl-file-picker-overlay',
    onClick: (e: MouseEvent) => {
      if (e.target === overlay) closeOverlay();
    }
  });

  const modal = el('div', { id: 'kdl-file-picker-modal' }, [header]);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  try {
    const { files } = await collectFilesForPost(postDetails, { template: state.settings.fileNameTemplate });
    const attachments = files.filter((t) => t.source === 'url');

    if (attachments.length === 0) {
      header.querySelector('h4')!.textContent = '📎 No attachments found';
      modal.appendChild(el('p', { style: { color: '#94a3b8', margin: '16px 0 0' } }, ['No attachments or downloadable files available for this post.']));
      return;
    }

    header.querySelector('h4')!.textContent = `📎 Select a file to download (${attachments.length})`;

    const list = el('ul', { id: 'kdl-file-picker-list' });
    attachments.forEach((file) => {
      const fileName = file.name.split('/').pop() || file.name;
      const fileIcon = file.isMedia ? '🖼️' : '📁';
      const a = el('a', { href: '#', dataset: { url: file.data, name: file.name } }, [
        el('span', { className: 'kdl-file-icon' }, [fileIcon]),
        el('span', { className: 'kdl-file-name' }, [fileName])
      ]);
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
        closeOverlay();
      }
    });

    modal.appendChild(list);
  } catch (error: any) {
    header.querySelector('h4')!.textContent = '⚠️ Failed to load attachments';
    modal.appendChild(el('p', { style: { color: '#f87171', margin: '16px 0 0', fontSize: '0.9rem' } }, [error.message]));
  }
}
