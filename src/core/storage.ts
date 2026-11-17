import { readStored, writeStored } from '../state/gmStorage';

// Module state lives under `mod.<id>.<key>`; `mod.<id>.enabled` is the on/off switch
export const modKey = (id: string, key: string): string => `mod.${id}.${key}`;

const MIGRATED_KEY = 'mod.migrated.v1';
// A primitive fallback makes readStored hand the raw value back untouched
const UNSET = '\u0000kdl-unset';

const clampGrid = (value: unknown): number => Math.max(120, Math.min(400, Number(value) || 180));

// Toggles that moved from their pre-module keys. Old keys are left in place so a downgrade keeps working
const LEGACY_KEYS: [oldKey: string, newKey: string, convert: (value: unknown) => unknown][] = [
  ['kui_hide_ads', modKey('adblock', 'enabled'), Boolean],
  ['kemono_grid_size', modKey('gridSize', 'size'), clampGrid],
  ['kui_preload_images', modKey('kui.post', 'preloadImages'), Boolean],
  ['kui_hide_empty_sections', modKey('kui.post', 'hideEmptySections'), Boolean]
];

let migrationChecked = false;

export function migrateLegacyKeys(): void {
  if (migrationChecked) return;
  migrationChecked = true;
  if (typeof GM_getValue !== 'function' || readStored(MIGRATED_KEY, false)) return;
  for (const [oldKey, newKey, convert] of LEGACY_KEYS) {
    const value = readStored<unknown>(oldKey, UNSET);
    if (value === UNSET || value === undefined || value === null) continue;
    if (readStored<unknown>(newKey, UNSET) !== UNSET) continue;
    writeStored(newKey, convert(value));
  }
  writeStored(MIGRATED_KEY, true);
}

export function readModuleValue<T>(id: string, key: string, fallback: T): T {
  migrateLegacyKeys();
  return readStored<T>(modKey(id, key), fallback);
}

export function writeModuleValue(id: string, key: string, value: unknown): void {
  migrateLegacyKeys();
  writeStored(modKey(id, key), value);
}
