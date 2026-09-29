import { state } from '../state/store';
import { resolveLanguage } from './translators';
import { cacheKey, clearCache, getCached, getRender, putCached, putRender, renderKey } from '../vendor/lens/cache';
import { acquireSource, encodeForUpload, fingerprint } from '../vendor/lens/image';
import { callLens } from '../vendor/lens/lens/client';
import { renderToBlob } from '../vendor/lens/render/canvas';
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

// A display setting changed: whatever shows a translation redraws it. The render cache is keyed by
// every drawn setting, so this re-renders from the answer already in hand without asking Lens again
export const LENS_DISPLAY_CHANGED = 'kdl:lens-display-changed';

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
 * One display width for every place an image is shown.
 *
 * The readable-size floor is relative to how wide the image is displayed, so
 * rendering the gallery preview at its own width and the lightbox at the
 * viewport's gave one image two renderings with two different text sizes. The
 * viewport is where the image is actually read; quantising it keeps a resize
 * from splitting the cache, and keeps both places on one rendering.
 */
function referenceWidth(): number {
  const width = Math.max(320, Math.min(window.innerWidth || 1280, 2560));
  return Math.round(width / 200) * 200;
}

/** The image at `url` with its text translated, as an object URL. */
export async function translateImage(url: string): Promise<string> {
  const settings = lensSettings();
  const displayedWidth = referenceWidth();
  const key = cacheKey(url, settings);
  const rendered = renderKey(key, settings, displayedWidth);

  const live = liveUrls.get(rendered);
  if (live) return live;
  // A finished rendering short-circuits everything: no pixels, no round trip
  const done = getRender(rendered, settings);
  if (done) return keepUrl(rendered, done);

  const image = await loadImage(url);
  const prepared = await acquireSource({ element: image, kind: 'img', url, pointable: true });
  try {
    let result: LensResult | null = getCached(key, settings);
    // Recognised by its pixels, so a picture answered on an earlier visit costs no upload.
    // Asked before the encode, which is the expensive half of a miss
    const hash = result ? '' : fingerprint(prepared.source, prepared.width, prepared.height);
    if (!result && hash) {
      result = await getStored(hash, settings);
      if (result) putCached(key, result, settings);
    }
    if (!result) {
      const upload = await encodeForUpload(prepared.source, settings);
      result = await callLens(upload, settings);
      putCached(key, result, settings);
      void putStored(hash, result, settings);
    }

    if (!result.blocks.length) {
      throw new Error(
        result.ocr.some((paragraph) => paragraph.lines.length > 0)
          ? 'Lens read the text but returned no translation (same language?)'
          : 'Lens found no text in this image'
      );
    }

    const blob = await renderToBlob(
      prepared.source,
      prepared.width,
      prepared.height,
      result.blocks,
      settings,
      displayedWidth
    );
    putRender(rendered, blob, settings);
    return keepUrl(rendered, blob);
  } finally {
    prepared.release();
  }
}

/** Forgets every Lens answer, in memory and across reloads. Returns what the persistent store held. */
export async function clearImageTranslationCache(): Promise<{ entries: number; bytes: number }> {
  const stored = await storedStats();
  clearCache();
  await clearStored();
  return stored;
}
