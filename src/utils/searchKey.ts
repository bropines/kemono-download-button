// Search keys that let a Latin or Cyrillic query find Japanese, Korean and Chinese names: both the query and the
// text are reduced to one form (lower-case Latin, no diacritics, long vowels shortened), so "hatsune", "хацунэ",
// "хатсуне" and 初音ミク (with its English name from translateNames) meet.
// - kana becomes rōmaji locally (wanakana);
// - a Cyrillic query is read two ways: plain transliteration, and the Polivanov system Russian uses for Japanese
//   names (си = shi, ти = chi, цу = tsu, дзи = ji, э = e...);
// - kanji and hangul need a dictionary: translateNames() asks Google once per name and keeps the answer.

import { toRomaji } from 'wanakana';
import { readStored, writeStored } from '../state/gmStorage';
import { translateLinesGoogle } from '../services/translators';

const KANA = /[぀-ヿㇰ-ㇿｦ-ﾟ]/;
const NEEDS_DICTIONARY = /[㐀-䶿一-鿿豈-﫿가-힯ᄀ-ᇿ]/;
const CYRILLIC = /[Ѐ-ӿ]/;

const PLAIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', і: 'i', ї: 'yi', є: 'ye', ґ: 'g',
};

// Polivanov, longest first: Russian spelling of a Japanese name back to Hepburn
const POLIVANOV: [string, string][] = [
  ['дзё', 'jo'], ['дзя', 'ja'], ['дзю', 'ju'], ['дзи', 'ji'], ['дз', 'z'],
  ['сё', 'sho'], ['ся', 'sha'], ['сю', 'shu'], ['си', 'shi'],
  ['тё', 'cho'], ['тя', 'cha'], ['тю', 'chu'], ['ти', 'chi'],
  ['цу', 'tsu'], ['ё', 'yo'], ['я', 'ya'], ['ю', 'yu'], ['э', 'e'], ['й', 'i'], ['ж', 'j'], ['ц', 'ts'],
  ['ф', 'f'], ['х', 'h'], ['ш', 'sh'], ['ч', 'ch'],
];

function transliterate(text: string, polivanov: boolean): string {
  let out = text;
  if (polivanov) for (const [from, to] of POLIVANOV) out = out.split(from).join(to);
  return Array.from(out).map((ch) => PLAIN[ch] ?? ch).join('');
}

/** The comparable form: lower case, rōmaji for kana, no diacritics, long vowels shortened, no separators */
export function searchKey(text: string): string {
  let s = String(text ?? '').toLowerCase();
  if (KANA.test(s)) s = toRomaji(s);
  s = s.normalize('NFKD').replace(/[̀-ͯ]/g, '');
  if (CYRILLIC.test(s)) s = transliterate(s, false);
  return compact(s);
}

function compact(s: string): string {
  return s
    .replace(/kh/g, 'h')
    .replace(/ou/g, 'o')
    .replace(/([aeiou])\1+/g, '$1')
    .replace(/[\s\-_'’.·・,:;!?()[\]{}"]+/g, '');
}

/** The forms a query may mean, each split into words that must all be found */
export function queryVariants(query: string): string[][] {
  const words = String(query ?? '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const asIs = words.map((word) => compact(KANA.test(word) ? toRomaji(word) : word));
  const variants = [asIs];
  if (words.some((word) => CYRILLIC.test(word))) {
    variants.push(words.map((word) => compact(transliterate(word, false))));
    variants.push(words.map((word) => compact(transliterate(word, true))));
  }
  return variants;
}

/** Whether any form of the query has all its words in one of the texts' keys */
export function matchesQuery(keys: string[], variants: string[][]): boolean {
  return variants.some((words) => words.every((word) => !word || keys.some((key) => key.includes(word))));
}

// ---- English names for kanji / hangul, from Google, kept between visits ----

const STORE_KEY = 'search.nameTranslations';
const MAX_STORED = 4000;
let memory: Record<string, string> | null = null;

function stored(): Record<string, string> {
  if (!memory) {
    const value = readStored<Record<string, string>>(STORE_KEY, {});
    memory = value && typeof value === 'object' ? value : {};
  }
  return memory;
}

export const needsTranslation = (text: string): boolean => NEEDS_DICTIONARY.test(String(text ?? ''));

/**
 * English for the names that have kanji or hangul (初音ミク -> Hatsune Miku, 김민지 -> Kim Min-ji), asked for
 * once per name and kept. A failed request leaves those names without, it is tried again next time.
 */
export async function translateNames(names: string[]): Promise<Record<string, string>> {
  const known = stored();
  const missing = Array.from(new Set(names.filter((name) => needsTranslation(name) && !(name in known))));
  for (let start = 0; start < missing.length; start += 100) {
    const batch = missing.slice(start, start + 100);
    try {
      const out = await translateLinesGoogle(batch, 'en');
      batch.forEach((name, i) => { if (out[i]) known[name] = out[i]; });
    } catch {
      break;
    }
  }
  if (missing.length) {
    const entries = Object.entries(known);
    memory = Object.fromEntries(entries.slice(Math.max(0, entries.length - MAX_STORED)));
    writeStored(STORE_KEY, memory);
  }
  return memory || known;
}
