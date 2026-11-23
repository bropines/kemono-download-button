// "For AI" packs: a slice of the settings plus a system prompt that explains it, so a chat AI can edit the
// slice from a description in plain words. The user pastes the pack (or its copied text) into any chat, says
// what they want, and imports the answer back. Import finds the pack by its id and applies that pack's fields
// only, each through its own validator; everything else in the answer is ignored.
//
// A pack never carries secrets: its fields are chosen one by one, and a pack has no way to reach the others.
// This file holds no DOM or storage code; the packs live in ./aiPacks/ and the buttons in ui/settings/aiPackUi.

export const AI_PACK_FORMAT = 'kdl-ai-pack';
export const AI_PACK_VERSION = 1;

export interface AiField {
  key: string;
  /** Current value, as the AI sees it */
  get(): unknown;
  /** Applies a valid value and returns true; returns false (and changes nothing) otherwise */
  set(value: unknown): boolean | Promise<boolean>;
}

export interface AiPackDef {
  /** Stable id, written into the file and matched on import */
  id: string;
  /** Position in the export menu (lower first) */
  order?: number;
  /** Shown in menus and toasts */
  title(): string;
  fields(): AiField[];
  /** The whole system prompt, English: what each field does, the allowed values, limits and examples */
  systemPrompt(): string;
  /** Runs once after an import applied at least one field (redraws, sync) */
  afterApply?(): void | Promise<void>;
}

export interface AiPackFile {
  format: typeof AI_PACK_FORMAT;
  version: number;
  pack: string;
  title: string;
  script: string;
  systemPrompt: string;
  settings: Record<string, unknown>;
}

export interface AiApplyResult {
  pack: AiPackDef;
  applied: string[];
  /** Keys that were present but invalid, or not part of the pack */
  skipped: string[];
}

/** `code` names the problem (the UI words it as ai.error.<code>); `params` fill the text */
export class AiPackError extends Error {
  constructor(readonly code: 'noJson' | 'notObject' | 'unknownPack' | 'noPack' | 'otherPack' | 'version' | 'noSettings', readonly params: Record<string, string> = {}) {
    super(`${code}${Object.keys(params).length ? ` ${JSON.stringify(params)}` : ''}`);
  }
}

const packs = new Map<string, AiPackDef>();

export function registerAiPack(def: AiPackDef): AiPackDef {
  packs.set(def.id, def);
  return def;
}

export const getAiPacks = (): AiPackDef[] => [...packs.values()].sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
export const getAiPack = (id: string): AiPackDef | undefined => packs.get(id);

/** Field values, deep-copied so a caller can never write through them */
export function aiPackValues(def: AiPackDef): Record<string, unknown> {
  return Object.fromEntries(def.fields().map((field) => [field.key, JSON.parse(JSON.stringify(field.get() ?? null))]));
}

export function buildAiPack(def: AiPackDef, scriptVersion: string): AiPackFile {
  return {
    format: AI_PACK_FORMAT,
    version: AI_PACK_VERSION,
    pack: def.id,
    title: def.title(),
    script: scriptVersion,
    systemPrompt: def.systemPrompt(),
    settings: aiPackValues(def),
  };
}

/** The clipboard version: the prompt, then the JSON to edit (without the prompt in it) */
export function aiPackText(def: AiPackDef, scriptVersion: string): string {
  const { systemPrompt, ...file } = buildAiPack(def, scriptVersion);
  return `${systemPrompt}\n\n## Current JSON\n\n\`\`\`json\n${JSON.stringify(file, null, 2)}\n\`\`\`\n`;
}

/** Common opening and closing of every pack's prompt, so each pack writes only its own part */
export function composeAiPrompt(def: { id: string }, parts: { role: string; body: string; example?: unknown }): string {
  const example = parts.example === undefined ? '' :
    `\n\nExample of a valid answer:\n\n\`\`\`json\n${JSON.stringify({ format: AI_PACK_FORMAT, pack: def.id, settings: parts.example }, null, 2)}\n\`\`\``;
  return [
    `You are helping a user configure the "Kemono & Pawchive Download Button" userscript (a browser add-on for the archive sites kemono, coomer and pawchive). ${parts.role}`,
    'The user may write in any language; answer in the format below whatever language they use. This prompt is in English only so it stays exact.',
    parts.body.trim(),
    [
      '## How to answer',
      `- Reply with ONE JSON object of the same shape as the current JSON: {"format": "${AI_PACK_FORMAT}", "pack": "${def.id}", "settings": { ... }}. No other text; a single \`\`\`json code block is accepted too.`,
      '- Put only the keys described above inside "settings". Keys you leave out keep their current value, so it is fine to return only what changes. Unknown keys and values of the wrong type are skipped on import.',
      '- Do not invent values outside the allowed lists and limits. If the request cannot be done with these settings, say so in one short sentence instead of returning JSON.',
      '- Never add passwords, cookies or API keys: this pack has no place for them.',
    ].join('\n'),
  ].join('\n\n') + example;
}

/** The JSON object in an AI answer: plain JSON, a ```json block, or the outermost {...} in surrounding text */
export function parseAiAnswer(text: string): unknown {
  const source = String(text ?? '').trim().replace(/^﻿/, '');
  const attempts: string[] = [source];
  const fenced = /```(?:json|JSON)?\s*\n?([\s\S]*?)```/.exec(source);
  if (fenced) attempts.push(fenced[1].trim());
  const first = source.indexOf('{');
  const last = source.lastIndexOf('}');
  if (first >= 0 && last > first) attempts.push(source.slice(first, last + 1));
  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch {
      // the next form
    }
  }
  throw new AiPackError('noJson');
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

/** True for anything that names itself an AI pack */
export const isAiPackData = (data: unknown): boolean => isObject(data) && data.format === AI_PACK_FORMAT;

/** The registered pack an object belongs to, by its `pack` id (null when it names none or an unknown one) */
export function detectAiPack(data: unknown): AiPackDef | null {
  if (!isObject(data) || typeof data.pack !== 'string') return null;
  return packs.get(data.pack) ?? null;
}

/**
 * Applies an answer to its pack. `expected` is the pack of the button that opened the import: then a bare
 * `{settings}` or a bare object of fields is accepted too. An answer naming another pack is refused.
 */
export async function applyAiPack(data: unknown, expected?: AiPackDef): Promise<AiApplyResult> {
  if (!isObject(data)) throw new AiPackError('notObject');
  const named = typeof data.pack === 'string' ? data.pack : '';
  const pack = named ? packs.get(named) : expected;
  if (named && !pack) throw new AiPackError('unknownPack', { pack: named });
  if (!pack) throw new AiPackError('noPack');
  if (expected && pack.id !== expected.id) throw new AiPackError('otherPack', { title: pack.title() });
  if (data.version !== undefined && (typeof data.version !== 'number' || data.version > AI_PACK_VERSION)) {
    throw new AiPackError('version', { version: String(data.version) });
  }
  const values = isObject(data.settings) ? data.settings
    : named || data.format !== undefined ? null
    : data;
  if (!values) throw new AiPackError('noSettings');
  const fields = new Map(pack.fields().map((field) => [field.key, field]));
  const applied: string[] = [];
  const skipped: string[] = [];
  for (const [key, value] of Object.entries(values)) {
    const field = fields.get(key);
    let ok = false;
    if (field) {
      try {
        ok = await field.set(value);
      } catch {
        ok = false;
      }
    }
    (ok ? applied : skipped).push(key);
  }
  if (applied.length) await pack.afterApply?.();
  return { pack, applied, skipped };
}
