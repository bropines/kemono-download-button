import { showMessage } from '../ui/toast';
import { appState, getSettings, state } from '../state/store';
import { gmXmlhttpRequestWithRetries } from '../utils/http';

export async function executeTranslation(button: HTMLElement): Promise<void> {
  await getSettings();
  const provider = state.settings.translationProvider;
  if (provider === 'none') {
    showMessage('Translation provider is set to "None" in settings.', 'warning');
    return;
  }

  const postContentNode = document.querySelector('.post__content') as HTMLElement | null;
  if (!postContentNode) {
    showMessage('Post content not found to translate.', 'warning');
    return;
  }

  // Service buttons live inside .post__content: keep them out of the text sent for translation
  // and out of innerText replacement, then put the live nodes (with their handlers) back
  const embedContainer = postContentNode.querySelector<HTMLElement>('.kui-embed-container');
  embedContainer?.remove();

  try {
    if (!appState.originalPostContentHTML) {
      appState.originalPostContentHTML = postContentNode.innerHTML;
    }

    const isTranslated = button.dataset.isTranslated === 'true';
    if (isTranslated) {
      postContentNode.innerHTML = appState.originalPostContentHTML;
      button.dataset.isTranslated = 'false';
      button.textContent = 'Translate 📝';
      return;
    }

    const originalText = postContentNode.innerText.trim();
    if (!originalText) {
      showMessage('No text content found to translate.', 'info');
      return;
    }

    if (appState.translationCache[originalText]) {
      postContentNode.innerText = appState.translationCache[originalText];
      button.dataset.isTranslated = 'true';
      button.textContent = 'Show Original ↩️';
      return;
    }

    button.textContent = 'Translating... ⏳';
    (button as HTMLButtonElement).disabled = true;

    try {
      let translatedText = '';
      if (provider === 'gemini') {
        translatedText = await executeGeminiTranslation(originalText);
      } else if (provider === 'deepl') {
        translatedText = await executeDeepLTranslation(originalText);
      } else {
        throw new Error(`Provider ${provider} is not supported yet.`);
      }

      if (translatedText) {
        appState.translationCache[originalText] = translatedText;
        postContentNode.innerText = translatedText;
        button.dataset.isTranslated = 'true';
        button.textContent = 'Show Original ↩️';
      }
    } catch (error: any) {
      console.error('Translation error:', error);
      showMessage(`Translation failed: ${error.message}`, 'error');
    } finally {
      (button as HTMLButtonElement).disabled = false;
    }
  } finally {
    if (embedContainer) postContentNode.prepend(embedContainer);
  }
}

export async function executeGeminiTranslation(text: string): Promise<string> {
  const apiKey = state.settings.geminiApiKey;
  if (!apiKey) throw new Error('Gemini API key is missing in settings.');

  const model = state.settings.translationModelName || 'gemini-1.5-flash-latest';
  const targetLang = state.settings.translationLanguage || 'Russian';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `Translate the following content into ${targetLang}. Preserve line breaks and formatting. Do not add conversational commentary:\n\n${text}`;

  const response = await gmXmlhttpRequestWithRetries({
    method: 'POST',
    url,
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    responseType: 'json'
  });

  const candidates = response.response?.candidates;
  if (candidates && candidates[0]?.content?.parts?.[0]?.text) {
    return candidates[0].content.parts[0].text.trim();
  }
  throw new Error('Invalid response structure from Gemini API');
}

export async function executeDeepLTranslation(text: string): Promise<string> {
  const apiKey = state.settings.deeplApiKey;
  if (!apiKey) throw new Error('DeepL API key is missing in settings.');

  const tier = state.settings.deeplApiTier || 'free';
  const baseUrl = tier === 'pro' ? 'https://api.deepl.com' : 'https://api-free.deepl.com';
  const targetLang = (state.settings.translationLanguage || 'RU').substring(0, 2).toUpperCase();

  const response = await gmXmlhttpRequestWithRetries({
    method: 'POST',
    url: `${baseUrl}/v2/translate`,
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/json'
    },
    data: JSON.stringify({ text: [text], target_lang: targetLang }),
    responseType: 'json'
  });

  const translations = response.response?.translations;
  if (translations && translations[0]?.text) {
    return translations[0].text.trim();
  }
  throw new Error('Invalid response structure from DeepL API');
}
