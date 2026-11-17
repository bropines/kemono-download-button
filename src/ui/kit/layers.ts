/** z-index of the #kdl-root host on the page; every kit overlay stacks inside it. */
export const HOST_Z_INDEX = 2147483000;

/** Stacking order inside the kit root. */
export const LAYERS = {
  base: 1,
  overlay: 100,
  modal: 110,
  popover: 120,
  toast: 200,
  tooltip: 300,
} as const;
