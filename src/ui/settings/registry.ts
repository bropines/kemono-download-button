import type { IconName } from '../../config/icons';

/**
 * Extension point of the Settings dialog.
 *
 * Every tab of the dialog is a section registered here, the built-in ones included
 * (see ./sections). Modules add their own settings the same way:
 *
 *   registerSettingsSection({
 *     id: 'my-module', title: 'My module', icon: 'package', order: 10,
 *     placement: 'modules',            // a card inside the "Modules" tab (default: its own tab)
 *     render(container) { container.append(settingSwitch(...)); },
 *   });
 *
 * render() runs each time the section is shown in a freshly opened dialog, so read current
 * values there. Build controls with the helpers in ./controls (save-on-change + "Saved" toast).
 */
export interface SettingsSection {
  /** Unique id; also the tab value for openSettings(id). Re-registering an id replaces it. */
  id: string;
  title: string;
  icon?: IconName;
  /** Ascending; built-in tabs use 10..60, the Modules tab 100. */
  order?: number;
  /** 'tab' (default): its own tab. 'modules': a card inside the Modules tab. */
  placement?: 'tab' | 'modules';
  /** Shown under the title of a module card. */
  description?: string;
  render(container: HTMLElement): void;
}

const sections = new Map<string, SettingsSection>();
const listeners = new Set<() => void>();

/** Adds (or replaces) a section. Returns a function that removes it again. */
export function registerSettingsSection(section: SettingsSection): () => void {
  sections.set(section.id, section);
  listeners.forEach((fn) => fn());
  return () => {
    if (sections.get(section.id) !== section) return;
    sections.delete(section.id);
    listeners.forEach((fn) => fn());
  };
}

/** Registered sections for one placement, sorted by order then title. */
export function getSettingsSections(placement: 'tab' | 'modules' = 'tab'): SettingsSection[] {
  return [...sections.values()]
    .filter((s) => (s.placement ?? 'tab') === placement)
    .sort((a, b) => (a.order ?? 50) - (b.order ?? 50) || a.title.localeCompare(b.title));
}

/** Called after every register/unregister; the open dialog uses it to re-render. */
export function onSettingsSectionsChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
