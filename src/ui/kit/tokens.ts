import { css } from '../../utils/cssBuilder';

const svgUrl = (inner: string, stroke: string, width = 2) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`
  )}")`;
const CHEVRON = '<path d="m6 9 6 6 6-6"/>';
const CHECK = '<path d="M20 6 9 17l-5-5"/>';
const DASH = '<path d="M5 12h14"/>';

const FONT =
  "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif";

/** shadcn zinc palette, dark. */
const dark = {
  '--kdl-background': '#09090b',
  '--kdl-foreground': '#fafafa',
  '--kdl-card': '#09090b',
  '--kdl-card-foreground': '#fafafa',
  '--kdl-popover': '#09090b',
  '--kdl-popover-foreground': '#fafafa',
  '--kdl-primary': '#fafafa',
  '--kdl-primary-foreground': '#18181b',
  '--kdl-secondary': '#27272a',
  '--kdl-secondary-foreground': '#fafafa',
  '--kdl-muted': '#27272a',
  '--kdl-muted-foreground': '#a1a1aa',
  '--kdl-accent': '#27272a',
  '--kdl-accent-foreground': '#fafafa',
  '--kdl-destructive': '#7f1d1d',
  '--kdl-destructive-foreground': '#fafafa',
  '--kdl-danger': '#f87171',
  '--kdl-success': '#22c55e',
  '--kdl-warning': '#f59e0b',
  '--kdl-border': '#27272a',
  '--kdl-input': '#27272a',
  '--kdl-ring': '#d4d4d8',
  '--kdl-overlay': 'rgba(0, 0, 0, 0.8)',
  '--kdl-shadow': '0 10px 15px -3px rgba(0,0,0,0.4), 0 4px 6px -4px rgba(0,0,0,0.4)',
  '--kdl-chevron': svgUrl(CHEVRON, '#a1a1aa'),
  '--kdl-check': svgUrl(CHECK, '#18181b', 3),
  '--kdl-dash': svgUrl(DASH, '#18181b', 3),
  colorScheme: 'dark',
};

/** shadcn zinc palette, light. */
const light = {
  '--kdl-background': '#ffffff',
  '--kdl-foreground': '#09090b',
  '--kdl-card': '#ffffff',
  '--kdl-card-foreground': '#09090b',
  '--kdl-popover': '#ffffff',
  '--kdl-popover-foreground': '#09090b',
  '--kdl-primary': '#18181b',
  '--kdl-primary-foreground': '#fafafa',
  '--kdl-secondary': '#f4f4f5',
  '--kdl-secondary-foreground': '#18181b',
  '--kdl-muted': '#f4f4f5',
  '--kdl-muted-foreground': '#71717a',
  '--kdl-accent': '#f4f4f5',
  '--kdl-accent-foreground': '#18181b',
  '--kdl-destructive': '#ef4444',
  '--kdl-destructive-foreground': '#fafafa',
  '--kdl-danger': '#dc2626',
  '--kdl-success': '#16a34a',
  '--kdl-warning': '#d97706',
  '--kdl-border': '#e4e4e7',
  '--kdl-input': '#e4e4e7',
  '--kdl-ring': '#18181b',
  '--kdl-overlay': 'rgba(0, 0, 0, 0.5)',
  '--kdl-shadow': '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
  '--kdl-chevron': svgUrl(CHEVRON, '#71717a'),
  '--kdl-check': svgUrl(CHECK, '#fafafa', 3),
  '--kdl-dash': svgUrl(DASH, '#fafafa', 3),
  colorScheme: 'light',
};

export type KitTheme = 'dark' | 'light';

/**
 * Theme variables: dark on :host / .kdl-scope / .kdl-tokens; light with data-theme="light" or .kdl-theme-light.
 * `.kdl-tokens` carries only these variables (no reset), for third-party markup such as Plyr.
 */
export const tokenStyles = css({
  ':host, .kdl-scope, .kdl-tokens': {
    ...dark,
    '--kdl-radius': '0.5rem',
    '--kdl-font': FONT,
  },
  ':host([data-theme="light"]), :is(.kdl-scope, .kdl-tokens):is([data-theme="light"], .kdl-theme-light)': light,
  ':is(.kdl-scope, .kdl-tokens):is([data-theme="dark"], .kdl-theme-dark)': dark,
});
