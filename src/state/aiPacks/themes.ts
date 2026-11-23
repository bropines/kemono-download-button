// User themes (Settings → Themes): variables, CSS and transforms an AI can write from a description.
// Theme scripts are never part of the pack, in either direction.

import { t, tx } from '../../i18n';
import { BUILTIN_THEMES } from '../../modules/restyle/presets';
import { getThemes, isBuiltin, MAX_THEME_BYTES, newThemeId, sanitizeTheme, saveTheme, setThemeEnabled, themeSize } from '../../modules/restyle/store';
import { PAGE_TYPES, SITE_IDS, TRANSFORM_ACTIONS, type Theme } from '../../modules/restyle/types';
import { THEME_VARS } from '../../modules/restyle/vars';
import { composeAiPrompt, registerAiPack } from '../aiPack';

const MAX_THEMES = 50;
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

/** A theme as the pack shows it: no origin, no script */
function shareable(theme: Theme): Record<string, unknown> {
  const { origin: _origin, script: _script, ...rest } = theme;
  return rest;
}

const userThemes = (): Theme[] => getThemes().filter((theme) => theme.origin !== 'builtin');

/** Sanitized themes ready to save, or null when an entry is not theme-shaped or too big */
export function prepareThemes(value: unknown): Theme[] | null {
  if (!Array.isArray(value) || value.length > MAX_THEMES) return null;
  const existing = new Map(userThemes().map((theme) => [theme.id, theme]));
  const prepared: Theme[] = [];
  for (const raw of value) {
    if (!isObject(raw) || typeof raw.name !== 'string' || !raw.name.trim()) return null;
    if (raw.css !== undefined && typeof raw.css !== 'string') return null;
    if (raw.vars !== undefined && !isObject(raw.vars)) return null;
    if (raw.transforms !== undefined && !Array.isArray(raw.transforms)) return null;
    if (raw.enabled !== undefined && typeof raw.enabled !== 'boolean') return null;
    const { script: _script, origin: _origin, ...rest } = raw;
    const id = typeof raw.id === 'string' && existing.has(raw.id) && !isBuiltin(raw.id) ? raw.id : newThemeId();
    const before = existing.get(id);
    // An update keeps what the pack never shows (origin, the local script)
    const theme = sanitizeTheme(before ? { ...before, ...rest, id, origin: before.origin, script: before.script } : { ...rest, id, origin: 'import' }, id);
    if (themeSize(theme) > MAX_THEME_BYTES) return null;
    prepared.push(theme);
  }
  return prepared;
}

function prompt(): string {
  const vars = THEME_VARS.map((def) => `  - \`${def.name}\` (${def.kind}${def.placeholder ? `, e.g. ${def.placeholder}` : ''}): drives ${[...def.site, ...def.kit].join(', ') || def.rules.map(([selector, prop]) => `${selector} ${prop}`).join('; ')}`).join('\n');
  const presets = BUILTIN_THEMES.map((theme) => `  - \`${theme.id}\`: ${tx(`themes.preset.${theme.id}.name`, theme.name)}. ${theme.description ?? ''}`).join('\n');
  return composeAiPrompt(themesPack, {
    role: 'Your job: write or edit user themes (CSS restyling of the site and of the script\'s own interface) from the user\'s description, e.g. "dark blue, rounder cards, hide the footer".',
    body: `
## Theme object
- \`id\`: keep the id of a theme you edit; omit it (or use a new string) for a new theme.
- \`name\` (required, up to 200 characters) and \`description\` (optional, up to 1000).
- \`enabled\`: boolean. Themes later in the list win over earlier ones.
- \`sites\`: "any" or an array of ${SITE_IDS.map((id) => `"${id}"`).join(', ')}.
- \`pages\`: "any" or an array of ${PAGE_TYPES.map((id) => `"${id}"`).join(', ')} (post page, creator page, post lists, the artists list, search results, anything else).
- \`vars\`: {"--name": "value"}. Values must not contain { } ; < > or "/*". The known variables map onto the site and the script's UI:
${vars}
  Any other custom property is written on <html> as is, for use in your CSS.
- \`css\`: plain CSS, at most ${MAX_THEME_BYTES / 1024} KB per theme. Every top-level selector is prefixed with the theme's scope (html[data-kdl-site="..."][data-kdl-page="..."]), so write site selectors as they are; :root rules apply to that <html>. Rules inside @media, @supports, @container and @layer are scoped too; @keyframes, @font-face and @property stay global. Plain rules already beat the site's, so use !important only against inline styles.
- \`transforms\`: array of {"selector", "action", "arg"?, "pages"?}, actions: ${TRANSFORM_ACTIONS.map((a) => `"${a}"`).join(', ')}. hide = display:none; sticky = position:sticky with arg as the top offset ("0", "3rem"); remove = remove the node; addClass = add the classes in arg; setAttr = arg "name=value" (on* attributes and javascript: are refused); moveBefore / moveInto = move the node before / into the first match of the selector in arg; wrap = wrap in div.kdl-restyle-wrap plus the classes in arg; setText = replace the text with arg. Prefer CSS when CSS can do it.
- Never write a "script" field: scripts are not accepted from this pack.

## Selectors you can rely on
- Page state on <html>: data-kdl-site (kemono, coomer, pawchive), data-kdl-page (the page types above).
- Site layout: .global-sidebar, .content-wrapper > .header (top bar), #main > .site-section, .card-list__items > article.post-card (post cards; a.user-card for creators), .user-header (creator banner), ul.tabs, .post__header, .post__title, .post__body, .post__content, .post__files, .post__thumbnail, .post__attachments, footer.post__footer > .post__comments, .comment, #post-tags, .global-footer.
- The script's controls in the page: #kdl-fixed-controls (floating buttons), .post-card-download-controls (buttons on post cards), .kdl-quick-fav-btn, .kdl-scope (wrapper of every inline widget; set --kdl-* tokens on it).
- Dialogs, panels and toasts live in a shadow root (#kdl-root) that page CSS cannot reach: restyle them only through the variables above, which are passed into it.
- The script's UI tokens (set by the variables above, or directly on .kdl-scope): --kdl-background, --kdl-foreground, --kdl-card, --kdl-popover, --kdl-primary, --kdl-primary-foreground, --kdl-secondary, --kdl-muted, --kdl-muted-foreground, --kdl-accent, --kdl-border, --kdl-input, --kdl-ring, --kdl-destructive, --kdl-success, --kdl-warning, --kdl-radius, --kdl-font.

## Fields in "settings"
- \`themes\`: array of theme objects, at most ${MAX_THEMES}. Each one with a known id updates that theme; any other is added as a new theme. Themes you leave out stay as they are (to turn one off, return it with "enabled": false), so return only the themes you create or change.
- \`presets\`: {"<preset id>": boolean} switches the built-in presets on or off. Presets:
${presets}`,
    example: { themes: [{ name: 'Midnight blue', enabled: true, sites: 'any', pages: 'any', vars: { '--kdl-site-bg': '#0b1020', '--kdl-site-surface': '#141a2e', '--kdl-site-accent': '#6ea8ff', '--kdl-radius': '12px' }, css: '.global-footer { display: none; }', transforms: [] }] },
  });
}

export const themesPack = registerAiPack({
  id: 'themes',
  order: 20,
  title: () => t('ai.pack.themes'),
  fields: () => [
    {
      key: 'themes',
      get: () => userThemes().map(shareable),
      set: (value) => {
        const themes = prepareThemes(value);
        if (!themes) return false;
        themes.forEach((theme) => saveTheme(theme));
        return true;
      },
    },
    {
      key: 'presets',
      get: () => Object.fromEntries(getThemes().filter((theme) => theme.origin === 'builtin').map((theme) => [theme.id, theme.enabled])),
      set: (value) => {
        if (!isObject(value)) return false;
        const entries = Object.entries(value);
        if (!entries.every(([id, on]) => isBuiltin(id) && typeof on === 'boolean')) return false;
        entries.forEach(([id, on]) => setThemeEnabled(id, on as boolean));
        return true;
      },
    },
  ],
  systemPrompt: prompt,
});
