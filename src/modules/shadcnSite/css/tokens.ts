// Static part of the root: radius, font, derived helpers, and the site's own variables pointed at the
// kit tokens (which come from the palette sheet, see ../palette.ts), so areas the skin does not style
// rule by rule follow too.

import { KIT_FONT } from '../../../ui/kit/tokens';

export const tokensCss = (): string => `
html {
  --kdl-radius: 0.5rem;
  --kdl-font: ${KIT_FONT};
  --kdl-shadow-sm: 0 1px 2px 0 color-mix(in srgb, var(--kdl-background) 60%, transparent);
  --kdl-hover-ring: color-mix(in srgb, var(--kdl-ring) 45%, var(--kdl-border));
  --kdl-focus-ring: 0 0 0 3px color-mix(in srgb, var(--kdl-ring) 35%, transparent);

  --colour0-primary: var(--kdl-foreground);
  --colour0-secondary: var(--kdl-muted-foreground);
  --colour0-tertirary: color-mix(in srgb, var(--kdl-muted-foreground) 65%, var(--kdl-background));
  --colour1-primary: var(--kdl-background);
  --colour1-primary-transparent: color-mix(in srgb, var(--kdl-background) 75%, transparent);
  --colour1-secondary: var(--kdl-secondary);
  --colour1-secondary-transparent: color-mix(in srgb, var(--kdl-secondary) 50%, transparent);
  --colour1-tertiary: var(--kdl-card);
  --submit-colour1-primary: var(--kdl-primary);
  --positive-colour1-secondary: var(--kdl-ring);
  --negative-colour1-primary: var(--kdl-danger);
  --favourite-colour1-primary: var(--kdl-warning);
  --favourite-colour2-primary: var(--kdl-warning);
  --anchour-colour1-primary: var(--kdl-foreground);
  --anchour-colour1-secondary: var(--kdl-muted-foreground);
  --anchour-colour2-primary: transparent;
  --anchour-colour2-secondary: transparent;
  --anchour-internal-colour1-primary: var(--kdl-foreground);
  --anchour-internal-colour1-secondary: var(--kdl-foreground);
  --anchour-internal-colour2-primary: transparent;
  --anchour-internal-colour2-secondary: transparent;
  --anchour-local-colour1-primary: var(--kdl-muted-foreground);
  --anchour-local-colour1-secondary: var(--kdl-muted-foreground);
  --anchour-local-colour2-primary: transparent;
  --anchour-local-colour2-secondary: transparent;

  color-scheme: dark;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--kdl-muted-foreground) 35%, transparent) transparent;
}
`;
