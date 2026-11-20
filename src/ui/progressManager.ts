// Downloads panel: every download run is a task card in one panel, docked in a corner of the screen
// (or above the bulk bar, bottom centre) as the user picks in Settings → Downloads.
//
// The panel folds into a small launcher button (download icon, overall progress ring, counter). It opens on its
// own when a download starts and folds back a few seconds after the last one ends, unless the pointer or focus is
// in it. Finished tasks stay listed (done, partly failed, failed, cancelled) until cleared, or are removed after
// a few seconds when "Remove finished downloads" is on.
//
// The ProgressTask API is what the download services use; it is unchanged apart from fail() and setTotal().

import { el } from '../utils/dom';
import { icon, type IconName } from '../config/icons';
import { addKitStyles, button, getKitRoot, progress, scrollArea, setProgress } from './kit';
import { getDockSlot } from './components/fixedControls';
import { progressBarStyles } from '../styles/components/progressBar.styles';
import { state } from '../state/store';
import { t } from '../i18n';

type TaskState = 'running' | 'done' | 'partial' | 'error' | 'cancelled';
type FileState = 'running' | 'success' | 'error';
export type PanelPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'bottom-center';

interface FileEntry {
  wrapper: HTMLElement;
  barInner: HTMLElement;
  label: HTMLElement;
  percent: number;
  state: FileState;
}

export interface ProgressTask {
  id: string;
  element: HTMLElement;
  statusElement: HTMLElement;
  filesContainer: HTMLElement;
  /** barInner is the kit progress bar of the file */
  files: Map<string, FileEntry>;
  updateStatus: (text: string) => void;
  addFile: (fileId: string, fileName: string) => void;
  updateFileProgress: (fileId: string, percent: number) => void;
  markFileComplete: (fileId: string, success: boolean) => void;
  /** Marks the run as failed and shows the message; finish() still has to be called */
  fail: (message: string) => void;
  /** Expected file count, when known before the files are added (keeps the overall bar from jumping) */
  setTotal: (count: number) => void;
  finish: (autoRemoveDelay?: number) => void;
  /** Aborted when the user cancels the task; pass it to every request of the run */
  readonly signal: AbortSignal;
  cancel: () => void;
}

const KIND_ICONS: [RegExp, IconName][] = [
  [/^bulk-/, 'folders'],
  [/^zip-/, 'archive'],
  [/^indiv-Images/, 'images'],
  [/^indiv-/, 'paperclip'],
];
const kindIcon = (baseId: string): IconName => KIND_ICONS.find(([test]) => test.test(baseId))?.[1] ?? 'download';

const STATE_ICON: Record<TaskState, IconName> = {
  running: 'loader-circle',
  done: 'check',
  partial: 'triangle-alert',
  error: 'circle-x',
  cancelled: 'x',
};
const FILE_ICON: Record<FileState, IconName> = { running: 'loader-circle', success: 'check', error: 'circle-x' };

// Folds the panel this long after the last task ended (unless hovered or focused)
const COLLAPSE_DELAY = 4000;
const RING = 2 * Math.PI * 15;

const setIcon = (holder: HTMLElement, name: IconName, spin = false): void => {
  if (holder.dataset.icon === name) return;
  holder.dataset.icon = name;
  holder.replaceChildren(icon(name, spin ? 'kdl-icon kdl-ui-spin' : 'kdl-icon'));
};

interface InternalTask extends ProgressTask {
  state: TaskState;
}

class ProgressManager {
  private tasks: Map<string, InternalTask> = new Map();
  private removalTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private runCounter = 0;
  private collapseTimer: ReturnType<typeof setTimeout> | undefined;
  private host: HTMLElement | null = null;
  private refs: {
    panel: HTMLElement;
    list: HTMLElement;
    summary: HTMLElement;
    clear: HTMLButtonElement;
    launcher: HTMLButtonElement;
    launcherCount: HTMLElement;
    launcherIcon: HTMLElement;
    ring: SVGCircleElement;
  } | null = null;

  constructor() {
    // Moving between a phone-width dock and a configured corner must follow rotation or resizing,
    // even while a download is already running and no new task is created.
    window.addEventListener('resize', () => this.place(), { passive: true });
  }

  private position(): PanelPosition {
    return (state.settings?.downloadPanelPosition as PanelPosition) || 'bottom-right';
  }

  /** The panel host, rebuilt if the kit root was; placed in the dock for bottom centre, else on its own */
  private getHost(): HTMLElement {
    addKitStyles('kdl-progress-styles', progressBarStyles);
    if (!this.host || !this.host.isConnected || !this.refs) this.build();
    this.place();
    return this.host!;
  }

  private build(): void {
    const summary = el('div', { className: 'kdl-dl__summary' });
    const clear = button({
      variant: 'ghost',
      size: 'sm',
      label: t('dl.panel.clear'),
      title: t('dl.panel.clearHint'),
      className: 'kdl-dl__clear',
      onClick: () => this.clearFinished(),
    });
    const collapse = button({
      icon: 'chevron-down',
      variant: 'ghost',
      size: 'icon',
      ariaLabel: t('dl.panel.collapse'),
      title: t('dl.panel.collapse'),
      className: 'kdl-dl__collapse',
      onClick: () => this.setOpen(false),
    });
    const list = scrollArea({ className: 'kdl-dl__list' });
    list.id = 'kdl-progress-container';
    const panel = el('div', { className: 'kdl-dl__panel' }, [
      el('div', { className: 'kdl-dl__head' }, [
        el('div', { className: 'kdl-dl__heading' }, [
          el('div', { className: 'kdl-dl__title' }, [t('dl.progress.region')]),
          summary,
        ]),
        clear,
        collapse,
      ]),
      list,
    ]);
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', t('dl.progress.region'));

    const ringSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ringSvg.setAttribute('viewBox', '0 0 36 36');
    ringSvg.setAttribute('class', 'kdl-dl__ring');
    ringSvg.setAttribute('aria-hidden', 'true');
    const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    [track, ring].forEach((circle) => {
      circle.setAttribute('cx', '18');
      circle.setAttribute('cy', '18');
      circle.setAttribute('r', '15');
    });
    track.setAttribute('class', 'kdl-dl__ring-track');
    ring.setAttribute('class', 'kdl-dl__ring-value');
    ring.setAttribute('stroke-dasharray', String(RING));
    ringSvg.append(track, ring);
    const launcherIcon = el('span', { className: 'kdl-dl__launcher-icon' });
    const launcherCount = el('span', { className: 'kdl-dl__launcher-count' });
    const launcher = el('button', { type: 'button', className: 'kdl-dl__launcher' }, [
      el('span', { className: 'kdl-dl__launcher-badge' }, [ringSvg, launcherIcon]),
      launcherCount,
    ]);
    launcher.setAttribute('aria-label', t('dl.panel.open'));
    launcher.title = t('dl.panel.open');
    launcher.addEventListener('click', () => this.setOpen(true));

    const host = el('div', { id: 'kdl-downloads', className: 'kdl-dl' }, [panel, launcher]);
    host.hidden = true;
    host.setAttribute('data-kdl-dismiss-ignore', '');
    // Hovering or focusing the panel keeps it open
    const hold = (): void => clearTimeout(this.collapseTimer);
    host.addEventListener('pointerenter', hold);
    host.addEventListener('focusin', hold);
    host.addEventListener('pointerleave', () => this.scheduleCollapse());

    this.host = host;
    this.refs = { panel, list, summary, clear, launcher, launcherCount, launcherIcon, ring };
    // Tasks of a rebuilt root come back into the new list
    this.tasks.forEach((task) => list.appendChild(task.element));
    this.refresh();
  }

  /** Moves the panel to the position picked in the settings (call after the setting changes) */
  public place(): void {
    if (!this.host) return;
    // Phones: a corner panel would cover the bulk bar, so it joins the dock above it
    const narrow = window.matchMedia('(max-width: 600px)').matches;
    const position = narrow && this.position().startsWith('bottom') ? 'bottom-center' : this.position();
    this.host.dataset.position = position;
    if (position === 'bottom-center') {
      const slot = getDockSlot('progress');
      if (this.host.parentElement !== slot) slot.appendChild(this.host);
    } else {
      const root = getKitRoot();
      if (this.host.parentNode !== root) root.appendChild(this.host);
    }
  }

  private setOpen(open: boolean): void {
    if (!this.host) return;
    clearTimeout(this.collapseTimer);
    this.host.toggleAttribute('data-open', open);
    this.refs?.launcher.setAttribute('aria-expanded', String(open));
  }

  private scheduleCollapse(): void {
    clearTimeout(this.collapseTimer);
    if (!this.host?.hasAttribute('data-open')) return;
    if ([...this.tasks.values()].some((task) => task.state === 'running')) return;
    if (this.host.matches(':hover, :focus-within')) return;
    this.collapseTimer = setTimeout(() => this.setOpen(false), COLLAPSE_DELAY);
  }

  private clearFinished(): void {
    this.tasks.forEach((task, id) => {
      if (task.state !== 'running') this.removeTask(id);
    });
  }

  private removeTask(id: string): void {
    const task = this.tasks.get(id);
    clearTimeout(this.removalTimers.get(id));
    this.removalTimers.delete(id);
    task?.element.remove();
    this.tasks.delete(id);
    this.refresh();
  }

  /** Summary line, launcher counter and ring, empty state */
  private refresh(): void {
    if (!this.host || !this.refs) return;
    const all = [...this.tasks.values()];
    const running = all.filter((task) => task.state === 'running');
    const finished = all.length - running.length;
    const failed = all.filter((task) => task.state === 'error' || task.state === 'partial').length;
    this.host.hidden = all.length === 0;
    this.host.dataset.busy = running.length ? 'true' : 'false';
    const parts: string[] = [];
    if (running.length) parts.push(t('dl.panel.active', { count: running.length }));
    if (finished) parts.push(t('dl.panel.finished', { count: finished }));
    if (failed) parts.push(t('dl.panel.failed', { count: failed }));
    this.refs.summary.textContent = parts.join(' · ');
    this.refs.clear.hidden = finished === 0;

    const percent = running.length
      ? running.reduce((sum, task) => sum + (overallPercent(task) ?? 0), 0) / running.length
      : 100;
    this.refs.ring.style.strokeDashoffset = String(RING * (1 - percent / 100));
    this.refs.launcherCount.textContent = String(running.length || finished);
    const launcherState: TaskState = running.length ? 'running' : failed ? 'partial' : 'done';
    this.host.dataset.state = launcherState;
    setIcon(this.refs.launcherIcon, running.length ? 'download' : STATE_ICON[launcherState]);
    if (!running.length) this.scheduleCollapse();
  }

  /**
   * Every call is its own run with its own element, AbortController and removal timer: the given id
   * repeats per post, so sharing a task would let one run cancel or remove another run's UI.
   */
  public createTask(baseId: string, titleText: string): ProgressTask {
    this.getHost();
    const refs = this.refs!;
    const id = `${baseId}-r${++this.runCounter}`;
    const controller = new AbortController();
    let expectedTotal = 0;
    let failedMessage = '';

    const status = el('div', { className: 'kdl-ov-task__status' }, [t('dl.progress.initializing')]);
    status.setAttribute('aria-live', 'polite');
    const counts = el('span', { className: 'kdl-dl-task__counts' });
    const stateIcon = el('span', { className: 'kdl-dl-task__state' });
    const bar = progress({ value: null, ariaLabel: titleText });
    const percentLabel = el('span', { className: 'kdl-dl-task__pct' });
    const filesContainer = scrollArea({ className: 'kdl-ov-task__files' });
    filesContainer.hidden = true;

    const toggle = button({
      icon: 'chevron-down',
      variant: 'ghost',
      size: 'icon',
      ariaLabel: t('dl.panel.files'),
      title: t('dl.panel.files'),
      className: 'kdl-dl-task__toggle',
      onClick: () => setExpanded(filesContainer.hidden),
    });
    toggle.hidden = true;
    const setExpanded = (open: boolean): void => {
      filesContainer.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      taskElement.toggleAttribute('data-expanded', open);
    };
    const cancelButton = button({
      icon: 'x',
      variant: 'ghost',
      size: 'icon',
      ariaLabel: t('dl.progress.cancelTask', { title: titleText }),
      title: t('dl.common.cancel'),
      className: 'kdl-ov-task__cancel',
      onClick: () => {
        if (task.state === 'running') task.cancel();
        else this.removeTask(id);
      },
    });

    const kind = el('span', { className: 'kdl-dl-task__kind' }, [icon(kindIcon(baseId))]);
    const taskElement = el('div', { className: 'kdl-ov-task kdl-dl-task', id: `task-${id}` }, [
      el('div', { className: 'kdl-ov-task__header' }, [
        kind,
        el('div', { className: 'kdl-ov-task__text' }, [
          el('div', { className: 'kdl-ov-task__title', title: titleText }, [titleText]),
          status,
        ]),
        toggle,
        cancelButton,
      ]),
      el('div', { className: 'kdl-dl-task__progress' }, [stateIcon, bar, percentLabel]),
      el('div', { className: 'kdl-dl-task__meta' }, [counts]),
      filesContainer,
    ]);
    taskElement.dataset.state = 'running';
    // Newest on top
    refs.list.prepend(taskElement);
    refs.list.scrollTop = 0;

    const render = (): void => {
      const files = [...task.files.values()];
      const done = files.filter((file) => file.state !== 'running').length;
      const errors = files.filter((file) => file.state === 'error').length;
      const total = Math.max(expectedTotal, files.length);
      toggle.hidden = files.length === 0;
      const value = task.state === 'running' ? overallPercent(task) : 100;
      setProgress(bar, value);
      percentLabel.textContent = value === null ? '' : `${Math.floor(value)}%`;
      const bits: string[] = [];
      if (total) bits.push(t('dl.panel.files.count', { done, total }));
      if (errors) bits.push(t('dl.panel.files.errors', { count: errors }));
      counts.textContent = bits.join(' · ');
      taskElement.dataset.state = task.state;
      setIcon(stateIcon, STATE_ICON[task.state], task.state === 'running');
      cancelButton.title = task.state === 'running' ? t('dl.common.cancel') : t('dl.panel.dismiss');
      cancelButton.setAttribute('aria-label', task.state === 'running'
        ? t('dl.progress.cancelTask', { title: titleText })
        : t('dl.panel.dismiss'));
      this.refresh();
    };

    let frame = 0;
    const scheduleRender = (): void => {
      if (frame) return;
      frame = window.setTimeout(() => {
        frame = 0;
        render();
      }, 120);
    };

    const task: InternalTask = {
      id,
      state: 'running',
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
        const fileIcon = el('span', { className: 'kdl-ov-file__icon' });
        setIcon(fileIcon, 'loader-circle', true);
        const fileBar = progress({ value: 0, ariaLabel: fileName });
        const wrapper = el('div', { className: 'kdl-ov-file' }, [fileIcon, label, fileBar]);
        wrapper.dataset.result = 'running';
        filesContainer.appendChild(wrapper);
        task.files.set(fileId, { wrapper, barInner: fileBar, label, percent: 0, state: 'running' });
        scheduleRender();
      },

      updateFileProgress: (fileId: string, percent: number) => {
        const file = task.files.get(fileId);
        if (!file) return;
        file.percent = percent;
        setProgress(file.barInner, percent);
        scheduleRender();
      },

      markFileComplete: (fileId: string, success: boolean) => {
        const file = task.files.get(fileId);
        if (!file) return;
        file.percent = 100;
        file.state = success ? 'success' : 'error';
        setProgress(file.barInner, 100);
        file.wrapper.dataset.result = file.state;
        setIcon(file.wrapper.querySelector<HTMLElement>('.kdl-ov-file__icon')!, FILE_ICON[file.state]);
        // Failed files float to the top of the list and open it, so they are seen
        if (!success && !controller.signal.aborted) {
          filesContainer.prepend(file.wrapper);
          setExpanded(true);
        }
        scheduleRender();
      },

      fail: (message: string) => {
        failedMessage = message;
        status.textContent = message;
      },

      setTotal: (count: number) => {
        expectedTotal = Math.max(0, count);
        taskElement.dataset.total = String(expectedTotal);
        scheduleRender();
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
        const errors = [...task.files.values()].some((file) => file.state === 'error');
        task.state = controller.signal.aborted ? 'cancelled' : failedMessage ? 'error' : errors ? 'partial' : 'done';
        cancelButton.disabled = false;
        clearTimeout(frame);
        frame = 0;
        render();
        clearTimeout(this.removalTimers.get(id));
        // Kept in the list unless the user asked for finished downloads to go away; failures always stay
        if (state.settings?.downloadPanelAutoClear && (task.state === 'done' || task.state === 'cancelled')) {
          this.removalTimers.set(id, setTimeout(() => this.removeTask(id), autoRemoveDelay));
        }
      },
    };

    this.tasks.set(id, task);
    if (state.settings?.downloadPanelAutoOpen !== false) this.setOpen(true);
    render();
    return task;
  }
}

/** Overall progress of a task from its files; null (indeterminate) before any file is known */
function overallPercent(task: InternalTask): number | null {
  const files = [...task.files.values()];
  if (!files.length) return null;
  const total = Math.max(files.length, Number(task.element.dataset.total) || 0);
  return files.reduce((sum, file) => sum + file.percent, 0) / total;
}

export const progressManager = new ProgressManager();
