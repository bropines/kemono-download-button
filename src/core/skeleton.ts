// The loading skeleton shown in place of #main while it is hidden: the page cloak (htmx navigations, and the
// first load when the script is early) and the optional preload userstyle (first load; generated from the
// built-in snapshots by scripts/postbuild.mjs). A skeleton is drawn from a snapshot of the real page
// (src/core/skeletonCapture.ts): the user's own when one was taken, otherwise the built-in one for that kind of
// page and screen class (src/core/skeletons.json).
//
// A snapshot becomes one SVG background on #main::before (the page's boxes, controls, images and text lines,
// every x and width a calc() of the container width, so it lines up at any width) and the card grid one
// repeated tile on #main::after. A soft highlight sweeps across: only its layer moves, through a registered
// custom property. Imports types only: postbuild evaluates this module on its own.

import type { Lin, SkeletonSnapshot, SnapShape } from './skeletonCapture';

const TEXT = 'rgba(128,128,128,0.22)';
const MEDIA = 'rgba(128,128,128,0.16)';

const px = (n: number): string => `${Math.round(n * 10) / 10}px`;
const len = ([p, b]: Lin, extra = 0): string => {
  const pct = Math.round(p * 1000) / 10;
  const total = b + extra;
  if (!pct) return px(total);
  if (!total) return `${pct}%`;
  return `calc(${pct}% ${total < 0 ? '-' : '+'} ${px(Math.abs(total))})`;
};

// Minimal escaping for an SVG in a data: URL inside url("…")
const enc = (svg: string): string => svg.replace(/%/g, '%25').replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E').replace(/"/g, "'");

// A skeleton is muted: light fills and strokes (a white button, a checkbox outline) become the text grey
const MUTED_LIGHT = 'rgba(128,128,128,0.3)';
function luminance(color: string): number {
  const srgb = /color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)/.exec(color);
  const rgb = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(color);
  const [r, g, b] = srgb ? srgb.slice(1).map(Number) : rgb ? rgb.slice(1).map((v) => Number(v) / 255) : [0, 0, 0];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const muted = (color?: string): string | undefined => (color && luminance(color) > 0.35 ? MUTED_LIGHT : color);

function shape(s: SnapShape): string {
  // Strokes sit inside the box, like a CSS border
  const inset = s.s ? 0.5 : 0;
  const geometry = `x:${len(s.x, inset)};y:${px(s.y + inset)};width:${len(s.w, -2 * inset)};height:${px(Math.max(1, s.h - 2 * inset))}`;
  const r = s.r ? ` rx='${Math.min(s.r, s.h / 2)}'` : '';
  if (s.k === 't') return `<rect class='t' style='${geometry}'${r}/>`;
  if (s.k === 'i') return `<rect class='i' style='${geometry}'${r}/>`;
  const f = muted(s.f), st = muted(s.s);
  const fill = f ? ` fill='${f}'` : ` fill='none'`;
  const stroke = st ? ` stroke='${st}'` : '';
  return `<rect style='${geometry}'${r}${fill}${stroke}/>`;
}

function image(shapes: SnapShape[], size = "width='100%' height='100%'"): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' ${size}><style>.t{fill:${TEXT}}.i{fill:${MEDIA}}</style>${shapes.map(shape).join('')}</svg>`;
  return `url("data:image/svg+xml;utf8,${enc(svg)}")`;
}

// The highlight over every layer (listed first = drawn on top)
const SWEEP = 'linear-gradient(100deg, transparent 35%, rgba(255, 255, 255, 0.05) 50%, transparent 65%)';
const layers = (img: string, size: string, repeat: string): string =>
  `background-image: ${SWEEP}, ${img}; background-size: 200% 100%, ${size}; background-position: var(--kdl-sweep, 100%) 0, 0 0; background-repeat: no-repeat, ${repeat};`;

/** Rules every skeleton shares: the pseudo-elements and the highlight's animation */
export function skeletonBaseCss(scope: string): string {
  const pseudo = `${scope}::before, ${scope}::after`;
  return `
${scope} { position: relative; }
${pseudo} { content: ""; position: absolute; visibility: visible; pointer-events: none; animation: kdl-skeleton-shimmer 1.8s ease-in-out infinite; }
/* Only the highlight moves: its position is a registered (animatable) property used by the first layer.
   The keyframes name must not be reused for another definition: a style and a script of different versions
   meet on one page, and the last @keyframes of a name wins for both. */
@property --kdl-sweep { syntax: '<percentage>'; inherits: false; initial-value: 100%; }
@keyframes kdl-skeleton-shimmer { from { --kdl-sweep: 100%; } to { --kdl-sweep: 0%; } }
@media (prefers-reduced-motion: reduce) { ${pseudo} { animation: none; } }
`;
}

/** One snapshot, drawn on the element matched by `scope`; `sizeScope` holds the page at its height (only while
    the content is hidden: the skeleton may stay drawn a moment longer, fading, over the page as it is) */
export function snapshotCss(scope: string, snap: SkeletonSnapshot, sizeScope = scope): string {
  const [top, left, right] = snap.pad;
  const rules = [
    `${sizeScope} { min-height: ${px(top + snap.h)}; }`,
    `${scope}::before { top: ${px(top)}; left: ${px(left)}; right: ${px(right)}; height: ${px(snap.h)}; ${layers(image(snap.shapes), '100% 100%', 'no-repeat')} }`,
  ];
  const grid = snap.grid;
  if (grid) {
    // The grid's box inside the content box, as offsets from the content box's edges
    // A pseudo-element's left/right percentages are of #main's padding box, the snapshot's of its content box
    const inner = left + right;
    const offset = ([p, b]: Lin): string => {
      const pct = Math.round(p * 1000) / 1000;
      return pct ? `calc((100% - ${px(inner)}) * ${pct} + ${px(b)})` : px(b);
    };
    const gridLeft = offset(grid.x);
    // A tile is a card plus the gap after it, the last column has none: the box grows by one gap
    const gridRight = offset([1 - grid.x[0] - grid.w[0], -(grid.x[1] + grid.w[1]) - (grid.gap ?? 0)]);
    const tile = image(grid.shapes, `width='${grid.tw}' height='${grid.th}'`);
    rules.push(`${scope}::after { display: block; top: ${px(top + grid.y)}; left: calc(${px(left)} + ${gridLeft}); right: calc(${px(right)} + ${gridRight}); bottom: 0; ${layers(tile, `var(--kdl-sk-tw, ${grid.tw}px) auto`, 'space repeat')} }`);
  } else {
    rules.push(`${scope}::after { display: none; }`);
  }
  return rules.join('\n');
}
