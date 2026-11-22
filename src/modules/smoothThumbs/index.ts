// Smooth thumbnails: the site serves ~800px thumbnails that cards show at ~200px. Browsers shrink them with a
// cheap filter, so line art (manga, sketches) turns jagged. This module draws each card thumbnail into a canvas
// at the card's real pixel size with createImageBitmap's high-quality resampling, laid over the <img>.
//
// The <img> stays in place (other code and the site read it) and is only made transparent once its canvas has
// been drawn, so a browser without resize options, or any failure, leaves the original picture visible.
// A cross-origin thumbnail taints the canvas, which only matters for reading pixels back: nothing does.

import type { KdlModule } from '../../core/types';
import { isCloaked } from '../../core/cloak';

const IMG = '.post-card__image';
const CANVAS = 'kdl-smooth-thumb';
const READY = 'data-kdl-smooth';
// Below this shrink factor the browser's own filter already looks fine
const MIN_RATIO = 1.5;

interface Entry {
  canvas: HTMLCanvasElement;
  src: string;
  key: string;
}

const entries = new Map<HTMLImageElement, Entry>();
let resizeObserver: ResizeObserver | null = null;
let mutationObserver: MutationObserver | null = null;
let scheduled = 0;

/** `rect` is the thumbnail box, measured by the caller when it measures many at once */
async function draw(img: HTMLImageElement, entry: Entry, rect?: DOMRect): Promise<void> {
  const box = img.parentElement;
  if (!box || !img.isConnected) return;
  rect ??= box.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.round(rect.width * dpr);
  const height = Math.round(rect.height * dpr);
  if (!width || !height || !img.naturalWidth) return;
  const key = `${img.currentSrc || img.src}|${width}x${height}`;
  if (entry.key === key) return;
  entry.key = key;

  const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
  if (1 / scale < MIN_RATIO) {
    img.removeAttribute(READY);
    entry.canvas.hidden = true;
    return;
  }
  const drawWidth = Math.max(1, Math.round(img.naturalWidth * scale));
  const drawHeight = Math.max(1, Math.round(img.naturalHeight * scale));
  inFlight++;
  try {
    const bitmap = await createImageBitmap(img, { resizeWidth: drawWidth, resizeHeight: drawHeight, resizeQuality: 'high' });
    if (entry.key !== key) return bitmap.close();
    const canvas = entry.canvas;
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')?.drawImage(bitmap, Math.round((width - drawWidth) / 2), Math.round((height - drawHeight) / 2));
    bitmap.close();
    shown.push([img, canvas]);
  } catch {
    // No resize options here (or the image failed): the browser's own rendering stays
    entry.canvas.hidden = true;
    img.removeAttribute(READY);
  } finally {
    inFlight--;
    showDrawn();
  }
}

// Canvases are swapped in together once the queue is drawn: showing one restyles the whole page (the skin's
// card rules), and one at a time that was a 30 ms style pass per slice, all through the page's entrance
let inFlight = 0;
const shown: [HTMLImageElement, HTMLCanvasElement][] = [];
function showDrawn(): void {
  if (inFlight || work.length) return;
  shown.splice(0).forEach(([img, canvas]) => {
    if (!img.isConnected) return;
    canvas.hidden = false;
    img.setAttribute(READY, '');
  });
}

// Images that loaded since the last frame: measured together, then drawn (one layout for the whole batch)
const queued = new Map<HTMLImageElement, Entry>();
let flushPending = false;

// Resampling a picture that is already decoded runs on the main thread, a few milliseconds each: fifty cards in
// one task froze the page for ~150 ms right as a new page of posts came in (the loading skeleton stood still,
// the page showed late). They are drawn a few at a time in idle time instead, in page order, and not at all
// while the page is still hidden: this is a refinement of pictures already on screen.
const SLICE_MS = 6;
const work: (() => void)[] = [];
let pumpPending = false;

function pump(): void {
  pumpPending = false;
  if (isCloaked()) {
    pumpPending = true;
    setTimeout(pump, 100);
    return;
  }
  const started = performance.now();
  while (work.length && performance.now() - started < SLICE_MS) work.shift()!();
  if (work.length) schedulePump();
}

function schedulePump(): void {
  if (pumpPending) return;
  pumpPending = true;
  if (typeof requestIdleCallback === 'function') requestIdleCallback(pump, { timeout: 400 });
  else setTimeout(pump, 30);
}

function drawBatch(batch: [HTMLImageElement, Entry][]): void {
  const rects = batch.map(([img]) => img.parentElement?.getBoundingClientRect());
  batch.forEach(([img, entry], index) => work.push(() => void draw(img, entry, rects[index])));
  if (work.length) schedulePump();
}

function flushQueued(): void {
  flushPending = false;
  const batch = [...queued];
  queued.clear();
  drawBatch(batch.filter(([img]) => img.isConnected));
}

function queueDraw(img: HTMLImageElement, entry: Entry): void {
  queued.set(img, entry);
  if (flushPending) return;
  flushPending = true;
  let done = false;
  const run = (): void => {
    if (done) return;
    done = true;
    flushQueued();
  };
  // rAF batches a frame's worth of loads; it never fires in a background tab, the timer does
  requestAnimationFrame(run);
  setTimeout(run, 100);
}

/** Adds the canvas; returns the entry when the image is ready to draw now (the caller measures and draws) */
function attach(img: HTMLImageElement): Entry | null {
  let entry = entries.get(img);
  const src = img.currentSrc || img.src;
  if (entry && entry.src === src && entry.canvas.isConnected) return null;
  if (!entry) {
    const canvas = document.createElement('canvas');
    canvas.className = CANVAS;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.hidden = true;
    entry = { canvas, src, key: '' };
    entries.set(img, entry);
    if (img.parentElement) resizeObserver?.observe(img.parentElement);
  }
  entry.src = src;
  entry.key = '';
  if (!entry.canvas.isConnected) img.after(entry.canvas);
  const current = entry;
  if (img.complete && img.naturalWidth) return current;
  img.addEventListener('load', () => queueDraw(img, current), { once: true });
  return null;
}

function scan(): void {
  scheduled = 0;
  // Forget cards that left the page (htmx swaps, live search)
  entries.forEach((entry, img) => {
    if (!img.isConnected) {
      entry.canvas.remove();
      entries.delete(img);
    }
  });
  // All DOM writes first, then every box measured in one layout pass: measuring right after each inserted
  // canvas forced a layout per card (~70 ms on a 50-card page)
  const ready: [HTMLImageElement, Entry][] = [];
  document.querySelectorAll<HTMLImageElement>(IMG).forEach((img) => {
    const entry = attach(img);
    if (entry) ready.push([img, entry]);
  });
  drawBatch(ready);
}

function schedule(): void {
  if (!scheduled) scheduled = window.setTimeout(scan, 50);
}

function undo(): void {
  entries.forEach((entry, img) => {
    entry.canvas.remove();
    img.removeAttribute(READY);
  });
  entries.clear();
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
canvas.${CANVAS} { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; transition: transform 0.3s ease; }
img${IMG}[${READY}] { opacity: 0; }
.post-card:hover canvas.${CANVAS} { transform: scale(1.03); }
`,
  mount(ctx) {
    if (typeof createImageBitmap !== 'function' || typeof ResizeObserver !== 'function') return;
    resizeObserver = new ResizeObserver((records) => {
      records.forEach((record) => {
        const img = (record.target as HTMLElement).querySelector<HTMLImageElement>(IMG);
        const entry = img && entries.get(img);
        // Also fires once for every newly observed box: through the same queue (a drawn size is skipped)
        if (img && entry) work.push(() => void draw(img, entry));
      });
      if (work.length) schedulePump();
    });
    mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    // A refinement of pictures already on screen: never part of the first frame
    schedule();
    ctx.onCleanup(() => {
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      resizeObserver = mutationObserver = null;
      clearTimeout(scheduled);
      queued.clear();
      work.length = 0;
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
