import { OPENAI_COMPATIBLE_PRESETS, TRANSLATION_LANGUAGES } from '../../../services/translators';
import { saveSetting, state } from '../../../state/store';
import { el } from '../../../utils/dom';
import { field, select } from '../../kit';
import { notifySaved, section, settingSelect, settingText, showWhen } from '../controls';
import { registerSettingsSection } from '../registry';
import { t } from '../../../i18n';

function openAiGroup(): HTMLElement {
  const baseUrl = settingText('openaiBaseUrl', t('settings.translation.baseUrl'), t('settings.translation.baseUrlDescription'), { placeholder: 'https://api.openai.com/v1' });
  const model = settingText('openaiModel', t('settings.translation.model'), undefined, { placeholder: 'gpt-4o-mini' });
  const preset = select({
    id: 'kdl-openai-preset',
    options: [{ value: '', label: t('settings.translation.presetPlaceholder') }, ...OPENAI_COMPATIBLE_PRESETS.map((p) => ({ value: p.id, label: p.name }))],
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
    field({ label: t('settings.translation.preset'), description: t('settings.translation.presetDescription'), control: preset }),
    baseUrl,
    settingText('openaiApiKey', t('settings.translation.apiKey'), t('settings.translation.apiKeyDescription'), { type: 'password' }),
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
      textContent: t('settings.translation.freeNote'),
    });
    const openai = openAiGroup();
    const gemini = el('div', { id: 'kdl-gemini-settings', className: 'kdl-settings__nested' }, [
      settingText('geminiApiKey', t('settings.translation.geminiKey'), undefined, { type: 'password' }),
      settingText('translationModelName', t('settings.translation.model'), undefined, { placeholder: 'gemini-2.5-flash' }),
    ]);
    const deepl = el('div', { id: 'kdl-deepl-settings', className: 'kdl-settings__nested' }, [
      settingText('deeplApiKey', t('settings.translation.deeplKey'), undefined, { type: 'password' }),
      settingSelect('deeplApiTier', t('settings.translation.deeplTier'), undefined, [
        { value: 'free', label: t('settings.translation.tierFree') },
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
      t('settings.translation.target'),
      t('settings.translation.targetDescription'),
      TRANSLATION_LANGUAGES.map(({ value, name }) => ({ value, label: name }))
    );
    // Older versions stored display names ("Russian"); options use lowercase values
    const languageSelect = language.querySelector('select')!;
    languageSelect.value = (state.settings.translationLanguage || 'auto').toLowerCase();
    if (!languageSelect.value) languageSelect.value = 'auto';

    container.append(
      section(t('settings.translation.providerSection'), [
        settingSelect('translationProvider', t('settings.translation.provider'), t('settings.translation.providerDescription'), [
          { value: 'none', label: t('settings.translation.providerNone') },
          { value: 'google', label: t('settings.translation.providerGoogle') },
          { value: 'yandex', label: t('settings.translation.providerYandex') },
          { value: 'openai', label: t('settings.translation.providerOpenai') },
          { value: 'gemini', label: t('settings.translation.providerGemini') },
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
