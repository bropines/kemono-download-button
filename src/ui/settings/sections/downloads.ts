import { DEFAULT_SETTINGS } from '../../../config/constants';
import { saveSetting, state } from '../../../state/store';
import { el } from '../../../utils/dom';
import { badge, button, field, input, kitIcon, select } from '../../kit';
import { showMessage } from '../../toast';
import {
  grid,
  notifySaved,
  section,
  settingNumber,
  settingSelect,
  settingSwitch,
  settingText,
  showWhen,
} from '../controls';
import { registerSettingsSection } from '../registry';

const TEMPLATE_TAGS =
  'Tags: {author_name}, {post_date}, {post_title}, {post_id}, {user_id}, {service}, {file_index}, {global_file_index}, {file_name}, {original_file_name}, {file_ext}';

/** Folder picker that fills a text setting with the chosen folder's name. */
function withFolderPicker(fieldNode: HTMLElement): HTMLElement {
  const target = fieldNode.querySelector<HTMLInputElement>('input')!;
  const fill = (name: string) => {
    target.value = name;
    target.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const hidden = el('input', { type: 'file', hidden: true });
  hidden.setAttribute('webkitdirectory', '');
  hidden.addEventListener('change', () => {
    const first = hidden.files?.[0];
    const name = first ? (first.webkitRelativePath || '').split('/')[0] || first.name : '';
    if (name) fill(name);
    hidden.value = '';
  });
  const browse = button({
    label: 'Folder',
    icon: 'folder-open',
    variant: 'outline',
    title: 'Select system folder…',
    className: 'kdl-browse-folder-btn',
    onClick: async () => {
      const picker = (window as unknown as { showDirectoryPicker?: () => Promise<{ name: string }> }).showDirectoryPicker;
      if (picker) {
        try {
          const dir = await picker();
          if (dir?.name) return fill(dir.name);
        } catch (err) {
          if ((err as Error).name === 'AbortError') return;
        }
      }
      hidden.click();
    },
  });
  const row = el('div', { className: 'kdl-settings__row' });
  target.replaceWith(row);
  row.append(target, browse, hidden);
  return fieldNode;
}

function templateControls(): HTMLElement[] {
  const templateField = settingText('fileNameTemplate', 'Template for individual downloads', TEMPLATE_TAGS, {
    placeholder: DEFAULT_SETTINGS.fileNameTemplate,
  });
  const templateInput = templateField.querySelector<HTMLInputElement>('input')!;
  const setTemplate = async (value: string) => {
    templateInput.value = value;
    await saveSetting('fileNameTemplate', value);
    notifySaved();
  };

  const presets = select({ id: 'kdl-template-select', options: [], ariaLabel: 'Saved templates' });
  const renderPresets = () => {
    presets.replaceChildren(
      el('option', { value: '', textContent: '-- Load a saved template --' }),
      ...(state.settings.savedFileNameTemplates || []).map((t) =>
        el('option', { value: t.template, textContent: t.name, dataset: { name: t.name } })
      )
    );
  };
  renderPresets();
  presets.addEventListener('change', () => presets.value && setTemplate(presets.value));

  const nameInput = input({ id: 'kdl-template-name-input', placeholder: 'New template name…', ariaLabel: 'Template name' });
  const saveTemplates = async (list: NonNullable<typeof state.settings.savedFileNameTemplates>) => {
    await saveSetting('savedFileNameTemplates', list);
    renderPresets();
  };

  const savePreset = button({
    id: 'kdl-template-save-btn',
    label: 'Save as preset',
    variant: 'secondary',
    onClick: async () => {
      const name = nameInput.value.trim();
      const template = templateInput.value.trim();
      if (!name || !template) return showMessage('Please provide a name and a template pattern.', 'warning');
      const list = [...(state.settings.savedFileNameTemplates || [])];
      const existing = list.find((t) => t.name === name);
      if (existing) existing.template = template;
      else list.push({ name, template });
      await saveTemplates(list);
      nameInput.value = '';
      showMessage(`Template "${name}" saved`, 'success');
    },
  });
  const deletePreset = button({
    id: 'kdl-template-delete-btn',
    label: 'Delete',
    variant: 'outline',
    onClick: async () => {
      const name = presets.selectedOptions[0]?.dataset.name;
      if (!name) return showMessage('Select a saved template to delete.', 'warning');
      await saveTemplates((state.settings.savedFileNameTemplates || []).filter((t) => t.name !== name));
      showMessage(`Template "${name}" deleted`, 'success');
    },
  });
  const reset = button({
    id: 'kdl-template-reset-btn',
    label: 'Reset to default',
    icon: 'rotate-ccw',
    variant: 'ghost',
    size: 'sm',
    onClick: () => setTemplate(DEFAULT_SETTINGS.fileNameTemplate),
  });

  return [
    templateField,
    el('div', { className: 'kdl-settings__row' }, [reset]),
    field({
      label: 'Saved templates',
      description: 'Pick one to use it, or save the current template under a name.',
      control: el('div', { className: 'kdl-settings__group' }, [
        el('div', { className: 'kdl-settings__row' }, [presets, deletePreset]),
        el('div', { className: 'kdl-settings__row' }, [nameInput, savePreset]),
      ]),
    }),
  ];
}

function bulkControls(): HTMLElement[] {
  const single = el('div', { id: 'kdl-bulk-single-settings', className: 'kdl-settings__nested' }, [
    withFolderPicker(settingText('bulkSingleSystemPathTemplate', 'Path of the big archive', 'Where the single ZIP is saved, relative to your downloads folder.', {
      placeholder: DEFAULT_SETTINGS.bulkSingleSystemPathTemplate,
    })),
    withFolderPicker(settingText('bulkSingleInternalPathTemplate', 'Structure inside the big archive', 'Folder hierarchy of each file inside the ZIP.', {
      placeholder: DEFAULT_SETTINGS.bulkSingleInternalPathTemplate,
    })),
  ]);
  const multiple = el('div', { id: 'kdl-bulk-multiple-settings', className: 'kdl-settings__nested' }, [
    withFolderPicker(settingText('bulkMultipleSystemPathTemplate', 'Path of each post archive', 'Where every per-post ZIP is saved.', {
      placeholder: DEFAULT_SETTINGS.bulkMultipleSystemPathTemplate,
    })),
  ]);
  const sync = (mode: string) => {
    showWhen(single, mode === 'single');
    showWhen(multiple, mode !== 'single');
  };
  sync(state.settings.bulkDownloadMode);
  return [
    settingSelect('bulkDownloadMode', 'Bulk download mode', 'One big ZIP for all selected posts, or one ZIP per post.', [
      { value: 'single', label: 'One big archive' },
      { value: 'multiple', label: 'Multiple archives (one per post)' },
    ], sync),
    single,
    multiple,
  ];
}

function ignoredExtensions(): HTMLElement {
  const chips = el('div', { className: 'kdl-settings__chips', id: 'kdl-ignored-extensions-setting' });
  const clean = (v: string) => v.toLowerCase().replace(/^\./, '').trim();
  const save = async (values: string[]) => {
    await saveSetting('ignoredFileExtensions', [...new Set(values.map(clean).filter(Boolean))]);
    notifySaved();
    render();
  };
  const render = () => {
    chips.replaceChildren(
      ...(state.settings.ignoredFileExtensions || []).map((ext) => {
        const remove = el('button', {
          type: 'button',
          className: 'kdl-settings__chip-remove',
          onClick: () => save((state.settings.ignoredFileExtensions || []).filter((v) => v !== ext)),
        }, [kitIcon('x')]);
        remove.setAttribute('aria-label', `Remove ${ext}`);
        const chip = badge({ text: ext, variant: 'secondary', className: 'kdl-settings__chip' });
        chip.append(remove);
        return chip;
      })
    );
  };
  const entry = input({ id: 'kdl-ignored-extensions-setting-input', placeholder: 'Type an extension (e.g. psd) and press Enter' });
  const add = () => {
    const value = clean(entry.value);
    entry.value = '';
    if (value && !(state.settings.ignoredFileExtensions || []).includes(value)) {
      save([...(state.settings.ignoredFileExtensions || []), value]);
    }
  };
  entry.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add();
    }
  });
  entry.addEventListener('blur', () => entry.value.trim() && add());
  render();
  return field({
    label: 'Ignored extensions',
    description: 'Files with these extensions are left out of ZIP archives. Case-insensitive.',
    control: el('div', { className: 'kdl-settings__group' }, [entry, chips]),
  });
}

function retryControls(): HTMLElement[] {
  const nested = el('div', { className: 'kdl-settings__nested' }, [
    grid([
      settingNumber('downloadRetryCount', 'Retries', 'Attempts after the first failure (0-5).', { min: 0, max: 5 }),
      settingNumber('downloadRetryDelay', 'Retry delay (ms)', 'Wait between attempts.', { min: 500, step: 500 }),
    ]),
  ]);
  showWhen(nested, state.settings.enableDownloadRetries);
  return [
    settingSwitch('enableDownloadRetries', 'Retry failed downloads', 'Retries automatically on network errors.', (on) => showWhen(nested, on)),
    nested,
  ];
}

registerSettingsSection({
  id: 'downloads',
  title: 'Downloads',
  icon: 'download',
  order: 20,
  render(container) {
    container.append(
      section('File naming', templateControls(), { icon: 'folder' }),
      section('Bulk downloads', bulkControls(), { icon: 'folders' }),
      section('Performance', [
        grid([
          settingNumber('maxConcurrentIndividualDownloads', 'Concurrent downloads', 'Parallel file downloads (1-10).', { min: 1, max: 10 }),
          settingNumber('maxConcurrentFileDownloadsInZip', 'Concurrent files per ZIP', 'Files of one archive fetched at once (1-10).', { min: 1, max: 10 }),
          settingNumber('maxConcurrentOperations', 'Concurrent queue jobs', 'Posts or archives processed at once (1-5).', { min: 1, max: 5 }),
          settingNumber('zipFileDownloadTimeout', 'File timeout (ms)', 'Longest wait for one file inside a ZIP.', { min: 10000, step: 1000 }),
        ]),
        ...retryControls(),
      ], { icon: 'refresh-cw' }),
      section('ZIP archives', [
        settingSelect('zipCompressionLevel', 'Compression level', '0 stores files as they are: instant and best for images and video.', [
          { value: '0', label: '0 - Store (instant, recommended)' },
          { value: '1', label: '1 - Fast' },
          { value: '4', label: '4 - Normal' },
          { value: '6', label: '6 - Standard' },
          { value: '9', label: '9 - Maximum' },
        ]),
        settingSwitch('savePostContentAsText', 'Save post content as .txt'),
        settingSwitch('addMetadataFile', 'Add metadata.json'),
        settingSwitch('addHtmlIndexInZip', 'Add _index.html to bulk archives'),
        settingSwitch('savePostTags', 'Add tags.txt'),
        settingSwitch('savePostComments', 'Add comments.txt'),
        ignoredExtensions(),
      ], { icon: 'archive' })
    );
  },
});
