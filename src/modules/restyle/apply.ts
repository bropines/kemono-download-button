// Puts enabled themes on the page: one <style id="kdl-theme-<id>"> each, kept at the end of
// <head> so they come after the script's own styles. Scoping is pure CSS (attribute selectors
// on <html>), so navigation needs no re-injection.

import type { PageType, SiteId } from '../../core/types';
import { scopeCssParts, scopeSelector } from './scopeCss';
import { compileTransformCss } from './transforms';
import type { Theme } from './types';
import { compileVars } from './vars';
import { keepInHead } from '../../core/page';

const STYLE_PREFIX = 'kdl-theme-';
const compiledCache = new Map<string, { source: string; css: string }>();

export function compileTheme(theme: Theme): string {
  const source = JSON.stringify([theme.sites, theme.pages, theme.vars, theme.css, theme.transforms]);
  const cached = compiledCache.get(theme.id);
  if (cached?.source === source) return cached.css;
  const scope = scopeSelector(theme.sites, theme.pages);
  const { hoisted, body } = scopeCssParts(theme.css, scope);
  const css = [
    ...hoisted,
    `/* ${theme.name.replace(/\*\//g, '')} */`,
    compileVars(theme.vars, scope),
    compileTransformCss(theme),
    body,
  ]
    .filter(Boolean)
    .join('\n');
  compiledCache.set(theme.id, { source, css });
  return css;
}

const styleId = (theme: Theme) => `${STYLE_PREFIX}${theme.id.replace(/[^\w-]/g, '-')}`;

/** Syncs the theme <style> nodes with the given themes (in order) and moves them last */
export function applyThemeStyles(themes: Theme[]): void {
  const head = document.head || document.documentElement;
  const wanted = new Set(themes.map(styleId));
  document.querySelectorAll<HTMLStyleElement>(`style[id^="${STYLE_PREFIX}"]`).forEach((node) => {
    if (!wanted.has(node.id)) node.remove();
  });
  const nodes = themes.map((theme) => {
    const id = styleId(theme);
    let node = document.getElementById(id) as HTMLStyleElement | null;
    if (!node) {
      node = keepInHead(document.createElement('style'));
      node.id = id;
    }
    const css = compileTheme(theme);
    if (node.textContent !== css) node.textContent = css;
    return node;
  });
  const inOrder = nodes.every((node, i) => node.isConnected && (i === 0 || nodes[i - 1].nextElementSibling === node));
  // Re-appending re-parses the sheet, so only move nodes when something landed after them
  if (!inOrder || themeStylesOutOfOrder()) nodes.forEach((node) => head.appendChild(node));
}

/** True when another style/stylesheet link sits after our first theme style */
export function themeStylesOutOfOrder(): boolean {
  const ours = document.querySelector(`style[id^="${STYLE_PREFIX}"]`);
  if (!ours) return false;
  let next = ours.nextElementSibling;
  while (next) {
    if ((next.tagName === 'STYLE' && !next.id.startsWith(STYLE_PREFIX)) || (next.tagName === 'LINK' && (next as HTMLLinkElement).rel === 'stylesheet')) {
      return true;
    }
    next = next.nextElementSibling;
  }
  return false;
}

export function removeThemeStyles(): void {
  document.querySelectorAll(`style[id^="${STYLE_PREFIX}"]`).forEach((node) => node.remove());
}

// --- Local scripts ------------------------------------------------------------------------

export interface ThemeScriptApi {
  page: PageType;
  site: SiteId;
  theme: string;
  root: Element;
  /** Runs when the theme is turned off, edited, or stops matching the page */
  onCleanup(fn: () => void): void;
}

interface RunningScript {
  key: string;
  cleanups: Array<() => void>;
}

const running = new Map<string, RunningScript>();

function stopScript(id: string): void {
  const script = running.get(id);
  if (!script) return;
  running.delete(id);
  script.cleanups.reverse().forEach((fn) => {
    try {
      fn();
    } catch (error) {
      console.warn('[KDL:restyle] theme script cleanup failed:', error);
    }
  });
}

/**
 * Runs the `script` of matching local themes once per (theme, script, page) and stops the
 * ones that no longer apply. Scripts are user code from this browser only: imports drop them.
 */
export function syncThemeScripts(themes: Theme[], allowed: boolean, page: PageType, site: SiteId, root: Element): void {
  const wanted = new Map<string, Theme>();
  if (allowed) {
    for (const theme of themes) {
      if (theme.origin !== 'local' || !theme.script?.trim()) continue;
      if (theme.sites !== 'any' && !theme.sites.includes(site)) continue;
      if (theme.pages !== 'any' && !theme.pages.includes(page)) continue;
      wanted.set(theme.id, theme);
    }
  }
  for (const [id, script] of running) {
    const theme = wanted.get(id);
    if (!theme || script.key !== `${page}\n${theme.script}`) stopScript(id);
  }
  for (const [id, theme] of wanted) {
    if (running.has(id)) continue;
    const entry: RunningScript = { key: `${page}\n${theme.script}`, cleanups: [] };
    running.set(id, entry);
    const api: ThemeScriptApi = { page, site, theme: theme.name, root, onCleanup: (fn) => entry.cleanups.push(fn) };
    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      new Function('kdl', theme.script!)(api);
    } catch (error) {
      // Strict CSP (or AdGuard's injection) can forbid new Function entirely
      console.warn(`[KDL:restyle] script of theme "${theme.name}" failed:`, error);
    }
  }
}

export function stopAllThemeScripts(): void {
  [...running.keys()].forEach(stopScript);
}
