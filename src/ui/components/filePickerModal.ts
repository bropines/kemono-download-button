import { collectFilesForPost } from '../../services/collectorService';
import { downloadFilesToDiskWithProgress, DownloadFileSpec } from '../../services/downloadService';
import { state } from '../../state/store';
import { FileItem, PostDetails } from '../../types';
import { el } from '../../utils/dom';
import { icon, IconName } from '../../config/icons';

const setHeading = (header: HTMLElement, iconName: IconName, text: string): void =>
  header.querySelector('h4')!.replaceChildren(icon(iconName), text);
import { showMessage } from '../toast';

export async function showFilePickerModal(postDetails: PostDetails): Promise<void> {
  const closeOverlay = () => {
    overlay.remove();
    document.removeEventListener('keydown', onEscape);
  };
  const onEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeOverlay();
  };
  document.addEventListener('keydown', onEscape);

  const closeBtn = el('button', {
    className: 'kdl-modal-close',
    title: 'Close',
    onClick: closeOverlay
  }, [icon('x')]);

  const header = el('div', { className: 'kdl-modal-header' }, [
    el('h4', {}, [icon('paperclip'), 'Loading attachments...']),
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
      setHeading(header, 'paperclip', 'No attachments found');
      modal.appendChild(el('p', { style: { color: '#94a3b8', margin: '16px 0 0' } }, ['No attachments or downloadable files available for this post.']));
      return;
    }

    setHeading(header, 'paperclip', `Select a file to download (${attachments.length})`);

    const list = el('ul', { id: 'kdl-file-picker-list' });
    attachments.forEach((file) => {
      const fileName = file.name.split('/').pop() || file.name;
      const fileIcon = icon(file.isMedia ? 'image' : 'file');
      const a = el('a', { href: '#', dataset: { url: file.data, name: file.name } }, [
        el('span', { className: 'kdl-file-icon' }, [fileIcon]),
        el('span', { className: 'kdl-file-name' }, [fileName])
      ]);
      list.appendChild(el('li', {}, [a]));
    });

    list.addEventListener('click', async (e: MouseEvent) => {
      e.preventDefault();
      const link = (e.target as HTMLElement).closest('a');
      if (link) {
        const url = link.dataset.url!;
        const fileName = link.dataset.name!.split('/').pop() || link.dataset.name!;
        closeOverlay();
        showMessage(`Starting download for ${fileName}`, 'info');
        await downloadFilesToDiskWithProgress(
          [{ url, fileName }],
          fileName,
          1
        );
      }
    });

    modal.appendChild(list);
  } catch (error: any) {
    setHeading(header, 'triangle-alert', 'Failed to load attachments');
    modal.appendChild(el('p', { style: { color: '#f87171', margin: '16px 0 0', fontSize: '0.9rem' } }, [error.message]));
  }
}

export async function showMultiPostFilePickerModal(posts: PostDetails[]): Promise<void> {
  if (!posts || posts.length === 0) return;

  const closeOverlay = () => {
    overlay.remove();
    document.removeEventListener('keydown', onEscape);
  };
  const onEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeOverlay();
  };
  document.addEventListener('keydown', onEscape);

  const closeBtn = el('button', {
    className: 'kdl-modal-close',
    title: 'Close',
    onClick: closeOverlay
  }, [icon('x')]);

  const header = el('div', { className: 'kdl-modal-header' }, [
    el('h4', {}, [icon('paperclip'), `Fetching attachments for ${posts.length} posts...`]),
    closeBtn
  ]);

  const overlay = el('div', {
    id: 'kdl-file-picker-overlay',
    onClick: (e: MouseEvent) => {
      if (e.target === overlay) closeOverlay();
    }
  });

  const modal = el('div', { id: 'kdl-file-picker-modal', style: { width: '680px' } }, [header]);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const statusText = el('p', { style: { color: '#94a3b8', margin: '0 0 16px', fontSize: '0.9rem' } }, [
    `Fetching metadata (0/${posts.length} posts loaded)...`
  ]);
  modal.appendChild(statusText);

  try {
    let loadedCount = 0;
    const postFileGroups: Array<{ post: PostDetails; files: FileItem[] }> = [];

    for (const post of posts) {
      const { files } = await collectFilesForPost(post, { template: state.settings.fileNameTemplate });
      const urlFiles = files.filter((f) => f.source === 'url');
      if (urlFiles.length > 0) {
        postFileGroups.push({ post, files: urlFiles });
      }
      loadedCount++;
      statusText.textContent = `Fetching metadata (${loadedCount}/${posts.length} posts loaded)...`;
    }

    if (postFileGroups.length === 0) {
      setHeading(header, 'paperclip', 'No downloadable attachments found');
      statusText.textContent = 'None of the selected posts contain downloadable attachments.';
      return;
    }

    const totalFilesCount = postFileGroups.reduce((acc, g) => acc + g.files.length, 0);
    setHeading(header, 'paperclip', `Pick Attachments (${totalFilesCount} files in ${postFileGroups.length} posts)`);
    statusText.remove();

    const downloadBtn = el('button', {
      className: 'kdl-multi-dl-btn',
      onClick: async () => {
        const checkedBoxes = Array.from(modal.querySelectorAll<HTMLInputElement>('.kdl-multi-file-cb:checked'));
        if (checkedBoxes.length === 0) {
          showMessage('Please select at least one file to download.', 'warning');
          return;
        }

        const specs: DownloadFileSpec[] = checkedBoxes.map((cb) => ({
          url: cb.dataset.url!,
          fileName: cb.dataset.name!
        }));

        closeOverlay();
        showMessage(`Starting ${specs.length} parallel downloads with progress tracking...`, 'info');
        await downloadFilesToDiskWithProgress(specs, `Bulk Pick (${specs.length} files)`);
      }
    }, [`Download Selected (${totalFilesCount})`]) as HTMLButtonElement;

    const updateCheckedCounter = () => {
      const count = modal.querySelectorAll('.kdl-multi-file-cb:checked').length;
      downloadBtn.textContent = `Download Selected (${count})`;
      downloadBtn.disabled = count === 0;
    };

    const actionToolbar = el('div', { className: 'kdl-multi-picker-toolbar' }, [
      el('button', {
        className: 'kdl-tb-btn',
        onClick: () => {
          modal.querySelectorAll<HTMLInputElement>('.kdl-multi-file-cb').forEach((cb) => (cb.checked = true));
          updateCheckedCounter();
        }
      }, ['Select All']),
      el('button', {
        className: 'kdl-tb-btn',
        onClick: () => {
          modal.querySelectorAll<HTMLInputElement>('.kdl-multi-file-cb').forEach((cb) => (cb.checked = false));
          updateCheckedCounter();
        }
      }, ['Deselect All']),
      downloadBtn
    ]);

    modal.appendChild(actionToolbar);

    const listContainer = el('div', { id: 'kdl-multi-file-picker-list' });

    postFileGroups.forEach((group) => {
      const groupHeader = el('div', { className: 'kdl-post-group-header' }, [
        el('span', { className: 'kdl-post-group-title' }, [icon('pin'), group.post.postTitle]),
        el('span', { className: 'kdl-post-group-date' }, [group.post.postDate || ''])
      ]);

      const groupList = el('ul', { className: 'kdl-group-file-list' });
      group.files.forEach((file) => {
        const fileName = file.name.split('/').pop() || file.name;
        const fileIcon = icon(file.isMedia ? 'image' : 'file');
        const checkbox = el('input', {
          type: 'checkbox',
          checked: true,
          className: 'kdl-multi-file-cb',
          dataset: { url: file.data, name: file.name },
          onChange: updateCheckedCounter
        }) as HTMLInputElement;

        const label = el('label', { className: 'kdl-multi-file-item' }, [
          checkbox,
          el('span', { className: 'kdl-file-icon' }, [fileIcon]),
          el('span', { className: 'kdl-file-name' }, [fileName])
        ]);

        groupList.appendChild(el('li', {}, [label]));
      });

      listContainer.appendChild(el('div', { className: 'kdl-post-group-card' }, [groupHeader, groupList]));
    });

    modal.appendChild(listContainer);
  } catch (error: any) {
    setHeading(header, 'triangle-alert', 'Failed to fetch attachments');
    modal.appendChild(el('p', { style: { color: '#f87171', margin: '16px 0 0' } }, [error.message]));
  }
}
