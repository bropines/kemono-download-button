// Colour swatches for the shadcn skin's accent and base tone, inside its card in the Modules tab.
// Clicking one sets the same module setting as the select above it (which follows via the registry).

import { getModuleSetting, setModuleSetting } from '../../../core/registry';
import { ACCENTS, BASES, isHexColour } from '../../../modules/shadcnSite/palette';
import { el } from '../../../utils/dom';
import { css } from '../../../utils/cssBuilder';
import { addKitStyles } from '../../kit';
import { notifySaved, whileConnected } from '../controls';
import { registerSettingsSection } from '../registry';

const MODULE_ID = 'ui.shadcn';

const styles = css({
  '.kdl-swatches': { display: 'flex', flexDirection: 'column', gap: '8px' },
  '.kdl-swatches__row': { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  '.kdl-swatches__label': { fontSize: '12px', color: 'var(--kdl-muted-foreground)', minWidth: '72px' },
  '.kdl-swatch': {
    width: '24px',
    height: '24px',
    padding: '0',
    borderRadius: '9999px',
    border: '1px solid var(--kdl-border)',
    cursor: 'pointer',
    boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.25)',
  },
  '.kdl-swatch[aria-pressed="true"]': { outline: '2px solid var(--kdl-ring)', outlineOffset: '2px' },
  '.kdl-swatch:focus-visible': { outline: '2px solid var(--kdl-ring)', outlineOffset: '2px' },
});

type Kind = 'accent' | 'base';

function swatchColour(kind: Kind, key: string): string {
  if (kind === 'base') {
    const b = BASES[key];
    return `linear-gradient(135deg, ${b.background} 50%, ${b.surface} 50%)`;
  }
  if (key === 'custom') {
    const hex = String(getModuleSetting(MODULE_ID, 'accentCustom') || '');
    return isHexColour(hex) ? hex : 'conic-gradient(#f43f5e, #f59e0b, #22c55e, #3b82f6, #8b5cf6, #f43f5e)';
  }
  return ACCENTS[key].primary || 'linear-gradient(135deg, #fafafa 50%, #27272a 50%)';
}

function row(kind: Kind, label: string, keys: string[], labels: Record<string, { label: string }>): HTMLElement {
  const buttons = keys.map((key) => {
    const btn = el('button', { type: 'button', className: 'kdl-swatch', title: labels[key].label, dataset: { key } });
    btn.setAttribute('aria-label', `${label}: ${labels[key].label}`);
    btn.style.background = swatchColour(kind, key);
    btn.addEventListener('click', () => {
      setModuleSetting(MODULE_ID, kind, key);
      notifySaved();
    });
    return btn;
  });
  const node = el('div', { className: 'kdl-swatches__row', dataset: { kind } }, [el('span', { className: 'kdl-swatches__label', textContent: label }), ...buttons]);
  const sync = () => {
    const current = String(getModuleSetting(MODULE_ID, kind));
    buttons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.key === current));
      if (kind === 'accent' && btn.dataset.key === 'custom') btn.style.background = swatchColour(kind, 'custom');
    });
  };
  sync();
  whileConnected(node, (event) => event.type === 'setting' && event.id === MODULE_ID && sync());
  return node;
}

registerSettingsSection({
  id: MODULE_ID,
  title: 'shadcn skin colours',
  placement: 'modules',
  render(container) {
    addKitStyles('kdl-shadcn-swatches', styles);
    container.prepend(
      el('div', { className: 'kdl-swatches' }, [
        row('accent', 'Accent', Object.keys(ACCENTS), ACCENTS),
        row('base', 'Base tone', Object.keys(BASES), BASES),
      ])
    );
  },
});
