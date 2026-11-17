// Declarative transforms. 'hide' and 'sticky' compile to CSS; the others change the DOM.
// DOM changes are recorded with an undo function so they can be reverted on unmount and
// before htmx stores a history snapshot. Every touched node is marked data-kdl-restyled.

import type { PageType, SiteId } from '../../core/types';
import { prefixSelectors, scopeSelector } from './scopeCss';
import { CSS_ACTIONS, type Theme, type Transform } from './types';

const MARK = 'data-kdl-restyled';
const SAFE_LENGTH = /^[\w.%()+\-*\s]{1,60}$/;
const BAD_SELECTOR = /[{};]/;
const BAD_ATTR_NAME = /^on|^(?:srcdoc|formaction)$/i;
const SCRIPT_URL = /^\s*(?:javascript|vbscript|data:text\/html)/i;

export function isSelectorSafe(selector: string): boolean {
  return !!selector.trim() && !BAD_SELECTOR.test(selector);
}

/** CSS for the theme's hide/sticky transforms, scoped like the theme */
export function compileTransformCss(theme: Theme): string {
  return theme.transforms
    .filter((t) => CSS_ACTIONS.has(t.action) && isSelectorSafe(t.selector))
    .map((t) => {
      const scope = scopeSelector(theme.sites, theme.pages, t.pages);
      const selector = prefixSelectors(t.selector, scope);
      if (t.action === 'hide') return `${selector} { display: none !important; }`;
      const top = t.arg && SAFE_LENGTH.test(t.arg) ? (/^\d+(\.\d+)?$/.test(t.arg) ? `${t.arg}px` : t.arg) : '0';
      return `${selector} { position: sticky !important; top: ${top}; z-index: 5; }`;
    })
    .join('\n');
}

interface AppliedRecord {
  node: Element;
  key: string;
  undo: () => void;
  /** Where a moved/removed node came from */
  anchor?: Comment;
}

interface Applied {
  undo: () => void;
  anchor?: Comment;
}

const records: AppliedRecord[] = [];
const touched = new WeakMap<Element, Set<string>>();
const errors = new Map<string, string>();

const ruleKey = (theme: Theme, index: number, t: Transform) =>
  `${theme.id}#${index}:${t.action}:${t.selector}:${t.arg ?? ''}`;

export function getTransformErrors(themeId: string): string[] {
  return [...errors.entries()].filter(([key]) => key.startsWith(`${themeId}#`)).map(([, message]) => message);
}

function addMark(node: Element, key: string): void {
  let keys = touched.get(node);
  if (!keys) touched.set(node, (keys = new Set()));
  keys.add(key);
  node.setAttribute(MARK, String(keys.size));
}

function dropMark(node: Element, key: string): void {
  const keys = touched.get(node);
  keys?.delete(key);
  if (!keys?.size) node.removeAttribute(MARK);
  else node.setAttribute(MARK, String(keys.size));
}

/** Placeholder that remembers where a node was */
function anchorAt(node: Node): Comment {
  const anchor = document.createComment('kdl-restyle');
  node.parentNode?.insertBefore(anchor, node);
  return anchor;
}

function restoreAt(anchor: Comment, node: Node): void {
  if (anchor.parentNode) anchor.parentNode.replaceChild(node, anchor);
}

/** Applies one DOM transform to one node; returns its undo or null when nothing changed */
function applyOne(node: Element, t: Transform): Applied | null {
  const arg = t.arg ?? '';
  switch (t.action) {
    case 'remove': {
      if (!node.parentNode) return null;
      const anchor = anchorAt(node);
      node.remove();
      return { anchor, undo: () => restoreAt(anchor, node) };
    }
    case 'addClass': {
      const added = arg.split(/\s+/).filter((c) => c && !node.classList.contains(c));
      if (!added.length) return null;
      node.classList.add(...added);
      return { undo: () => node.classList.remove(...added) };
    }
    case 'setAttr': {
      const eq = arg.indexOf('=');
      const name = (eq < 0 ? arg : arg.slice(0, eq)).trim();
      const value = eq < 0 ? '' : arg.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!/^[a-zA-Z_:][\w:.-]*$/.test(name) || BAD_ATTR_NAME.test(name) || SCRIPT_URL.test(value)) {
        throw new Error(`setAttr: "${name}" is not allowed`);
      }
      const previous = node.getAttribute(name);
      if (previous === value) return null;
      node.setAttribute(name, value);
      return { undo: () => (previous === null ? node.removeAttribute(name) : node.setAttribute(name, previous)) };
    }
    case 'moveBefore':
    case 'moveInto': {
      if (!isSelectorSafe(arg)) throw new Error(`${t.action}: missing target selector`);
      const target = document.querySelector(arg);
      if (!target || target === node || node.contains(target)) return null;
      if (t.action === 'moveBefore' && target.previousElementSibling === node) return null;
      if (t.action === 'moveInto' && node.parentElement === target) return null;
      const anchor = anchorAt(node);
      if (t.action === 'moveBefore') target.parentNode?.insertBefore(node, target);
      else target.appendChild(node);
      return { anchor, undo: () => restoreAt(anchor, node) };
    }
    case 'wrap': {
      if (!node.parentNode) return null;
      const wrapper = document.createElement('div');
      wrapper.className = ['kdl-restyle-wrap', ...arg.split(/\s+/).filter(Boolean)].join(' ');
      node.parentNode.insertBefore(wrapper, node);
      wrapper.appendChild(node);
      return {
        undo: () => {
          if (wrapper.parentNode && node.parentNode === wrapper) wrapper.parentNode.replaceChild(node, wrapper);
          else wrapper.remove();
        },
      };
    }
    case 'setText': {
      if (node.textContent === arg) return null;
      const children = Array.from(node.childNodes);
      node.textContent = arg;
      return { undo: () => node.replaceChildren(...children) };
    }
    default:
      return null;
  }
}

function applies(theme: Theme, t: Transform, page: PageType, site: SiteId): boolean {
  if (theme.sites !== 'any' && !theme.sites.includes(site)) return false;
  if (theme.pages !== 'any' && !theme.pages.includes(page)) return false;
  return !t.pages?.length || t.pages.includes(page);
}

function undoRecord(record: AppliedRecord): void {
  try {
    record.undo();
  } catch (error) {
    console.warn('[KDL:restyle] undo failed:', error);
  }
  dropMark(record.node, record.key);
}

/**
 * Brings the DOM in line with the enabled themes: reverts changes whose rule no longer
 * applies, then applies rules to nodes they have not touched yet. Idempotent.
 */
export function syncTransforms(themes: Theme[], page: PageType, site: SiteId): void {
  const active = new Map<string, Transform>();
  for (const theme of themes) {
    theme.transforms.forEach((t, index) => {
      if (!CSS_ACTIONS.has(t.action) && applies(theme, t, page, site)) active.set(ruleKey(theme, index, t), t);
    });
  }

  for (let i = records.length - 1; i >= 0; i--) {
    const record = records[i];
    if (!active.has(record.key)) {
      undoRecord(record);
      records.splice(i, 1);
    } else if (!record.node.isConnected && !record.anchor?.isConnected) {
      records.splice(i, 1); // swapped away with its page
    }
  }
  for (const key of [...errors.keys()]) if (!active.has(key)) errors.delete(key);

  for (const [key, t] of active) {
    if (!isSelectorSafe(t.selector)) continue;
    let nodes: Element[];
    try {
      nodes = Array.from(document.querySelectorAll(t.selector));
      errors.delete(key);
    } catch {
      errors.set(key, `Invalid selector: ${t.selector}`);
      continue;
    }
    for (const node of nodes) {
      if (touched.get(node)?.has(key) || node.closest('#kdl-root')) continue;
      try {
        const applied = applyOne(node, t);
        if (!applied) continue;
        addMark(node, key);
        records.push({ node, key, ...applied });
      } catch (error) {
        errors.set(key, error instanceof Error ? error.message : String(error));
        break;
      }
    }
  }
}

/** Reverts every DOM change, newest first */
export function undoAllTransforms(): void {
  while (records.length) undoRecord(records.pop()!);
}
