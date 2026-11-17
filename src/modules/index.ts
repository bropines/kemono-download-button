import type { KdlModule } from '../core/types';
import { registerModule } from '../core/registry';
import { coreModule } from './core';
import { downloaderPostModule, downloaderCreatorModule, favoritesQuickModule } from './downloader';
import { adblockModule } from '../features/adblock';
import { viewedPostsModule } from '../features/kui/viewedPosts';
import { copyUsernameModule } from '../features/kui/userPageModule';
import { kuiPostModule } from '../features/kui/postPageModule';
import { gridSizeModule } from '../ui/components/kui/gridControls';

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
  favoritesQuickModule
];

export function registerBuiltinModules(): void {
  BUILTIN_MODULES.forEach(registerModule);
}
