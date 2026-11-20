import { setAdBlockEnabled } from '../../features/adblock';
import { exportSettings, getSettings, importSettings, resetSettings } from '../../state/store';
import { el } from '../../utils/dom';
import { button, dialog, kitIcon, tabs, type DialogHandle } from '../kit';
import { showMessage } from '../toast';
import { setModuleSetting } from '../../core/registry';
import { getSettingsSections, onSettingsSectionsChange } from './registry';
import { ensureSettingsStyles } from './styles';
import './sections';
import { renderTopicModules } from './sections/modules';
import { t, tx } from '../../i18n';

export type SettingsTab = 'general' | 'downloads' | 'translation' | 'images' | 'interface' | 'modules' | (string & {});

let handle: DialogHandle | null = null;
let currentTab: SettingsTab = 'general';

function buildTabs(): HTMLElement {
  const sections = getSettingsSections('tab');
  if (!sections.some((s) => s.id === currentTab)) currentTab = sections[0]?.id ?? 'general';
  const node = tabs({
    ariaLabel: t('settings.dialog.sectionsAria'),
    value: currentTab,
    onChange: (value) => (currentTab = value),
    items: sections.map((s) => ({
      value: s.id,
      label: tx(`settings.tab.${s.id}`, s.title),
      content: () => {
        const panel = el('div', { className: 'kdl-settings__panel', dataset: { section: s.id } });
        const content = el('div', { className: 'kdl-settings__panel' });
        s.render(content);
        panel.append(content);
        renderTopicModules(panel, s.id);
        return panel;
      },
    })),
  });
  node.querySelectorAll<HTMLElement>('.kdl-ui-tabs__trigger').forEach((trigger, i) => {
    trigger.dataset.section = sections[i].id;
    trigger.dataset.kdlTab = sections[i].id;
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
    title: t('settings.reset.title'),
    description: t('settings.reset.description'),
    size: 'sm',
    footer: [
      button({ label: t('settings.common.cancel'), variant: 'outline', onClick: () => confirm.close() }),
      button({
        label: t('settings.reset.confirm'),
        variant: 'destructive',
        onClick: async () => {
          confirm.close();
          await resetSettings();
          setAdBlockEnabled(true);
          setModuleSetting('gridSize', 'size', 180);
          refreshSettings();
          showMessage(t('settings.reset.done'), 'success');
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
      showMessage(t('settings.import.done', { count }), 'success');
    } catch (e) {
      showMessage(t('settings.import.failed', { error: (e as Error).message }), 'error');
    }
  });
  return [
    button({ id: 'kdl-export-btn', label: t('settings.footer.export'), icon: 'download', variant: 'outline', onClick: () => exportSettings() }),
    button({ id: 'kdl-import-btn', label: t('settings.footer.import'), icon: 'folder-open', variant: 'outline', onClick: () => file.click() }),
    button({ id: 'kdl-reset-btn', label: t('settings.footer.reset'), icon: 'rotate-ccw', variant: 'ghost', onClick: confirmReset }),
    file,
    el('span', { className: 'kdl-settings__footer-spacer' }),
    button({ label: t('settings.footer.done'), onClick: () => closeSettings() }),
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
    title: t('settings.dialog.title'),
    description: t('settings.dialog.description'),
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
