import type { KdlModule } from '../../../core/types';

/** Keep the module catalogue and the relevant settings page backed by the same registry. */
export function moduleTopic(mod: Pick<KdlModule, 'id' | 'group'>): 'themes' | 'downloads' | 'interface' | null {
  if (mod.id === 'core' || mod.id === 'i18n.site' || mod.id === 'onboarding') return null;
  if (mod.id === 'restyle' || mod.id === 'ui.shadcn' || mod.id.startsWith('ui.shadcn.')) return 'themes';
  if (mod.group === 'Downloader') return 'downloads';
  if (['General', 'Interface', 'Lists', 'Post page', 'Creator page'].includes(mod.group || '')) return 'interface';
  return null;
}
