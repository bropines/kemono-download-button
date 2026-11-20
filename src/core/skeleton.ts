// The loading skeleton shown in place of #main while it is hidden: the page cloak (htmx navigations) and the
// optional preload userstyle (first load; extras/kdl-preload.user.css is generated from this file by
// scripts/postbuild.mjs). shadcn-like: muted rounded shapes (a creator header with avatar, name and tab pills,
// then a grid of cards with a thumbnail and two text lines) and a soft highlight sweeping across them.
//
// The shapes are SVG masks over one muted background, so the colour follows the skin's --kdl-muted when the
// skin is loaded and falls back to zinc on a first load. The pseudo-elements stay visible inside the hidden
// #main. No imports: postbuild evaluates this module on its own.

const svg = (width: number, height: number, body: string): string =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'>${body}</svg>`)}")`;

const HEADER = svg(560, 132, [
  "<circle cx='28' cy='28' r='28'/>",
  "<rect x='72' y='8' width='220' height='20' rx='6'/>",
  "<rect x='72' y='38' width='140' height='12' rx='6' fill-opacity='.7'/>",
  "<rect x='0' y='92' width='84' height='32' rx='16' fill-opacity='.8'/>",
  "<rect x='96' y='92' width='110' height='32' rx='16' fill-opacity='.8'/>",
  "<rect x='218' y='92' width='96' height='32' rx='16' fill-opacity='.8'/>",
  "<rect x='326' y='92' width='120' height='32' rx='16' fill-opacity='.8'/>",
].join(''));

// One card per tile; the tile's spare 16px on the right and bottom is the gap
const CARD = svg(196, 292, [
  "<rect width='180' height='200' rx='12'/>",
  "<rect y='216' width='150' height='14' rx='7' fill-opacity='.8'/>",
  "<rect y='240' width='100' height='12' rx='6' fill-opacity='.6'/>",
].join(''));

/** Skeleton rules for the hidden content element matched by `scope` (e.g. `html[data-kdl-cloak] #main`) */
export function skeletonCss(scope: string): string {
  const pseudo = `${scope}::before, ${scope}::after`;
  return `
${scope} { position: relative; min-height: 70vh; }
${pseudo} {
  content: ""; position: absolute; left: 16px; right: 16px; visibility: visible; pointer-events: none;
  background-color: var(--kdl-muted, #27272a);
  background-image: linear-gradient(100deg, transparent 35%, rgba(255, 255, 255, 0.08) 50%, transparent 65%);
  background-size: 200% 100%; background-repeat: no-repeat;
  animation: kdl-skeleton-sweep 1.6s ease-in-out infinite;
}
${scope}::before {
  top: 16px; height: 132px;
  -webkit-mask: ${HEADER} no-repeat 0 0 / 560px 132px; mask: ${HEADER} no-repeat 0 0 / 560px 132px;
}
${scope}::after {
  top: 172px; bottom: 16px;
  -webkit-mask: ${CARD} 0 0 / 196px 292px; mask: ${CARD} 0 0 / 196px 292px;
  -webkit-mask-repeat: space repeat; mask-repeat: space repeat;
}
@keyframes kdl-skeleton-sweep { from { background-position: 100% 0; } to { background-position: 0 0; } }
@media (prefers-reduced-motion: reduce) { ${pseudo} { animation: none; background-image: none; } }
`;
}
