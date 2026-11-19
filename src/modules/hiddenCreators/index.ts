// Hidden creators: cards of blocked / hidden creators are hidden (or dimmed) on every list.
// Sources, merged into one Set of "service:id":
//  1. Pawchive's own block list, printed by the server as `window.pawBlockedCreators = [...]` in an inline script
//     on /artists (read from the DOM, since the sandbox may not see page globals; cached between pages).
//  2. A local list the user manages: the "Hide creator" button on a creator page, or the module setting.
// Read-only towards the site. Cards are only marked with an attribute; everything is undone on unmount.

import type { KdlModule, ModuleContext } from '../../core/types';
import { button, ensureKit, kitScope } from '../../ui/kit';
import { readStored, writeStored } from '../../state/gmStorage';
import { t } from '../../i18n';

const CARDS = 'article.post-card[data-service][data-user], a.user-card';
const MARK = 'data-kdl-hidden';
const REVEAL = 'data-kdl-reveal';
const CACHE_KEY = 'mod.creators.hide.paw';
const OWN = 'kdl-hide-own';

let ctxRef: ModuleContext | null = null;
let lastPath = '';

/** "service:id" strings out of the inline script text (JSON when possible, otherwise every quoted pair) */
function parseBlocked(text: string): string[] {
  const body = /pawBlockedCreators\s*=\s*(\[[\s\S]*?\])/.exec(text)?.[1];
  if (!body) return [];
  try {
    const data = JSON.parse(body) as any[];
    const out = data.map((item) =>
      typeof item === 'string' ? item
        : item && typeof item === 'object' ? `${item.service}:${item.id ?? item.user}` : '');
    return out.filter((key) => /^[^:\s]+:[^:\s]+$/.test(key) && !key.includes('undefined'));
  } catch {
    return Array.from(body.matchAll(/["']([^"':\s]+:[^"'\s]+)["']/g), (m) => m[1]);
  }
}

function pawList(): string[] {
  const script = Array.from(document.querySelectorAll('script:not([src])')).find((s) => (s.textContent || '').includes('pawBlockedCreators'));
  let list: string[] | null = script ? parseBlocked(script.textContent || '') : null;
  if (!list) {
    try {
      const page: any = typeof unsafeWindow !== 'undefined' ? unsafeWindow : null;
      if (page && Array.isArray(page.pawBlockedCreators)) list = page.pawBlockedCreators.filter((k: unknown) => typeof k === 'string');
    } catch { /* sandbox without page access */ }
  }
  if (list) writeStored(CACHE_KEY, list);
  return list || readStored<string[]>(CACHE_KEY, []);
}

function localList(ctx: ModuleContext): string[] {
  return ctx.settings.get<string>('local').split(/\r?\n/).map((line) => line.trim().toLowerCase().replace(/\s+/g, '')).filter(Boolean);
}

function keyOf(card: HTMLElement): string {
  let service = card.dataset.service || '';
  let id = card.dataset.user || card.dataset.id || '';
  if (!service || !id) {
    const m = /\/([^/]+)\/user\/([^/?#]+)/.exec(card.getAttribute('href') || '');
    if (m) [, service, id] = m;
  }
  return service && id ? `${service}:${id}`.toLowerCase() : '';
}

/** The creator of the current page: /service/user/id, not a post */
function creatorKey(): string {
  const m = /^\/([^/]+)\/user\/([^/?#]+)\/?(?:dms|fancards|links|announcements)?\/?$/.exec(location.pathname);
  return m ? `${m[1]}:${m[2]}`.toLowerCase() : '';
}

function syncChip(count: number): void {
  const first = document.querySelector(`[${MARK}]`);
  const old = document.querySelector<HTMLElement>('.kdl-hide-chip');
  if (!count || !first?.parentElement) return void old?.remove();
  const revealed = document.documentElement.hasAttribute(REVEAL);
  const label = t(revealed ? 'creators.hide.chipOff' : 'creators.hide.chip', { count });
  if (old && old.nextElementSibling === first.parentElement) {
    const text = old.querySelector('span');
    if (text) text.textContent = label;
    return;
  }
  old?.remove();
  ensureKit();
  const chip = kitScope([button({
    label, variant: 'secondary', size: 'sm', icon: 'eye',
    onClick: () => {
      document.documentElement.toggleAttribute(REVEAL);
      syncChip(count);
    },
  })], { className: `${OWN} kdl-hide-chip` });
  first.parentElement.before(chip);
}

function syncHeaderButton(ctx: ModuleContext): void {
  const actions = document.querySelector('.user-header__actions');
  const key = creatorKey();
  const old = actions?.querySelector<HTMLElement>('#kdl-hide-creator-btn');
  if (!actions || !key) return void old?.parentElement?.remove();
  const hidden = localList(ctx).includes(key);
  if (old?.dataset.state === String(hidden)) return;
  old?.parentElement?.remove();
  ensureKit();
  const label = t(hidden ? 'creators.hide.unhide' : 'creators.hide.hide');
  const btn = button({
    id: 'kdl-hide-creator-btn', icon: hidden ? 'eye' : 'eye-off', variant: 'outline', size: 'icon', title: label, ariaLabel: label,
    onClick: () => {
      const rest = localList(ctx).filter((k) => k !== key);
      ctx.settings.set('local', (hidden ? rest : [...rest, key]).join('\n'));
    },
  });
  btn.dataset.state = String(hidden);
  actions.append(kitScope([btn], { className: OWN, tag: 'span' }));
}

function apply(): void {
  const ctx = ctxRef;
  if (!ctx) return;
  if (location.pathname !== lastPath) {
    lastPath = location.pathname;
    document.documentElement.removeAttribute(REVEAL);
  }
  const blocked = new Set([...pawList(), ...localList(ctx)].map((k) => k.toLowerCase()));
  document.documentElement.dataset.kdlHideMode = ctx.settings.get<string>('mode');
  const badge = t('creators.hide.badge');
  const own = creatorKey();
  let count = 0;
  document.querySelectorAll<HTMLElement>(CARDS).forEach((card) => {
    // On a hidden creator's own page their posts stay: opening it means you want to see them
    const key = keyOf(card);
    const hide = blocked.has(key) && key !== own;
    if (hide) count++;
    if (hide !== card.hasAttribute(MARK)) {
      if (hide) card.setAttribute(MARK, badge);
      else card.removeAttribute(MARK);
    }
  });
  syncChip(count);
  syncHeaderButton(ctx);
}

function undo(): void {
  document.querySelectorAll(`[${MARK}]`).forEach((card) => card.removeAttribute(MARK));
  document.querySelectorAll(`.${OWN}`).forEach((node) => node.remove());
}

const STYLES = `
html[data-kdl-hide-mode="hide"]:not([${REVEAL}]) [${MARK}] { display: none !important; }
html[data-kdl-hide-mode="dim"] [${MARK}], html[${REVEAL}] [${MARK}] { opacity: 0.35; position: relative; }
html[data-kdl-hide-mode="dim"] [${MARK}]::after, html[${REVEAL}] [${MARK}]::after {
  content: attr(${MARK});
  position: absolute; top: 6px; left: 6px; z-index: 2; padding: 1px 8px; border-radius: 9999px;
  background: var(--kdl-secondary, rgba(0, 0, 0, 0.75)); color: var(--kdl-secondary-foreground, #fff);
  font-size: 11px; line-height: 18px; pointer-events: none;
}
.kdl-hide-chip { display: flex; margin: 0 0 8px; }
.user-header__actions .kdl-scope.${OWN} { display: inline-flex; align-items: center; }
`;

export const hiddenCreatorsModule: KdlModule = {
  id: 'creators.hide',
  name: 'Hidden creators',
  description:
    "Hides cards of blocked creators everywhere: Pawchive's own block list (read from the /artists page) plus a local list you manage with a button on the creator page.",
  group: 'Lists',
  pages: 'any',
  defaultEnabled: true,
  settings: [
    {
      key: 'mode', label: 'Hidden creators are', type: 'select', default: 'hide',
      options: [{ value: 'hide', label: 'Hidden' }, { value: 'dim', label: 'Dimmed' }],
    },
    {
      key: 'local', label: 'Local list', type: 'textarea', default: '',
      hint: 'One "service:id" per line, e.g. patreon:12345. The eye button on a creator page edits it.',
    },
  ],
  styles: STYLES,
  mount(ctx) {
    ctxRef = ctx;
    lastPath = location.pathname;
    ctx.settings.onChange('mode', apply);
    ctx.settings.onChange('local', apply);
    apply();
    // Cards added later (live search, appended pages): one pass per burst of mutations
    let timer = 0;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = window.setTimeout(apply, 150);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    ctx.onCleanup(() => {
      observer.disconnect();
      clearTimeout(timer);
      undo();
      document.documentElement.removeAttribute(REVEAL);
      delete document.documentElement.dataset.kdlHideMode;
      ctxRef = null;
    });
  },
  update: apply,
  beforeSnapshot() {
    undo();
    window.setTimeout(apply, 0);
  },
};
