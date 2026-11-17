import { emptyState } from '../../kit';
import { section } from '../controls';
import { getSettingsSections, registerSettingsSection } from '../registry';

// MODULE HOOK: modules call registerSettingsSection({ ..., placement: 'modules' }) from ../registry;
// each one renders as a card in this tab. Nothing registers here yet.
registerSettingsSection({
  id: 'modules',
  title: 'Modules',
  icon: 'package',
  order: 100,
  render(container) {
    const modules = getSettingsSections('modules');
    if (!modules.length) {
      container.append(
        emptyState({
          icon: 'package',
          title: 'No module settings yet',
          description: 'Optional modules will list their settings here.',
        })
      );
      return;
    }
    for (const mod of modules) {
      const body = section(mod.title, [], { icon: mod.icon, description: mod.description });
      body.dataset.section = mod.id;
      mod.render(body.querySelector<HTMLElement>('.kdl-ui-card__content')!);
      container.append(body);
    }
  },
});
