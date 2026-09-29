import { state } from '../state/store';
import { resolveLanguage } from './translators';
import { cacheKey, clearCache, getCached, getRender, putCached, putRender, renderKey } from '../vendor/lens/cache';
import { acquireSource, encodeForUpload, fingerprint } from '../vendor/lens/image';
import type { Source } from '../vendor/lens/image';
import { callLens } from '../vendor/lens/lens/client';
import { renderToBlob, renderToCanvas } from '../vendor/lens/render/canvas';
import { clearStored, getStored, putStored, storedStats } from '../vendor/lens/store';
import type { LensResult, Settings } from '../vendor/lens/types';

// Translates the text inside an image through Google Lens. The core under
// src/vendor/lens is a copy of https://github.com/bropines/chrome-lens-userscript
// (MIT); this module is the only place that knows about our settings.

// Upstream's defaults. Only the fields our settings expose are overridden below;
// the rest are Chromium's own numbers and are better left alone.
const LENS_DEFAULTS: Settings = {
  targetLang: 'ru',
  sourceLang: '',
  ocrLang: '',
  region: 'US',
  timeZone: 'America/New_York',
  // The key Chromium ships with.
  apiKey: 'AIzaSyDr2UxVnv_U85AbhhY8XSHSIavUW0DC-sY',
  timeoutMs: 60000,
  minImageSize: 50,
  // Chromium's image budget: components/lens/lens_features.cc
  maxArea: 1500000,
  maxSide: 1600,
  jpegQuality: 0.4,
  showButton: true,
  buttonMode: 'auto',
  hotkey: 'none',
  fontFamily: '',
  drawBackground: true,
  verticalText: 'auto',
  renderMode: 'canvas',
  enabled: true,
  minReadablePx: 12,
  supersample: 2,
  cacheBytes: 32 * 1024 * 1024,
  persistCache: true,
  mangaMode: false,
  mangaBoxGrowth: 1.45,
  outlineScale: 1,
  eraseMode: 'patch',
  hullPadding: 0.45,
  reflowHorizontal: false,
  fitToBox: true,
  lineSpacing: 1.25,
  textAlign: 'auto'
};

const finite = (value: unknown, fallback: number): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export function lensSettings(): Settings {
  const settings = state.settings;
  return {
    ...LENS_DEFAULTS,
    // The same target language the text translators use
    targetLang: resolveLanguage(settings.translationLanguage).code,
    mangaMode: settings.imageTranslateManga,
    eraseMode: settings.imageTranslateErase,
    minReadablePx: Number(settings.imageTranslateMinPx) || 0,
    supersample: Number(settings.imageTranslateSharpness) || 1,
    reflowHorizontal: settings.imageTranslateReflow,
    fitToBox: settings.imageTranslateFitToBox,
    lineSpacing: Number(settings.imageTranslateLineSpacing) || LENS_DEFAULTS.lineSpacing,
    persistCache: settings.imageTranslatePersist,
    drawBackground: settings.imageTranslateDrawBackground,
    hullPadding: finite(settings.imageTranslateHullPadding, LENS_DEFAULTS.hullPadding),
    outlineScale: finite(settings.imageTranslateOutline, LENS_DEFAULTS.outlineScale),
    textAlign: settings.imageTranslateAlign,
    verticalText: settings.imageTranslateVertical,
    mangaBoxGrowth: finite(settings.imageTranslateMangaGrowth, LENS_DEFAULTS.mangaBoxGrowth),
    fontFamily: settings.imageTranslateFont
  };
}

// A display setting is moving (a slider mid-drag): a live view redraws a quick draft
export const LENS_DISPLAY_PREVIEW = 'kdl:lens-display-preview';
// It settled and was saved: every translation on screen redraws for good. The render cache is keyed
// by every drawn setting, so both redraw from the answer already in hand without asking Lens again
export const LENS_DISPLAY_CHANGED = 'kdl:lens-display-changed';

export function notifyLensDisplayPreview(): void {
  document.dispatchEvent(new CustomEvent(LENS_DISPLAY_PREVIEW));
}

export function notifyLensDisplayChanged(): void {
  document.dispatchEvent(new CustomEvent(LENS_DISPLAY_CHANGED));
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load the image'));
    image.src = url;
  });
}

interface Pixels {
  source: Source;
  width: number;
  height: number;
  release(): void;
}

// Decoded pictures, by URL. Every redraw after a setting changes needs the pixels again, and
// decoding a full page each time was a large part of what a redraw cost. Two, because a manga page
// decoded is tens of megabytes: enough for the page on screen and the one just left.
const MAX_PICTURES = 2;
const pictures = new Map<string, Promise<Pixels>>();

function picture(url: string): Promise<Pixels> {
  const known = pictures.get(url);
  if (known) {
    pictures.delete(url);
    pictures.set(url, known);
    return known;
  }
  const loading = loadImage(url).then((image) => acquireSource({ element: image, kind: 'img', url, pointable: true }));
  loading.catch(() => pictures.delete(url));
  pictures.set(url, loading);
  while (pictures.size > MAX_PICTURES) {
    const oldest = pictures.keys().next();
    if (oldest.done) break;
    // Later rather than now: a render that started before the eviction may still be drawing from it
    void pictures.get(oldest.value)?.then((pixels) => setTimeout(() => pixels.release(), 30000), () => {});
    pictures.delete(oldest.value);
  }
  return loading;
}

/** Lens answered, but there is nothing to draw: no text, or text already in the target language. */
export class NothingToTranslate extends Error {}

// What Lens said about the picture at `url`: from memory, from an earlier visit (recognised by its
// pixels), or asked for now. The encode is the expensive half of a miss and comes last.
async function answer(url: string, settings: Settings, pixels: Pixels): Promise<LensResult> {
  const key = cacheKey(url, settings);
  let result: LensResult | null = getCached(key, settings);
  const hash = result ? '' : fingerprint(pixels.source, pixels.width, pixels.height);
  if (!result && hash) {
    result = await getStored(hash, settings);
    if (result) putCached(key, result, settings);
  }
  if (!result) {
    const upload = await encodeForUpload(pixels.source, settings);
    result = await callLens(upload, settings);
    putCached(key, result, settings);
    void putStored(hash, result, settings);
  }
  if (!result.blocks.length) {
    throw new NothingToTranslate(
      result.ocr.some((paragraph) => paragraph.lines.length > 0)
        ? 'Lens read the text but returned no translation (same language?)'
        : 'Lens found no text in this image'
    );
  }
  return result;
}

// Object URLs outlive the blob cache they came from, so they are handed out from
// here and the oldest ones are revoked rather than left to leak.
const MAX_LIVE_URLS = 8;
const liveUrls = new Map<string, string>();

function keepUrl(key: string, blob: Blob): string {
  const url = URL.createObjectURL(blob);
  liveUrls.set(key, url);
  while (liveUrls.size > MAX_LIVE_URLS) {
    const oldest = liveUrls.keys().next();
    if (oldest.done) break;
    URL.revokeObjectURL(liveUrls.get(oldest.value)!);
    liveUrls.delete(oldest.value);
  }
  return url;
}

/**
 * How wide the picture is shown when the viewer fits it to the screen, which is where it is read.
 *
 * The readable-size floor is set in on-screen pixels, so it has to know this. The viewport's width
 * stood in for it and was far too generous for a tall page: a manga page fitted to the screen's
 * height is shown at a fraction of that width, so the floor came out several times too small and the
 * minimum size seemed to do nothing. The gallery uses the same width, so both places show one
 * rendering; quantised, so a resize does not split the cache.
 */
function displayedWidthOf(width: number, height: number): number {
  const viewWidth = window.innerWidth || 1280;
  const viewHeight = window.innerHeight || 800;
  const fitted = width * Math.min(1, viewWidth / width, viewHeight / height);
  return Math.max(100, Math.round(fitted / 50) * 50);
}

/** The image at `url` with its text translated, as an object URL, for an <img>. */
export async function translateImage(url: string): Promise<string> {
  const settings = lensSettings();
  // The picture's size decides how it is shown, and so the rendering; decoded once and kept
  const pixels = await picture(url);
  const displayedWidth = displayedWidthOf(pixels.width, pixels.height);
  const rendered = renderKey(cacheKey(url, settings), settings, displayedWidth);

  const live = liveUrls.get(rendered);
  if (live) return live;
  // A finished rendering short-circuits the rest: no round trip, no drawing
  const done = getRender(rendered, settings);
  if (done) return keepUrl(rendered, done);

  const result = await answer(url, settings, pixels);
  const blob = await renderToBlob(pixels.source, pixels.width, pixels.height, result.blocks, settings, displayedWidth);
  putRender(rendered, blob, settings);
  return keepUrl(rendered, blob);
}

/**
 * The same translation as a canvas at a multiple of the image's size, for a viewer that draws it
 * directly: no PNG to encode or decode, which is what makes redrawing while a slider moves possible.
 * A draft skips the supersampling, a quarter of the pixels, for the frames in between.
 */
export async function renderTranslation(url: string, draft = false): Promise<HTMLCanvasElement> {
  const settings = lensSettings();
  if (draft) settings.supersample = 1;
  const pixels = await picture(url);
  const result = await answer(url, settings, pixels);
  return renderToCanvas(pixels.source, pixels.width, pixels.height, result.blocks, settings, displayedWidthOf(pixels.width, pixels.height));
}

/** Forgets every Lens answer, in memory and across reloads. Returns what the persistent store held. */
export async function clearImageTranslationCache(): Promise<{ entries: number; bytes: number }> {
  const stored = await storedStats();
  clearCache();
  await clearStored();
  return stored;
}
