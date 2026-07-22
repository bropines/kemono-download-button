import { DEFAULT_SETTINGS } from '../../config/constants';
import { clearAllCache, clearIncompleteCache, getCacheStats } from '../../services/cacheService';
import { exportSettings, getSettings, importSettings, saveSetting, state } from '../../state/store';
import { DownloaderSettings } from '../../types';
import { el } from '../../utils/dom';
import { showMessage } from '../toast';

let settingsModalElement: HTMLElement | null = null;
let settingsOverlayElement: HTMLElement | null = null;

export async function toggleSettingsModal(forceShow?: boolean): Promise<void> {
  try {
    await getSettings();
  } catch (e) {
    console.error('[Kemono DL] Error loading settings:', e);
  }
  if (!settingsModalElement) createSettingsModal();
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
    auto: 'auto',
    russian: 'ru',
    english: 'en',
    chinese: 'zh',
    japanese: 'ja',
    korean: 'ko'
  };

  const languageOptions = Object.keys(langCodeMap)
    .map((name) => `<option value="${name}">${name.charAt(0).toUpperCase() + name.slice(1)}</option>`)
    .join('');

  settingsOverlayElement = el('div', { id: 'kdl-settings-overlay' });
  settingsModalElement = el('div', { id: 'kdl-settings-modal' });

  settingsModalElement.innerHTML = `
    <div id="kdl-settings-modal-content">
        <h2>Downloader Settings</h2>
        <h3>General</h3>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-enableAPIFetch"> Enable Site API Fetching</label></div>
        <div class="kdl-setting-item"><label>Session Cookie <input type="password" id="kdl-setting-sessionCookie" placeholder="Paste session cookie here"></label><small>Needed for API requests that require login.</small></div>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-savePostContentAsText"> Save Post Content as .txt in ZIP</label></div>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-addMetadataFile"> Add metadata.json to ZIP</label></div>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-addHtmlIndexInZip"> Add _index.html to Bulk ZIP</label></div>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-savePostTags"> Add tags.txt to ZIP</label></div>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-savePostComments"> Add comments.txt to ZIP</label></div>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-enableDebugLogging"> Enable Debug Logging (Console)</label></div>
        <div class="kdl-setting-item">
            <label for="kdl-setting-cacheDurationHours">Post List Cache Duration (Hours)</label>
            <input type="number" id="kdl-setting-cacheDurationHours" min="0" step="1">
            <small>0 = disable caching. How long to store the full post list before re-fetching.</small>
        </div>

        <h3>File Naming & Structure</h3>
        <div class="kdl-setting-item">
            <label for="kdl-setting-fileNameTemplate">Template for <u>Individual Downloads</u></label>
            <input type="text" id="kdl-setting-fileNameTemplate">
            <small>Defines the save path for single files. <b>Example:</b> {author_name}/{post_date}_{post_title}/{file_name}</small>
        </div>
        <div class="kdl-setting-item">
            <label for="kdl-template-select">Saved Templates</label>
            <div style="display: flex; gap: 5px;">
                <select id="kdl-template-select" style="flex-grow: 1;"></select>
                <button id="kdl-template-delete-btn" style="padding: 5px 10px; background-color: #dc3545; color: white; border: none; border-radius: 4px;">Delete</button>
            </div>
            <div style="display: flex; gap: 5px; margin-top: 5px;">
                <input type="text" id="kdl-template-name-input" placeholder="New template name..." style="flex-grow: 1;">
                <button id="kdl-template-save-btn" style="padding: 5px 10px; background-color: #28a745; color: white; border: none; border-radius: 4px;">Save Current</button>
            </div>
        </div>

        <h4>Bulk Download Settings</h4>
        <div class="kdl-setting-item">
            <label for="kdl-setting-bulkDownloadMode">Bulk Download Mode</label>
            <select id="kdl-setting-bulkDownloadMode">
                <option value="single">One Big Archive</option>
                <option value="multiple">Multiple Archives (one per post)</option>
            </select>
        </div>
        <div id="kdl-bulk-single-settings">
            <div class="kdl-setting-item">
                <label for="kdl-setting-bulkSingleSystemPathTemplate"><u>System Path</u> for the Big Archive</label>
                <input type="text" id="kdl-setting-bulkSingleSystemPathTemplate">
            </div>
            <div class="kdl-setting-item">
                <label for="kdl-setting-bulkSingleInternalPathTemplate"><u>Internal Structure</u> inside the Big Archive</label>
                <input type="text" id="kdl-setting-bulkSingleInternalPathTemplate">
            </div>
        </div>
        <div id="kdl-bulk-multiple-settings" style="display:none;">
            <div class="kdl-setting-item">
                <label for="kdl-setting-bulkMultipleSystemPathTemplate"><u>System Path</u> for Multiple Archives</label>
                <input type="text" id="kdl-setting-bulkMultipleSystemPathTemplate">
            </div>
        </div>

        <h3>Visible Buttons</h3>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-showZipButton"> Download (ZIP)</label></div>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-showImagesButton"> Download Images</label></div>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-showFilesButton"> Download Attachments</label></div>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-showCopyLinksButton"> Copy Links</label></div>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-showShareButton"> Share Links (Mobile)</label></div>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-showTranslateButton"> Translate Button</label></div>

        <h3>Downloads</h3>
        <div class="kdl-setting-item"><label for="kdl-setting-maxConcurrentIndividualDownloads">Max Concurrent "Images/Files" Downloads</label><input type="number" id="kdl-setting-maxConcurrentIndividualDownloads" min="1" max="10"></div>
        <div class="kdl-setting-item"><label for="kdl-setting-zipFileDownloadTimeout">File Timeout in ZIP (ms)</label><input type="number" id="kdl-setting-zipFileDownloadTimeout" min="10000" step="1000"></div>
        <div class="kdl-setting-item"><label><input type="checkbox" id="kdl-setting-enableDownloadRetries"> Enable Download Retries</label></div>
        <div class="kdl-setting-item" id="kdl-retry-count-setting"><label for="kdl-setting-downloadRetryCount">Number of Retries</label><input type="number" id="kdl-setting-downloadRetryCount" min="0" max="5"></div>
        <div class="kdl-setting-item" id="kdl-retry-delay-setting"><label for="kdl-setting-downloadRetryDelay">Delay Between Retries (ms)</label><input type="number" id="kdl-setting-downloadRetryDelay" min="500" step="500"></div>

        <h3>Translation</h3>
        <div class="kdl-setting-item">
            <label for="kdl-setting-translationProvider">Translation Provider</label>
            <select id="kdl-setting-translationProvider">
                <option value="none">None</option><option value="gemini">Gemini</option><option value="deepl">DeepL</option><option value="yandex">Yandex (Free)</option><option value="google">Google (Free)</option>
            </select>
        </div>
        <div class="kdl-setting-item"><label for="kdl-setting-translationLanguage">Translate to Language</label><select id="kdl-setting-translationLanguage">${languageOptions}</select></div>
        <div id="kdl-gemini-settings" style="display:none;"><div class="kdl-setting-item"><label>Gemini API Key</label><input type="password" id="kdl-setting-geminiApiKey"></div><div class="kdl-setting-item"><label>Model Name</label><input type="text" id="kdl-setting-translationModelName"></div></div>
        <div id="kdl-deepl-settings" style="display:none;"><div class="kdl-setting-item"><label>DeepL API Key</label><input type="password" id="kdl-setting-deeplApiKey"></div><div class="kdl-setting-item"><label>API Tier</label><select id="kdl-setting-deeplApiTier"><option value="free">Free</option><option value="pro">Pro</option></select></div></div>

        <h3>Manage Settings & Cache</h3>
        <div class="kdl-setting-item" style="display: flex; gap: 10px; justify-content: center; margin-bottom: 15px;">
            <button id="kdl-export-btn" style="padding: 8px 15px; background-color: #007bff; color: white; border: none; border-radius: 4px;">Export Settings</button>
            <button id="kdl-import-btn" style="padding: 8px 15px; background-color: #17a2b8; color: white; border: none; border-radius: 4px;">Import Settings</button>
            <input type="file" id="kdl-import-file-input" accept=".json" style="display: none;">
        </div>

        <div class="kdl-setting-item" style="display: flex; flex-direction: column; gap: 8px; align-items: center; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px;">
            <div id="kdl-cache-stats-text" style="font-size: 13px; color: #ccc;">Cached Data: Loading...</div>
            <div style="display: flex; gap: 10px;">
                <button id="kdl-clear-incomplete-cache-btn" style="padding: 6px 12px; background-color: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer;">Clear Incomplete Cache</button>
                <button id="kdl-clear-all-cache-btn" style="padding: 6px 12px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Clear All Cache</button>
            </div>
        </div>
    </div>
    <div class="kdl-settings-actions"><button class="kdl-close">Close</button><button class="kdl-save">Save</button></div>
  `;

  settingsOverlayElement.appendChild(settingsModalElement);
  document.body.appendChild(settingsOverlayElement);

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

  document.getElementById('kdl-template-save-btn')!.addEventListener('click', () => {
    const name = templateNameInput.value.trim();
    const template = fileNameTemplateInput.value.trim();
    if (!name || !template) return showMessage('Please provide a name and a template pattern.', 'warning');
    if (!state.settings.savedFileNameTemplates) state.settings.savedFileNameTemplates = [];
    const existingIndex = state.settings.savedFileNameTemplates.findIndex((t) => t.name === name);
    if (existingIndex > -1) state.settings.savedFileNameTemplates[existingIndex].template = template;
    else state.settings.savedFileNameTemplates.push({ name, template });
    templateNameInput.value = '';
    updateSettingsModalUI();
    showMessage(`Template "${name}" saved!`, 'info');
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
  refreshCacheStatsUI();

  const templateSelect = document.getElementById('kdl-template-select') as HTMLSelectElement;
  templateSelect.innerHTML = '<option value="">-- Load a saved template --</option>';
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
  document.getElementById('kdl-bulk-single-settings')!.style.display = isSingleMode ? 'block' : 'none';
  document.getElementById('kdl-bulk-multiple-settings')!.style.display = isSingleMode ? 'none' : 'block';

  toggleTranslatorSettingsVisibility();
  toggleRetrySettingsVisibility();
}

function toggleTranslatorSettingsVisibility(): void {
  const provider = (document.getElementById('kdl-setting-translationProvider') as HTMLSelectElement)?.value;
  document.getElementById('kdl-gemini-settings')!.style.display = provider === 'gemini' ? 'block' : 'none';
  document.getElementById('kdl-deepl-settings')!.style.display = provider === 'deepl' ? 'block' : 'none';
}

function toggleRetrySettingsVisibility(): void {
  const enabled = (document.getElementById('kdl-setting-enableDownloadRetries') as HTMLInputElement)?.checked;
  document.getElementById('kdl-retry-count-setting')!.style.display = enabled ? 'block' : 'none';
  document.getElementById('kdl-retry-delay-setting')!.style.display = enabled ? 'block' : 'none';
}

async function refreshCacheStatsUI(): Promise<void> {
  const statsElem = document.getElementById('kdl-cache-stats-text');
  if (!statsElem) return;
  const { count, totalSizeBytes } = await getCacheStats();
  const sizeMb = (totalSizeBytes / (1024 * 1024)).toFixed(1);
  statsElem.textContent = `Cached Data: ${count} files (${sizeMb} MB)`;
}
