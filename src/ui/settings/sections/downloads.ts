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
import { t } from '../../../i18n';

const TEMPLATE_TAGS = () =>
  t('settings.downloads.templateTags', {
    tags: '{author_name}, {post_date}, {post_title}, {post_id}, {user_id}, {service}, {file_index}, {global_file_index}, {file_name}, {original_file_name}, {file_ext}',
  });

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
    label: t('settings.downloads.folder'),
    icon: 'folder-open',
    variant: 'outline',
    title: t('settings.downloads.folderTitle'),
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
  const templateField = settingText('fileNameTemplate', t('settings.downloads.template'), TEMPLATE_TAGS(), {
    placeholder: DEFAULT_SETTINGS.fileNameTemplate,
  });
  const templateInput = templateField.querySelector<HTMLInputElement>('input')!;
  const setTemplate = async (value: string) => {
    templateInput.value = value;
    await saveSetting('fileNameTemplate', value);
    notifySaved();
  };

  const presets = select({ id: 'kdl-template-select', options: [], ariaLabel: t('settings.downloads.savedTemplates') });
  const renderPresets = () => {
    presets.replaceChildren(
      el('option', { value: '', textContent: t('settings.downloads.loadTemplate') }),
      ...(state.settings.savedFileNameTemplates || []).map((t) =>
        el('option', { value: t.template, textContent: t.name, dataset: { name: t.name } })
      )
    );
  };
  renderPresets();
  presets.addEventListener('change', () => presets.value && setTemplate(presets.value));

  const nameInput = input({ id: 'kdl-template-name-input', placeholder: t('settings.downloads.templateNamePlaceholder'), ariaLabel: t('settings.downloads.templateName') });
  const saveTemplates = async (list: NonNullable<typeof state.settings.savedFileNameTemplates>) => {
    await saveSetting('savedFileNameTemplates', list);
    renderPresets();
  };

  const savePreset = button({
    id: 'kdl-template-save-btn',
    label: t('settings.downloads.savePreset'),
    variant: 'secondary',
    onClick: async () => {
      const name = nameInput.value.trim();
      const template = templateInput.value.trim();
      if (!name || !template) return showMessage(t('settings.downloads.needNameAndTemplate'), 'warning');
      const list = [...(state.settings.savedFileNameTemplates || [])];
      const existing = list.find((t) => t.name === name);
      if (existing) existing.template = template;
      else list.push({ name, template });
      await saveTemplates(list);
      nameInput.value = '';
      showMessage(t('settings.downloads.templateSaved', { name }), 'success');
    },
  });
  const deletePreset = button({
    id: 'kdl-template-delete-btn',
    label: t('settings.downloads.delete'),
    variant: 'outline',
    onClick: async () => {
      const name = presets.selectedOptions[0]?.dataset.name;
      if (!name) return showMessage(t('settings.downloads.selectToDelete'), 'warning');
      await saveTemplates((state.settings.savedFileNameTemplates || []).filter((t) => t.name !== name));
      showMessage(t('settings.downloads.templateDeleted', { name }), 'success');
    },
  });
  const reset = button({
    id: 'kdl-template-reset-btn',
    label: t('settings.downloads.resetTemplate'),
    icon: 'rotate-ccw',
    variant: 'ghost',
    size: 'sm',
    onClick: () => setTemplate(DEFAULT_SETTINGS.fileNameTemplate),
  });

  return [
    templateField,
    el('div', { className: 'kdl-settings__row' }, [reset]),
    field({
      label: t('settings.downloads.savedTemplates'),
      description: t('settings.downloads.savedTemplatesDescription'),
      control: el('div', { className: 'kdl-settings__group' }, [
        el('div', { className: 'kdl-settings__row' }, [presets, deletePreset]),
        el('div', { className: 'kdl-settings__row' }, [nameInput, savePreset]),
      ]),
    }),
  ];
}

function bulkControls(): HTMLElement[] {
  const single = el('div', { id: 'kdl-bulk-single-settings', className: 'kdl-settings__nested' }, [
    withFolderPicker(settingText('bulkSingleSystemPathTemplate', t('settings.downloads.singlePath'), t('settings.downloads.singlePathDescription'), {
      placeholder: DEFAULT_SETTINGS.bulkSingleSystemPathTemplate,
    })),
    withFolderPicker(settingText('bulkSingleInternalPathTemplate', t('settings.downloads.singleInternal'), t('settings.downloads.singleInternalDescription'), {
      placeholder: DEFAULT_SETTINGS.bulkSingleInternalPathTemplate,
    })),
  ]);
  const multiple = el('div', { id: 'kdl-bulk-multiple-settings', className: 'kdl-settings__nested' }, [
    withFolderPicker(settingText('bulkMultipleSystemPathTemplate', t('settings.downloads.multiplePath'), t('settings.downloads.multiplePathDescription'), {
      placeholder: DEFAULT_SETTINGS.bulkMultipleSystemPathTemplate,
    })),
  ]);
  const sync = (mode: string) => {
    showWhen(single, mode === 'single');
    showWhen(multiple, mode !== 'single');
  };
  sync(state.settings.bulkDownloadMode);
  return [
    settingSelect('bulkDownloadMode', t('settings.downloads.bulkMode'), t('settings.downloads.bulkModeDescription'), [
      { value: 'single', label: t('settings.downloads.bulkSingle') },
      { value: 'multiple', label: t('settings.downloads.bulkMultiple') },
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
        remove.setAttribute('aria-label', t('settings.downloads.removeExtension', { ext }));
        const chip = badge({ text: ext, variant: 'secondary', className: 'kdl-settings__chip' });
        chip.append(remove);
        return chip;
      })
    );
  };
  const entry = input({ id: 'kdl-ignored-extensions-setting-input', placeholder: t('settings.downloads.extensionPlaceholder') });
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
    label: t('settings.downloads.ignored'),
    description: t('settings.downloads.ignoredDescription'),
    control: el('div', { className: 'kdl-settings__group' }, [entry, chips]),
  });
}

function retryControls(): HTMLElement[] {
  const nested = el('div', { className: 'kdl-settings__nested' }, [
    grid([
      settingNumber('downloadRetryCount', t('settings.downloads.retries'), t('settings.downloads.retriesDescription'), { min: 0, max: 5 }),
      settingNumber('downloadRetryDelay', t('settings.downloads.retryDelay'), t('settings.downloads.retryDelayDescription'), { min: 500, step: 500 }),
    ]),
  ]);
  showWhen(nested, state.settings.enableDownloadRetries);
  return [
    settingSwitch('enableDownloadRetries', t('settings.downloads.retry'), t('settings.downloads.retryDescription'), (on) => showWhen(nested, on)),
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
      section(t('settings.downloads.namingSection'), templateControls(), { icon: 'folder' }),
      section(t('settings.downloads.bulkSection'), bulkControls(), { icon: 'folders' }),
      section(t('settings.downloads.performanceSection'), [
        grid([
          settingNumber('maxConcurrentIndividualDownloads', t('settings.downloads.concurrent'), t('settings.downloads.concurrentDescription'), { min: 1, max: 10 }),
          settingNumber('maxConcurrentFileDownloadsInZip', t('settings.downloads.concurrentZip'), t('settings.downloads.concurrentZipDescription'), { min: 1, max: 10 }),
          settingNumber('maxConcurrentOperations', t('settings.downloads.concurrentJobs'), t('settings.downloads.concurrentJobsDescription'), { min: 1, max: 5 }),
          settingNumber('zipFileDownloadTimeout', t('settings.downloads.timeout'), t('settings.downloads.timeoutDescription'), { min: 10000, step: 1000 }),
        ]),
        ...retryControls(),
      ], { icon: 'refresh-cw' }),
      section(t('settings.downloads.zipSection'), [
        settingSelect('zipCompressionLevel', t('settings.downloads.compression'), t('settings.downloads.compressionDescription'), [
          { value: '0', label: t('settings.downloads.compression0') },
          { value: '1', label: t('settings.downloads.compression1') },
          { value: '4', label: t('settings.downloads.compression4') },
          { value: '6', label: t('settings.downloads.compression6') },
          { value: '9', label: t('settings.downloads.compression9') },
        ]),
        settingSwitch('savePostContentAsText', t('settings.downloads.saveContent')),
        settingSwitch('addMetadataFile', t('settings.downloads.addMetadata')),
        settingSwitch('addHtmlIndexInZip', t('settings.downloads.addIndex')),
        settingSwitch('savePostTags', t('settings.downloads.addTags')),
        settingSwitch('savePostComments', t('settings.downloads.addComments')),
        ignoredExtensions(),
      ], { icon: 'archive' })
    );
  },
});
