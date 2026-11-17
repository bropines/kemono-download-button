/** locales/<code>.json */
export interface LocalePack {
  code: string;
  /** Native name shown in the language list */
  name: string;
  /** Integer, raised on every change; a pack only replaces an older one */
  version: number;
  /** Our interface: key -> message (ICU-lite, see format.ts) */
  ui: Record<string, string>;
  /** Site chrome: English text as the site shows it -> translation. `{name}` in a key captures a part. */
  site: Record<string, string>;
}

/** One entry of locales/index.json */
export interface LocaleIndexEntry {
  code: string;
  name: string;
  version: number;
  /** Hex SHA-256 of the exact bytes of locales/<code>.json */
  sha256: string;
}

/** locales/index.json */
export interface LocaleIndex {
  packs: LocaleIndexEntry[];
}
