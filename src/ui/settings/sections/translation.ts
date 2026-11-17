import { OPENAI_COMPATIBLE_PRESETS, TRANSLATION_LANGUAGES } from '../../../services/translators';
import { saveSetting, state } from '../../../state/store';
import { el } from '../../../utils/dom';
import { field, select } from '../../kit';
import { notifySaved, section, settingSelect, settingText, showWhen } from '../controls';
import { registerSettingsSection } from '../registry';

function openAiGroup(): HTMLElement {
  const baseUrl = settingText('openaiBaseUrl', 'Base URL', 'API root; /chat/completions is appended.', { placeholder: 'https://api.openai.com/v1' });
  const model = settingText('openaiModel', 'Model', undefined, { placeholder: 'gpt-4o-mini' });
  const preset = select({
    id: 'kdl-openai-preset',
    options: [{ value: '', label: '-- Fill from preset --' }, ...OPENAI_COMPATIBLE_PRESETS.map((p) => ({ value: p.id, label: p.name }))],
    onChange: async (id) => {
      const found = OPENAI_COMPATIBLE_PRESETS.find((p) => p.id === id);
      if (!found) return;
      baseUrl.querySelector('input')!.value = found.baseUrl;
      model.querySelector('input')!.value = found.model;
      await saveSetting('openaiBaseUrl', found.baseUrl);
      await saveSetting('openaiModel', found.model);
      notifySaved();
    },
  });
  return el('div', { id: 'kdl-openai-settings', className: 'kdl-settings__nested' }, [
    field({ label: 'Preset', description: 'Fills in the base URL and a default model for a known provider.', control: preset }),
    baseUrl,
    settingText('openaiApiKey', 'API key', 'Not needed for local servers.', { type: 'password' }),
    model,
  ]);
}

registerSettingsSection({
  id: 'translation',
  title: 'Translation',
  icon: 'languages',
  order: 30,
  render(container) {
    const freeNote = el('p', {
      id: 'kdl-free-translator-note',
      className: 'kdl-settings__note',
      textContent: 'No API key needed: uses the public web translator, which may rate-limit very heavy use.',
    });
    const openai = openAiGroup();
    const gemini = el('div', { id: 'kdl-gemini-settings', className: 'kdl-settings__nested' }, [
      settingText('geminiApiKey', 'Gemini API key', undefined, { type: 'password' }),
      settingText('translationModelName', 'Model', undefined, { placeholder: 'gemini-2.5-flash' }),
    ]);
    const deepl = el('div', { id: 'kdl-deepl-settings', className: 'kdl-settings__nested' }, [
      settingText('deeplApiKey', 'DeepL API key', undefined, { type: 'password' }),
      settingSelect('deeplApiTier', 'API tier', undefined, [
        { value: 'free', label: 'Free' },
        { value: 'pro', label: 'Pro' },
      ]),
    ]);
    const sync = (provider: string) => {
      showWhen(freeNote, provider === 'google' || provider === 'yandex');
      showWhen(openai, provider === 'openai');
      showWhen(gemini, provider === 'gemini');
      showWhen(deepl, provider === 'deepl');
    };
    sync(state.settings.translationProvider);

    const language = settingSelect(
      'translationLanguage',
      'Target language',
      'Also used by image translation.',
      TRANSLATION_LANGUAGES.map(({ value, name }) => ({ value, label: name }))
    );
    // Older versions stored display names ("Russian"); options use lowercase values
    const languageSelect = language.querySelector('select')!;
    languageSelect.value = (state.settings.translationLanguage || 'auto').toLowerCase();
    if (!languageSelect.value) languageSelect.value = 'auto';

    container.append(
      section('Provider', [
        settingSelect('translationProvider', 'Translation provider', 'Service that translates post titles, content and comments.', [
          { value: 'none', label: 'None' },
          { value: 'google', label: 'Google Translate (free, no key)' },
          { value: 'yandex', label: 'Yandex Translate (free, no key)' },
          { value: 'openai', label: 'OpenAI-compatible LLM (GPT, Gemini, OpenRouter, local…)' },
          { value: 'gemini', label: 'Gemini AI (native API)' },
          { value: 'deepl', label: 'DeepL' },
        ], sync),
        language,
        freeNote,
        openai,
        gemini,
        deepl,
      ], { icon: 'languages' })
    );
  },
});
