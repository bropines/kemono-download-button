export type PageType = 'post' | 'creator' | 'list' | 'artists' | 'search' | 'other';
export type SiteId = 'kemono' | 'coomer' | 'pawchive';

export interface PageInfo {
  type: PageType;
  site: SiteId;
  path: string;
}

export type SettingType = 'boolean' | 'number' | 'select' | 'text' | 'textarea';
export type SettingValue = boolean | number | string;

export interface SettingDef {
  key: string;
  label: string;
  type: SettingType;
  default: SettingValue;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  hint?: string;
  /** Replaces the default control in the settings UI; the stored value keeps its declared type */
  editor?: SettingEditor;
}

export interface SettingEditorContext {
  /** Unique per rendered copy of the setting */
  id: string;
  value: SettingValue;
  save(value: SettingValue): void;
}

/** Builds a custom control; `sync` pushes a value changed elsewhere (import, another copy) into it */
export type SettingEditor = (ctx: SettingEditorContext) => { control: HTMLElement; sync(value: SettingValue): void };

export interface ModuleSettings {
  get<T extends SettingValue = SettingValue>(key: string): T;
  set(key: string, value: SettingValue): void;
  /** Listener is dropped on unmount (or kept for good when added from setup). Returns an unsubscribe. */
  onChange(key: string, fn: (value: SettingValue) => void): () => void;
}

export interface ModuleContext {
  /** Live: always the page of the current navigation */
  readonly page: PageType;
  readonly site: SiteId;
  /** Live: #main when present, otherwise <body> */
  readonly root: Element;
  settings: ModuleSettings;
  /** Runs on unmount, in reverse order. Callbacks added from setup() run never (setup is permanent). */
  onCleanup(fn: () => void): void;
  log(...args: unknown[]): void;
}

export interface KdlModule {
  id: string;
  name: string;
  description?: string;
  group?: string;
  pages: PageType[] | 'any';
  sites?: SiteId[];
  defaultEnabled: boolean;
  /** Always enabled; setModuleEnabled ignores it and a settings UI should not offer a toggle */
  locked?: boolean;
  /** Not listed in Settings (modules tab, related modules): switched only by its own hidden way */
  hidden?: boolean;
  settings?: SettingDef[];
  /** Injected into <style id="kdl-mod-<id>"> in <head> while the module is enabled */
  styles?: string | (() => string);
  /** Mounted only while these modules are enabled; also ordered after them */
  requires?: string[];
  /** Ordering only */
  after?: string[];
  /** Once, before the first mount */
  setup?(ctx: ModuleContext): void;
  /** Entering a matching page (or being enabled on one) */
  mount?(ctx: ModuleContext): void;
  /** Batched page mutations (and same-path navigations) while mounted */
  update?(ctx: ModuleContext): void;
  /** Leaving the page or being disabled: undo DOM changes */
  unmount?(ctx: ModuleContext): void;
  /** Right before htmx stores a history snapshot: strip nodes that would come back without listeners */
  beforeSnapshot?(): void;
  /** At document-start, before the page is parsed (only <html> exists): cheap visual setup such as flags and
   *  CSS variables, so the first paint already looks right. Styles of enabled modules are injected then too. */
  early?(): void;
}

export type RegistryEvent =
  | { type: 'registered' | 'enabled' | 'disabled' | 'mounted' | 'unmounted'; id: string }
  | { type: 'setting'; id: string; key: string; value: SettingValue };
