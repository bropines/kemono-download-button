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
  src: string;
  key: string;
}

const entries = new Map<HTMLImageElement, Entry>();
let resizeObserver: ResizeObserver | null = null;
let mutationObserver: MutationObserver | null = null;
let scheduled = 0;

async function draw(img: HTMLImageElement, entry: Entry): Promise<void> {
  const box = img.parentElement;
  if (!box || !img.isConnected) return;
  const rect = box.getBoundingClientRect();
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
  try {
    const bitmap = await createImageBitmap(img, { resizeWidth: drawWidth, resizeHeight: drawHeight, resizeQuality: 'high' });
    if (entry.key !== key) return bitmap.close();
    const canvas = entry.canvas;
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')?.drawImage(bitmap, Math.round((width - drawWidth) / 2), Math.round((height - drawHeight) / 2));
    bitmap.close();
    canvas.hidden = false;
    img.setAttribute(READY, '');
  } catch {
    // No resize options here (or the image failed): the browser's own rendering stays
    entry.canvas.hidden = true;
    img.removeAttribute(READY);
  }
}

function attach(img: HTMLImageElement): void {
  let entry = entries.get(img);
  const src = img.currentSrc || img.src;
  if (entry && entry.src === src && entry.canvas.isConnected) return;
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
  if (img.complete && img.naturalWidth) void draw(img, current);
  else img.addEventListener('load', () => void draw(img, current), { once: true });
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
  document.querySelectorAll<HTMLImageElement>(IMG).forEach(attach);
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
        if (img && entry) void draw(img, entry);
      });
    });
    mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    scan();
    ctx.onCleanup(() => {
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      resizeObserver = mutationObserver = null;
      clearTimeout(scheduled);
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
