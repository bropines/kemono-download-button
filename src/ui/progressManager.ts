import { el } from '../utils/dom';
import { addKitStyles, button, progress, scrollArea, setProgress } from './kit';
import { getDockSlot } from './components/fixedControls';
import { progressBarStyles } from '../styles/components/progressBar.styles';
import { t } from '../i18n';

export interface ProgressTask {
  id: string;
  element: HTMLElement;
  statusElement: HTMLElement;
  filesContainer: HTMLElement;
  /** barInner is the kit progress bar of the file */
  files: Map<string, { wrapper: HTMLElement; barInner: HTMLElement; label: HTMLElement }>;
  updateStatus: (text: string) => void;
  addFile: (fileId: string, fileName: string) => void;
  updateFileProgress: (fileId: string, percent: number) => void;
  markFileComplete: (fileId: string, success: boolean) => void;
  finish: (autoRemoveDelay?: number) => void;
  /** Aborted when the user cancels the task; pass it to every request of the run */
  readonly signal: AbortSignal;
  cancel: () => void;
}

class ProgressManager {
  private tasks: Map<string, ProgressTask> = new Map();
  private removalTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private runCounter = 0;

  /** Task stack inside the bottom dock of the kit root (recreated if the root was rebuilt). */
  private getContainer(): HTMLElement {
    addKitStyles('kdl-progress-styles', progressBarStyles);
    const slot = getDockSlot('progress');
    let container = slot.querySelector<HTMLElement>('#kdl-progress-container');
    if (!container) {
      container = scrollArea();
      container.id = 'kdl-progress-container';
      container.setAttribute('aria-label', t('dl.progress.region'));
      container.setAttribute('role', 'region');
      slot.appendChild(container);
    }
    return container;
  }

  /**
   * Every call is its own run with its own element, AbortController and removal timer: the given id
   * repeats per post, so sharing a task would let one run cancel or remove another run's UI.
   */
  public createTask(baseId: string, titleText: string): ProgressTask {
    const container = this.getContainer();
    const id = `${baseId}-r${++this.runCounter}`;
    const controller = new AbortController();
    const status = el('div', { className: 'kdl-ov-task__status' }, [t('dl.progress.initializing')]);
    status.setAttribute('aria-live', 'polite');
    const cancelButton = button({
      icon: 'x',
      variant: 'ghost',
      size: 'icon',
      ariaLabel: t('dl.progress.cancelTask', { title: titleText }),
      title: t('dl.common.cancel'),
      className: 'kdl-ov-task__cancel',
      onClick: () => task.cancel(),
    });
    const header = el('div', { className: 'kdl-ov-task__header' }, [
      el('div', { className: 'kdl-ov-task__text' }, [
        el('div', { className: 'kdl-ov-task__title', title: titleText }, [titleText]),
        status,
      ]),
      cancelButton,
    ]);
    const filesContainer = scrollArea({ className: 'kdl-ov-task__files' });
    const taskElement = el('div', { className: 'kdl-ov-task', id: `task-${id}` }, [header, filesContainer]);

    container.appendChild(taskElement);

    const task: ProgressTask = {
      id,
      element: taskElement,
      statusElement: status,
      filesContainer,
      files: new Map(),

      updateStatus: (text: string) => {
        status.textContent = text;
      },

      addFile: (fileId: string, fileName: string) => {
        if (task.files.has(fileId)) return;
        const label = el('div', { className: 'kdl-ov-file__label', title: fileName }, [fileName]);
        const bar = progress({ value: 0, ariaLabel: fileName });
        const wrapper = el('div', { className: 'kdl-ov-file' }, [label, bar]);
        filesContainer.appendChild(wrapper);
        filesContainer.scrollTop = filesContainer.scrollHeight;
        task.files.set(fileId, { wrapper, barInner: bar, label });
      },

      updateFileProgress: (fileId: string, percent: number) => {
        const file = task.files.get(fileId);
        if (file) setProgress(file.barInner, percent);
      },

      markFileComplete: (fileId: string, success: boolean) => {
        const file = task.files.get(fileId);
        if (file) {
          setProgress(file.barInner, 100);
          file.wrapper.dataset.result = success ? 'success' : 'error';
        }
      },

      get signal() {
        return controller.signal;
      },

      cancel: () => {
        if (controller.signal.aborted) return;
        controller.abort();
        status.textContent = t('dl.progress.cancelling');
        cancelButton.disabled = true;
      },

      finish: (autoRemoveDelay = 5000) => {
        cancelButton.hidden = true;
        clearTimeout(this.removalTimers.get(id));
        this.removalTimers.set(id, setTimeout(() => {
          taskElement.remove();
          this.tasks.delete(id);
          this.removalTimers.delete(id);
        }, autoRemoveDelay));
      }
    };

    this.tasks.set(id, task);
    return task;
  }
}

export const progressManager = new ProgressManager();
