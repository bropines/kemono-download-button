import type { PageType, SiteId } from '../../core/types';

export type TransformAction =
  | 'hide'
  | 'remove'
  | 'addClass'
  | 'setAttr'
  | 'moveBefore'
  | 'moveInto'
  | 'wrap'
  | 'setText'
  | 'sticky';

export interface Transform {
  selector: string;
  action: TransformAction;
  /** Class names, `name=value`, target selector, text or sticky offset, depending on the action */
  arg?: string;
  /** Narrows the theme's own page scope */
  pages?: PageType[];
}

/** Where a theme came from: only `local` themes may carry a script */
export type ThemeOrigin = 'local' | 'import' | 'builtin';

export interface Theme {
  id: string;
  name: string;
  enabled: boolean;
  sites: SiteId[] | 'any';
  pages: PageType[] | 'any';
  /** `--kdl-*` (or any custom property) → value */
  vars: Record<string, string>;
  css: string;
  transforms: Transform[];
  origin: ThemeOrigin;
  /** Local themes only; runs behind the module's allowScripts switch */
  script?: string;
  description?: string;
}

export const SITE_IDS: SiteId[] = ['kemono', 'coomer', 'pawchive'];
export const PAGE_TYPES: PageType[] = ['post', 'creator', 'list', 'artists', 'search', 'other'];
export const TRANSFORM_ACTIONS: TransformAction[] = [
  'hide',
  'remove',
  'addClass',
  'setAttr',
  'moveBefore',
  'moveInto',
  'wrap',
  'setText',
  'sticky',
];
/** Actions compiled to CSS; the rest touch the DOM */
export const CSS_ACTIONS = new Set<TransformAction>(['hide', 'sticky']);
