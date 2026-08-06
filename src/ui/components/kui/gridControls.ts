import { SELECTORS } from '../../../config/selectors';
import { KUI_STORAGE_KEYS } from '../../../config/storage';

export function setupGridControls(): void {
  const slider = document.getElementById("gridSizeSlider") as HTMLInputElement | null;
  const numberInput = document.getElementById("gridSizeInput") as HTMLInputElement | null;

  const getSavedSize = (): number => {
    const savedSize = typeof GM_getValue === 'function' ? (GM_getValue<string>(KUI_STORAGE_KEYS.GRID_SIZE, "180") as any) : "180";
    return Math.max(120, Math.min(400, Number(savedSize) || 180));
  };

  const updateGridSize = (value: number | string) => {
    const safeValue = Math.max(120, Math.min(400, Number(value) || 180));

    // Set on :root and body so all present & future grid containers inherit --card-size
    document.documentElement.style.setProperty("--card-size", `${safeValue}px`, "important");
    if (document.body) {
      document.body.style.setProperty("--card-size", `${safeValue}px`, "important");
    }

    // Set directly on all post grid containers in DOM
    const containers = document.querySelectorAll<HTMLElement>(SELECTORS.postGridContainer);
    containers.forEach((container) => {
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
      if (typeof GM_setValue === 'function') GM_setValue(KUI_STORAGE_KEYS.GRID_SIZE, slider.value);
    });
    slider.addEventListener("change", (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target && typeof GM_setValue === 'function') GM_setValue(KUI_STORAGE_KEYS.GRID_SIZE, target.value);
    });
  }

  if (numberInput && !numberInput.dataset.kuiListener) {
    numberInput.dataset.kuiListener = 'true';
    numberInput.value = String(saved);
    numberInput.addEventListener("input", () => {
      updateGridSize(numberInput.value);
      if (typeof GM_setValue === 'function') GM_setValue(KUI_STORAGE_KEYS.GRID_SIZE, numberInput.value);
    });
    numberInput.addEventListener("change", (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target && typeof GM_setValue === 'function') GM_setValue(KUI_STORAGE_KEYS.GRID_SIZE, target.value);
    });
  }
}
