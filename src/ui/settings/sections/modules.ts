import {
  getModule,
  getModules,
  getModuleSetting,
  isModuleEnabled,
  setModuleEnabled,
  setModuleSetting,
  type KdlModule,
  type PageType,
  type SettingDef,
} from '../../../core';
import { el } from '../../../utils/dom';
import {
  badge,
  emptyState,
  field,
  input,
  isSwitchOn,
  kitIcon,
  select,
  setSliderValue,
  setSwitch,
  slider,
  switchControl,
  textarea,
} from '../../kit';
import { notifySaved, section, whileConnected } from '../controls';
import { getSettingsSections, registerSettingsSection, type SettingsSection } from '../registry';
import { t, tx } from '../../../i18n';

const PAGE_LABELS: Record<PageType, () => string> = {
  post: () => t('settings.modules.page.post'),
  creator: () => t('settings.modules.page.creator'),
  list: () => t('settings.modules.page.list'),
  artists: () => t('settings.modules.page.artists'),
  search: () => t('settings.modules.page.search'),
  other: () => t('settings.modules.page.other'),
};

/** Translated texts of a module definition (convention keys, see src/i18n/README.md). */
const modName = (mod: KdlModule) => tx(`mod.${mod.id}.name`, mod.name);
const modDescription = (mod: KdlModule) => (mod.description ? tx(`mod.${mod.id}.description`, mod.description) : undefined);
const modGroup = (group: string) => tx(`modules.group.${group}`, group);
// A slider only when the range is small enough to drag through; otherwise a number input
const MAX_SLIDER_STEPS = 1000;

const settingId = (mod: KdlModule, key: string) => `kdl-mod-${mod.id}-${key}`.replace(/[^\w-]/g, '-');

/** Required modules that are switched off, by name. */
function missingRequirements(mod: KdlModule): string[] {
  return (mod.requires ?? []).filter((dep) => !isModuleEnabled(dep)).map((dep) => { const def = getModule(dep); return def ? modName(def) : dep; });
}

/** Builds the control for one declared setting; `sync` pushes an outside change into it. */
function settingControl(mod: KdlModule, def: SettingDef): { node: HTMLElement; sync: (value: unknown) => void } {
  const id = settingId(mod, def.key);
  const value = getModuleSetting(mod.id, def.key);
  const save = (next: boolean | number | string) => {
    setModuleSetting(mod.id, def.key, next);
    notifySaved();
  };
  const labelled = (control: HTMLElement, horizontal = false) =>
    field({ label: tx(`mod.${mod.id}.setting.${def.key}`, def.label), description: def.hint ? tx(`mod.${mod.id}.setting.${def.key}.hint`, def.hint) : undefined, control, orientation: horizontal ? 'horizontal' : 'vertical' });

  switch (def.type) {
    case 'boolean': {
      const control = switchControl({ id, checked: Boolean(value), onChange: save });
      return { node: labelled(control, true), sync: (v) => setSwitch(control, Boolean(v)) };
    }
    case 'number': {
      const { min, max } = def;
      if (min !== undefined && max !== undefined && max > min && max - min <= MAX_SLIDER_STEPS) {
        const control = slider({ id, min, max, value: Number(value), showValue: true, onInput: save });
        return { node: labelled(control), sync: (v) => setSliderValue(control, Number(v)) };
      }
      const control = input({
        id,
        type: 'number',
        min,
        max,
        value: String(value),
        onChange: (raw) => {
          save(Number(raw));
          control.value = String(getModuleSetting(mod.id, def.key));
        },
      });
      return { node: labelled(control), sync: (v) => (control.value = String(v)) };
    }
    case 'select': {
      const options = (def.options ?? []).map((o) => ({ value: o.value, label: tx(`mod.${mod.id}.setting.${def.key}.option.${o.value}`, o.label) }));
      const control = select({ id, options, value: String(value), onChange: save });
      return { node: labelled(control), sync: (v) => (control.value = String(v)) };
    }
    case 'textarea': {
      const control = textarea({ id, value: String(value), rows: 4, onInput: save });
      return { node: labelled(control), sync: (v) => (control.value = String(v)) };
    }
    default: {
      const control = input({ id, value: String(value), onInput: save });
      return { node: labelled(control), sync: (v) => (control.value = String(v)) };
    }
  }
}

function pageBadges(mod: KdlModule): HTMLElement {
  const pages = mod.pages === 'any' ? [t('settings.modules.page.any')] : mod.pages.map((page) => PAGE_LABELS[page]?.() ?? page);
  return el('div', { className: 'kdl-settings__module-badges' }, [
    ...pages.map((text) => badge({ text, variant: 'outline' })),
    ...(mod.sites ?? []).map((site) => badge({ text: site, variant: 'secondary' })),
    mod.locked ? badge({ text: t('settings.modules.alwaysOn'), variant: 'secondary', icon: 'lock' }) : null,
  ]);
}

/** One module: switch, description, pages, its declared settings and any section registered under its id. */
function moduleCard(mod: KdlModule, extra: SettingsSection | undefined): HTMLElement {
  const toggle = switchControl({
    id: settingId(mod, 'enabled'),
    ariaLabel: t('settings.modules.enable', { name: modName(mod) }),
    checked: isModuleEnabled(mod.id),
    disabled: !!mod.locked,
    onChange: (checked) => {
      setModuleEnabled(mod.id, checked);
      notifySaved();
    },
  });
  const notice = el('p', { className: 'kdl-settings__module-notice' }, [kitIcon('info'), el('span')]);
  const controls = (mod.settings ?? []).map((def) => ({ def, ...settingControl(mod, def) }));
  const body = el('div', { className: 'kdl-settings__group kdl-settings__module-settings' }, controls.map((c) => c.node));
  if (extra) extra.render(body);

  const node = section(modName(mod), [pageBadges(mod), notice, body.childElementCount ? body : null], {
    description: modDescription(mod) ?? extra?.description,
  });
  node.classList.add('kdl-settings__module');
  node.dataset.module = mod.id;
  node.dataset.search = [mod.id, mod.name, modName(mod), mod.description, modDescription(mod), mod.group, mod.group && modGroup(mod.group), extra?.title, extra && tx(`settings.tab.${extra.id}`, extra.title)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  toggle.classList.add('kdl-settings__module-toggle');
  node.querySelector('.kdl-settings__section-head')!.append(toggle);

  const syncState = () => {
    const missing = missingRequirements(mod);
    const enabled = isModuleEnabled(mod.id);
    if (isSwitchOn(toggle) !== enabled) setSwitch(toggle, enabled);
    // A module waiting on a switched-off requirement can't run, so its own switch is held until that is on
    toggle.disabled = !!mod.locked || (missing.length > 0 && !enabled);
    notice.hidden = !missing.length;
    notice.querySelector('span')!.textContent = missing.length
      ? t(enabled ? 'settings.modules.needsInactive' : 'settings.modules.needs', { names: missing.join(', ') })
      : '';
    node.dataset.state = enabled && !missing.length ? 'on' : 'off';
  };
  syncState();

  whileConnected(node, (event) => {
    if (event.type === 'enabled' || event.type === 'disabled') syncState();
    if (event.type !== 'setting' || event.id !== mod.id) return;
    const control = controls.find((c) => c.def.key === event.key);
    if (!control) return;
    // Leave a field the user is typing in or dragging alone: the value came from it anyway
    const active = (control.node.getRootNode() as Document | ShadowRoot).activeElement;
    const editing = control.node.contains(active) && control.def.type !== 'boolean' && control.def.type !== 'select';
    if (!editing) control.sync(event.value);
  });
  return node;
}

function groupBlock(title: string, cards: HTMLElement[]): HTMLElement {
  return el('section', { className: 'kdl-settings__module-group', dataset: { group: title } }, [
    el('h3', { className: 'kdl-settings__module-group-title', textContent: modGroup(title) }),
    ...cards,
  ]);
}

function renderModules(container: HTMLElement): void {
  const modules = getModules();
  const sections = getSettingsSections('modules');
  const byModule = new Map(sections.filter((s) => getModule(s.id)).map((s) => [s.id, s]));
  const loose = sections.filter((s) => !getModule(s.id));

  const groups = new Map<string, HTMLElement[]>();
  modules.forEach((mod) => {
    const group = mod.group || 'Other';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(moduleCard(mod, byModule.get(mod.id)));
  });
  const looseCards = loose.map((s) => {
    const node = section(tx(`settings.tab.${s.id}`, s.title), [], { icon: s.icon, description: s.description });
    node.dataset.section = s.id;
    node.dataset.search = [s.id, s.title, tx(`settings.tab.${s.id}`, s.title), s.description].filter(Boolean).join(' ').toLowerCase();
    s.render(node.querySelector<HTMLElement>('.kdl-ui-card__content')!);
    return node;
  });

  const blocks = [...groups].map(([title, cards]) => groupBlock(title, cards));
  if (looseCards.length) blocks.push(groupBlock(t('settings.modules.moreSettings'), looseCards));

  if (!blocks.length) {
    container.append(emptyState({ icon: 'package', title: t('settings.modules.none') }));
    return;
  }

  const empty = emptyState({ icon: 'search', title: t('settings.modules.noMatch') });
  empty.hidden = true;
  const search = input({
    id: 'kdl-modules-search',
    type: 'search',
    placeholder: t('settings.modules.searchPlaceholder'),
    ariaLabel: t('settings.modules.search'),
    onInput: (raw) => {
      const terms = raw.toLowerCase().split(/\s+/).filter(Boolean);
      let shown = 0;
      blocks.forEach((block) => {
        let visible = 0;
        block.querySelectorAll<HTMLElement>(':scope > [data-search]').forEach((card) => {
          const match = terms.every((t) => card.dataset.search!.includes(t));
          card.hidden = !match;
          if (match) visible++;
        });
        block.hidden = !visible;
        shown += visible;
      });
      empty.hidden = shown > 0;
    },
  });
  container.append(
    el('div', { className: 'kdl-settings__module-search' }, [kitIcon('search'), search]),
    ...blocks,
    empty
  );
}

// Every registered module is listed here with its switch and declared settings. Settings sections
// registered with placement 'modules' render inside the card of the module with the same id, or at the end.
registerSettingsSection({
  id: 'modules',
  title: 'Modules',
  icon: 'package',
  order: 100,
  render(container) {
    renderModules(container);
    // A module registered while the tab is open shows up without reopening the dialog
    whileConnected(container, (event) => {
      if (event.type !== 'registered') return;
      container.replaceChildren();
      renderModules(container);
    });
  },
});
