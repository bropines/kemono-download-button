import { clearAllCache, getCacheStats } from '../../../services/cacheService';
import { kuiState, setVerboseDebugMode } from '../../../state/kuiState';
import { setDebug, setSession, state } from '../../../state/store';
import { el } from '../../../utils/dom';
import { debugModule } from '../../../utils/logger';
import { button, field, input, setButtonLoading, setSwitch } from '../../kit';
import { showMessage } from '../../toast';
import { notifySaved, section, settingNumber, settingSwitch, showWhen, switchRow } from '../controls';
import { registerSettingsSection } from '../registry';

function sessionField(): HTMLElement {
  const control = input({
    id: 'kdl-setting-sessionCookie',
    type: 'password',
    placeholder: 'Session key or full cookie string',
    autocomplete: 'off',
    value: state.settings.sessionCookie,
    onChange: async (value) => {
      await setSession(value);
      control.value = state.settings.sessionCookie;
      notifySaved();
    },
  });
  return field({
    label: 'Session',
    description:
      "Needed for restricted or paywalled posts, and a fallback when automatic file fetching fails. Paste the 'session' cookie value (saved as session=<key>) or a full cookie string.",
    control,
  });
}

function cacheControls(): HTMLElement {
  const stats = el('span', { className: 'kdl-settings__stat', id: 'kdl-cache-stats-text', textContent: 'Cached data: loading…' });
  const refresh = async () => {
    const { count, totalSizeBytes } = await getCacheStats();
    stats.textContent = `Cached data: ${count} entries (${(totalSizeBytes / (1024 * 1024)).toFixed(1)} MB)`;
  };
  const clear: HTMLButtonElement = button({
    id: 'kdl-clear-all-cache-btn',
    label: 'Clear cache',
    icon: 'x',
    variant: 'outline',
    size: 'sm',
    onClick: async () => {
      setButtonLoading(clear, true);
      try {
        await clearAllCache();
        await refresh();
        showMessage('Entire cache has been cleared', 'success');
      } finally {
        setButtonLoading(clear, false);
      }
    },
  });
  refresh();
  return el('div', { className: 'kdl-settings__row' }, [stats, el('span', { className: 'kdl-settings__footer-spacer' }), clear]);
}

function debugControls(): HTMLElement {
  const verbose = switchRow({
    id: 'kdl-setting-verboseDebug',
    label: 'Verbose',
    description: 'Also logs every API request and response in the F12 console.',
    checked: kuiState.isVerboseDebugEnabled,
    onChange: (checked) => {
      setVerboseDebugMode(checked);
      notifySaved();
    },
  });
  const nested = el('div', { className: 'kdl-settings__nested' }, [verbose]);
  showWhen(nested, state.settings.enableDebugLogging);
  const main = switchRow({
    id: 'kdl-setting-enableDebugLogging',
    label: 'Debug mode',
    description: 'Logs to the browser console and shows the on-page debugger.',
    checked: state.settings.enableDebugLogging,
    onChange: async (checked) => {
      await setDebug(checked);
      if (checked) debugModule.show();
      else debugModule.hide();
      // turning debug off clears verbose too
      const verboseSwitch = verbose.querySelector<HTMLElement>('.kdl-ui-switch');
      if (verboseSwitch) setSwitch(verboseSwitch, kuiState.isVerboseDebugEnabled);
      showWhen(nested, checked);
      notifySaved();
    },
  });
  return el('div', { className: 'kdl-settings__group' }, [main, nested]);
}

registerSettingsSection({
  id: 'general',
  title: 'General',
  icon: 'settings',
  order: 10,
  render(container) {
    container.append(
      section('Session & API', [
        sessionField(),
        settingSwitch('enableAPIFetch', 'Use the site API', 'Fetch posts through the fast REST API instead of parsing HTML pages.'),
      ], { icon: 'key-round' }),
      section('Cache', [
        settingNumber('cacheDurationHours', 'Post list cache duration (hours)', '0 disables caching.', { min: 0, step: 1 }),
        cacheControls(),
      ], { icon: 'archive' }),
      section('Debug', [debugControls()], { icon: 'info' })
    );
  },
});
