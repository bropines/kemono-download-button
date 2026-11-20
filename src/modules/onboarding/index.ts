// First-run welcome: one dialog after install (and again when ONBOARDING_VERSION goes up) with the redesign
// switch and the optional no-flash userstyle. "Seen" lives in the userscript manager's storage (GM_setValue),
// not in the site's storage, so clearing site data does not bring it back. Settings → Interface reopens it.

import type { KdlModule } from '../../core/types';
import { isModuleEnabled, setModuleEnabled } from '../../core/registry';
import { readStored, writeStored } from '../../state/gmStorage';
import { el } from '../../utils/dom';
import { addKitStyles, button, dialog, field, switchControl, type DialogHandle } from '../../ui/kit';
import { canOfferPreloadStyle, isPreloadStyleOutdated, PRELOAD_STYLE_REVISION, PRELOAD_STYLE_URL, preloadStyleControl } from '../../ui/components/preloadStyle';
import { toast } from '../../ui/kit';
import { t } from '../../i18n';

const SEEN_KEY = 'onboarding.version';
// The style revision an update was last offered for: the toast comes once per new revision
const OFFERED_KEY = 'preload.offeredRevision';
const ONBOARDING_VERSION = 1;
// Let the page settle (and the user see it) before asking anything
const DELAY_MS = 1500;

let handle: DialogHandle | null = null;
let timer = 0;

const STYLES = `
.kdl-onboarding { display: flex; flex-direction: column; gap: 16px; }
.kdl-onboarding__intro { margin: 0; color: var(--kdl-muted-foreground); font-size: 14px; line-height: 1.5; }
.kdl-onboarding__hint { margin: 0; color: var(--kdl-muted-foreground); font-size: 13px; }
.kdl-preload-style { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
`;

export function openOnboarding(): void {
  if (handle?.isOpen()) return;
  addKitStyles('kdl-onboarding', STYLES);
  const finish = (): void => writeStored(SEEN_KEY, ONBOARDING_VERSION);
  const redesign = switchControl({
    id: 'kdl-onboarding-redesign',
    checked: isModuleEnabled('ui.shadcn'),
    ariaLabel: t('settings.interface.redesign'),
    onChange: (checked) => setModuleEnabled('ui.shadcn', checked),
  });
  const content = el('div', { className: 'kdl-onboarding' }, [
    el('p', { className: 'kdl-onboarding__intro', textContent: t('onboarding.intro') }),
    field({ label: t('settings.interface.redesign'), description: t('settings.interface.redesignDescription'), control: redesign, orientation: 'horizontal' }),
    canOfferPreloadStyle()
      ? field({ label: t('preload.title'), description: t('preload.description'), control: preloadStyleControl() })
      : null,
    el('p', { className: 'kdl-onboarding__hint', textContent: t('onboarding.settingsHint') }),
  ].filter(Boolean) as HTMLElement[]);
  handle = dialog({
    title: t('onboarding.title'),
    content: [content],
    size: 'md',
    // Closing it any way counts as seen: it never comes back by itself
    onClose: finish,
    footer: [button({ label: t('onboarding.done'), onClick: () => handle?.close() })],
  });
  handle.open();
}

export const onboardingModule: KdlModule = {
  id: 'onboarding',
  name: 'Welcome',
  description: 'Shown once after install: the redesign switch and the optional no-flash style.',
  group: 'General',
  pages: 'any',
  defaultEnabled: true,
  locked: true,
  setup() {
    // An installed preload style older than this build's: offer the update once (Stylus shows its update page)
    if (isPreloadStyleOutdated() && Number(readStored<number>(OFFERED_KEY, 0)) < PRELOAD_STYLE_REVISION) {
      window.setTimeout(() => {
        writeStored(OFFERED_KEY, PRELOAD_STYLE_REVISION);
        toast({
          title: t('preload.updateTitle'),
          description: t('preload.updateDescription'),
          duration: 15000,
          action: { label: t('preload.update'), onClick: () => window.open(PRELOAD_STYLE_URL, '_blank') },
        });
      }, DELAY_MS);
    }
    if (Number(readStored<number>(SEEN_KEY, 0)) >= ONBOARDING_VERSION) return;
    timer = window.setTimeout(() => {
      // Another tab may have shown it meanwhile
      if (Number(readStored<number>(SEEN_KEY, 0)) < ONBOARDING_VERSION) openOnboarding();
    }, DELAY_MS);
  },
  unmount() {
    clearTimeout(timer);
  },
};
