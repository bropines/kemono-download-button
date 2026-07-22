import { appState, getSettings, state } from '../state/store';
import { updateQueueIndicator } from '../ui/components/fixedControls';

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
    buttonElement.dataset.isQueued = 'true';
    buttonElement.textContent = 'Queued...';
    (buttonElement as HTMLButtonElement).disabled = true;
  }
  updateQueueIndicator();
  processQueue();
}

export async function processQueue(): Promise<void> {
  await getSettings();
  if (appState.isQueueProcessing || appState.downloadQueue.length === 0) return;
  if (appState.activeOperations >= state.settings.maxConcurrentOperations) return;

  appState.isQueueProcessing = true;

  while (appState.downloadQueue.length > 0 && appState.activeOperations < state.settings.maxConcurrentOperations) {
    const task = appState.downloadQueue.shift()!;
    appState.activeOperations++;
    updateQueueIndicator();

    if (task.buttonElement) {
      delete task.buttonElement.dataset.isQueued;
      task.buttonElement.dataset.isDownloading = 'true';
      task.buttonElement.textContent = 'Processing...';
    }

    (async () => {
      try {
        await task.action(task.postDetails);
      } catch (error) {
        console.error(`Task ${task.type} failed for post ${task.postDetails.postID}:`, error);
      } finally {
        if (task.buttonElement) {
          delete task.buttonElement.dataset.isDownloading;
          task.buttonElement.textContent = task.originalButtonText;
          (task.buttonElement as HTMLButtonElement).disabled = false;
        }
        appState.activeOperations--;
        updateQueueIndicator();
        processQueue();
      }
    })();
  }

  appState.isQueueProcessing = false;
}
