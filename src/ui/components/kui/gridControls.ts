import type { KdlModule } from '../../../core/types';
import { getModuleSetting, setModuleSetting } from '../../../core/registry';

const MODULE_ID = 'gridSize';
const MIN = 120;
const MAX = 400;
const DEFAULT = 180;
const CONTAINERS = '.card-list__items, .card-list';

const clamp = (value: unknown): number => Math.max(MIN, Math.min(MAX, Number(value) || DEFAULT));

const getSlider = () => document.getElementById("gridSizeSlider") as HTMLInputElement | null;
const getNumberInput = () => document.getElementById("gridSizeInput") as HTMLInputElement | null;

function applyGridSize(value: unknown): void {
  const safeValue = clamp(value);

  // Set on :root and body so post card grid containers inherit --card-size
  document.documentElement.style.setProperty("--card-size", `${safeValue}px`, "important");
  document.body?.style.setProperty("--card-size", `${safeValue}px`, "important");

  // Set directly on post grid containers, explicitly excluding creator/artist cards (.user-card)
  document.querySelectorAll<HTMLElement>(CONTAINERS).forEach((container) => {
    if (container.querySelector('.user-card, a.user-card')) {
      container.style.removeProperty("--card-size");
      return;
    }
    container.style.setProperty("--card-size", `${safeValue}px`, "important");
  });

  syncControls(safeValue);
}

function clearGridSize(): void {
  document.documentElement.style.removeProperty("--card-size");
  document.body?.style.removeProperty("--card-size");
  document.querySelectorAll<HTMLElement>(CONTAINERS).forEach((container) => container.style.removeProperty("--card-size"));
}

function syncControls(value: number): void {
  const slider = getSlider();
  const numberInput = getNumberInput();
  if (slider && document.activeElement !== slider) slider.value = String(value);
  if (numberInput && document.activeElement !== numberInput) numberInput.value = String(value);
}

// The inputs live in the UI settings panel; they write the module setting, which applies it while mounted
function bindControls(): void {
  [getSlider(), getNumberInput()].forEach((input) => {
    if (!input || input.dataset.kuiListener) return;
    input.dataset.kuiListener = 'true';
    input.value = String(getModuleSetting<number>(MODULE_ID, 'size'));
    input.addEventListener("input", () => setModuleSetting(MODULE_ID, 'size', clamp(input.value)));
  });
}

export const gridSizeModule: KdlModule = {
  id: MODULE_ID,
  name: 'Card grid size',
  description: 'Sets the width of post cards in lists.',
  group: 'Lists',
  pages: 'any',
  defaultEnabled: true,
  settings: [{ key: 'size', label: 'Post card size (px)', type: 'number', default: DEFAULT, min: MIN, max: MAX }],
  mount(ctx) {
    bindControls();
    applyGridSize(ctx.settings.get('size'));
    ctx.settings.onChange('size', (value) => applyGridSize(value));
    const onResize = () => applyGridSize(ctx.settings.get('size'));
    window.addEventListener("resize", onResize);
    ctx.onCleanup(() => window.removeEventListener("resize", onResize));
  },
  update(ctx) {
    bindControls();
    applyGridSize(ctx.settings.get('size'));
  },
  unmount() {
    clearGridSize();
  }
};
