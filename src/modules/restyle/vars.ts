// Site-level theme variables and what each one drives.
//
// Redefining a site variable replaces it (there is no "fallback to the old value"), so a
// mapping is only emitted for the variables a theme actually sets.

import type { UiKey } from '../../i18n';

export type VarKind = 'color' | 'length' | 'font';

export interface ThemeVarDef {
  name: string;
  /** i18n key of the label shown in the theme editor */
  label: UiKey;
  kind: VarKind;
  /** Site custom properties set to var(name) */
  site: string[];
  /** Kit tokens set to var(name) on .kdl-scope and the #kdl-root host */
  kit: string[];
  /** Extra declarations (`selector` → `prop`) for values the site hardcodes */
  rules: Array<[string, string]>;
  placeholder?: string;
}

export const THEME_VARS: ThemeVarDef[] = [
  {
    name: '--kdl-site-bg',
    label: 'themes.var.bg',
    kind: 'color',
    site: ['--colour1-primary'],
    kit: ['--kdl-background', '--kdl-primary-foreground'],
    rules: [['body', 'background-color']],
  },
  {
    name: '--kdl-site-surface',
    label: 'themes.var.surface',
    kind: 'color',
    site: ['--colour1-secondary'],
    kit: ['--kdl-card', '--kdl-popover', '--kdl-secondary', '--kdl-muted', '--kdl-accent'],
    rules: [
      ['.global-sidebar', 'background'],
      ['.content-wrapper > .header', 'background'],
    ],
  },
  {
    name: '--kdl-site-text',
    label: 'themes.var.text',
    kind: 'color',
    site: ['--colour0-primary'],
    kit: ['--kdl-foreground', '--kdl-card-foreground', '--kdl-popover-foreground', '--kdl-secondary-foreground', '--kdl-accent-foreground'],
    rules: [['body', 'color']],
  },
  {
    name: '--kdl-site-muted',
    label: 'themes.var.muted',
    kind: 'color',
    site: ['--colour0-secondary'],
    kit: ['--kdl-muted-foreground'],
    rules: [],
  },
  {
    name: '--kdl-site-accent',
    label: 'themes.var.accent',
    kind: 'color',
    site: [
      '--anchour-colour1-primary',
      '--anchour-internal-colour1-primary',
      '--anchour-local-colour1-primary',
      '--submit-colour1-primary',
      '--plyr-color-main',
    ],
    kit: ['--kdl-primary', '--kdl-ring'],
    rules: [['.tabs .tab a.active', 'border-bottom-color']],
  },
  {
    name: '--kdl-radius',
    label: 'themes.var.radius',
    kind: 'length',
    site: [],
    kit: ['--kdl-radius'],
    rules: [
      ['.post-card, .post-card > a, .user-card, .user-header, .comment, .post__thumbnail img, .search-input', 'border-radius'],
      ['.post-card, .user-card', 'overflow'],
    ],
    placeholder: '8px',
  },
  {
    name: '--kdl-content-width',
    label: 'themes.var.contentWidth',
    kind: 'length',
    site: [],
    kit: [],
    rules: [['#main > .site-section', 'max-width']],
    placeholder: '1200px',
  },
  {
    name: '--kdl-grid-gap',
    label: 'themes.var.gridGap',
    kind: 'length',
    site: [],
    kit: [],
    rules: [['.card-list__items', 'gap']],
    placeholder: '8px',
  },
  {
    name: '--kdl-font',
    label: 'themes.var.font',
    kind: 'font',
    site: [],
    kit: ['--kdl-font'],
    rules: [['body', 'font-family']],
    placeholder: 'Inter, system-ui, sans-serif',
  },
  {
    name: '--kdl-font-size',
    label: 'themes.var.fontSize',
    kind: 'length',
    site: [],
    kit: [],
    rules: [['body', 'font-size']],
    placeholder: '16px',
  },
];

const VALID_NAME = /^--[\w-]+$/;
const UNSAFE_VALUE = /[{};<>]|\/\*/;

export function isValidVar(name: string, value: string): boolean {
  return VALID_NAME.test(name) && typeof value === 'string' && value.trim() !== '' && !UNSAFE_VALUE.test(value);
}

/** Unscoped CSS for a theme's variables: `scope` is the html compound selector */
export function compileVars(vars: Record<string, string>, scope: string): string {
  const entries = Object.entries(vars).filter(([name, value]) => isValidVar(name, value));
  if (!entries.length) return '';
  const rootDecls: string[] = [];
  const kitDecls: string[] = [];
  const rules: string[] = [];
  for (const [name, value] of entries) {
    rootDecls.push(`${name}: ${value.trim()};`);
    const def = THEME_VARS.find((d) => d.name === name);
    if (!def) continue;
    def.site.forEach((siteVar) => rootDecls.push(`${siteVar}: var(${name});`));
    // Raw value: --kdl-radius maps onto the kit token of the same name, var() would be a cycle
    def.kit.forEach((token) => kitDecls.push(`${token}: ${value.trim()};`));
    def.rules.forEach(([selector, prop]) => {
      const sel = selector.split(',').map((s) => `${scope} ${s.trim()}`).join(', ');
      if (prop === 'overflow') rules.push(`${sel} { overflow: hidden; }`);
      else rules.push(`${sel} { ${prop}: var(${name}); }`);
    });
    if (name === '--kdl-content-width') rules.push(`${scope} #main > .site-section { margin-inline: auto; }`);
    if (name === '--kdl-site-bg') rules.push(`${scope} { --colour1-primary-transparent: color-mix(in srgb, var(${name}) 75%, transparent); }`);
    if (name === '--kdl-site-surface') rules.push(`${scope} { --colour1-secondary-transparent: color-mix(in srgb, var(${name}) 50%, transparent); }`);
  }
  let out = `${scope} { ${rootDecls.join(' ')} }\n`;
  // Outer-document rules beat the kit's :host defaults, so the shadow root follows too
  if (kitDecls.length) out += `${scope} .kdl-scope, ${scope} #kdl-root { ${kitDecls.join(' ')} }\n`;
  return out + rules.join('\n') + '\n';
}
