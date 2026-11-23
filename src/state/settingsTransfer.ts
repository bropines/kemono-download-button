import { KUI_STORAGE_KEYS } from '../config/storage';
import { getModules, getModuleSetting, isModuleEnabled, setModuleEnabled, setModuleSetting } from '../core/registry';
import { modKey } from '../core/storage';
import { LANG_SETTING_KEY, setLanguageSetting } from '../i18n';
import { readStored, writeStored } from './gmStorage';
import { kuiState, setEmbedRules, setVerboseDebugMode } from './kuiState';
import { parseEmbedRules } from './aiPacks/embedRules';
import { themesPack } from './aiPacks/themes';

// Interface settings and module state that go into a settings export next to the downloader settings.
// Every entry validates what it imports: a wrong type is skipped, unknown keys are never read.
// Caches, history (viewed posts, downloaded files) and one-off flags stay out: they are not settings.

interface Entry {
  get(): unknown;
  /** Applies a valid value and returns true; returns false (and changes nothing) otherwise. */
  set(value: unknown): boolean;
}

const COMMENT_LAYOUTS = ['list', 'grid', 'carousel'];
const LANGUAGE = /^(auto|[a-z]{2,3}(-[A-Za-z0-9]{2,8})?)$/;

const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0;

function storedNumber(key: string, fallback: number): Entry {
  return {
    get: () => readStored(key, fallback),
    set: (value) => isCount(value) && (writeStored(key, value), true),
  };
}

function storedBoolean(key: string): Entry {
  return {
    get: () => readStored<boolean>(key, false) === true,
    set: (value) => typeof value === 'boolean' && (writeStored(key, value), true),
  };
}

/** A block order kept as an array of ids: every id known and none repeated */
function storedOrder(key: string, ids: string[]): Entry {
  return {
    get: () => {
      const value = readStored<unknown>(key, []);
      return Array.isArray(value) ? value : [];
    },
    set: (value) => {
      if (!Array.isArray(value) || value.some((id) => !ids.includes(id)) || new Set(value).size !== value.length) return false;
      writeStored(key, value);
      return true;
    },
  };
}

/** A field of the themes pack as an entry: it validates the same way */
function themesEntry(key: string): Entry {
  return {
    get: () => themesPack.fields().find((f) => f.key === key)!.get(),
    set: (value) => themesPack.fields().find((f) => f.key === key)!.set(value) === true,
  };
}

function interfaceEntries(): Record<string, Entry> {
  return {
    [KUI_STORAGE_KEYS.EMBED_RULES]: {
      get: () => kuiState.embedRules,
      set: (value) => {
        const rules = parseEmbedRules(value, true);
        if (!rules) return false;
        setEmbedRules(rules);
        return true;
      },
    },
    [KUI_STORAGE_KEYS.COMMENTS_LAYOUT]: {
      get: () => readStored(KUI_STORAGE_KEYS.COMMENTS_LAYOUT, 'list'),
      set: (value) => typeof value === 'string' && COMMENT_LAYOUTS.includes(value) && (writeStored(KUI_STORAGE_KEYS.COMMENTS_LAYOUT, value), true),
    },
    [KUI_STORAGE_KEYS.COMMENTS_LIMIT]: storedNumber(KUI_STORAGE_KEYS.COMMENTS_LIMIT, 20),
    [KUI_STORAGE_KEYS.COMMENTS_LIST_LIMIT]: storedNumber(KUI_STORAGE_KEYS.COMMENTS_LIST_LIMIT, 4),
    [KUI_STORAGE_KEYS.VERBOSE_DEBUG]: {
      get: () => kuiState.isVerboseDebugEnabled,
      set: (value) => typeof value === 'boolean' && (setVerboseDebugMode(value), true),
    },
    [KUI_STORAGE_KEYS.LENS_PANEL_OPEN]: storedBoolean(KUI_STORAGE_KEYS.LENS_PANEL_OPEN),
    'kui.video.loop': storedBoolean('kui.video.loop'),
    [LANG_SETTING_KEY]: {
      get: () => readStored(LANG_SETTING_KEY, 'auto') || 'auto',
      set: (value) => typeof value === 'string' && LANGUAGE.test(value) && (setLanguageSetting(value), true),
    },
    // Folded sidebar sections: "s1 s3"
    'ui.sidebar.collapsed': {
      get: () => String(readStored<string>('ui.sidebar.collapsed', '') || ''),
      set: (value) => typeof value === 'string' && /^(s\d{1,2}( s\d{1,2})*)?$/.test(value.trim()) && (writeStored('ui.sidebar.collapsed', value.trim()), true),
    },
    // Folded blocks on creator pages
    ...Object.fromEntries(['announcements', 'tags', 'links'].map((id) => {
      const key = modKey('creators.overview', `collapsed.${id}`);
      return [key, storedBoolean(key)];
    })),
    [modKey('creators.similar', 'collapsed')]: storedBoolean(modKey('creators.similar', 'collapsed')),
    // Post page block order (the creator page orders are module settings); the older creator keys are still
    // read while their module setting was never touched
    'postBlocks.order': storedOrder('postBlocks.order', ['downloads', 'content', 'files', 'videos']),
    'creatorOverview.order': storedOrder('creatorOverview.order', ['announcements', 'tags', 'links']),
    'creatorBlocks.order': storedOrder('creatorBlocks.order', ['similar', 'overview', 'posts']),
    // Themes. Scripts are never exported; a restored theme keeps the script it already has here
    'restyle.userThemes': themesEntry('themes'),
    'restyle.builtins': themesEntry('presets'),
  };
}

/** `mod.<id>.enabled` for every switchable module and `mod.<id>.<key>` for every declared setting. */
function moduleEntries(): Record<string, Entry> {
  const entries: Record<string, Entry> = {};
  getModules().forEach((mod) => {
    if (!mod.locked) {
      entries[modKey(mod.id, 'enabled')] = {
        get: () => isModuleEnabled(mod.id),
        set: (value) => typeof value === 'boolean' && (setModuleEnabled(mod.id, value), true),
      };
    }
    (mod.settings ?? []).forEach((def) => {
      entries[modKey(mod.id, def.key)] = {
        get: () => getModuleSetting(mod.id, def.key),
        set: (value) => {
          if (typeof value !== typeof def.default) return false;
          if (typeof value === 'number' && !Number.isFinite(value)) return false;
          if (def.type === 'select' && def.options && !def.options.some((o) => o.value === value)) return false;
          setModuleSetting(mod.id, def.key, value as boolean | number | string);
          return true;
        },
      };
    });
  });
  return entries;
}

const allEntries = () => ({ ...interfaceEntries(), ...moduleEntries() });

/** Current interface and module values, keyed by their storage keys. */
export function exportExtraSettings(): Record<string, unknown> {
  return Object.fromEntries(Object.entries(allEntries()).map(([key, entry]) => [key, entry.get()]));
}

/** Applies the known keys of an imported object; returns the keys that were valid and applied. */
export function importExtraSettings(data: Record<string, unknown>): string[] {
  const applied: string[] = [];
  Object.entries(allEntries()).forEach(([key, entry]) => {
    if (!Object.prototype.hasOwnProperty.call(data, key)) return;
    try {
      if (entry.set(data[key])) applied.push(key);
    } catch {
      // A broken value is skipped like a wrong type
    }
  });
  return applied;
}
