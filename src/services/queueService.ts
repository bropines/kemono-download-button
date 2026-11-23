import { appState, getSettings, state } from '../state/store';
import { updateQueueIndicator } from '../ui/components/fixedControls';
import { t } from '../i18n';
import { kitIcon } from '../ui/kit';

// Buttons hold icons, so their original markup (not just the text) is restored when the task ends
const originalButtonHtml = new WeakMap<HTMLElement, string>();
const originalButtonTitle = new WeakMap<HTMLElement, string | null>();

// An icon-only button (post cards) keeps its size and shows a status icon, the words go to its tooltip: a label
// widened it out of the card on phones. Other buttons show the words.
function showButtonState(button: HTMLElement, label: string, icon: 'clock' | 'loader-circle'): void {
  if (!button.classList.contains('kdl-ui-btn--size-icon')) {
    button.textContent = label;
    return;
  }
  if (!originalButtonTitle.has(button)) originalButtonTitle.set(button, button.getAttribute('title'));
  button.replaceChildren(kitIcon(icon, icon === 'loader-circle' ? 'kdl-ui-spin' : undefined));
  button.title = label;
  button.setAttribute('aria-label', label);
}

function restoreButtonTitle(button: HTMLElement): void {
  if (!originalButtonTitle.has(button)) return;
  const title = originalButtonTitle.get(button);
  if (title === null || title === undefined) button.removeAttribute('title');
  else button.title = title;
  button.setAttribute('aria-label', title || '');
  if (!title) button.removeAttribute('aria-label');
  originalButtonTitle.delete(button);
}

export function addTaskToQueue(
  type: string,
  action: (pd: any) => Promise<any>,
  postDetails: any,
  buttonElement: HTMLElement | null,
  originalButtonText?: string
): void {
  const origText = originalButtonText || (buttonElement ? buttonElement.textContent || '' : '');
  appState.downloadQueue.push({ type, action, postDetails, buttonElement, originalButtonText: origText });

  if (buttonElement) {
    if (!originalButtonHtml.has(buttonElement)) originalButtonHtml.set(buttonElement, buttonElement.innerHTML);
    buttonElement.dataset.isQueued = 'true';
    showButtonState(buttonElement, t('dl.queue.queued'), 'clock');
    (buttonElement as HTMLButtonElement).disabled = true;
  }
  updateQueueIndicator();
  processQueue();
}

/** The setting can arrive as a string from an input or an import, or be missing/0: that would stall the queue */
function getMaxConcurrentOperations(): number {
  const value = Math.floor(Number(state.settings.maxConcurrentOperations));
  return Number.isFinite(value) && value >= 1 ? value : 1;
}

export async function processQueue(): Promise<void> {
  await getSettings();
  // Everything below runs synchronously, so no other processQueue call can interleave with the slot accounting
  if (appState.isQueueProcessing || appState.downloadQueue.length === 0) return;
  const maxConcurrent = getMaxConcurrentOperations();
  if (appState.activeOperations >= maxConcurrent) return;

  appState.isQueueProcessing = true;

  while (appState.downloadQueue.length > 0 && appState.activeOperations < maxConcurrent) {
    const task = appState.downloadQueue.shift()!;
    appState.activeOperations++;
    updateQueueIndicator();

    if (task.buttonElement) {
      delete task.buttonElement.dataset.isQueued;
      task.buttonElement.dataset.isDownloading = 'true';
      showButtonState(task.buttonElement, t('dl.queue.processing'), 'loader-circle');
    }

    (async () => {
      try {
        await task.action(task.postDetails);
      } catch (error) {
        console.error(`Task ${task.type} failed for post ${task.postDetails.postID}:`, error);
      } finally {
        if (task.buttonElement) {
          delete task.buttonElement.dataset.isDownloading;
          restoreButtonTitle(task.buttonElement);
          const html = originalButtonHtml.get(task.buttonElement);
          if (html !== undefined) {
            task.buttonElement.innerHTML = html;
            originalButtonHtml.delete(task.buttonElement);
          } else {
            task.buttonElement.textContent = task.originalButtonText;
          }
          (task.buttonElement as HTMLButtonElement).disabled = false;
        }
        appState.activeOperations = Math.max(0, appState.activeOperations - 1);
        updateQueueIndicator();
        processQueue();
      }
    })();
  }

  appState.isQueueProcessing = false;
}
