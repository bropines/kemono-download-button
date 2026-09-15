import { DEFAULT_SETTINGS } from '../../config/constants';
import { clearAllCache, clearIncompleteCache, getCacheStats } from '../../services/cacheService';
import { exportSettings, getSettings, importSettings, saveSetting, state } from '../../state/store';
import { DownloaderSettings } from '../../types';
import { el } from '../../utils/dom';
import { showMessage } from '../toast';

let settingsModalElement: HTMLElement | null = null;
let settingsOverlayElement: HTMLElement | null = null;

function tooltipSpan(text: string): HTMLElement {
  return el('span', { className: 'kdl-tooltip-trigger', dataset: { tooltip: text } }, ['ℹ️']);
}

function checkboxItem(id: string, text: string, tooltipText?: string): HTMLElement {
  const checkbox = el('input', { type: 'checkbox', id });
  const labelChildren: Array<string | HTMLElement> = [checkbox, ` ${text}`];
  if (tooltipText) labelChildren.push(' ', tooltipSpan(tooltipText));
  return el('div', { className: 'kdl-setting-item' }, [el('label', {}, labelChildren)]);
}

function inputItem(
  id: string,
  type: string,
  labelText: string,
  props: Record<string, any> = {},
  tooltipText?: string,
  containerId?: string
): HTMLElement {
  const inputElem = el('input', { type, id, ...props });
  const labelChildren: Array<string | HTMLElement> = [labelText];
  if (tooltipText) labelChildren.push(' ', tooltipSpan(tooltipText));
  const labelElem = el('label', { htmlFor: id }, labelChildren);
  const containerProps: Record<string, any> = { className: 'kdl-setting-item' };
  if (containerId) containerProps.id = containerId;
  return el('div', containerProps, [labelElem, inputElem]);
}

function folderInputItem(
  id: string,
  labelText: string,
  props: Record<string, any> = {},
  tooltipText?: string
): HTMLElement {
  const inputElem = el('input', { type: 'text', id, ...props, style: { flex: '1' } }) as HTMLInputElement;

  const hiddenFileInput = el('input', {
    type: 'file',
    style: { display: 'none' }
  }) as HTMLInputElement;
  hiddenFileInput.setAttribute('webkitdirectory', '');
  hiddenFileInput.setAttribute('directory', '');

  const browseBtn = el(
    'button',
    {
      type: 'button',
      className: 'kdl-btn-info kdl-browse-folder-btn',
      title: 'Select system folder...',
      style: {
        flexShrink: '0',
        whiteSpace: 'nowrap',
        fontSize: '0.82rem',
        padding: '5px 10px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      },
      onClick: async (e: MouseEvent) => {
        e.preventDefault();
        if ('showDirectoryPicker' in window) {
          try {
            const dirHandle = await (window as any).showDirectoryPicker();
            if (dirHandle && dirHandle.name) {
              inputElem.value = dirHandle.name;
              inputElem.dispatchEvent(new Event('input', { bubbles: true }));
              inputElem.dispatchEvent(new Event('change', { bubbles: true }));
              return;
            }
          } catch (err: any) {
            if (err.name === 'AbortError') return; // User cancelled dialog
          }
        }
        hiddenFileInput.click();
      }
    },
    ['📂 Select Folder']
  );

  hiddenFileInput.addEventListener('change', () => {
    if (hiddenFileInput.files && hiddenFileInput.files.length > 0) {
      const firstFile = hiddenFileInput.files[0];
      const relPath = firstFile.webkitRelativePath || '';
      const folderName = relPath.split('/')[0] || hiddenFileInput.files[0].name;
      if (folderName) {
        inputElem.value = folderName;
        inputElem.dispatchEvent(new Event('input', { bubbles: true }));
        inputElem.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });

  const labelChildren: Array<string | HTMLElement> = [labelText];
  if (tooltipText) labelChildren.push(' ', tooltipSpan(tooltipText));
  const labelElem = el('label', { htmlFor: id }, labelChildren);

  const inputRow = el('div', { style: { display: 'flex', gap: '6px', alignItems: 'center' } }, [
    inputElem,
    browseBtn,
    hiddenFileInput
  ]);

  return el('div', { className: 'kdl-setting-item' }, [labelElem, inputRow]);
}

function selectItem(
  id: string,
  labelText: string,
  options: Array<{ value: string; text: string }>,
  tooltipText?: string
): HTMLElement {
  const selectElem = el(
    'select',
    { id },
    options.map((opt) => el('option', { value: opt.value }, [opt.text]))
  );
  const labelChildren: Array<string | HTMLElement> = [labelText];
  if (tooltipText) labelChildren.push(' ', tooltipSpan(tooltipText));
  const labelElem = el('label', { htmlFor: id }, labelChildren);
  return el('div', { className: 'kdl-setting-item' }, [labelElem, selectElem]);
}

let renderIgnoredExtChipsFn: ((vals: string[]) => void) | null = null;

function createChipsInputItem(
  id: string,
  labelText: string,
  tooltipText?: string
): HTMLElement {
  const chipsWrapper = el('div', { className: 'kdl-chips-wrapper' });
  const inputElem = el('input', {
    type: 'text',
    id: `${id}-input`,
    placeholder: 'Type ext (e.g. txt, psd) & press Enter...',
    className: 'kdl-chips-input'
  });

  const renderChips = (values: string[]) => {
    const uniqueVals = [...new Set(values.map((v) => v.toLowerCase().replace(/^\./, '').trim()).filter(Boolean))];
    state.settings.ignoredFileExtensions = uniqueVals;

    chipsWrapper.replaceChildren(
      ...uniqueVals.map((val) => {
        const removeBtn = el(
          'span',
          {
            className: 'kdl-chip-remove',
            onClick: (e: MouseEvent) => {
              e.stopPropagation();
              const updated = (state.settings.ignoredFileExtensions || []).filter((v) => v !== val);
              renderChips(updated);
            }
          },
          ['✖']
        );
        return el('span', { className: 'kdl-chip' }, [val, removeBtn]);
      })
    );
  };

  renderIgnoredExtChipsFn = renderChips;

  const addExtension = (raw: string) => {
    const cleaned = raw.toLowerCase().replace(/^\./, '').trim();
    if (cleaned) {
      const current = state.settings.ignoredFileExtensions || [];
      if (!current.includes(cleaned)) {
        renderChips([...current, cleaned]);
      }
    }
    inputElem.value = '';
  };

  inputElem.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addExtension(inputElem.value);
    }
  });

  inputElem.addEventListener('blur', () => {
    if (inputElem.value.trim()) {
      addExtension(inputElem.value);
    }
  });

  const labelChildren: Array<string | HTMLElement> = [labelText];
  if (tooltipText) labelChildren.push(' ', tooltipSpan(tooltipText));

  return el('div', { className: 'kdl-setting-item', id }, [
    el('label', { htmlFor: `${id}-input` }, labelChildren),
    el('div', { className: 'kdl-chips-container' }, [chipsWrapper, inputElem])
  ]);
}

function cardContainer(title: string, children: HTMLElement[]): HTMLElement {
  return el('div', { className: 'kdl-settings-card' }, [
    el('h3', {}, [title]),
    ...children
  ]);
}

let isEscapeListenerBound = false;

export async function toggleSettingsModal(forceShow?: boolean): Promise<void> {
  try {
    await getSettings();
  } catch (e) {
    console.error('[Kemono DL] Error loading settings:', e);
  }
  if (!settingsModalElement || !settingsOverlayElement || !document.body.contains(settingsOverlayElement)) {
    if (settingsOverlayElement && settingsOverlayElement.parentNode) {
      settingsOverlayElement.parentNode.removeChild(settingsOverlayElement);
    }
    settingsModalElement = null;
    settingsOverlayElement = null;
    createSettingsModal();
  }
  if (!isEscapeListenerBound) {
    isEscapeListenerBound = true;
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && settingsOverlayElement?.style.display === 'flex') settingsOverlayElement.style.display = 'none';
    });
  }
  const computedDisplay = settingsOverlayElement ? window.getComputedStyle(settingsOverlayElement).display : 'none';
  const isCurrentlyHidden = computedDisplay === 'none';
  const displayState = typeof forceShow === 'boolean' ? forceShow : isCurrentlyHidden;

  if (displayState) {
    updateSettingsModalUI();
    settingsOverlayElement!.style.display = 'flex';
  } else {
    settingsOverlayElement!.style.display = 'none';
  }
}

export function createSettingsModal(): void {
  if (settingsModalElement) return;

  const langCodeMap: Record<string, string> = {
    auto: 'Auto',
    russian: 'Russian',
    english: 'English',
    chinese: 'Chinese',
    japanese: 'Japanese',
    korean: 'Korean'
  };

  const langOptions = Object.entries(langCodeMap).map(([value, text]) => ({ value, text }));

  settingsOverlayElement = el('div', { id: 'kdl-settings-overlay' });
  settingsModalElement = el('div', { id: 'kdl-settings-modal' });

  // 1. General & Cache Card
  const generalCard = cardContainer('⚙️ General & Cache', [
    checkboxItem('kdl-setting-enableAPIFetch', 'Enable Site API Fetching', 'Use fast site REST API instead of parsing HTML pages'),
    inputItem('kdl-setting-sessionCookie', 'password', 'Session Cookie', { placeholder: 'Paste session cookie here' }, 'Session authentication cookie. Required to access restricted or paywalled posts'),
    inputItem('kdl-setting-cacheDurationHours', 'number', 'Post List Cache Duration (Hours)', { min: 0, step: 1 }, 'Post list cache retention duration. 0 = disable caching'),
    checkboxItem('kdl-setting-enableDebugLogging', 'Enable Debug Logging in Console'),
    el('div', { className: 'kdl-cache-box' }, [
      el('div', { id: 'kdl-cache-stats-text' }, ['Cached Data: Loading...']),
      el('div', { style: { display: 'flex', gap: '8px', marginTop: '6px' } }, [
        el('button', { id: 'kdl-clear-incomplete-cache-btn', className: 'kdl-btn-warn', style: { flex: '1' } }, ['Clear Incomplete']),
        el('button', { id: 'kdl-clear-all-cache-btn', className: 'kdl-btn-danger', style: { flex: '1' } }, ['Clear All'])
      ])
    ])
  ]);

  // 2. File Naming & Templates Card
  const templatesCard = cardContainer('📁 File Naming & Templates', [
    inputItem('kdl-setting-fileNameTemplate', 'text', 'Template for Individual Downloads', { placeholder: DEFAULT_SETTINGS.fileNameTemplate }, 'Available tags: {author_name}, {post_date}, {post_title}, {post_id}, {user_id}, {service}, {file_index}, {global_file_index}, {file_name}, {original_file_name}, {file_ext}'),
    el('div', { style: { display: 'flex', gap: '6px', marginBottom: '10px' } }, [
      el('button', {
        type: 'button',
        id: 'kdl-template-reset-btn',
        className: 'kdl-btn-info',
        style: { fontSize: '0.78rem', padding: '4px 10px' }
      }, ['🔄 Reset to Default Pattern'])
    ]),
    el('div', { className: 'kdl-setting-item' }, [
      el('label', { htmlFor: 'kdl-template-select' }, ['Saved Templates']),
      el('div', { style: { display: 'flex', gap: '6px' } }, [
        el('select', { id: 'kdl-template-select', style: { flexGrow: '1' } }),
        el('button', { id: 'kdl-template-delete-btn', className: 'kdl-btn-danger' }, ['Delete'])
      ]),
      el('div', { style: { display: 'flex', gap: '6px', marginTop: '6px' } }, [
        el('input', { type: 'text', id: 'kdl-template-name-input', placeholder: 'New template name...', style: { flexGrow: '1' } }),
        el('button', { id: 'kdl-template-save-btn', className: 'kdl-btn-success' }, ['Save'])
      ])
    ]),
    el('h4', {}, ['Bulk Download Settings ', tooltipSpan('Choose between one big ZIP archive for all posts or individual ZIP archives per post')]),
    selectItem('kdl-setting-bulkDownloadMode', 'Bulk Download Mode', [
      { value: 'single', text: 'One Big Archive' },
      { value: 'multiple', text: 'Multiple Archives (one per post)' }
    ]),
    el('div', { id: 'kdl-bulk-single-settings' }, [
      folderInputItem('kdl-setting-bulkSingleSystemPathTemplate', 'System Path for Big Archive', { placeholder: '{author_name}/{author_name} - {service}' }, 'System directory path where the big ZIP archive will be saved'),
      folderInputItem('kdl-setting-bulkSingleInternalPathTemplate', 'Internal Structure inside Big Archive', { placeholder: '{post_date} - {post_title}/{file_name}' }, 'Folder hierarchy pattern inside the big ZIP archive')
    ]),
    el('div', { id: 'kdl-bulk-multiple-settings', style: { display: 'none' } }, [
      folderInputItem('kdl-setting-bulkMultipleSystemPathTemplate', 'System Path for Multiple Archives', { placeholder: '{author_name}/{post_date} - {post_title}' }, 'System directory path template for post ZIP archives')
    ])
  ]);

  // 3. ZIP Engine & Performance Card
  const zipCard = cardContainer('📦 ZIP Engine & Performance', [
    selectItem(
      'kdl-setting-zipCompressionLevel',
      'ZIP Compression Level',
      [
        { value: '0', text: '0 - Store (Instant, 0% CPU - Recommended)' },
        { value: '1', text: '1 - Fast (Light Compression)' },
        { value: '4', text: '4 - Normal (Balanced)' },
        { value: '6', text: '6 - Standard (Medium Deflate)' },
        { value: '9', text: '9 - Maximum (Highest Compression)' }
      ],
      '0 = Store / Instant packaging (0% CPU, best for videos and images). 9 = Maximum compression'
    ),
    checkboxItem('kdl-setting-savePostContentAsText', 'Save Post Content as .txt'),
    checkboxItem('kdl-setting-addMetadataFile', 'Add metadata.json to ZIP'),
    checkboxItem('kdl-setting-addHtmlIndexInZip', 'Add _index.html to Bulk ZIP'),
    checkboxItem('kdl-setting-savePostTags', 'Add tags.txt to ZIP'),
    checkboxItem('kdl-setting-savePostComments', 'Add comments.txt to ZIP'),
    inputItem('kdl-setting-maxConcurrentIndividualDownloads', 'number', 'Max Concurrent Downloads', { min: 1, max: 10 }, 'Number of concurrent file download streams (1-10)'),
    inputItem('kdl-setting-zipFileDownloadTimeout', 'number', 'File Timeout (ms)', { min: 10000, step: 1000 }, 'Maximum response timeout when downloading a file inside ZIP'),
    checkboxItem('kdl-setting-enableDownloadRetries', 'Enable Download Retries', 'Automatically retry failed downloads on network errors'),
    inputItem('kdl-setting-downloadRetryCount', 'number', 'Number of Retries', { min: 0, max: 5 }, undefined, 'kdl-retry-count-setting'),
    inputItem('kdl-setting-downloadRetryDelay', 'number', 'Retry Delay (ms)', { min: 500, step: 500 }, undefined, 'kdl-retry-delay-setting'),
    createChipsInputItem(
      'kdl-ignored-extensions-setting',
      'Ignored Extensions in ZIP',
      'File extensions to exclude from ZIP archives (e.g. txt, psd, mp4). Case-insensitive & auto-deduplicated.'
    )
  ]);

  // 4. Translation Card
  const translationCard = cardContainer('🌐 Translation', [
    selectItem(
      'kdl-setting-translationProvider',
      'Translation Provider',
      [
        { value: 'none', text: 'None' },
        { value: 'gemini', text: 'Gemini AI' },
        { value: 'deepl', text: 'DeepL' },
        { value: 'yandex', text: 'Yandex (Free)' },
        { value: 'google', text: 'Google (Free)' }
      ],
      'Service for automated translation of post titles and text content'
    ),
    selectItem('kdl-setting-translationLanguage', 'Target Language', langOptions),
    el('div', { id: 'kdl-gemini-settings', style: { display: 'none' } }, [
      inputItem('kdl-setting-geminiApiKey', 'password', 'Gemini API Key'),
      inputItem('kdl-setting-translationModelName', 'text', 'Model Name')
    ]),
    el('div', { id: 'kdl-deepl-settings', style: { display: 'none' } }, [
      inputItem('kdl-setting-deeplApiKey', 'password', 'DeepL API Key'),
      selectItem('kdl-setting-deeplApiTier', 'API Tier', [
        { value: 'free', text: 'Free' },
        { value: 'pro', text: 'Pro' }
      ])
    ])
  ]);

  // 5. Visible Buttons Card
  const visibleButtonsCard = cardContainer('👁️ Visible Buttons', [
    el('div', { className: 'kdl-setting-checkbox-grid' }, [
      checkboxItem('kdl-setting-showZipButton', 'ZIP Download'),
      checkboxItem('kdl-setting-showImagesButton', 'Images'),
      checkboxItem('kdl-setting-showFilesButton', 'Attachments'),
      checkboxItem('kdl-setting-showCopyLinksButton', 'Copy Links'),
      checkboxItem('kdl-setting-showShareButton', 'Share Links'),
      checkboxItem('kdl-setting-showTranslateButton', 'Translate')
    ])
  ]);

  // 3 Columns & Content Grid
  const col1 = el('div', { className: 'kdl-settings-col' }, [generalCard, templatesCard]);
  const col2 = el('div', { className: 'kdl-settings-col' }, [zipCard]);
  const col3 = el('div', { className: 'kdl-settings-col' }, [translationCard, visibleButtonsCard]);
  const grid = el('div', { className: 'kdl-settings-grid' }, [col1, col2, col3]);

  const modalContent = el('div', { id: 'kdl-settings-modal-content' }, [
    el('h2', {}, ['⚙️ Downloader Settings']),
    grid
  ]);

  const actionsFooter = el('div', { className: 'kdl-settings-actions' }, [
    el('div', { className: 'kdl-settings-config-btns' }, [
      el('button', { id: 'kdl-export-btn', className: 'kdl-btn-primary' }, ['Export Config']),
      el('button', { id: 'kdl-import-btn', className: 'kdl-btn-info' }, ['Import Config']),
      el('input', { type: 'file', id: 'kdl-import-file-input', accept: '.json', style: { display: 'none' } })
    ]),
    el('div', { className: 'kdl-settings-modal-btns' }, [
      el('button', { className: 'kdl-close' }, ['Close']),
      el('button', { className: 'kdl-save' }, ['Save'])
    ])
  ]);

  settingsModalElement.appendChild(modalContent);
  settingsModalElement.appendChild(actionsFooter);
  settingsOverlayElement.appendChild(settingsModalElement);
  document.body.appendChild(settingsOverlayElement);

  // Event Listeners
  settingsModalElement.querySelector('.kdl-save')!.addEventListener('click', async () => {
    for (const key in DEFAULT_SETTINGS) {
      if (key === 'savedFileNameTemplates') continue;
      const element = document.getElementById(`kdl-setting-${key}`) as HTMLInputElement | HTMLSelectElement | null;
      if (element) {
        let value: any = element.type === 'checkbox' ? (element as HTMLInputElement).checked : element.type === 'number' ? parseInt(element.value, 10) : element.value;
        await saveSetting(key as keyof DownloaderSettings, value);
      }
    }
    await saveSetting('savedFileNameTemplates', state.settings.savedFileNameTemplates || []);
    await saveSetting('ignoredFileExtensions', state.settings.ignoredFileExtensions || []);
    showMessage('Settings saved!', 'info');
    toggleSettingsModal(false);
  });

  settingsModalElement.querySelector('.kdl-close')!.addEventListener('click', () => toggleSettingsModal(false));
  settingsOverlayElement.addEventListener('click', (e) => {
    if (e.target === settingsOverlayElement) toggleSettingsModal(false);
  });

  document.getElementById('kdl-export-btn')!.addEventListener('click', exportSettings);
  const importInput = document.getElementById('kdl-import-file-input') as HTMLInputElement;
  document.getElementById('kdl-import-btn')!.addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev: any) => {
      const count = await importSettings(ev.target?.result);
      updateSettingsModalUI();
      showMessage(`Successfully imported ${count} settings!`, 'info');
    };
    reader.readAsText(file);
    importInput.value = '';
  });

  document.getElementById('kdl-setting-bulkDownloadMode')!.addEventListener('change', (e: any) => {
    const isSingleMode = e.target.value === 'single';
    document.getElementById('kdl-bulk-single-settings')!.style.display = isSingleMode ? 'block' : 'none';
    document.getElementById('kdl-bulk-multiple-settings')!.style.display = isSingleMode ? 'none' : 'block';
  });

  document.getElementById('kdl-setting-translationProvider')!.addEventListener('change', toggleTranslatorSettingsVisibility);
  document.getElementById('kdl-setting-enableDownloadRetries')!.addEventListener('change', toggleRetrySettingsVisibility);

  const templateSelect = document.getElementById('kdl-template-select') as HTMLSelectElement;
  const templateNameInput = document.getElementById('kdl-template-name-input') as HTMLInputElement;
  const fileNameTemplateInput = document.getElementById('kdl-setting-fileNameTemplate') as HTMLInputElement;

  templateSelect.addEventListener('change', () => {
    if (templateSelect.value) fileNameTemplateInput.value = templateSelect.value;
  });

  document.getElementById('kdl-template-save-btn')!.addEventListener('click', async () => {
    const name = templateNameInput.value.trim();
    const template = fileNameTemplateInput.value.trim();
    if (!name || !template) return showMessage('Please provide a name and a template pattern.', 'warning');
    if (!state.settings.savedFileNameTemplates) state.settings.savedFileNameTemplates = [];
    const existingIndex = state.settings.savedFileNameTemplates.findIndex((t) => t.name === name);
    if (existingIndex > -1) state.settings.savedFileNameTemplates[existingIndex].template = template;
    else state.settings.savedFileNameTemplates.push({ name, template });
    await saveSetting('savedFileNameTemplates', state.settings.savedFileNameTemplates);
    templateNameInput.value = '';
    updateSettingsModalUI();
    showMessage(`Template "${name}" saved!`, 'info');
  });

  document.getElementById('kdl-template-delete-btn')!.addEventListener('click', async () => {
    const selectedOption = templateSelect.options[templateSelect.selectedIndex];
    const nameToDelete = selectedOption?.dataset.name || selectedOption?.textContent;
    if (!nameToDelete || !templateSelect.value) return showMessage('Select a custom template to delete.', 'warning');
    state.settings.savedFileNameTemplates = (state.settings.savedFileNameTemplates || []).filter((t) => t.name !== nameToDelete);
    await saveSetting('savedFileNameTemplates', state.settings.savedFileNameTemplates);
    updateSettingsModalUI();
    showMessage(`Template "${nameToDelete}" deleted!`, 'info');
  });

  document.getElementById('kdl-template-reset-btn')!.addEventListener('click', async () => {
    fileNameTemplateInput.value = DEFAULT_SETTINGS.fileNameTemplate;
    await saveSetting('fileNameTemplate', DEFAULT_SETTINGS.fileNameTemplate);
    showMessage('Reset template to default pattern!', 'info');
  });

  document.getElementById('kdl-clear-incomplete-cache-btn')!.addEventListener('click', async () => {
    const deleted = await clearIncompleteCache();
    await refreshCacheStatsUI();
    showMessage(`Cleared ${deleted} incomplete cache entries!`, 'info');
  });

  document.getElementById('kdl-clear-all-cache-btn')!.addEventListener('click', async () => {
    await clearAllCache();
    await refreshCacheStatsUI();
    showMessage('Entire cache has been cleared!', 'info');
  });
}

export function updateSettingsModalUI(): void {
  if (!settingsModalElement) return;
  for (const key in state.settings) {
    const element = document.getElementById(`kdl-setting-${key}`) as HTMLInputElement | HTMLSelectElement | null;
    if (element) {
      if (element.type === 'checkbox') (element as HTMLInputElement).checked = (state.settings as any)[key];
      else element.value = (state.settings as any)[key];
    }
  }

  const fileNameTemplateInput = document.getElementById('kdl-setting-fileNameTemplate') as HTMLInputElement | null;
  if (fileNameTemplateInput && (!fileNameTemplateInput.value || !fileNameTemplateInput.value.trim())) {
    fileNameTemplateInput.value = DEFAULT_SETTINGS.fileNameTemplate;
  }

  refreshCacheStatsUI();

  const templateSelect = document.getElementById('kdl-template-select') as HTMLSelectElement;
  templateSelect.replaceChildren(el('option', { value: '' }, ['-- Load a saved template --']));
  if (state.settings.savedFileNameTemplates && state.settings.savedFileNameTemplates.length > 0) {
    state.settings.savedFileNameTemplates.forEach((item) => {
      const option = document.createElement('option');
      option.textContent = item.name;
      option.value = item.template;
      option.dataset.name = item.name;
      templateSelect.appendChild(option);
    });
  }

  const isSingleMode = state.settings.bulkDownloadMode === 'single';
  const singleSettings = document.getElementById('kdl-bulk-single-settings');
  const multipleSettings = document.getElementById('kdl-bulk-multiple-settings');
  if (singleSettings) singleSettings.style.display = isSingleMode ? 'block' : 'none';
  if (multipleSettings) multipleSettings.style.display = isSingleMode ? 'none' : 'block';

  toggleTranslatorSettingsVisibility();
  toggleRetrySettingsVisibility();

  if (renderIgnoredExtChipsFn) {
    renderIgnoredExtChipsFn(state.settings.ignoredFileExtensions || []);
  }
}

function toggleTranslatorSettingsVisibility(): void {
  const provider = (document.getElementById('kdl-setting-translationProvider') as HTMLSelectElement)?.value;
  const geminiElem = document.getElementById('kdl-gemini-settings');
  const deeplElem = document.getElementById('kdl-deepl-settings');
  if (geminiElem) geminiElem.style.display = provider === 'gemini' ? 'block' : 'none';
  if (deeplElem) deeplElem.style.display = provider === 'deepl' ? 'block' : 'none';
}

function toggleRetrySettingsVisibility(): void {
  const enabled = (document.getElementById('kdl-setting-enableDownloadRetries') as HTMLInputElement)?.checked;
  const countElem = document.getElementById('kdl-retry-count-setting');
  const delayElem = document.getElementById('kdl-retry-delay-setting');
  if (countElem) countElem.style.display = enabled ? 'block' : 'none';
  if (delayElem) delayElem.style.display = enabled ? 'block' : 'none';
}

async function refreshCacheStatsUI(): Promise<void> {
  const statsElem = document.getElementById('kdl-cache-stats-text');
  if (!statsElem) return;
  const { count, totalSizeBytes } = await getCacheStats();
  const sizeMb = (totalSizeBytes / (1024 * 1024)).toFixed(1);
  statsElem.textContent = `Cached Data: ${count} files (${sizeMb} MB)`;
}
