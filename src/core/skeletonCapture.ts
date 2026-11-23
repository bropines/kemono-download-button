// Skeleton capture: turns the rendered #main (its first ~1.5 screens) into a compact snapshot of shapes, so the
// loading skeleton is the page itself rather than a drawing of it. Used two ways:
// - at runtime, after each page has settled, for the user's own layout (grid size, page width, theme, phone):
//   the page cloak shows it on the next visit to the same kind of page (src/core/skeletonStore.ts);
// - by scripts/capture-skeletons (through the browser's devtools) for the built-in snapshots shipped in
//   src/core/skeletons.json, which the preload userstyle is generated from.
//
// Every horizontal coordinate is a linear expression `p% + b px` of the container width, built along the
// chain of boxes (left-, right-, centre-anchored or stretched inside the parent box), so a snapshot taken at
// one width still lines up at another. The main card grid becomes one repeated tile. Colours are the
// computed ones. No imports: the capture script injects this module on its own.

/** A horizontal position or length: p * 100% + b px */
export type Lin = [number, number];

/** k: s = box (fill/stroke), t = text line, i = image/media, c = control (button, input) */
export interface SnapShape { k: 's' | 't' | 'i' | 'c'; x: Lin; w: Lin; y: number; h: number; r: number; f?: string; s?: string }

export interface SkeletonSnapshot {
  v: 1;
  /** #main padding: top, left, right */
  pad: [number, number, number];
  /** Captured height (the skeleton's height) */
  h: number;
  shapes: SnapShape[];
  /** The card grid: its box, and one tile of shapes (absolute px inside the tile) */
  // `fit`: a post card grid, whose columns come from --card-size (auto-fill): the skeleton recomputes its tile
  // width at show time, so a snapshot taken at another width or card size gets the real column count
  grid?: { x: Lin; w: Lin; y: number; tw: number; th: number; gap: number; shapes: SnapShape[]; fit?: 1 };
  /** Creator pages: the bottom of the tabs row, from the top of the content box (a same-creator swap draws the
      skeleton below it only, lined up with the live row: src/core/cloak.ts) */
  cut?: number;
}

// Dense pages (the tag list: a bar and two labels per row) fill about a screen with this
const MAX_SHAPES = 600;
const MAX_TILE_SHAPES = 40;
const EDGE = 64;
const NONE = /^(transparent|rgba\(0, 0, 0, 0\)|none)$/;

const lin = (p: number, b: number): Lin => [p, Math.round(b)];
const add = (a: Lin, b: Lin): Lin => [a[0] + b[0], a[1] + b[1]];

interface Clip { top: number; bottom: number; left: number; right: number }
interface Frame { x: Lin; w: Lin; left: number; width: number; clip: Clip }

const NO_CLIP: Clip = { top: -Infinity, bottom: Infinity, left: -Infinity, right: Infinity };
// Ancestors with overflow other than visible cut their children (collapsed panels, scroll strips)
function clipOf(style: CSSStyleDeclaration, rect: DOMRect, outer: Clip): Clip {
  const clips = (value: string): boolean => value !== 'visible';
  if (!clips(style.overflowX) && !clips(style.overflowY)) return outer;
  return {
    top: clips(style.overflowY) ? Math.max(outer.top, rect.top) : outer.top,
    bottom: clips(style.overflowY) ? Math.min(outer.bottom, rect.bottom) : outer.bottom,
    left: clips(style.overflowX) ? Math.max(outer.left, rect.left) : outer.left,
    right: clips(style.overflowX) ? Math.min(outer.right, rect.right) : outer.right,
  };
}
// The part of a rect inside the clip, or null when nothing of it shows
function within(rect: { left: number; top: number; right: number; bottom: number }, clip: Clip): DOMRect | null {
  const left = Math.max(rect.left, clip.left), right = Math.min(rect.right, clip.right);
  const top = Math.max(rect.top, clip.top), bottom = Math.min(rect.bottom, clip.bottom);
  return right - left >= 2 && bottom - top >= 2 ? new DOMRect(left, top, right - left, bottom - top) : null;
}

function visible(el: Element, style: CSSStyleDeclaration): boolean {
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) <= 0.05 || style.position === 'fixed') return false;
  // Also catches what only an ancestor hides: closed <details> content (content-visibility: hidden), zero opacity.
  // Not content-visibility: auto: rows scrolled out of view are still part of the page's layout.
  const check = (el as Element & { checkVisibility?: (options: object) => boolean }).checkVisibility;
  return !check || check.call(el, { opacityProperty: true, visibilityProperty: true });
}

function paint(style: CSSStyleDeclaration): { f?: string; s?: string } {
  const f = NONE.test(style.backgroundColor) ? undefined : style.backgroundColor;
  const s = parseFloat(style.borderTopWidth) > 0 && !NONE.test(style.borderTopColor) && style.borderTopStyle !== 'none' ? style.borderTopColor : undefined;
  return { f, s };
}

/** The filled share of a left-to-right gradient with a hard stop (`to right, color P%, transparent 0`), or 0 */
function barFraction(image: string): number {
  if (!image.startsWith('linear-gradient(to right')) return 0;
  const stop = /\)\s+([\d.]+)%,\s*(?:transparent|rgba\(0, 0, 0, 0\))\s+0(?:px|%)?\)/.exec(image);
  return stop ? Math.min(1, Number(stop[1]) / 100) : 0;
}

/** Where a box sits inside its parent frame, as expressions of the parent's width */
function place(parent: Frame, left: number, width: number): { x: Lin; w: Lin } {
  const L = left - parent.left;
  const R = parent.left + parent.width - (left + width);
  if (L < EDGE && R < EDGE && width > parent.width * 0.5) return { x: add(parent.x, lin(0, L)), w: add(parent.w, lin(0, -(L + R))) };
  if (Math.abs(L - R) <= 4 && L > EDGE / 2) return { x: add(add(parent.x, [parent.w[0] / 2, parent.w[1] / 2]), lin(0, -width / 2)), w: lin(0, width) };
  if (R < L && R < EDGE) return { x: add(add(parent.x, parent.w), lin(0, -(R + width))), w: lin(0, width) };
  return { x: add(parent.x, lin(0, L)), w: lin(0, width) };
}

/** Text lines of an element's own text nodes, as bars a little shorter than the line */
function textLines(el: Element, frame: Frame, top: number, out: SnapShape[], budget: number, limit: number): void {
  for (const node of Array.from(el.childNodes)) {
    if (out.length >= budget) return;
    if (node.nodeType !== 3 || !node.textContent?.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const raw of Array.from(range.getClientRects())) {
      const rect = within(raw, frame.clip);
      if (!rect || rect.width < 4 || rect.height < 4) continue;
      // A long text (a novel post, <br>-separated lines) stops at the captured height and the shape budget
      if (rect.top - top > limit || out.length >= budget) return;
      const h = Math.max(6, Math.round(rect.height * 0.55));
      const pos = place(frame, rect.left, rect.width);
      out.push({ k: 't', x: pos.x, w: pos.w, y: Math.round(rect.top - top + (rect.height - h) / 2), h, r: Math.min(6, h / 2) });
    }
  }
}

// <picture> is an inline box whose size is not the image's: its <img> is taken instead
const MEDIA = new Set(['IMG', 'VIDEO', 'CANVAS', 'IFRAME']);
const CONTROLS = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']);

function isControl(el: Element, style: CSSStyleDeclaration, rect: DOMRect): boolean {
  if (CONTROLS.has(el.tagName)) return true;
  if (rect.height > 56 || rect.width > 420) return false;
  // A row made of parts (a tag's name and count) is drawn as its parts, not as one button with a label
  if (Array.from(el.children).filter((child) => child.textContent?.trim()).length >= 2) return false;
  const { f, s } = paint(style);
  const boxy = !!(f || s);
  return boxy && parseFloat(style.borderTopLeftRadius) > 0 && (el.tagName === 'A' || el.getAttribute('role') === 'button' || el.classList.contains('kdl-ui-btn'));
}

/** The element whose children are the main card grid, if any */
function findGrid(root: Element): Element | null {
  let best: Element | null = null;
  let bestCount = 0;
  root.querySelectorAll('.card-list__items, [class*="card-list"], .kui-gallery-layout').forEach((el) => {
    const style = getComputedStyle(el);
    if (style.display !== 'grid' && !(style.display === 'flex' && style.flexWrap === 'wrap')) return;
    const count = el.children.length;
    if (count >= 4 && count > bestCount) { best = el; bestCount = count; }
  });
  return best;
}

export function captureSkeleton(root: Element | null = document.querySelector('#main')): SkeletonSnapshot | null {
  if (!root) return null;
  const rootRect = root.getBoundingClientRect();
  const rootStyle = getComputedStyle(root);
  const pad: [number, number, number] = [parseFloat(rootStyle.paddingTop) || 0, parseFloat(rootStyle.paddingLeft) || 0, parseFloat(rootStyle.paddingRight) || 0];
  const left = rootRect.left + pad[1];
  const top = rootRect.top + pad[0];
  const width = rootRect.width - pad[1] - pad[2];
  if (width < 200) return null;
  const limit = Math.min(rootRect.height - pad[0], Math.round(window.innerHeight * 1.5));
  const base: Frame = { x: [0, 0], w: [1, 0], left, width, clip: NO_CLIP };
  const shapes: SnapShape[] = [];
  const grid = findGrid(root);
  let gridSnap: SkeletonSnapshot['grid'];

  const walk = (el: Element, frame: Frame, out: SnapShape[], originTop: number, budget: number): void => {
    for (const child of Array.from(el.children)) {
      if (out.length >= budget) return;
      const style = getComputedStyle(child);
      // No box of its own (display: contents): its children belong to the parent's layout
      if (style.display === 'contents') {
        walk(child, frame, out, originTop, budget);
        continue;
      }
      const rect = within(child.getBoundingClientRect(), frame.clip);
      if (!rect || rect.top - originTop > limit || rect.bottom < originTop) continue;
      if (!visible(child, style)) continue;
      const pos = place(frame, rect.left, rect.width);
      const y = Math.round(rect.top - originTop);
      const h = Math.round(Math.min(rect.height, limit - (rect.top - originTop)));
      const r = Math.round(parseFloat(style.borderTopLeftRadius) || 0);
      if (child === grid && out === shapes) {
        const first = Array.from(child.children).find((item) => item.getBoundingClientRect().width > 20);
        if (first) {
          const itemRect = first.getBoundingClientRect();
          const gridStyle = getComputedStyle(child);
          const colGap = parseFloat(gridStyle.columnGap) || 0;
          const rowGap = parseFloat(gridStyle.rowGap) || 0;
          const tile: SnapShape[] = [];
          const tileFrame: Frame = { x: [0, 0], w: [0, itemRect.width], left: itemRect.left, width: itemRect.width, clip: NO_CLIP };
          const itemStyle = getComputedStyle(first);
          const itemPaint = paint(itemStyle);
          tile.push({ k: 's', x: [0, 0], w: [0, Math.round(itemRect.width)], y: 0, h: Math.round(itemRect.height), r: Math.round(parseFloat(itemStyle.borderTopLeftRadius) || 0), ...itemPaint });
          walk(first, tileFrame, tile, itemRect.top, MAX_TILE_SHAPES);
          gridSnap = { x: pos.x, w: pos.w, y: Math.round(rect.top - top), tw: Math.floor(itemRect.width + colGap), th: Math.floor(itemRect.height + rowGap), gap: Math.round(colGap), shapes: tile, ...(first.classList.contains('post-card') ? { fit: 1 as const } : {}) };
        }
        continue;
      }
      if (isControl(child, style, rect)) {
        const { f, s } = paint(style);
        out.push({ k: 'c', x: pos.x, w: pos.w, y, h, r, f, s });
        // A label line inside, so a button reads as one
        const label = (child as HTMLElement).innerText?.trim();
        if (label && rect.width > 20) {
          const inner = Math.min(rect.width - 24, label.length * 7);
          const lx = place(frame, rect.left + (rect.width - inner) / 2, inner);
          out.push({ k: 't', x: lx.x, w: lx.w, y: y + Math.round(rect.height / 2 - 4), h: 8, r: 4 });
        }
        continue;
      }
      if (MEDIA.has(child.tagName) || (child.tagName.toLowerCase() === 'svg' && rect.width > 28) || /url\(/.test(style.backgroundImage)) {
        out.push({ k: 'i', x: pos.x, w: pos.w, y, h, r });
        continue;
      }
      if (child.tagName.toLowerCase() === 'svg') {
        out.push({ k: 't', x: pos.x, w: pos.w, y, h, r: Math.min(4, rect.width / 2) });
        continue;
      }
      const { f, s } = paint(style);
      if ((f || s) && rect.width > 8 && rect.height > 8) out.push({ k: 's', x: pos.x, w: pos.w, y, h, r, f, s });
      // A bar drawn as a hard-stop gradient (the tag list's popularity): its filled part
      const bar = barFraction(style.backgroundImage);
      if (bar && rect.width * bar > 2) {
        const filled = place(frame, rect.left, rect.width * bar);
        out.push({ k: 'i', x: filled.x, w: filled.w, y, h, r });
      }
      const childFrame: Frame = { x: pos.x, w: pos.w, left: rect.left, width: rect.width, clip: clipOf(style, child.getBoundingClientRect(), frame.clip) };
      textLines(child, childFrame, originTop, out, budget, limit);
      walk(child, childFrame, out, originTop, budget);
    }
  };
  walk(root, base, shapes, top, MAX_SHAPES);
  const tabs = root.querySelector(':scope > .site-section--user > .kdl-sk-tabs-row');
  const cut = tabs ? Math.round(tabs.getBoundingClientRect().bottom - top) : undefined;
  return { v: 1, pad, h: Math.round(Math.max(0, limit)), shapes, grid: gridSnap, ...(cut !== undefined && cut > 0 ? { cut } : {}) };
}

/** Width class a snapshot belongs to: phones lay pages out differently */
export function skeletonBucket(width = window.innerWidth): 'mobile' | 'desktop' {
  return width <= 720 ? 'mobile' : 'desktop';
}

/** The kind of page a skeleton is for: creator tabs, posts, and the first path segments elsewhere */
export function skeletonRoute(path = window.location.pathname): string {
  const clean = path.replace(/\/+$/, '') || '/';
  if (/^\/[^/]+\/user\/[^/]+\/post\/[^/]+/.test(clean)) return 'post';
  const creator = /^\/[^/]+\/user\/[^/]+(?:\/([^/]+))?$/.exec(clean);
  if (creator) return creator[1] ? `creator-${creator[1]}` : 'creator';
  if (/^\/discord\/server\//.test(clean)) return 'discord';
  return clean.split('/').filter(Boolean).slice(0, 2).join('-') || 'home';
}
