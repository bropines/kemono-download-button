import { collectFilesForPost } from '../../services/collectorService';
import { downloadFilesToDiskWithProgress, DownloadFileSpec } from '../../services/downloadService';
import { state } from '../../state/store';
import { FileItem, PostDetails } from '../../types';
import { el } from '../../utils/dom';
import { addKitStyles, badge, button, checkbox, dialog, emptyState, kitIcon, progress, scrollArea, setProgress, type DialogHandle } from '../kit';
import { filePickerModalStyles } from '../../styles/components/filePickerModal.styles';
import { showMessage } from '../toast';

const baseName = (name: string): string => name.split('/').pop() || name;

/** Short type label from the extension ("JPG", "ZIP"), or a generic one. */
function fileType(file: FileItem): string {
  const match = /\.([a-z0-9]{1,5})$/i.exec(baseName(file.name));
  return match ? match[1].toUpperCase() : file.isMedia ? 'MEDIA' : 'FILE';
}

/** Icon, name and type badge shared by both pickers' rows. */
const fileRowParts = (file: FileItem) => [
  kitIcon(file.isMedia ? 'image' : 'file'),
  el('span', { className: 'kdl-ov-picker__name', title: baseName(file.name) }, [baseName(file.name)]),
  badge({ text: fileType(file), variant: 'outline' }),
];

interface Picker {
  handle: DialogHandle;
  setTitle: (text: string) => void;
  isClosed: () => boolean;
}

function openPicker(title: string, size: 'md' | 'lg', id: string): Picker {
  addKitStyles('kdl-file-picker-styles', filePickerModalStyles);
  let closed = false;
  const handle = dialog({ title, size, onClose: () => (closed = true) });
  handle.element.id = id;
  handle.open();
  const titleNode = handle.element.querySelector('.kdl-ui-dialog__title')!;
  return { handle, setTitle: (text) => (titleNode.textContent = text), isClosed: () => closed };
}

const statusLine = (text: string, error = false) =>
  el('p', { className: `kdl-ov-picker__status${error ? ' kdl-ov-picker__status--error' : ''}` }, [text]);

export async function showFilePickerModal(postDetails: PostDetails): Promise<void> {
  const { handle, setTitle } = openPicker('Loading attachments...', 'md', 'kdl-file-picker-modal');
  handle.body.replaceChildren(progress({ ariaLabel: 'Loading attachments' }));

  try {
    const { files } = await collectFilesForPost(postDetails, { template: state.settings.fileNameTemplate });
    const attachments = files.filter((t) => t.source === 'url');

    if (attachments.length === 0) {
      setTitle('No attachments found');
      handle.body.replaceChildren(
        emptyState({ icon: 'paperclip', title: 'Nothing to download', description: 'No attachments or downloadable files available for this post.' })
      );
      return;
    }

    setTitle(`Select a file to download (${attachments.length})`);
    const rows = attachments.map((file) =>
      el('button', {
        type: 'button',
        className: 'kdl-ov-picker__row',
        onClick: async () => {
          const fileName = baseName(file.name);
          handle.close();
          showMessage(`Starting download for ${fileName}`, 'info');
          await downloadFilesToDiskWithProgress([{ url: file.data, fileName }], fileName, 1);
        }
      }, fileRowParts(file))
    );
    handle.body.replaceChildren(scrollArea({ className: 'kdl-ov-picker__list', ariaLabel: 'Attachments', children: rows }));
    rows[0]?.focus();
  } catch (error: any) {
    setTitle('Failed to load attachments');
    handle.body.replaceChildren(statusLine(error.message, true));
  }
}

export async function showMultiPostFilePickerModal(posts: PostDetails[]): Promise<void> {
  if (!posts || posts.length === 0) return;

  const picker = openPicker(`Fetching attachments for ${posts.length} posts...`, 'lg', 'kdl-file-picker-modal');
  const { handle, setTitle } = picker;
  const loadStatus = statusLine(`Fetching metadata (0/${posts.length} posts loaded)...`);
  const loadBar = progress({ value: 0, max: posts.length, ariaLabel: 'Fetching attachments' });
  handle.body.replaceChildren(el('div', { className: 'kdl-ui-stack' }, [loadStatus, loadBar]));

  try {
    const postFileGroups: Array<{ post: PostDetails; files: FileItem[] }> = [];
    let loadedCount = 0;
    for (const post of posts) {
      // Closing the dialog stops fetching the rest
      if (picker.isClosed()) return;
      const { files } = await collectFilesForPost(post, { template: state.settings.fileNameTemplate });
      const urlFiles = files.filter((f) => f.source === 'url');
      if (urlFiles.length > 0) postFileGroups.push({ post, files: urlFiles });
      loadedCount++;
      loadStatus.textContent = `Fetching metadata (${loadedCount}/${posts.length} posts loaded)...`;
      setProgress(loadBar, loadedCount);
    }

    if (postFileGroups.length === 0) {
      setTitle('No downloadable attachments found');
      handle.body.replaceChildren(
        emptyState({ icon: 'paperclip', title: 'Nothing to download', description: 'None of the selected posts contain downloadable attachments.' })
      );
      return;
    }

    const totalFilesCount = postFileGroups.reduce((acc, g) => acc + g.files.length, 0);
    setTitle(`Pick Attachments (${totalFilesCount} files in ${postFileGroups.length} posts)`);

    const fileBoxes: Array<{ box: HTMLInputElement; file: FileItem }> = [];
    const groupBoxes: Array<{ box: HTMLInputElement; files: HTMLInputElement[] }> = [];
    const countBadge = badge({ text: '', variant: 'secondary' });
    const downloadBtn = button({ label: 'Download selected', icon: 'download', onClick: () => void startDownload() });

    // Tri-state sync: a group (or "all") box is checked, unchecked or indeterminate after its files
    const syncTriState = (box: HTMLInputElement, files: HTMLInputElement[]) => {
      const checked = files.filter((f) => f.checked).length;
      box.checked = checked === files.length;
      box.indeterminate = checked > 0 && checked < files.length;
    };
    const refresh = () => {
      const count = fileBoxes.filter((f) => f.box.checked).length;
      countBadge.textContent = `${count} / ${totalFilesCount} selected`;
      downloadBtn.disabled = count === 0;
      groupBoxes.forEach((g) => syncTriState(g.box, g.files));
      syncTriState(allBox, fileBoxes.map((f) => f.box));
    };
    const setAll = (boxes: HTMLInputElement[], value: boolean) => {
      boxes.forEach((b) => (b.checked = value));
      refresh();
    };

    const allBox = checkbox({ checked: true, ariaLabel: 'Select all files', onChange: (value) => setAll(fileBoxes.map((f) => f.box), value) });

    const groups = postFileGroups.map((group) => {
      const rows = group.files.map((file) => {
        const box = checkbox({ checked: true, onChange: refresh });
        fileBoxes.push({ box, file });
        return el('label', { className: 'kdl-ov-picker__row' }, [box, ...fileRowParts(file)]);
      });
      const files = fileBoxes.slice(-rows.length).map((f) => f.box);
      const groupBox = checkbox({ checked: true, ariaLabel: `Select all files of ${group.post.postTitle}`, onChange: (value) => setAll(files, value) });
      groupBoxes.push({ box: groupBox, files });
      return el('div', { className: 'kdl-ov-picker__group' }, [
        el('label', { className: 'kdl-ov-picker__group-header' }, [
          groupBox,
          el('span', { className: 'kdl-ov-picker__group-title', title: group.post.postTitle }, [group.post.postTitle]),
          el('span', { className: 'kdl-ov-picker__date' }, [group.post.postDate || '']),
          badge({ text: String(group.files.length), variant: 'secondary' })
        ]),
        ...rows
      ]);
    });

    const startDownload = async () => {
      const specs: DownloadFileSpec[] = fileBoxes.filter((f) => f.box.checked).map((f) => ({ url: f.file.data, fileName: f.file.name }));
      if (specs.length === 0) {
        showMessage('Please select at least one file to download.', 'warning');
        return;
      }
      handle.close();
      showMessage(`Starting ${specs.length} parallel downloads with progress tracking...`, 'info');
      await downloadFilesToDiskWithProgress(specs, `Bulk Pick (${specs.length} files)`);
    };

    handle.body.replaceChildren(
      el('div', { className: 'kdl-ov-picker__toolbar' }, [
        el('label', { className: 'kdl-ui-row' }, [allBox, 'Select all']),
        countBadge
      ]),
      scrollArea({ className: 'kdl-ov-picker__list', ariaLabel: 'Attachments by post', children: groups })
    );
    handle.footer.replaceChildren(button({ label: 'Cancel', variant: 'outline', onClick: handle.close }), downloadBtn);
    handle.footer.hidden = false;
    refresh();
    downloadBtn.focus();
  } catch (error: any) {
    setTitle('Failed to fetch attachments');
    handle.body.replaceChildren(statusLine(error.message, true));
  }
}
