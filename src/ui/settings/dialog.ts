import { setAdBlockEnabled } from '../../features/adblock';
import { exportSettings, getSettings, importSettings, resetSettings } from '../../state/store';
import { el } from '../../utils/dom';
import { button, dialog, kitIcon, tabs, type DialogHandle } from '../kit';
import { showMessage } from '../toast';
import { setModuleSetting } from '../../core/registry';
import { getSettingsSections, onSettingsSectionsChange } from './registry';
import { ensureSettingsStyles } from './styles';
import './sections';

export type SettingsTab = 'general' | 'downloads' | 'translation' | 'images' | 'interface' | 'modules' | (string & {});

let handle: DialogHandle | null = null;
let currentTab: SettingsTab = 'general';

function buildTabs(): HTMLElement {
  const sections = getSettingsSections('tab');
  if (!sections.some((s) => s.id === currentTab)) currentTab = sections[0]?.id ?? 'general';
  const node = tabs({
    ariaLabel: 'Settings sections',
    value: currentTab,
    onChange: (value) => (currentTab = value),
    items: sections.map((s) => ({
      value: s.id,
      label: s.title,
      content: () => {
        const panel = el('div', { className: 'kdl-settings__panel', dataset: { section: s.id } });
        s.render(panel);
        return panel;
      },
    })),
  });
  node.querySelectorAll<HTMLElement>('.kdl-ui-tabs__trigger').forEach((trigger, i) => {
    trigger.dataset.section = sections[i].id;
    const name = sections[i].icon;
    if (name) trigger.prepend(kitIcon(name));
  });
  return node;
}

/** Rebuilds the open dialog's tabs (after import/reset or a new section), staying on the current tab. */
export function refreshSettings(): void {
  if (!handle?.isOpen()) return;
  handle.body.replaceChildren(buildTabs());
}

function confirmReset(): void {
  const confirm: DialogHandle = dialog({
    title: 'Reset settings?',
    description:
      'Every downloader and interface setting goes back to its default, saved templates included. Your session cookie and embed rules are kept.',
    size: 'sm',
    footer: [
      button({ label: 'Cancel', variant: 'outline', onClick: () => confirm.close() }),
      button({
        label: 'Reset',
        variant: 'destructive',
        onClick: async () => {
          confirm.close();
          await resetSettings();
          setAdBlockEnabled(true);
          setModuleSetting('gridSize', 'size', 180);
          refreshSettings();
          showMessage('Settings reset to defaults', 'success');
        },
      }),
    ],
  });
  confirm.open();
}

function buildFooter(): HTMLElement[] {
  const file = el('input', { type: 'file', id: 'kdl-import-file-input', accept: '.json,application/json', hidden: true });
  file.addEventListener('change', async () => {
    const chosen = file.files?.[0];
    file.value = '';
    if (!chosen) return;
    try {
      const count = await importSettings(await chosen.text());
      refreshSettings();
      showMessage(`Imported ${count} settings`, 'success');
    } catch (e) {
      showMessage(`Import failed: ${(e as Error).message}`, 'error');
    }
  });
  return [
    button({ id: 'kdl-export-btn', label: 'Export', icon: 'download', variant: 'outline', onClick: () => exportSettings() }),
    button({ id: 'kdl-import-btn', label: 'Import', icon: 'folder-open', variant: 'outline', onClick: () => file.click() }),
    button({ id: 'kdl-reset-btn', label: 'Reset', icon: 'rotate-ccw', variant: 'ghost', onClick: confirmReset }),
    file,
    el('span', { className: 'kdl-settings__footer-spacer' }),
    button({ label: 'Done', onClick: () => closeSettings() }),
  ];
}

function selectTab(tab: SettingsTab): void {
  handle?.element.querySelector<HTMLElement>(`.kdl-ui-tabs__trigger[data-section="${CSS.escape(tab)}"]`)?.click();
}

/** Opens the Settings dialog, optionally on a tab (section id). Selects the tab if it is already open. */
export async function openSettings(tab?: SettingsTab): Promise<void> {
  if (tab) currentTab = tab;
  if (handle?.isOpen()) {
    if (tab) selectTab(tab);
    return;
  }
  try {
    await getSettings();
  } catch (e) {
    console.error('[Kemono DL] Error loading settings:', e);
  }
  if (handle?.isOpen()) return;
  ensureSettingsStyles();
  handle = dialog({
    title: 'Settings',
    description: 'Changes are saved as you make them.',
    size: 'lg',
    className: 'kdl-settings',
    content: () => [buildTabs()],
    footer: buildFooter(),
    onClose: () => (handle = null),
  });
  handle.element.id = 'kdl-settings-modal';
  handle.open();
}

export function closeSettings(): void {
  handle?.close();
}

export function isSettingsOpen(): boolean {
  return !!handle?.isOpen();
}

onSettingsSectionsChange(refreshSettings);
