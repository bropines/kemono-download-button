import { adblockModule, isAdBlockEnabled, setAdBlockEnabled, ADBLOCK_COMMAND } from '../../features/adblock';
import { notifySaved, section, syncedSwitch } from './controls';
import { getSettings, resetSettings } from '../../state/store';
import { importSettingsFile, openExportDialog } from './transfer';
import { el } from '../../utils/dom';
import { button, dialog, kitIcon, tabs, type DialogHandle, type DialogOptions } from '../kit';
import { createSettingsSearch, type SettingsSearch } from './search';
import { showMessage } from '../toast';
import { setModuleSetting } from '../../core/registry';
import { getSettingsSections, onSettingsSectionsChange } from './registry';
import { ensureSettingsStyles } from './styles';
import './sections';
import { renderTopicModules } from './sections/modules';
import { t, tx } from '../../i18n';

export type SettingsTab = 'general' | 'downloads' | 'translation' | 'images' | 'interface' | 'modules' | (string & {});

let handle: DialogHandle | null = null;
let search: SettingsSearch | null = null;
let currentTab: SettingsTab = 'general';

/** Renders the panels of the tabs not opened yet (for the search), then goes back to the current tab. */
function renderAllPanels(root: HTMLElement): void {
  const triggers = Array.from(root.querySelectorAll<HTMLElement>(':scope > .kdl-ui-tabs__list > .kdl-ui-tabs__trigger'));
  const current = triggers.find((trigger) => trigger.getAttribute('aria-selected') === 'true');
  let opened = false;
  for (const trigger of triggers) {
    const id = trigger.getAttribute('aria-controls');
    const panel = id ? root.querySelector(`#${CSS.escape(id)}`) : null;
    if (!panel || panel.childElementCount) continue;
    try {
      trigger.click();
      opened = true;
    } catch (e) {
      console.error('[Kemono DL] Settings tab failed to render:', e);
    }
  }
  if (opened) current?.click();
}

const isTyping = (node: EventTarget | undefined): boolean =>
  node instanceof HTMLElement && (node.isContentEditable || (node.matches('input, textarea, select') && !(node instanceof HTMLInputElement && ['checkbox', 'radio', 'range', 'button'].includes(node.type))));

/** Ctrl/Cmd+F and "/" go to the search; Escape empties it first, then closes the dialog. Escapes taken by a layer
    above the dialog (a popover, a confirmation) never get here: the kit's dismiss stack stops them. */
function onKeyDown(event: KeyboardEvent): void {
  if (!handle?.isOpen() || !search || event.defaultPrevented) return;
  const key = event.key;
  if (key === 'Escape') {
    event.preventDefault();
    if (search.query()) search.clear();
    else closeSettings();
  } else if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && key.toLowerCase() === 'f') {
    event.preventDefault();
    search.focus();
  } else if (key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !isTyping(event.composedPath()[0])) {
    event.preventDefault();
    search.focus();
  }
}

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
  const node = buildTabs();
  handle.body.replaceChildren(node);
  search?.attach(node);
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
          setAdBlockEnabled(adblockModule.defaultEnabled);
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
  return [
    // Export opens a choice (full backup, without secrets, AI packs); Import works out the file type itself
    button({ id: 'kdl-export-btn', label: t('settings.footer.export'), icon: 'download', variant: 'outline', onClick: openExportDialog }),
    button({ id: 'kdl-import-btn', label: t('settings.footer.import'), icon: 'folder-open', variant: 'outline', onClick: importSettingsFile }),
    button({ id: 'kdl-reset-btn', label: t('settings.footer.reset'), icon: 'rotate-ccw', variant: 'ghost', onClick: confirmReset }),
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
  const tabsNode = buildTabs();
  const options: DialogOptions = {
    title: t('settings.dialog.title'),
    description: t('settings.dialog.description'),
    size: 'lg',
    className: 'kdl-settings',
    content: () => [tabsNode],
    footer: buildFooter(),
    // Escape goes through onKeyDown, which empties the search first
    closeOnEscape: false,
    onClose: () => {
      handle = null;
      search = null;
      document.removeEventListener('keydown', onKeyDown);
    },
  };
  handle = dialog(options);
  handle.element.id = 'kdl-settings-modal';
  search = createSettingsSearch({ dialog: handle.element, body: handle.body, renderAll: renderAllPanels, secret: secretSetting });
  handle.element.querySelector('.kdl-ui-dialog__header')?.append(search.field);
  search.attach(tabsNode);
  // The search box comes first in the dialog now; opening still focuses the current tab (a focused box would
  // bring up the keyboard on phones). Read by open() below.
  options.initialFocus = tabsNode.querySelector<HTMLElement>('.kdl-ui-tabs__trigger[aria-selected="true"]');
  document.addEventListener('keydown', onKeyDown);
  handle.open();
}

/** The hidden ad switch: only the exact command shows it */
function secretSetting(query: string): HTMLElement | null {
  if (query !== ADBLOCK_COMMAND) return null;
  return section(t('settings.interface.siteSection'), [
    syncedSwitch({
      id: 'hideAdsToggle',
      label: t('settings.interface.hideAds'),
      description: t('settings.interface.hideAdsDescription'),
      checked: isAdBlockEnabled(),
      onChange: (checked) => {
        setAdBlockEnabled(checked);
        notifySaved();
      },
    }, adblockModule.id),
  ], { icon: 'eye' });
}

export function closeSettings(): void {
  handle?.close();
}

export function isSettingsOpen(): boolean {
  return !!handle?.isOpen();
}

onSettingsSectionsChange(refreshSettings);
