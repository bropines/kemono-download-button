import { appState } from '../../state/store';
import { el, getOrCreateContainer } from '../../utils/dom';
import { toggleSettingsModal } from './settingsModal';

export function createFixedControls(): void {
  const container = getOrCreateContainer('kdl-fixed-controls');
  if (!document.body.contains(container)) {
    document.body.appendChild(container);
  }

  if (container.querySelector('#kdl-settings-btn')) return;

  appState.queueIndicatorElement = (container.querySelector('#kdl-queue-indicator') as HTMLElement) || el('div', { id: 'kdl-queue-indicator' });
  updateQueueIndicator();

  const settingsBtn = el(
    'button',
    {
      id: 'kdl-settings-btn',
      title: 'Kemono Downloader Settings',
      type: 'button',
      onClick: (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSettingsModal();
      }
    },
    ['⚙️']
  );

  if (!container.contains(appState.queueIndicatorElement)) {
    container.appendChild(appState.queueIndicatorElement);
  }
  container.appendChild(settingsBtn);
}

export function updateQueueIndicator(): void {
  if (!appState.queueIndicatorElement) return;
  const total = appState.downloadQueue.length;
  if (total === 0 && appState.activeOperations === 0) {
    appState.queueIndicatorElement.style.display = 'none';
  } else {
    appState.queueIndicatorElement.style.display = 'block';
    appState.queueIndicatorElement.textContent = `Queue: ${appState.activeOperations} active, ${total} waiting`;
  }
}
