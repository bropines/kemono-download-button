import type { IconName } from '../../config/icons';
import { saveSetting, state } from '../../state/store';
import type { DownloaderSettings } from '../../types';
import { onRegistryChange, type RegistryEvent } from '../../core';
import { el } from '../../utils/dom';
import {
  card,
  field,
  input,
  kitIcon,
  select,
  switchControl,
  toast,
  type Child,
  type InputOptions,
  type SelectOption,
  type ToastHandle,
} from '../kit';

type Key = keyof DownloaderSettings;
type KeysOf<T> = { [K in Key]: DownloaderSettings[K] extends T ? K : never }[Key];

const SAVED_DEBOUNCE_MS = 600;
let savedTimer = 0;
let savedToast: ToastHandle | null = null;

/** One "Saved" toast per burst of changes. */
export function notifySaved(): void {
  clearTimeout(savedTimer);
  savedTimer = window.setTimeout(() => {
    const alive = savedToast?.element.isConnected && savedToast.element.dataset.state !== 'closed';
    if (alive) savedToast!.update({ title: 'Saved' });
    else savedToast = toast({ title: 'Saved', variant: 'success', duration: 1500 });
  }, SAVED_DEBOUNCE_MS);
}

/** Card grouping related controls. */
export function section(title: string, children: Child[], options: { description?: string; icon?: IconName } = {}): HTMLDivElement {
  const node = card({ content: children, className: 'kdl-settings__section' });
  node.prepend(
    el('div', { className: 'kdl-settings__section-head' }, [
      options.icon ? kitIcon(options.icon) : null,
      el('h3', { className: 'kdl-settings__section-title', textContent: title }),
    ])
  );
  if (options.description) {
    node.children[0].after(el('p', { className: 'kdl-settings__section-description', textContent: options.description }));
  }
  return node;
}

/** Shows or hides a group of controls. */
export function showWhen(node: HTMLElement, visible: boolean): void {
  node.hidden = !visible;
}

export interface SwitchRowOptions {
  id?: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Switch + label + description, saved by the caller. */
export function switchRow(options: SwitchRowOptions): HTMLDivElement {
  return field({
    label: options.label,
    description: options.description,
    orientation: 'horizontal',
    control: switchControl({ id: options.id, checked: options.checked, onChange: options.onChange }),
  });
}

/** Switch bound to a boolean downloader setting. */
export function settingSwitch(
  key: KeysOf<boolean>,
  label: string,
  description?: string,
  onChange?: (checked: boolean) => void
): HTMLDivElement {
  return switchRow({
    id: `kdl-setting-${key}`,
    label,
    description,
    checked: !!state.settings[key],
    onChange: async (checked) => {
      await saveSetting(key, checked as DownloaderSettings[typeof key]);
      notifySaved();
      onChange?.(checked);
    },
  });
}

/** Text/password input bound to a string setting; saves as you type. */
export function settingText(
  key: KeysOf<string>,
  label: string,
  description?: string,
  options: Pick<InputOptions, 'type' | 'placeholder'> & { onSaved?: (value: string) => void } = {}
): HTMLDivElement {
  const control = input({
    id: `kdl-setting-${key}`,
    type: options.type ?? 'text',
    placeholder: options.placeholder,
    value: String(state.settings[key] ?? ''),
    autocomplete: options.type === 'password' ? 'off' : undefined,
    onInput: async (value) => {
      await saveSetting(key, value as DownloaderSettings[typeof key]);
      notifySaved();
      options.onSaved?.(value);
    },
  });
  return field({ label, description, control });
}

/** Number input bound to a numeric setting; clamped and saved on change. */
export function settingNumber(
  key: KeysOf<number>,
  label: string,
  description: string | undefined,
  range: { min?: number; max?: number; step?: number } = {}
): HTMLDivElement {
  const control = input({
    id: `kdl-setting-${key}`,
    type: 'number',
    ...range,
    value: String(state.settings[key]),
    onChange: async (raw) => {
      const parsed = parseFloat(raw);
      let value = Number.isFinite(parsed) ? parsed : (state.settings[key] as number);
      if (range.min !== undefined) value = Math.max(range.min, value);
      if (range.max !== undefined) value = Math.min(range.max, value);
      control.value = String(value);
      await saveSetting(key, value as DownloaderSettings[typeof key]);
      notifySaved();
    },
  });
  return field({ label, description, control });
}

/** Select bound to a string or numeric setting. */
export function settingSelect(
  key: KeysOf<string> | KeysOf<number>,
  label: string,
  description: string | undefined,
  options: SelectOption[],
  onChange?: (value: string) => void
): HTMLDivElement {
  const numeric = typeof state.settings[key] === 'number';
  const control = select({
    id: `kdl-setting-${key}`,
    options,
    value: String(state.settings[key]),
    onChange: async (value) => {
      await saveSetting(key, (numeric ? Number(value) : value) as DownloaderSettings[typeof key]);
      notifySaved();
      onChange?.(value);
    },
  });
  return field({ label, description, control });
}

/** A row of controls laid out in a responsive grid. */
export function grid(children: Child[]): HTMLDivElement {
  return el('div', { className: 'kdl-settings__grid' }, children);
}

/**
 * Registry events for a control of the open dialog. Sections render synchronously into a panel that is
 * attached right away, so the first event after the node left the page (dialog closed, tabs rebuilt) unsubscribes.
 */
export function whileConnected(node: HTMLElement, fn: (event: RegistryEvent) => void): void {
  const off = onRegistryChange((event) => {
    if (!node.isConnected) return void off();
    fn(event);
  });
}
