import { icon } from '../config/icons';
import { el, getOrCreateContainer } from '../utils/dom';

export interface ProgressTask {
  id: string;
  element: HTMLElement;
  statusElement: HTMLElement;
  filesContainer: HTMLElement;
  files: Map<string, { wrapper: HTMLElement; barInner: HTMLElement; label: HTMLElement }>;
  updateStatus: (text: string) => void;
  addFile: (fileId: string, fileName: string) => void;
  updateFileProgress: (fileId: string, percent: number) => void;
  markFileComplete: (fileId: string, success: boolean) => void;
  finish: (autoRemoveDelay?: number) => void;
  /** Aborted when the user cancels the task; pass it to every request of the run */
  readonly signal: AbortSignal;
  cancel: () => void;
  /** Prepares the task for another run with the same id */
  reset: () => void;
}

class ProgressManager {
  private container: HTMLElement | null = null;
  private tasks: Map<string, ProgressTask> = new Map();
  private removalTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  private getContainer(): HTMLElement {
    if (!this.container || !document.body.contains(this.container)) {
      this.container = getOrCreateContainer('kdl-progress-container');
    }
    return this.container;
  }

  public createTask(id: string, titleText: string): ProgressTask {
    const container = this.getContainer();
    if (this.tasks.has(id)) {
      const existing = this.tasks.get(id)!;
      // Task ids repeat per post: the previous run's pending removal would delete this run's element
      clearTimeout(this.removalTimers.get(id));
      this.removalTimers.delete(id);
      existing.reset();
      existing.updateStatus('Restarting task...');
      return existing;
    }

    let controller = new AbortController();
    const title = el('div', { className: 'kdl-task-title' }, [titleText]);
    const status = el('div', { className: 'kdl-task-status' }, ['Initializing...']);
    const cancelButton = el('button', { className: 'kdl-task-cancel', title: 'Cancel', onClick: () => task.cancel() }, [icon('x')]) as HTMLButtonElement;
    const header = el('div', { className: 'kdl-task-header' }, [title, status, cancelButton]);
    const filesContainer = el('div', { className: 'kdl-task-files' });
    const taskElement = el('div', { className: 'kdl-progress-task', id: `task-${id}` }, [header, filesContainer]);

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
        const label = el('div', { className: 'kdl-progress-bar-label' }, [fileName]);
        const barInner = el('div', { className: 'kdl-progress-bar-inner' });
        const bar = el('div', { className: 'kdl-progress-bar' }, [barInner]);
        const wrapper = el('div', { className: 'kdl-progress-bar-wrapper' }, [label, bar]);
        filesContainer.appendChild(wrapper);
        filesContainer.scrollTop = filesContainer.scrollHeight;
        task.files.set(fileId, { wrapper, barInner, label });
      },

      updateFileProgress: (fileId: string, percent: number) => {
        const file = task.files.get(fileId);
        if (file) {
          file.barInner.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        }
      },

      markFileComplete: (fileId: string, success: boolean) => {
        const file = task.files.get(fileId);
        if (file) {
          file.barInner.style.width = '100%';
          file.barInner.classList.add(success ? 'kdl-success' : 'kdl-error');
          file.label.classList.add(success ? 'kdl-success' : 'kdl-error');
        }
      },

      get signal() {
        return controller.signal;
      },

      cancel: () => {
        if (controller.signal.aborted) return;
        controller.abort();
        status.textContent = 'Cancelling...';
        cancelButton.disabled = true;
      },

      reset: () => {
        controller = new AbortController();
        cancelButton.style.display = '';
        cancelButton.disabled = false;
        task.files.clear();
        filesContainer.replaceChildren();
      },

      finish: (autoRemoveDelay = 5000) => {
        cancelButton.style.display = 'none';
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
