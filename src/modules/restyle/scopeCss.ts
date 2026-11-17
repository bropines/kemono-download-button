// Scopes user CSS to <html data-kdl-site data-kdl-page> by prefixing selectors.
//
// Prefixing instead of CSS nesting: it works in every engine (AdGuard's Android WebView
// included), `:root`/`html` selectors keep working (they are merged into the scope) and
// every rule gains (0,1,1) specificity, so it beats the site's own rules without
// !important. User CSS is deliberately *not* put in an @layer: unlayered site CSS
// would beat any layered rule.

import type { PageType, SiteId } from '../../core/types';

/** Blocks whose content is a list of style rules and gets scoped recursively */
const GROUPING_AT_RULES = new Set(['media', 'supports', 'container', 'layer', 'document', '-moz-document', 'starting-style']);

const attrList = (name: string, values: readonly string[]): string =>
  values.length === 1
    ? `[${name}="${values[0]}"]`
    : `:is(${values.map((v) => `[${name}="${v}"]`).join(',')})`;

/** `html[data-kdl-site]…` compound for a site/page scope */
export function scopeSelector(sites: SiteId[] | 'any', pages: PageType[] | 'any', extraPages?: PageType[]): string {
  let scope = 'html';
  scope += sites === 'any' || !sites.length ? '[data-kdl-site]' : attrList('data-kdl-site', sites);
  if (pages !== 'any' && pages.length) scope += attrList('data-kdl-page', pages);
  if (extraPages?.length) scope += attrList('data-kdl-page', extraPages);
  return scope;
}

function stripComments(source: string): string {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '"' || ch === "'") {
      const end = skipString(source, i);
      out += source.slice(i, end);
      i = end;
    } else if (ch === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end < 0 ? source.length : end + 2;
    } else {
      out += ch;
      i++;
    }
  }
  return out;
}

function skipString(source: string, start: number): number {
  const quote = source[start];
  let i = start + 1;
  while (i < source.length && source[i] !== quote) {
    if (source[i] === '\\') i++;
    else if (source[i] === '\n') break;
    i++;
  }
  return i + 1;
}

/** Index of the first `{` or `;` at depth 0, outside strings and parentheses */
function findPreludeEnd(source: string, start: number): number {
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (ch === '"' || ch === "'") i = skipString(source, i) - 1;
    else if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
    else if (depth === 0 && (ch === '{' || ch === ';' || ch === '}')) return i;
  }
  return source.length;
}

/** Index just after the `}` matching the `{` at `open` */
function findBlockEnd(source: string, open: number): number {
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    if (ch === '"' || ch === "'") i = skipString(source, i) - 1;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return i + 1;
  }
  return source.length;
}

/** Splits a selector list on top-level commas */
export function splitSelectors(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < list.length; i++) {
    const ch = list[i];
    if (ch === '"' || ch === "'") {
      const end = skipString(list, i);
      current += list.slice(i, end);
      i = end - 1;
      continue;
    }
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else current += ch;
  }
  parts.push(current);
  return parts.map((s) => s.trim()).filter(Boolean);
}

const ROOT_SELECTOR = /^(?::root|html)(?![\w-])/i;

export function prefixSelectors(list: string, scope: string): string {
  return splitSelectors(list)
    .map((sel) => (ROOT_SELECTOR.test(sel) ? sel.replace(ROOT_SELECTOR, scope) : `${scope} ${sel}`))
    .join(',\n');
}

function scopeBlock(source: string, scope: string, hoisted: string[]): string {
  let out = '';
  let i = 0;
  while (i < source.length) {
    while (i < source.length && /\s|;/.test(source[i])) i++;
    if (i >= source.length) break;
    if (source[i] === '}') {
      i++; // stray closing brace
      continue;
    }
    const end = findPreludeEnd(source, i);
    const prelude = source.slice(i, end).trim();
    if (end >= source.length || source[end] !== '{') {
      // Statement at-rule (@import, @layer a, b;) or garbage without a block
      if (prelude.startsWith('@')) hoisted.push(`${prelude};`);
      i = end + 1;
      continue;
    }
    const blockEnd = findBlockEnd(source, end);
    const body = source.slice(end + 1, Math.max(end + 1, blockEnd - 1));
    i = blockEnd;
    if (prelude.startsWith('@')) {
      const name = (prelude.match(/^@([\w-]+)/)?.[1] ?? '').toLowerCase();
      out += GROUPING_AT_RULES.has(name)
        ? `${prelude} {\n${scopeBlock(body, scope, hoisted)}}\n`
        : `${prelude} {${body}}\n`; // @keyframes, @font-face, @property…: global by nature
    } else if (prelude) {
      out += `${prefixSelectors(prelude, scope)} {${body}}\n`;
    }
  }
  return out;
}

/** Scopes a stylesheet; statement at-rules (@import) come back separately so they can lead the sheet */
export function scopeCssParts(source: string, scope: string): { hoisted: string[]; body: string } {
  const hoisted: string[] = [];
  const body = scopeBlock(stripComments(source), scope, hoisted);
  return { hoisted, body };
}

export function scopeCss(source: string, scope: string): string {
  const { hoisted, body } = scopeCssParts(source, scope);
  return (hoisted.length ? hoisted.join('\n') + '\n' : '') + body;
}
