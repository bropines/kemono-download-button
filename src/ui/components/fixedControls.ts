import { appState } from '../../state/store';
import { el } from '../../utils/dom';
import { addKitStyles, badge } from '../kit';
import { dockStyles } from '../../styles/components/fixedControls.styles';
import { t } from '../../i18n';

export type DockSlot = 'progress' | 'queue' | 'bulk';
const SLOTS: DockSlot[] = ['progress', 'queue', 'bulk'];

/**
 * The bottom dock in the kit shadow root (a child of body, outside #main, so HTMX swaps keep it).
 * It stacks progress tasks, the queue badge and the bulk bar top to bottom, so they never overlap.
 */
export function getDockSlot(slot: DockSlot): HTMLElement {
  const root = addKitStyles('kdl-dock-styles', dockStyles);
  let dock = root.getElementById('kdl-fixed-controls');
  if (!dock) {
    dock = el(
      'div',
      { id: 'kdl-fixed-controls' },
      SLOTS.map((name) => el('div', { className: 'kdl-ov-dock__slot', dataset: { slot: name } }))
    );
    // Clicks here must not dismiss an open dialog or sheet
    dock.setAttribute('data-kdl-dismiss-ignore', '');
    root.appendChild(dock);
  }
  return dock.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!;
}

export function createFixedControls(): void {
  const slot = getDockSlot('queue');
  if (!appState.queueIndicatorElement) {
    const indicator = badge({ text: '', variant: 'secondary', icon: 'loader-circle', iconClassName: 'kdl-ui-spin' });
    indicator.id = 'kdl-queue-indicator';
    indicator.setAttribute('role', 'status');
    indicator.hidden = true;
    appState.queueIndicatorElement = indicator;
  }
  if (!slot.contains(appState.queueIndicatorElement)) slot.appendChild(appState.queueIndicatorElement);
  updateQueueIndicator();
}

export function updateQueueIndicator(): void {
  const indicator = appState.queueIndicatorElement;
  if (!indicator) return;
  const waiting = appState.downloadQueue.length;
  const idle = waiting === 0 && appState.activeOperations === 0;
  indicator.hidden = idle;
  if (idle) return;
  // Keep the badge's icon, replace only its text
  const text = t('dl.queue.status', { active: appState.activeOperations, waiting });
  const last = indicator.lastChild;
  if (last?.nodeType === Node.TEXT_NODE) last.textContent = text;
  else indicator.append(text);
}
