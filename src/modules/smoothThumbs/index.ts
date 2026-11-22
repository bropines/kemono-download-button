// Smooth thumbnails: the site serves ~800px thumbnails that cards show at ~200px. Browsers shrink them with a
// cheap filter, so line art (manga, sketches) turns jagged. This module draws each card thumbnail into a canvas
// at the card's real pixel size with createImageBitmap's high-quality resampling, laid over the <img>.
//
// The <img> stays in place (other code and the site read it) and is only made transparent once its canvas has
// been drawn, so a browser without resize options, or any failure, leaves the original picture visible.
// A cross-origin thumbnail taints the canvas, which only matters for reading pixels back: nothing does.

import type { KdlModule } from '../../core/types';

const IMG = '.post-card__image';
const CANVAS = 'kdl-smooth-thumb';
const READY = 'data-kdl-smooth';
// Below this shrink factor the browser's own filter already looks fine
const MIN_RATIO = 1.5;

interface Entry {
  canvas: HTMLCanvasElement;
  box: Element;
  src: string;
  key: string;
  /** The thumbnail box in CSS pixels, as the ResizeObserver last reported it (0: not reported yet) */
  width: number;
  height: number;
}

const entries = new Map<HTMLImageElement, Entry>();
const boxes = new Map<Element, HTMLImageElement>();
let resizeObserver: ResizeObserver | null = null;
let mutationObserver: MutationObserver | null = null;
let scheduled = 0;

// The box size comes from the ResizeObserver, never from a measurement here: asking for a rectangle after each
// frame's worth of drawn canvases forced a style and layout pass per frame (~1 s in total on a 50-card page)
async function draw(img: HTMLImageElement, entry: Entry): Promise<void> {
  if (!img.isConnected) return;
  const dpr = window.devicePixelRatio || 1;
  const width = Math.round(entry.width * dpr);
  const height = Math.round(entry.height * dpr);
  if (!width || !height || !img.naturalWidth) return;
  const key = `${img.currentSrc || img.src}|${width}x${height}`;
  if (entry.key === key) return;
  entry.key = key;

  const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
  if (1 / scale < MIN_RATIO) {
    img.removeAttribute(READY);
    return;
  }
  const drawWidth = Math.max(1, Math.round(img.naturalWidth * scale));
  const drawHeight = Math.max(1, Math.round(img.naturalHeight * scale));
  try {
    const bitmap = await createImageBitmap(img, { resizeWidth: drawWidth, resizeHeight: drawHeight, resizeQuality: 'high' });
    if (entry.key !== key) return bitmap.close();
    const canvas = entry.canvas;
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')?.drawImage(bitmap, Math.round((width - drawWidth) / 2), Math.round((height - drawHeight) / 2));
    bitmap.close();
    img.setAttribute(READY, '');
  } catch {
    // No resize options here (or the image failed): the browser's own rendering stays
    img.removeAttribute(READY);
  }
}

// rAF batches a frame's worth of work; it never fires in a background tab, the timer does
function nextFrame(fn: () => void): void {
  let done = false;
  const run = (): void => {
    if (done) return;
    done = true;
    fn();
  };
  requestAnimationFrame(run);
  setTimeout(run, 100);
}

// Thumbnails waiting to be drawn. createImageBitmap decodes and resamples partly on the main thread (~3 ms a
// thumbnail): a page of 50 cards drawn in one go froze it for 150-200 ms, right as the page came in. A few per
// frame instead; this is a refinement of pictures already on screen.
const FRAME_BUDGET_MS = 5;
const jobs = new Map<HTMLImageElement, Entry>();
let pumping = false;

function pump(): void {
  pumping = false;
  const started = performance.now();
  for (const [img, entry] of jobs) {
    jobs.delete(img);
    void draw(img, entry);
    if (performance.now() - started >= FRAME_BUDGET_MS) break;
  }
  if (jobs.size) startPump();
}

function startPump(): void {
  if (pumping) return;
  pumping = true;
  nextFrame(pump);
}

/** Draws once both the picture and the size of its box are known (whichever comes last asks again) */
function queueDraw(img: HTMLImageElement, entry: Entry): void {
  if (!entry.width || !img.complete || !img.naturalWidth) return;
  jobs.set(img, entry);
  startPump();
}

function forget(img: HTMLImageElement, entry: Entry): void {
  entry.canvas.remove();
  resizeObserver?.unobserve(entry.box);
  boxes.delete(entry.box);
  entries.delete(img);
  jobs.delete(img);
}

/** Adds the canvas and draws when the image is ready */
function attach(img: HTMLImageElement): void {
  const box = img.parentElement;
  if (!box) return;
  let entry = entries.get(img);
  const src = img.currentSrc || img.src;
  if (entry && entry.src === src && entry.canvas.isConnected) return;
  if (!entry) {
    const canvas = document.createElement('canvas');
    canvas.className = CANVAS;
    canvas.setAttribute('aria-hidden', 'true');
    entry = { canvas, box, src, key: '', width: 0, height: 0 };
    entries.set(img, entry);
    boxes.set(box, img);
    // Reports the box's size right after the next layout
    resizeObserver?.observe(box);
  }
  entry.src = src;
  entry.key = '';
  if (!entry.canvas.isConnected) img.after(entry.canvas);
  const current = entry;
  if (img.complete && img.naturalWidth) queueDraw(img, current);
  else img.addEventListener('load', () => queueDraw(img, current), { once: true });
}

function scan(): void {
  scheduled = 0;
  // Forget cards that left the page (htmx swaps, live search)
  entries.forEach((entry, img) => {
    if (!img.isConnected) forget(img, entry);
  });
  document.querySelectorAll<HTMLImageElement>(IMG).forEach(attach);
}

function schedule(): void {
  if (!scheduled) scheduled = window.setTimeout(scan, 50);
}

function undo(): void {
  entries.forEach((entry, img) => {
    img.removeAttribute(READY);
    forget(img, entry);
  });
}

function onResize(records: ResizeObserverEntry[]): void {
  records.forEach((record) => {
    const img = boxes.get(record.target);
    const entry = img && entries.get(img);
    if (!img || !entry) return;
    // The border box, as the canvas covers it
    const size = record.borderBoxSize?.[0];
    entry.width = size ? size.inlineSize : record.contentRect.width;
    entry.height = size ? size.blockSize : record.contentRect.height;
    queueDraw(img, entry);
  });
}

export const smoothThumbsModule: KdlModule = {
  id: 'ui.smoothThumbs',
  name: 'Smooth thumbnails',
  description:
    'Card thumbnails are shrunk with high-quality resampling, so line art and text in previews stay smooth instead of jagged.',
  group: 'Interface',
  pages: 'any',
  defaultEnabled: true,
  styles: () => `
canvas.${CANVAS} { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; opacity: 0; transition: transform 0.3s ease, opacity 0.2s ease; }
/* Shown through the attribute on the <img>, not the canvas's own hidden: the site styles have :has() rules that name
   [hidden], so flipping it anywhere restyled the whole page (~20 ms) for every thumbnail drawn */
/* A crossfade, not a swap in one frame: the canvas fades in over the picture, which hides only once it is covered */
img${IMG}[${READY}] { opacity: 0; transition: opacity 0s linear 0.2s; }
img${IMG}[${READY}] + canvas.${CANVAS} { opacity: 1; }
.post-card:hover canvas.${CANVAS} { transform: scale(1.03); }
`,
  mount(ctx) {
    if (typeof createImageBitmap !== 'function' || typeof ResizeObserver !== 'function') return;
    resizeObserver = new ResizeObserver(onResize);
    mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    // A refinement of pictures already on screen: never part of the first frame
    schedule();
    ctx.onCleanup(() => {
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      resizeObserver = mutationObserver = null;
      clearTimeout(scheduled);
      jobs.clear();
      scheduled = 0;
      undo();
    });
  },
  update() {
    schedule();
  },
  // htmx snapshots the page for back/forward: keep the site's own markup in it
  beforeSnapshot() {
    undo();
    schedule();
  },
};
