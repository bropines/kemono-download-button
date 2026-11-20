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
import { importerStatusModule } from './importerStatus';
import { smoothThumbsModule } from './smoothThumbs';
import { pageTransitionsModule } from './pageTransitions';
import { dmsViewerModule } from './dmsViewer';
import { hiddenCreatorsModule } from './hiddenCreators';
import { downloadByTagsModule } from './downloadByTags';
import { similarCreatorsModule } from './similarCreators';
import { postInfoModule } from './postInfo';
import { downloadHistoryModule } from './downloadHistory';
import { creatorLinksModule } from './creatorLinks';
import { creatorOverviewModule } from './creatorOverview';
import { postBlocksModule } from './pageBlocks/post';
import { creatorBlocksModule } from './pageBlocks/creator';
import { siteTranslationModule } from '../i18n/site';
import { onboardingModule } from './onboarding';

// Registration order is the tie-breaker for mount order; requires/after override it
export const BUILTIN_MODULES: KdlModule[] = [
  coreModule,
  adblockModule,
  gridSizeModule,
  viewedPostsModule,
  copyUsernameModule,
  kuiPostModule,
  postBlocksModule,
  downloaderPostModule,
  downloaderCreatorModule,
  downloaderListModule,
  favoritesQuickModule,
  downloadHistoryModule,
  tagsToolsModule,
  postsSearchModule,
  importerStatusModule,
  smoothThumbsModule,
  pageTransitionsModule,
  dmsViewerModule,
  hiddenCreatorsModule,
  downloadByTagsModule,
  similarCreatorsModule,
  postInfoModule,
  creatorLinksModule,
  creatorOverviewModule,
  creatorBlocksModule,
  siteTranslationModule,
  onboardingModule,
  // Before restyle, so user themes keep the last word
  shadcnSiteModule,
  ...shadcnSiteParts,
  restyleModule
];

export function registerBuiltinModules(): void {
  BUILTIN_MODULES.forEach(registerModule);
}
