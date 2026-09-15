import { showMessage } from '../ui/toast';
import { appState, getSettings, state } from '../state/store';
import { translateText } from './translators';

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

    // Switching provider or language must not return a stale translation
    const cacheKey = `${provider}:${state.settings.translationLanguage}:${originalText}`;
    if (appState.translationCache[cacheKey]) {
      postContentNode.innerText = appState.translationCache[cacheKey];
      button.dataset.isTranslated = 'true';
      button.textContent = 'Show Original ↩️';
      return;
    }

    button.textContent = 'Translating... ⏳';
    (button as HTMLButtonElement).disabled = true;

    try {
      const translatedText = await translateText(originalText, state.settings);
      if (translatedText) {
        appState.translationCache[cacheKey] = translatedText;
        postContentNode.innerText = translatedText;
        button.dataset.isTranslated = 'true';
        button.textContent = 'Show Original ↩️';
      }
    } catch (error: any) {
      console.error('Translation error:', error);
      showMessage(`Translation failed: ${error.message}`, 'error');
      button.textContent = 'Translate 📝';
    } finally {
      (button as HTMLButtonElement).disabled = false;
    }
  } finally {
    if (embedContainer) postContentNode.prepend(embedContainer);
  }
}
