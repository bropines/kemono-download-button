import { SELECTORS } from '../../../config/selectors';
import { KUI_STORAGE_KEYS } from '../../../config/storage';

export function setupGridControls(): void {
  const slider = document.getElementById("gridSizeSlider") as HTMLInputElement | null;
  const numberInput = document.getElementById("gridSizeInput") as HTMLInputElement | null;

  const updateGridSize = (value: number | string) => {
    const containers = document.querySelectorAll<HTMLElement>(SELECTORS.postGridContainer);
    if (containers.length === 0) return;
    const safeValue = Math.max(120, Math.min(400, Number(value)));
    containers.forEach((container) => {
      if (container.querySelector(SELECTORS.postCard)) {
        container.style.setProperty("--card-size", `${safeValue}px`, "important");
      }
    });
    if (slider && document.activeElement !== slider) slider.value = String(safeValue);
    if (numberInput && document.activeElement !== numberInput) numberInput.value = String(safeValue);
  };

  const savedSize = typeof GM_getValue === 'function' ? (GM_getValue<string>(KUI_STORAGE_KEYS.GRID_SIZE, "180") as any) : "180";
  updateGridSize(savedSize);

  if (slider) {
    slider.addEventListener("input", () => updateGridSize(slider.value));
    slider.addEventListener("change", (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target && typeof GM_setValue === 'function') GM_setValue(KUI_STORAGE_KEYS.GRID_SIZE, target.value);
    });
  }

  if (numberInput) {
    numberInput.addEventListener("input", () => updateGridSize(numberInput.value));
    numberInput.addEventListener("change", (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target && typeof GM_setValue === 'function') GM_setValue(KUI_STORAGE_KEYS.GRID_SIZE, target.value);
    });
  }
}
