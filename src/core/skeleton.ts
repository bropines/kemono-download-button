// The loading skeleton shown in place of #main while it is hidden: the page cloak (htmx navigations) and the
// optional preload userstyle (first load; extras/kdl-preload.user.css is generated from this file by
// scripts/postbuild.mjs). One per page type, drawn to the redesign's real geometry (measured on a 1700px
// window): the creator page (profile card, tabs, pagination, card grid), the post page (prev/next, header
// card, content and files sections) and post lists (pagination, card grid).
//
// Each band is an SVG background without a viewBox, sized 100% wide: rounded corners and borders stay crisp
// at any width, and nested <svg x="50%"> / <svg x="100%"> place parts at the centre or the right edge. The
// pseudo-elements stay visible inside the hidden #main; a soft highlight sweeps across. Colours are the
// skin's defaults (data URIs cannot read CSS variables). No imports: postbuild evaluates this module alone.

export type SkeletonPage = 'creator' | 'post' | 'list';

const BG = '#0a0a0a';
const CARD = '#111111';
const LINE = '#262626';
const SHAPE = '#262626';
const SOFT = '#1c1c1c';

type Attrs = Record<string, string | number>;
const tag = (name: string, attrs: Attrs, body = ''): string =>
  `<${name} ${Object.entries(attrs).map(([key, value]) => `${key}='${value}'`).join(' ')}${body ? `>${body}</${name}>` : '/>'}`;
const rect = (x: number | string, y: number, width: number | string, height: number, rx: number, fill = SHAPE, extra: Attrs = {}): string =>
  tag('rect', { x, y, width, height, rx, fill, ...extra });
// A card surface the full width (or height) of its band: the stroke is half clipped, so 2 draws a 1px border
const panel = (height: number | string = '100%'): string => rect(0, 0, '100%', height as number, 12, CARD, { stroke: LINE, 'stroke-width': 2 });
const at = (x: string, body: string): string => tag('svg', { x, overflow: 'visible' }, body);
const svg = (body: string): string =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'>${body}</svg>`)}")`;

interface Layer { image: string; x?: string; y: number; height: number | 'rest'; repeat?: string; size?: string }

// ---- Shared pieces ----

// Creator pages centre the page numbers and put the post search on the right; lists right-align the numbers
const pageNumbers = (count: number): string =>
  [rect(0, 0, 36, 36, 8, 'none', { stroke: '#404040', 'stroke-width': 1.5 }), ...Array.from({ length: count }, (_, i) => rect(50 + i * 42, 12, 12, 12, 3))].join('');
const PAGINATOR = svg([
  panel(),
  rect(15, 19, 150, 12, 4),
  at('50%', tag('g', { transform: 'translate(-280 7)' }, pageNumbers(10))),
  at('100%', [rect(-248, 7, 240, 36, 8, BG, { stroke: LINE }), rect(-232, 19, 12, 12, 6), rect(-212, 20, 110, 10, 4, SOFT)].join('')),
].join(''));
const LIST_PAGINATOR = svg([
  panel(),
  rect(15, 18, 190, 12, 4),
  at('100%', tag('g', { transform: 'translate(-650 5)' }, pageNumbers(14))),
].join(''));

// One post card per tile (193 wide, `height` tall, plus the row gap); `space` spreads the columns like the
// grid. Lists show two-line titles, so their cards are taller.
const cardTile = (height: number, titleLines: number): string => svg([
  rect(0.5, 0.5, 192, height - 1, 12, CARD, { stroke: LINE }),
  rect(1, 1, 191, 191, 11), rect(1, 96, 191, 96, 0),
  ...Array.from({ length: titleLines }, (_, i) => rect(13, 204 + i * 22, i ? 110 : 150, 14, 4)),
  rect(13, height - 49, 100, 12, 4, SOFT),
  rect(13, height - 29, 78, 20, 6),
].join(''));
const grid = (height: number, titleLines: number, gap: number): Omit<Layer, 'y'> =>
  ({ image: cardTile(height, titleLines), height: 'rest', size: `193px ${height + gap}px`, repeat: 'space repeat' });
const GRID = grid(291, 1, 15);

// ---- Creator page ----

const CREATOR_HEADER = svg(at('50%', [
  rect(-479.5, 0.5, 959, 270, 12, CARD, { stroke: LINE }),
  rect(-479, 1, 958, 112, 11), rect(-479, 56, 958, 57, 0),
  rect(-460, 61, 104, 104, 12, '#2e2e2e', { stroke: CARD, 'stroke-width': 4 }),
  rect(-343, 134, 26, 12, 3, SOFT), rect(-310, 128, 170, 24, 6), rect(-128, 132, 16, 16, 4, SOFT), rect(-100, 132, 16, 16, 4, SOFT),
  rect(-343, 173, 124, 27, 8, 'none', { stroke: SHAPE, 'stroke-width': 1.5 }), rect(-330, 183, 96, 8, 4, SOFT),
  ...[[-344, 164], [-171, 77], [-89, 34], [-46, 34], [-2, 139], [146, 34]].map(([x, w]) => rect(x, 218, w, 36, 8)),
].join('')));
const CREATOR_TABS = svg(at('50%', [
  rect(-296.5, 0, 593, 38, 8),
  rect(-292, 4, 72, 30, 6, CARD),
  ...[[-280, 46, SHAPE], [-204, 70, '#363636'], [-116, 92, '#363636'], [-8, 150, '#363636'], [158, 118, '#363636']].map(([x, w, fill]) => rect(x as number, 14, w as number, 10, 4, fill as string)),
].join('')));
const SECTION_TITLE = svg([rect(0, 0, 128, 14, 4), at('100%', rect(-22, 1, 14, 12, 4, SOFT))].join(''));

const CREATOR: { before: Layer[]; beforeHeight: number; after: Layer[]; afterTop: number } = {
  before: [
    { image: CREATOR_HEADER, y: 0, height: 271 },
    { image: CREATOR_TABS, y: 283, height: 38 },
    { image: SECTION_TITLE, y: 340, height: 14 },
    { image: PAGINATOR, y: 377, height: 50 },
  ],
  beforeHeight: 427,
  after: [{ ...GRID, y: 0 }],
  afterTop: 447,
};

// ---- Post page ----

const POST_NAV = svg([rect(0, 14, 90, 12, 4, SOFT), at('100%', [rect(-130, 2, 130, 36, 8, 'none', { stroke: LINE, 'stroke-width': 1.5 }), rect(-112, 15, 80, 10, 4)].join(''))].join(''));
const POST_HEADER = svg([
  panel(),
  rect(1, 1, 200, 241, 11, '#161616'), rect(100, 1, 101, 241, 0, '#161616'),
  rect(56, 54, 90, 90, 12, '#2e2e2e'), rect(61, 168, 80, 14, 4),
  rect(225, 26, 320, 24, 6), rect(555, 32, 120, 14, 4, SOFT),
  rect(225, 63, 108, 22, 6, 'none', { stroke: SHAPE, 'stroke-width': 1.5 }), rect(342, 63, 108, 22, 6, 'none', { stroke: SHAPE, 'stroke-width': 1.5 }),
  rect(225, 106, 270, 12, 4, SOFT), rect(225, 140, 220, 12, 4, SOFT),
  rect(225, 168, 40, 12, 4, SOFT), rect(335, 163, 70, 22, 6), rect(415, 163, 90, 22, 6), rect(515, 163, 65, 22, 6),
  rect(225, 190, 150, 32, 8, 'none', { stroke: SHAPE, 'stroke-width': 1.5 }), rect(385, 190, 140, 32, 8, 'none', { stroke: SHAPE, 'stroke-width': 1.5 }),
  at('100%', [
    rect(-462, 32, 215, 36, 8, 'none', { stroke: SHAPE, 'stroke-width': 1.5 }), rect(-237, 32, 215, 36, 8),
    rect(-462, 79, 215, 36, 8, 'none', { stroke: SHAPE, 'stroke-width': 1.5 }), rect(-237, 79, 215, 36, 8),
    rect(-237, 126, 215, 36, 8, '#3a3a3a'),
  ].join('')),
].join(''));
// A post section: title, divider, then `body` (relative to the section's top-left)
const SECTION = (body: string): string => svg([
  panel(),
  rect(20, 22, 130, 18, 5),
  tag('line', { x1: 20, y1: 56.5, x2: '100%', y2: 56.5, stroke: LINE }),
  at('100%', rect(-21, 50, 20, 12, 0, CARD)),
  body,
].join(''));
const POST_CONTENT = SECTION([rect(20, 86, '55%', 12, 4, SOFT), rect(20, 116, '72%', 12, 4, SOFT)].join(''));
const POST_FILES = SECTION([
  ...[80, 230, 380, 530].map((y) => rect(20, y, 224, 136, 8)),
  rect(264, 80, '62%', 520, 10, SOFT),
].join(''));

const POST = {
  before: [
    { image: POST_NAV, y: 0, height: 40 },
    { image: POST_HEADER, y: 44, height: 243 },
    { image: POST_CONTENT, y: 311, height: 160 },
  ],
  beforeHeight: 471,
  after: [{ image: POST_FILES, y: 0, height: 'rest' as const }],
  afterTop: 487,
};

// ---- Post lists ----

// Title, search box and the Filters / Search tips buttons, centred above the pagination
const LIST_HEAD = svg(at('50%', [
  rect(-60, 4, 120, 32, 8),
  rect(-224, 63, 448, 36, 8, BG, { stroke: LINE }), rect(-208, 75, 12, 12, 6), rect(-188, 76, 120, 10, 4, SOFT),
  rect(-133, 114, 82, 34, 8, 'none', { stroke: SHAPE, 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }),
  rect(-41, 114, 162, 34, 8, 'none', { stroke: SHAPE, 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }),
].join('')));

const LIST = {
  before: [
    { image: LIST_HEAD, y: 0, height: 150 },
    { image: LIST_PAGINATOR, y: 167, height: 47 },
  ],
  beforeHeight: 214,
  after: [{ ...grid(303, 2, 15), y: 0 }],
  afterTop: 233,
};

const PAGES: Record<SkeletonPage, { before: Layer[]; beforeHeight: number; after: Layer[]; afterTop: number }> = { creator: CREATOR, post: POST, list: LIST };

// The highlight sweeping over every layer (first in the list = on top)
const SWEEP = 'linear-gradient(100deg, transparent 35%, rgba(255, 255, 255, 0.05) 50%, transparent 65%)';

function backgrounds(layers: Layer[]): string {
  const images = [SWEEP, ...layers.map((layer) => layer.image)].join(', ');
  const sizes = ['200% 100%', ...layers.map((layer) => layer.size ?? `100% ${layer.height === 'rest' ? '100%' : `${layer.height}px`}`)].join(', ');
  const positions = ['var(--kdl-sweep, 100%) 0', ...layers.map((layer) => `${layer.x ?? '0'} ${layer.y}px`)].join(', ');
  const repeats = ['no-repeat', ...layers.map((layer) => layer.repeat ?? 'no-repeat')].join(', ');
  return `background-image: ${images}; background-size: ${sizes}; background-position: ${positions}; background-repeat: ${repeats};`;
}

/** Rules every skeleton shares: the hidden element and its two visible pseudo-elements */
export function skeletonBaseCss(scope: string): string {
  const pseudo = `${scope}::before, ${scope}::after`;
  return `
${scope} { position: relative; min-height: 70vh; }
${pseudo} {
  content: ""; position: absolute; left: 32px; right: 32px; visibility: visible; pointer-events: none;
  animation: kdl-skeleton-shimmer 1.8s ease-in-out infinite;
}
/* Only the highlight moves: its position is a registered (animatable) property used by the first layer.
   The keyframes name must not be reused for another definition: a style and a script of different versions
   meet on one page, and the last @keyframes of a name wins for both. */
@property --kdl-sweep { syntax: '<percentage>'; inherits: false; initial-value: 100%; }
@keyframes kdl-skeleton-shimmer { from { --kdl-sweep: 100%; } to { --kdl-sweep: 0%; } }
@media (max-width: 600px) { ${pseudo} { left: 12px; right: 12px; } }
@media (prefers-reduced-motion: reduce) { ${pseudo} { animation: none; } }
`;
}

/** The layout of one page type */
export function skeletonPageCss(scope: string, page: SkeletonPage): string {
  const { before, beforeHeight, after, afterTop } = PAGES[page];
  return `
${scope}::before { top: 24px; height: ${beforeHeight}px; ${backgrounds(before)} }
${scope}::after { top: ${24 + afterTop}px; bottom: 16px; ${backgrounds(after)} }
`;
}
