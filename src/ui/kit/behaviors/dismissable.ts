export type DismissReason = 'escape' | 'outside';

export interface DismissOptions {
  onDismiss: (reason: DismissReason) => void;
  /** Close on Escape (default true). */
  escape?: boolean;
  /** Close on pointerdown outside the element (default true). */
  outside?: boolean;
  /** Extra elements that count as inside (e.g. the trigger button). */
  ignore?: Array<Element | null | undefined>;
}

interface Layer extends DismissOptions {
  element: Element;
}

/** Open layers, topmost last. Only the topmost one reacts to an event. */
const stack: Layer[] = [];
let listening = false;

function top(): Layer | undefined {
  return stack[stack.length - 1];
}

function onKeyDown(event: KeyboardEvent): void {
  const layer = top();
  if (!layer || event.key !== 'Escape' || layer.escape === false) return;
  event.stopPropagation();
  event.preventDefault();
  layer.onDismiss('escape');
}

function onPointerDown(event: PointerEvent): void {
  const layer = top();
  if (!layer || layer.outside === false) return;
  // composedPath sees through shadow roots, unlike event.target
  const path = event.composedPath();
  const inside = [layer.element, ...(layer.ignore ?? [])].some((node) => node && path.includes(node));
  const exempt = path.some((node) => node instanceof Element && node.hasAttribute('data-kdl-dismiss-ignore'));
  if (!inside && !exempt) layer.onDismiss('outside');
}

/**
 * Registers an element as a dismissable layer (Escape + outside click).
 * Layers stack, so a popover inside a dialog closes before the dialog does.
 * Returns an unregister function; call it when the element closes.
 */
export function dismissable(element: Element, options: DismissOptions): () => void {
  const layer: Layer = { element, ...options };
  stack.push(layer);
  if (!listening) {
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    listening = true;
  }
  return () => {
    const index = stack.indexOf(layer);
    if (index >= 0) stack.splice(index, 1);
    if (!stack.length && listening) {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      listening = false;
    }
  };
}
