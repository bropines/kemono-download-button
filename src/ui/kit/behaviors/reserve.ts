// Space reserved in the page flow for a block that arrives late: a placeholder of the final size goes in at once,
// then `swapIn` puts the real block in its place, and `collapseAway` folds it when there is nothing to show.
// When the two heights differ, the height eases from one to the other instead of jumping in one frame. No easing
// with reduced motion, or with `animate: false` (the page is not shown yet, e.g. under the page cloak).

const EASE_MS = 200;

const reduced = (): boolean => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

interface EaseOptions {
  /** false: change at once (the page is hidden, nothing to smooth) */
  animate?: boolean;
}

// Pins the node at `from` px and eases its height to `to`, then hands the height back to the layout
function ease(node: HTMLElement, from: number, to: number, done: () => void): void {
  const style = node.style;
  style.overflow = 'hidden';
  style.height = `${from}px`;
  style.transition = `height ${EASE_MS}ms ease, margin ${EASE_MS}ms ease, opacity ${EASE_MS}ms ease`;
  void node.offsetHeight;
  requestAnimationFrame(() => {
    style.height = `${to}px`;
  });
  let finished = false;
  const finish = (): void => {
    if (finished) return;
    finished = true;
    node.removeEventListener('transitionend', onEnd);
    done();
  };
  const onEnd = (event: TransitionEvent): void => {
    if (event.target === node && event.propertyName === 'height') finish();
  };
  node.addEventListener('transitionend', onEnd);
  setTimeout(finish, EASE_MS + 80);
}

/** Replaces `placeholder` with `next` in the page. Only the height differs from frame to frame, never both. */
export function swapIn(placeholder: HTMLElement, next: HTMLElement, options: EaseOptions = {}): void {
  if (!placeholder.isConnected) return;
  const from = placeholder.offsetHeight;
  placeholder.replaceWith(next);
  if (options.animate === false || reduced()) return;
  const to = next.offsetHeight;
  if (Math.abs(from - to) < 2) return;
  ease(next, from, to, () => {
    next.style.removeProperty('height');
    next.style.removeProperty('overflow');
    next.style.removeProperty('transition');
  });
}

/** Folds the node's height (and margins) away, then removes it; `done` runs once it is gone */
export function collapseAway(node: HTMLElement, done?: () => void, options: EaseOptions = {}): void {
  const finish = (): void => {
    node.remove();
    done?.();
  };
  if (!node.isConnected || options.animate === false || reduced()) return finish();
  const from = node.offsetHeight;
  node.style.margin = getComputedStyle(node).margin;
  ease(node, from, 0, finish);
  requestAnimationFrame(() => {
    node.style.margin = '0';
    node.style.opacity = '0';
  });
}
