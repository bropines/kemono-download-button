import { KUI_STORAGE_KEYS } from '../config/storage';
import { getModules, getModuleSetting, isModuleEnabled, setModuleEnabled, setModuleSetting } from '../core/registry';
import { modKey } from '../core/storage';
import type { EmbedRules } from '../types';
import { readStored, writeStored } from './gmStorage';
import { kuiState, setEmbedRules, setVerboseDebugMode } from './kuiState';

// Interface settings and module state that go into a settings export next to the downloader settings.
// Every entry validates what it imports: a wrong type is skipped, unknown keys are never read.

interface Entry {
  get(): unknown;
  /** Applies a valid value and returns true; returns false (and changes nothing) otherwise. */
  set(value: unknown): boolean;
}

const COMMENT_LAYOUTS = ['list', 'grid', 'carousel'];

const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0;

function storedNumber(key: string, fallback: number): Entry {
  return {
    get: () => readStored(key, fallback),
    set: (value) => isCount(value) && (writeStored(key, value), true),
  };
}

function interfaceEntries(): Record<string, Entry> {
  return {
    [KUI_STORAGE_KEYS.EMBED_RULES]: {
      get: () => kuiState.embedRules,
      set: (value) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
        const rules: EmbedRules = {};
        Object.entries(value as Record<string, unknown>).forEach(([domain, action]) => {
          if (domain.trim() && (action === 'button' || action === 'hide')) rules[domain.trim().toLowerCase()] = action;
        });
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

/** Applies the known keys of an imported object; returns how many were valid and applied. */
export function importExtraSettings(data: Record<string, unknown>): number {
  let count = 0;
  Object.entries(allEntries()).forEach(([key, entry]) => {
    if (Object.prototype.hasOwnProperty.call(data, key) && entry.set(data[key])) count++;
  });
  return count;
}
