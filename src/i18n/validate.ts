// Checks for translation packs, shared by the script (downloaded packs) and scripts/verify-locales.mjs
// (CI), which loads this file through the TypeScript compiler. Keep it free of imports.
//
// A pack is rejected when its shape is wrong (code, version, `ui`/`site` objects, a value that is not a
// string). Single entries are dropped, and fall back to English, when they are empty, unknown, or their
// message breaks: an unclosed brace, a malformed plural, or a {placeholder} the English text does not have.

/** Keys built at run time from ids (src/i18n/README.md), so they are not in the English baseline */
export const CONVENTION_KEY = /^(mod\.|modules\.group\.|settings\.tab\.|themes\.preset\.)/;

/** Language codes: `ru`, `pt-BR`, `zh-Hans` */
export const LANG_CODE = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

const PLURAL_SELECTOR = /^(=\d+|zero|one|two|few|many|other)$/;

export interface MessageInfo {
  /** {name} and {name, plural, ...} parameters used anywhere in the message */
  params: Set<string>;
  error?: string;
}

function closing(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}' && --depth === 0) return i;
  }
  return -1;
}

/** Parses an ICU-lite message (see format.ts). Braces around anything else are literal text. */
export function parseMessage(message: string): MessageInfo {
  const params = new Set<string>();
  const walk = (text: string): string | undefined => {
    let i = 0;
    while (i < text.length) {
      const open = text.indexOf('{', i);
      if (open < 0) return;
      const close = closing(text, open);
      if (close < 0) return `unclosed "{" at ${open}`;
      const inner = text.slice(open + 1, close);
      const plural = /^\s*(\w+)\s*,\s*plural\s*,([\s\S]*)$/.exec(inner);
      if (plural) {
        params.add(plural[1]);
        const spec = plural[2];
        const seen = new Set<string>();
        let j = 0;
        while (j < spec.length) {
          const rest = spec.slice(j);
          if (!rest.trim()) break;
          const option = /^\s*([^\s{]+)\s*\{/.exec(rest);
          if (!option || !PLURAL_SELECTOR.test(option[1])) return `bad plural option in "{${plural[1]}, plural, ...}"`;
          const bodyOpen = j + option[0].length - 1;
          const bodyClose = closing(spec, bodyOpen);
          if (bodyClose < 0) return `unclosed plural option "${option[1]}"`;
          seen.add(option[1]);
          const nested = walk(spec.slice(bodyOpen + 1, bodyClose));
          if (nested) return nested;
          j = bodyClose + 1;
        }
        if (!seen.has('other')) return `plural "{${plural[1]}, plural, ...}" has no "other" option`;
      } else if (/^\s*plural\s*,|,\s*plural\b/.test(inner)) {
        return `malformed plural "{${inner.slice(0, 30)}"`;
      } else if (/^\s*\w+\s*$/.test(inner)) {
        params.add(inner.trim());
      }
      i = close + 1;
    }
  };
  const error = walk(message);
  return error ? { params, error } : { params };
}

export interface EntryCheck {
  /** The entry must not be used */
  error?: string;
  /** Usable, but worth a look */
  warning?: string;
}

/** Checks one translated message against its English source (null when there is none to compare). */
export function checkEntry(source: string | null, translated: string): EntryCheck {
  if (!translated.trim()) return { error: 'empty' };
  const target = parseMessage(translated);
  if (target.error) return { error: target.error };
  if (source === null) return {};
  const base = parseMessage(source);
  const unknown = [...target.params].filter((p) => !base.params.has(p));
  if (unknown.length) return { error: `unknown placeholder ${unknown.map((p) => `{${p}}`).join(', ')}` };
  const missing = [...base.params].filter((p) => !target.params.has(p));
  return missing.length ? { warning: `does not use ${missing.map((p) => `{${p}}`).join(', ')}` } : {};
}

export interface PackShape {
  code: string;
  name: string;
  version: number;
  ui: Record<string, string>;
  site: Record<string, string>;
}

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

/** Problems that make the whole pack unusable; empty when the shape is right. */
export function packShapeProblems(raw: unknown, code?: string): string[] {
  if (!isRecord(raw)) return ['not a JSON object'];
  const problems: string[] = [];
  if (typeof raw.code !== 'string' || !LANG_CODE.test(raw.code)) problems.push('"code" must be a language code like "ru" or "pt-BR"');
  else if (code !== undefined && raw.code !== code) problems.push(`"code" is "${raw.code}", expected "${code}"`);
  if (typeof raw.name !== 'string' || !raw.name.trim()) problems.push('"name" is missing');
  if (!Number.isInteger(raw.version) || (raw.version as number) < 1) problems.push('"version" must be a positive integer');
  for (const part of ['ui', 'site'] as const) {
    const section = raw[part];
    if (!isRecord(section)) {
      problems.push(`"${part}" must be an object`);
      continue;
    }
    const bad = Object.keys(section).filter((key) => typeof section[key] !== 'string');
    if (bad.length) problems.push(`"${part}" values must be strings: ${bad.slice(0, 5).join(', ')}${bad.length > 5 ? '…' : ''}`);
  }
  return problems;
}

export interface SanitizeResult {
  pack?: PackShape;
  /** Why the pack was rejected */
  problems: string[];
  /** Entries left out, "ui:key: reason" */
  dropped: string[];
}

/** Validates a downloaded pack and keeps only the entries that are safe to show. */
export function sanitizePack(raw: unknown, baseline: Record<string, string>, code?: string): SanitizeResult {
  const problems = packShapeProblems(raw, code);
  if (problems.length) return { problems, dropped: [] };
  const source = raw as unknown as PackShape;
  const dropped: string[] = [];
  const ui: Record<string, string> = {};
  for (const [key, value] of Object.entries(source.ui)) {
    const known = Object.prototype.hasOwnProperty.call(baseline, key);
    if (!known && !CONVENTION_KEY.test(key)) {
      dropped.push(`ui:${key}: unknown key`);
      continue;
    }
    const check = checkEntry(known ? baseline[key] : null, value);
    if (check.error) dropped.push(`ui:${key}: ${check.error}`);
    else ui[key] = value;
  }
  const site: Record<string, string> = {};
  for (const [key, value] of Object.entries(source.site)) {
    const check = checkEntry(key, value);
    if (check.error) dropped.push(`site:${key}: ${check.error}`);
    else site[key] = value;
  }
  return { pack: { code: source.code, name: source.name, version: source.version, ui, site }, problems: [], dropped };
}

export interface IndexEntryShape {
  code: string;
  name: string;
  version: number;
}

/** locales/index.json: a list of {code, name, version} (an object with a `packs` list is read too). */
export function parseIndex(raw: unknown): { packs: IndexEntryShape[]; problems: string[] } {
  const list = Array.isArray(raw) ? raw : isRecord(raw) && Array.isArray(raw.packs) ? raw.packs : null;
  if (!list) return { packs: [], problems: ['index.json must be a list of {"code", "name", "version"}'] };
  const packs: IndexEntryShape[] = [];
  const problems: string[] = [];
  list.forEach((entry, i) => {
    if (!isRecord(entry) || typeof entry.code !== 'string' || !LANG_CODE.test(entry.code) || typeof entry.name !== 'string' || !Number.isInteger(entry.version)) {
      problems.push(`entry ${i} needs "code" (e.g. "ru"), "name" and an integer "version"`);
      return;
    }
    if (packs.some((p) => p.code === entry.code)) {
      problems.push(`"${entry.code}" is listed twice`);
      return;
    }
    packs.push({ code: entry.code, name: entry.name, version: entry.version as number });
  });
  return { packs, problems };
}
