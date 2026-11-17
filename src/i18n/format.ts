// ICU-lite message formatting.
//
//   'Hello, {name}'                                   -> {name} is replaced by params.name
//   '{count, plural, one{# file} few{# файла} many{# файлов} other{# файла}}'
//                                                     -> category from Intl.PluralRules, # is the number
//   '{count, plural, =0{nothing} other{# items}}'     -> exact matches win over categories
//
// Anything else in braces that is not a known param stays as written, so a stray brace in a
// translation never throws.

export type MessageParams = Record<string, string | number>;

const pluralRules = new Map<string, Intl.PluralRules>();

function pluralCategory(locale: string, n: number): string {
  let rules = pluralRules.get(locale);
  if (!rules) {
    try {
      rules = new Intl.PluralRules(locale);
    } catch {
      rules = new Intl.PluralRules('en');
    }
    pluralRules.set(locale, rules);
  }
  return rules.select(n);
}

/** Index of the brace closing the one at `open`, or -1. */
function matchingBrace(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}' && --depth === 0) return i;
  }
  return -1;
}

/** `one{...} few{...} other{...}` -> map of selector to body. */
function pluralOptions(spec: string): Map<string, string> {
  const options = new Map<string, string>();
  let i = 0;
  while (i < spec.length) {
    const match = /^\s*(=\d+|[a-z]+)\s*\{/.exec(spec.slice(i));
    if (!match) break;
    const open = i + match[0].length - 1;
    const close = matchingBrace(spec, open);
    if (close < 0) break;
    options.set(match[1], spec.slice(open + 1, close));
    i = close + 1;
  }
  return options;
}

export function formatMessage(message: string, params: MessageParams | undefined, locale: string): string {
  if (!params || message.indexOf('{') < 0) return message;
  let out = '';
  let i = 0;
  while (i < message.length) {
    const open = message.indexOf('{', i);
    if (open < 0) {
      out += message.slice(i);
      break;
    }
    out += message.slice(i, open);
    const close = matchingBrace(message, open);
    if (close < 0) {
      out += message.slice(open);
      break;
    }
    const inner = message.slice(open + 1, close);
    const plural = /^\s*(\w+)\s*,\s*plural\s*,([\s\S]*)$/.exec(inner);
    if (plural && plural[1] in params) {
      const n = Number(params[plural[1]]);
      const options = pluralOptions(plural[2]);
      const body = options.get(`=${n}`) ?? options.get(pluralCategory(locale, n)) ?? options.get('other') ?? '';
      out += formatMessage(body.replace(/#/g, String(params[plural[1]])), params, locale);
    } else {
      const name = inner.trim();
      out += name in params ? String(params[name]) : message.slice(open, close + 1);
    }
    i = close + 1;
  }
  return out;
}
