// Only the types of upstream's detect.ts. Upstream classifies every picture on a page;
// here the callers already know which picture they mean, and the rest of that module
// pulls in upstream's UI. Copied verbatim from upstream's type declarations.

export type TargetKind = 'img' | 'canvas' | 'video' | 'background';

export interface Target {
  /** What the button sits on and what the translation is laid over. */
  element: HTMLElement;
  kind: TargetKind;
  /**
   * The picture's own address, where it has one - the identity the cache keys
   * on, and the URL to re-fetch from when the canvas comes back tainted.
   * Empty for a canvas or a video, which have no address at all.
   */
  url: string;
  /**
   * Whether a pointer can reach it at all.
   *
   * `pointer-events: none` is what an overlay is made of - a devtools
   * highlighter, a scrim, our own cover. eruda's DOM highlighter is a canvas
   * the size of the viewport, and it beat the actual page on area, which is how
   * the button ended up in the top corner.
   *
   * It only lowers the ranking rather than disqualifying, because a reader that
   * sets `pointer-events: none` on its page image to stop dragging is a real
   * thing, and there the picture is all there is. What it does fix is the
   * disagreement: the hover path can never select an unpointable element, so
   * the pinned one should not prefer it.
   */
  pointable: boolean;
}
