import { clearAllCache, getCacheStats } from '../../../services/cacheService';
import { clearApiCache, getApiCacheStats } from '../../../api/apiCache';
import { kuiState, setVerboseDebugMode } from '../../../state/kuiState';
import { setDebug, setSession, state } from '../../../state/store';
import { el } from '../../../utils/dom';
import { debugModule } from '../../../utils/logger';
import { button, field, input, setButtonLoading, setSwitch } from '../../kit';
import { showMessage } from '../../toast';
import { notifySaved, section, settingNumber, settingSelect, settingSwitch, showWhen, switchRow, syncedSwitch, whileConnected } from '../controls';
import { registerSettingsSection } from '../registry';
import { languageSection } from './language';
import { aboutSection } from './about';
import { t, tx } from '../../../i18n';
import { isModuleEnabled, setModuleEnabled } from '../../../core/registry';
import { isLayoutEditing, LAYOUT_BUTTON_MODULE, setLayoutEditing } from '../../../modules/pageBlocks/editButton';

function sessionField(): HTMLElement {
  const control = input({
    id: 'kdl-setting-sessionCookie',
    type: 'password',
    placeholder: t('settings.general.session.placeholder'),
    autocomplete: 'off',
    value: state.settings.sessionCookie,
    onChange: async (value) => {
      await setSession(value);
      control.value = state.settings.sessionCookie;
      notifySaved();
    },
  });
  return field({
    label: t('settings.general.session.label'),
    description: t('settings.general.session.description'),
    control,
  });
}

interface CacheRowOptions {
  statsId: string;
  buttonId: string;
  /** i18n prefix with .loading, .stats, .clear and .cleared */
  keys: 'settings.general.cache' | 'settings.general.apiCache';
  stats: () => Promise<{ count: number; totalSizeBytes: number }>;
  clear: () => Promise<void>;
}

/** Entry count and size of a cache with its clear button */
function cacheRow(options: CacheRowOptions): HTMLElement {
  const stats = el('span', { className: 'kdl-settings__stat', id: options.statsId, textContent: t(`${options.keys}.loading`) });
  const refresh = async () => {
    const { count, totalSizeBytes } = await options.stats();
    stats.textContent = t(`${options.keys}.stats`, { count, size: (totalSizeBytes / (1024 * 1024)).toFixed(1) });
  };
  const clear: HTMLButtonElement = button({
    id: options.buttonId,
    label: t(`${options.keys}.clear`),
    icon: 'x',
    variant: 'outline',
    size: 'sm',
    onClick: async () => {
      setButtonLoading(clear, true);
      try {
        await options.clear();
        await refresh();
        showMessage(t(`${options.keys}.cleared`), 'success');
      } finally {
        setButtonLoading(clear, false);
      }
    },
  });
  refresh();
  return el('div', { className: 'kdl-settings__row' }, [stats, el('span', { className: 'kdl-settings__footer-spacer' }), clear]);
}

const cacheControls = (): HTMLElement =>
  cacheRow({ statsId: 'kdl-cache-stats-text', buttonId: 'kdl-clear-all-cache-btn', keys: 'settings.general.cache', stats: getCacheStats, clear: clearAllCache });

const apiCacheControls = (): HTMLElement =>
  cacheRow({ statsId: 'kdl-api-cache-stats-text', buttonId: 'kdl-clear-api-cache-btn', keys: 'settings.general.apiCache', stats: getApiCacheStats, clear: clearApiCache });

const apiCacheLifetime = (): HTMLElement =>
  settingSelect('apiCacheLifetime', t('settings.general.apiCache.lifetime'), t('settings.general.apiCache.lifetimeDescription'),
    (['off', 'short', 'normal', 'long'] as const).map((value) => ({ value, label: t(`settings.general.apiCache.${value}`) })));

function debugControls(): HTMLElement {
  const verbose = switchRow({
    id: 'kdl-setting-verboseDebug',
    label: t('settings.general.debug.verbose'),
    description: t('settings.general.debug.verboseDescription'),
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
    label: t('settings.general.debug.label'),
    description: t('settings.general.debug.description'),
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

/** Page layout editing, first in the dialog so it is always at hand; the movable blocks exist only with the redesign */
function layoutSection(): HTMLElement {
  const node = section(t('settings.general.layoutSection'), [
    syncedSwitch({
      id: 'kdl-layout-edit-quick',
      label: tx('mod.creator.blockOrder.setting.editMode', 'Edit page layout'),
      description: tx('mod.creator.blockOrder.setting.editMode.hint', 'Show drag handles and move buttons for creator and post blocks.'),
      checked: isLayoutEditing(),
      onChange: (checked) => {
        setLayoutEditing(checked);
        notifySaved();
      },
    }, 'creator.blockOrder', 'editMode'),
    syncedSwitch({
      id: 'kdl-layout-button-toggle',
      label: t('settings.general.layout.button'),
      description: t('settings.general.layout.buttonDescription'),
      checked: isModuleEnabled(LAYOUT_BUTTON_MODULE),
      onChange: (checked) => {
        setModuleEnabled(LAYOUT_BUTTON_MODULE, checked);
        notifySaved();
      },
    }, LAYOUT_BUTTON_MODULE),
  ], { icon: 'layout-dashboard' });
  node.id = 'kdl-settings-layout';
  const sync = () => showWhen(node, isModuleEnabled('ui.shadcn'));
  sync();
  whileConnected(node, (event) => {
    if ((event.type === 'enabled' || event.type === 'disabled') && event.id === 'ui.shadcn') sync();
  });
  return node;
}

registerSettingsSection({
  id: 'general',
  title: 'General',
  icon: 'settings',
  order: 10,
  render(container) {
    container.append(
      layoutSection(),
      languageSection(),
      section(t('settings.general.sessionSection'), [
        sessionField(),
        settingSwitch('enableAPIFetch', t('settings.general.api.label'), t('settings.general.api.description')),
      ], { icon: 'key-round' }),
      section(t('settings.general.cacheSection'), [
        settingNumber('cacheDurationHours', t('settings.general.cache.duration'), t('settings.general.cache.durationDescription'), { min: 0, step: 1 }),
        cacheControls(),
        apiCacheLifetime(),
        apiCacheControls(),
      ], { icon: 'archive' }),
      section(t('settings.general.debugSection'), [debugControls()], { icon: 'info' }),
      aboutSection()
    );
  },
});
