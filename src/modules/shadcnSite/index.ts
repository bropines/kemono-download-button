// shadcn/ui-style skin for the site's own interface (Kemono, Coomer and Pawchive share the markup).
//
// Pure CSS through the registry's `styles` field: the <style> is added when the module is enabled and
// removed when it is disabled, so switching it off restores the site live. Every selector is prefixed
// with html[data-kdl-ui~="shadcn"] (set in mount): (0,1,1) on top of the site's own selector, which
// beats the unlayered site CSS without !important. Restyle themes add the same (0,1,1) or more and
// are kept after this sheet, so user themes and presets still win ties.
//
// The palette (accent, base tone, surface contrast) is a second sheet, <style id="kdl-mod-ui-shadcn-palette">,
// rewritten when one of those settings changes and kept right after the module sheet (before restyle).
//
// The only DOM change is a data-kdl-active marker on the sidebar link of the current page.

import type { KdlModule, ModuleContext } from '../../core/types';
import { onPageChange } from '../../core/router';
import { scopeCss } from '../restyle/scopeCss';
import { tokensCss } from './css/tokens';
import { baseCss } from './css/base';
import { layoutCss } from './css/layout';
import { cardsCss } from './css/cards';
import { postCss } from './css/post';
import { creatorCss } from './css/creator';
import { ACCENT_OPTIONS, BASE_OPTIONS, SURFACE_OPTIONS, paletteCss } from './palette';

export const SHADCN_ID = 'ui.shadcn';
const ATTR = 'data-kdl-ui';
const FLAG = 'shadcn';
const SCOPE = `html[${ATTR}~="${FLAG}"]`;
const ACTIVE = 'data-kdl-active';
const PALETTE_ID = 'kdl-mod-ui-shadcn-palette';
const PALETTE_KEYS = ['accent', 'accentCustom', 'base', 'surfaces'];

/** Compiled once per page session; the registry re-reads it when the module is enabled again */
function scoped(build: () => string): () => string {
  let cache: string | null = null;
  return () => (cache ??= scopeCss(build(), SCOPE));
}

function setFlag(on: boolean): void {
  const html = document.documentElement;
  const flags = new Set((html.getAttribute(ATTR) || '').split(/\s+/).filter(Boolean));
  if (on) flags.add(FLAG);
  else flags.delete(FLAG);
  if (flags.size) html.setAttribute(ATTR, [...flags].join(' '));
  else html.removeAttribute(ATTR);
}

function clearActive(): void {
  document.querySelectorAll(`[${ACTIVE}]`).forEach((node) => node.removeAttribute(ACTIVE));
}

// The longest sidebar href that is the current path or a parent of it (/posts/popular over /posts)
function syncActive(): void {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  let best: HTMLAnchorElement | null = null;
  let bestLength = -1;
  document.querySelectorAll<HTMLAnchorElement>('.global-sidebar a.global-sidebar-entry-item[href^="/"]').forEach((link) => {
    const href = (link.getAttribute('href') || '').split(/[?#]/)[0].replace(/\/+$/, '') || '/';
    const matches = href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`);
    if (matches && href.length > bestLength) {
      best = link;
      bestLength = href.length;
    }
  });
  document.querySelectorAll(`.global-sidebar [${ACTIVE}]`).forEach((node) => node !== best && node.removeAttribute(ACTIVE));
  const chosen = best as HTMLAnchorElement | null;
  if (chosen && !chosen.hasAttribute(ACTIVE)) chosen.setAttribute(ACTIVE, '');
}

function syncPalette(ctx: ModuleContext): void {
  let node = document.getElementById(PALETTE_ID);
  if (!node) {
    node = document.createElement('style');
    node.id = PALETTE_ID;
  }
  const options = {
    accent: ctx.settings.get<string>('accent'),
    accentCustom: ctx.settings.get<string>('accentCustom'),
    base: ctx.settings.get<string>('base'),
    surfaces: ctx.settings.get<string>('surfaces'),
  };
  const key = JSON.stringify(options);
  if (node.dataset.key !== key) {
    node.dataset.key = key;
    node.textContent = paletteCss(options, SCOPE);
  }
  // Right after the module sheet, so restyle's theme sheets (always last) still come later
  const anchor = document.getElementById('kdl-mod-ui-shadcn');
  if (anchor && anchor.nextElementSibling !== node) anchor.after(node);
  else if (!anchor && !node.isConnected) (document.head || document.documentElement).appendChild(node);
}

export const shadcnSiteModule: KdlModule = {
  id: SHADCN_ID,
  name: 'shadcn site skin',
  description:
    'Restyles the site itself like a shadcn/ui app: dark palette with a choice of accent and base tone, sidebar, header, inputs, buttons, pagination and tabs. The parts below can be switched off one by one. User themes still apply on top.',
  group: 'Interface',
  pages: 'any',
  defaultEnabled: false,
  after: ['core'],
  settings: [
    { key: 'accent', label: 'Accent colour', type: 'select', default: 'zinc', options: ACCENT_OPTIONS, hint: 'Primary buttons, focus rings, selection and hover tints. The settings dialog and download panels follow too.' },
    { key: 'accentCustom', label: 'Custom accent (hex)', type: 'text', default: '#6366f1', hint: 'Used when the accent is Custom, e.g. #6366f1.' },
    { key: 'base', label: 'Base tone', type: 'select', default: 'zinc', options: BASE_OPTIONS },
    { key: 'surfaces', label: 'Surface contrast', type: 'select', default: 'subtle', options: SURFACE_OPTIONS, hint: 'How far the sidebar, cards and page sections stand out from the background.' },
  ],
  styles: scoped(() => tokensCss() + baseCss() + layoutCss()),
  mount(ctx) {
    setFlag(true);
    syncPalette(ctx);
    PALETTE_KEYS.forEach((key) => ctx.settings.onChange(key, () => syncPalette(ctx)));
    syncActive();
    ctx.onCleanup(onPageChange(() => syncActive()));
    ctx.onCleanup(() => {
      setFlag(false);
      clearActive();
      document.getElementById(PALETTE_ID)?.remove();
    });
  },
  update(ctx) {
    syncActive();
    syncPalette(ctx);
  },
};

const part = (id: string, name: string, description: string, build: () => string): KdlModule => ({
  id: `${SHADCN_ID}.${id}`,
  name,
  description,
  group: 'Interface',
  pages: 'any',
  defaultEnabled: true,
  requires: [SHADCN_ID],
  styles: scoped(build),
});

export const shadcnSiteParts: KdlModule[] = [
  part('cards', 'shadcn skin: cards', 'Post cards with the thumbnail on top and a meta line below; creator, DM and other cards; tag clouds.', cardsCss),
  part('post', 'shadcn skin: post page', 'Post header card, tags as badges, content typography and comments.', postCss),
  part('creator', 'shadcn skin: creator page', 'Creator header as a profile card: banner, avatar, name and actions.', creatorCss),
];
