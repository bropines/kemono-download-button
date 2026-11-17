import type { KdlModule } from '../core/types';
import { registerModule } from '../core/registry';
import { coreModule } from './core';
import { downloaderPostModule, downloaderCreatorModule, downloaderListModule, favoritesQuickModule } from './downloader';
import { adblockModule } from '../features/adblock';
import { viewedPostsModule } from '../features/kui/viewedPosts';
import { copyUsernameModule } from '../features/kui/userPageModule';
import { kuiPostModule } from '../features/kui/postPageModule';
import { gridSizeModule } from '../ui/components/kui/gridControls';
import { restyleModule } from './restyle';
import { shadcnSiteModule, shadcnSiteParts } from './shadcnSite';
import { tagsToolsModule } from './tagsTools';
import { postsSearchModule } from './postsSearch';
import { siteTranslationModule } from '../i18n/site';

// Registration order is the tie-breaker for mount order; requires/after override it
export const BUILTIN_MODULES: KdlModule[] = [
  coreModule,
  adblockModule,
  gridSizeModule,
  viewedPostsModule,
  copyUsernameModule,
  kuiPostModule,
  downloaderPostModule,
  downloaderCreatorModule,
  downloaderListModule,
  favoritesQuickModule,
  tagsToolsModule,
  postsSearchModule,
  siteTranslationModule,
  // Before restyle, so user themes keep the last word
  shadcnSiteModule,
  ...shadcnSiteParts,
  restyleModule
];

export function registerBuiltinModules(): void {
  BUILTIN_MODULES.forEach(registerModule);
}
