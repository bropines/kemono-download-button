import { KdlModule, ModuleContext, PageInfo, RegistryEvent, SettingDef, SettingValue } from './types';
import { modKey, readModuleValue, writeModuleValue } from './storage';
import { keepInHead } from './page';

interface ModuleRecord {
  def: KdlModule;
  index: number;
  setupDone: boolean;
  mounted: boolean;
  ctx: ModuleContext | null;
  cleanups: (() => void)[];
}

interface Runtime {
  page(): PageInfo;
  root(): Element;
}

const records = new Map<string, ModuleRecord>();
const settingListeners = new Map<string, Set<(value: SettingValue) => void>>();
const registryListeners = new Set<(event: RegistryEvent) => void>();
let orderCache: ModuleRecord[] | null = null;
let runtime: Runtime | null = null;

const log = (id: string, ...args: unknown[]) => console.debug(`[KDL:${id}]`, ...args);

function emit(event: RegistryEvent): void {
  registryListeners.forEach((fn) => {
    try {
      fn(event);
    } catch (error) {
      console.error('[KDL] registry listener failed:', error);
    }
  });
}

/** Subscribe to registrations, enable/disable, mount/unmount and setting changes. Returns an unsubscribe. */
export function onRegistryChange(fn: (event: RegistryEvent) => void): () => void {
  registryListeners.add(fn);
  return () => registryListeners.delete(fn);
}

// Kahn's algorithm over requires + after, ties broken by registration order; a cycle falls back to that order
function ordered(): ModuleRecord[] {
  if (orderCache) return orderCache;
  const all = Array.from(records.values()).sort((a, b) => a.index - b.index);
  const deps = new Map(all.map((r) => [r.def.id, [...(r.def.requires || []), ...(r.def.after || [])].filter((d) => records.has(d))]));
  const done = new Set<string>();
  const result: ModuleRecord[] = [];
  while (result.length < all.length) {
    const next = all.find((r) => !done.has(r.def.id) && deps.get(r.def.id)!.every((d) => done.has(d)));
    if (!next) {
      const rest = all.filter((r) => !done.has(r.def.id));
      console.warn('[KDL] module dependency cycle among:', rest.map((r) => r.def.id).join(', '));
      result.push(...rest);
      break;
    }
    done.add(next.def.id);
    result.push(next);
  }
  return (orderCache = result);
}

export function registerModule(def: KdlModule): void {
  if (records.has(def.id)) {
    console.warn(`[KDL] module "${def.id}" registered twice; keeping the first`);
    return;
  }
  records.set(def.id, { def, index: records.size, setupDone: false, mounted: false, ctx: null, cleanups: [] });
  orderCache = null;
  emit({ type: 'registered', id: def.id });
  if (runtime) syncModules();
}

/** All registered modules, in mount order */
export function getModules(): readonly KdlModule[] {
  return ordered().map((r) => r.def);
}

export function getModule(id: string): KdlModule | undefined {
  return records.get(id)?.def;
}

/** The user's switch (or the default); a locked module is always on */
export function isModuleEnabled(id: string): boolean {
  const def = records.get(id)?.def;
  if (def?.locked) return true;
  return Boolean(readModuleValue(id, 'enabled', def ? def.defaultEnabled : false));
}

export function setModuleEnabled(id: string, enabled: boolean): void {
  if (records.get(id)?.def.locked) return;
  if (isModuleEnabled(id) === enabled) return;
  writeModuleValue(id, 'enabled', enabled);
  emit({ type: enabled ? 'enabled' : 'disabled', id });
  if (runtime) syncModules();
}

/** Currently mounted on this page */
export function isModuleMounted(id: string): boolean {
  return !!records.get(id)?.mounted;
}

function settingDef(id: string, key: string): SettingDef | undefined {
  return records.get(id)?.def.settings?.find((s) => s.key === key);
}

function coerce(def: SettingDef | undefined, value: unknown): SettingValue {
  if (!def) return value as SettingValue;
  switch (def.type) {
    case 'boolean':
      return Boolean(value);
    case 'number': {
      let n = Number(value);
      if (!Number.isFinite(n)) n = Number(def.default);
      if (def.min !== undefined) n = Math.max(def.min, n);
      if (def.max !== undefined) n = Math.min(def.max, n);
      return n;
    }
    default:
      return value == null ? String(def.default) : String(value);
  }
}

export function getModuleSetting<T extends SettingValue = SettingValue>(id: string, key: string): T {
  const def = settingDef(id, key);
  return coerce(def, readModuleValue<unknown>(id, key, def?.default)) as T;
}

/** Works for unregistered ids too (state modules write through it before registration) */
export function setModuleSetting(id: string, key: string, value: SettingValue): void {
  const next = coerce(settingDef(id, key), value);
  writeModuleValue(id, key, next);
  settingListeners.get(modKey(id, key))?.forEach((fn) => {
    try {
      fn(next);
    } catch (error) {
      console.error(`[KDL:${id}] setting listener failed:`, error);
    }
  });
  emit({ type: 'setting', id, key, value: next });
}

function subscribeSetting(id: string, key: string, fn: (value: SettingValue) => void): () => void {
  const k = modKey(id, key);
  if (!settingListeners.has(k)) settingListeners.set(k, new Set());
  settingListeners.get(k)!.add(fn);
  return () => settingListeners.get(k)?.delete(fn);
}

// `cleanups` null = setup context: listeners and cleanups live for the whole page session
function createContext(id: string, cleanups: (() => void)[] | null): ModuleContext {
  return {
    get page() {
      return runtime ? runtime.page().type : 'other';
    },
    get site() {
      return runtime ? runtime.page().site : 'kemono';
    },
    get root() {
      return runtime ? runtime.root() : document.body;
    },
    settings: {
      get: <T extends SettingValue>(key: string) => getModuleSetting<T>(id, key),
      set: (key, value) => setModuleSetting(id, key, value),
      onChange: (key, fn) => {
        const off = subscribeSetting(id, key, fn);
        cleanups?.push(off);
        return off;
      }
    },
    onCleanup: (fn) => {
      cleanups?.push(fn);
    },
    log: (...args) => log(id, ...args)
  };
}

// Enabled, and every required module is enabled too
function isEligible(id: string, seen = new Set<string>()): boolean {
  const record = records.get(id);
  if (!record || seen.has(id) || !isModuleEnabled(id)) return false;
  seen.add(id);
  return (record.def.requires || []).every((dep) => isEligible(dep, seen));
}

function matchesPage(def: KdlModule, page: PageInfo): boolean {
  if (def.sites && !def.sites.includes(page.site)) return false;
  return def.pages === 'any' || def.pages.includes(page.type);
}

function safely(record: ModuleRecord, phase: string, fn: () => void): void {
  try {
    fn();
  } catch (error) {
    console.error(`[KDL:${record.def.id}] ${phase} failed:`, error);
  }
}

function syncStyle(record: ModuleRecord, on: boolean): void {
  const { def } = record;
  if (!def.styles) return;
  const styleId = `kdl-mod-${def.id.replace(/[^\w-]/g, '-')}`;
  let node = document.getElementById(styleId);
  if (!on) {
    node?.remove();
    return;
  }
  if (node) {
    if (!node.isConnected) (document.head || document.documentElement).appendChild(node);
    return;
  }
  node = keepInHead(document.createElement('style'));
  node.id = styleId;
  node.textContent = typeof def.styles === 'function' ? def.styles() : def.styles;
  (document.head || document.documentElement).appendChild(node);
}

function mount(record: ModuleRecord): void {
  const { def } = record;
  if (!record.setupDone) {
    record.setupDone = true;
    if (def.setup) safely(record, 'setup', () => def.setup!(createContext(def.id, null)));
  }
  record.cleanups = [];
  record.ctx = createContext(def.id, record.cleanups);
  record.mounted = true;
  if (def.mount) safely(record, 'mount', () => def.mount!(record.ctx!));
  emit({ type: 'mounted', id: def.id });
}

function unmount(record: ModuleRecord): void {
  if (!record.mounted) return;
  const { def } = record;
  record.mounted = false;
  if (def.unmount && record.ctx) safely(record, 'unmount', () => def.unmount!(record.ctx!));
  const cleanups = record.cleanups.splice(0).reverse();
  cleanups.forEach((fn) => safely(record, 'cleanup', fn));
  record.ctx = null;
  emit({ type: 'unmounted', id: def.id });
}

// ---- Router-facing (not part of the settings UI API) ----

export function attachRuntime(next: Runtime): void {
  runtime = next;
}

/** Bring mounts and styles in line with enablement and the current page */
export function syncModules(): void {
  if (!runtime) return;
  const page = runtime.page();
  const list = ordered();
  const want = new Map(list.map((r) => [r.def.id, isEligible(r.def.id) && matchesPage(r.def, page)]));
  [...list].reverse().forEach((r) => {
    if (r.mounted && !want.get(r.def.id)) unmount(r);
  });
  list.forEach((r) => {
    syncStyle(r, isEligible(r.def.id));
    if (!r.mounted && want.get(r.def.id)) mount(r);
  });
}

/** Leaving the page: unmount everything not declared for 'any' page */
export function unmountPageScoped(): void {
  [...ordered()].reverse().forEach((r) => {
    if (r.def.pages !== 'any') unmount(r);
  });
}

export function updateMounted(): void {
  ordered().forEach((r) => {
    if (!r.mounted || !r.ctx) return;
    if (r.def.styles) syncStyle(r, true);
    if (r.def.update) safely(r, 'update', () => r.def.update!(r.ctx!));
  });
}

/** Unmounts and remounts the page-scoped modules, then updates the rest (after a language switch) */
export function remountModules(): void {
  if (!runtime) return;
  unmountPageScoped();
  syncModules();
  updateMounted();
}

export function snapshotMounted(): void {
  [...ordered()].reverse().forEach((r) => {
    if (r.mounted && r.def.beforeSnapshot) safely(r, 'beforeSnapshot', () => r.def.beforeSnapshot!());
  });
}
