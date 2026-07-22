import { appState } from '../../state/store';
import { el, getOrCreateContainer } from '../../utils/dom';
import { toggleSettingsModal } from './settingsModal';

export function createFixedControls(): void {
  if (document.getElementById('kdl-fixed-controls')) return;
  const container = getOrCreateContainer('kdl-fixed-controls');

  appState.queueIndicatorElement = el('div', { id: 'kdl-queue-indicator' });
  updateQueueIndicator();

  const settingsBtn = el(
    'button',
    {
      id: 'kdl-settings-btn',
      title: 'Kemono Downloader Settings',
      onClick: () => toggleSettingsModal()
    },
    ['⚙️']
  );

  container.appendChild(appState.queueIndicatorElement);
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
