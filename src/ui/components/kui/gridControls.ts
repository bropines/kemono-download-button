import { SELECTORS } from '../../../config/selectors';
import { readStored, writeStored } from '../../../state/gmStorage';
import { KUI_STORAGE_KEYS } from '../../../config/storage';

export function setupGridControls(): void {
  const slider = document.getElementById("gridSizeSlider") as HTMLInputElement | null;
  const numberInput = document.getElementById("gridSizeInput") as HTMLInputElement | null;

  const getSavedSize = (): number => {
    const savedSize = readStored<string>(KUI_STORAGE_KEYS.GRID_SIZE, "180");
    return Math.max(120, Math.min(400, Number(savedSize) || 180));
  };

  const updateGridSize = (value: number | string) => {
    const safeValue = Math.max(120, Math.min(400, Number(value) || 180));

    // Set on :root and body so post card grid containers inherit --card-size
    document.documentElement.style.setProperty("--card-size", `${safeValue}px`, "important");
    if (document.body) {
      document.body.style.setProperty("--card-size", `${safeValue}px`, "important");
    }

    // Set directly on all post grid containers, explicitly excluding creator/artist cards (.user-card)
    const containers = document.querySelectorAll<HTMLElement>('.card-list__items, .card-list');
    containers.forEach((container) => {
      // Skip creator/artist lists
      if (container.querySelector('.user-card, a.user-card')) {
        container.style.removeProperty("--card-size");
        return;
      }
      container.style.setProperty("--card-size", `${safeValue}px`, "important");
    });

    if (slider && document.activeElement !== slider) slider.value = String(safeValue);
    if (numberInput && document.activeElement !== numberInput) numberInput.value = String(safeValue);
  };

  const saved = getSavedSize();
  updateGridSize(saved);

  // Ensure grid size persists when resizing browser window
  window.removeEventListener("resize", (window as any)._kuiGridResizeHandler);
  (window as any)._kuiGridResizeHandler = () => {
    const currentSaved = getSavedSize();
    updateGridSize(currentSaved);
  };
  window.addEventListener("resize", (window as any)._kuiGridResizeHandler);

  if (slider && !slider.dataset.kuiListener) {
    slider.dataset.kuiListener = 'true';
    slider.value = String(saved);
    slider.addEventListener("input", () => {
      updateGridSize(slider.value);
      writeStored(KUI_STORAGE_KEYS.GRID_SIZE, slider.value);
    });
    slider.addEventListener("change", (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target) writeStored(KUI_STORAGE_KEYS.GRID_SIZE, target.value);
    });
  }

  if (numberInput && !numberInput.dataset.kuiListener) {
    numberInput.dataset.kuiListener = 'true';
    numberInput.value = String(saved);
    numberInput.addEventListener("input", () => {
      updateGridSize(numberInput.value);
      writeStored(KUI_STORAGE_KEYS.GRID_SIZE, numberInput.value);
    });
    numberInput.addEventListener("change", (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target) writeStored(KUI_STORAGE_KEYS.GRID_SIZE, target.value);
    });
  }
}
