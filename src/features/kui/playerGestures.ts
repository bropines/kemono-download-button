// Clicks and taps on the post video, the same on a computer and a phone:
//
//   zone            single click / tap                  double click / tap
//   middle third    play / pause (an icon flashes)      fullscreen
//   outer thirds    show / hide the controls            seek 10 s back / forward (animated)
//
// A single action waits DOUBLE_MS to know it is not the first half of a double one. Right after a seek, more taps
// on the same side keep seeking (+10, +20, +30... like a phone video app) without needing pairs.
// Plyr's own click-to-play and double-click fullscreen are switched off (clickToPlay: false, and its dblclick
// is stopped here), so nothing fires twice. Controls (buttons, bars, menus) keep their normal behaviour.

import { el } from '../../utils/dom';
import { icon } from '../../config/icons';
import { t } from '../../i18n';

const DOUBLE_MS = 230;
// After a seek, a tap on the same side within this keeps seeking
const STREAK_MS = 650;
const MAX_TAP_MS = 400;
const MAX_MOVEMENT_PX = 24;
const SEEK_SECONDS = 10;
const SIDE_SHARE = 0.35;

export type Side = -1 | 0 | 1;

/** What the gestures need from the player (Plyr), kept small for tests */
export interface GesturePlayer {
  media?: HTMLVideoElement;
  togglePlay(): unknown;
  toggleControls(toggle?: boolean): unknown;
  fullscreen: { toggle(): unknown };
  elements?: { container?: HTMLElement | null };
}

export function sideOf(rect: { left: number; right: number; width: number }, x: number): Side {
  if (x < rect.left + rect.width * SIDE_SHARE) return -1;
  if (x > rect.right - rect.width * SIDE_SHARE) return 1;
  return 0;
}

function seek(media: HTMLVideoElement, seconds: number): void {
  const current = media.currentTime;
  if (!Number.isFinite(current)) return;
  let start = 0;
  let end = media.duration;
  // A live stream can have an infinite duration, but a finite seekable window
  if (!Number.isFinite(end)) {
    const ranges = media.seekable;
    if (!ranges?.length) return;
    start = ranges.start(ranges.length - 1);
    end = ranges.end(ranges.length - 1);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return;
  try { media.currentTime = Math.max(start, Math.min(end, current + seconds)); }
  catch { /* The browser may reject seeking before metadata is ready */ }
}

// ---- Feedback drawn over the video ----

function overlay(container: HTMLElement | null | undefined, key: string, className: string): HTMLElement | null {
  if (!container) return null;
  let node = container.querySelector<HTMLElement>(`:scope > [data-kui-overlay="${key}"]`);
  if (!node) {
    node = el('div', { className });
    node.dataset.kuiOverlay = key;
    node.setAttribute('aria-hidden', 'true');
    container.appendChild(node);
  }
  return node;
}

/** A semicircle on the side with running chevrons and the total seconds of this streak */
function showSeek(container: HTMLElement | null | undefined, side: -1 | 1, total: number): void {
  const name = side < 0 ? 'back' : 'forward';
  const node = overlay(container, `seek-${name}`, `kui-seek-ripple kui-seek-ripple--${name}`);
  if (!node) return;
  node.replaceChildren(
    el('div', { className: 'kui-seek-ripple__arrows' }, [0, 1, 2].map(() => el('span', { className: 'kui-seek-ripple__arrow' }))),
    el('div', { className: 'kui-seek-ripple__label', textContent: t('kui.video.seekSeconds', { n: (side < 0 ? '−' : '+') + total }) }),
  );
  // Restart the animation on every tap of the streak
  node.classList.remove('is-on');
  void node.offsetWidth;
  node.classList.add('is-on');
  clearTimeout(Number(node.dataset.timer));
  node.dataset.timer = String(setTimeout(() => node.classList.remove('is-on'), STREAK_MS + 150));
}

/** The play or pause icon growing and fading in the middle, as the state it switched to */
function flashPlayState(container: HTMLElement | null | undefined, playing: boolean): void {
  const node = overlay(container, 'play', 'kui-play-flash');
  if (!node) return;
  node.replaceChildren(icon(playing ? 'play' : 'pause', 'kui-play-flash__icon'));
  node.classList.remove('is-on');
  void node.offsetWidth;
  node.classList.add('is-on');
}

// ---- Gestures ----

/** Bind to the stable player host: Plyr replaces its video on source changes. Returns the cleanup. */
export function installPlayerGestures(host: HTMLElement, getPlayer: () => GesturePlayer | null): () => void {
  const interactive = 'button, a, input, select, textarea, [role="button"], [role="slider"], .plyr__controls, .plyr__menu, .kui-video-playlist-toggle';
  const surface = (target: EventTarget | null): HTMLElement | null => {
    const element = target as Element | null;
    if (!element?.closest || element.closest(interactive)) return null;
    const wrapper = element.closest<HTMLElement>('.plyr__video-wrapper, .plyr__poster');
    const box = wrapper?.closest<HTMLElement>('.plyr') ?? null;
    return box && host.contains(box) ? box : null;
  };

  let press: { id: number; x: number; y: number; time: number; valid: boolean } | null = null;
  let pending: { side: Side; time: number; x: number; y: number; timer: ReturnType<typeof setTimeout> } | null = null;
  let streak: { side: -1 | 1; until: number; total: number } | null = null;

  const cancelPending = (): void => {
    if (pending) clearTimeout(pending.timer);
    pending = null;
  };

  const single = (side: Side): void => {
    const player = getPlayer();
    if (!player) return;
    const container = player.elements?.container;
    if (side === 0) {
      const wasPaused = !!player.media?.paused;
      player.togglePlay();
      flashPlayState(container, wasPaused);
    } else {
      const hidden = !!container?.classList.contains('plyr--hide-controls');
      player.toggleControls(hidden);
    }
  };

  const seekSide = (side: -1 | 1, time: number): void => {
    const player = getPlayer();
    const media = player?.media;
    if (!player || !media) return;
    streak = streak && streak.side === side && time <= streak.until
      ? { side, until: time + STREAK_MS, total: streak.total + SEEK_SECONDS }
      : { side, until: time + STREAK_MS, total: SEEK_SECONDS };
    seek(media, side * SEEK_SECONDS);
    showSeek(player.elements?.container, side, streak.total);
  };

  const double = (side: Side, time: number): void => {
    const player = getPlayer();
    if (!player) return;
    if (side === 0) player.fullscreen.toggle();
    else seekSide(side, time);
  };

  const tap = (box: HTMLElement, x: number, y: number, time: number): void => {
    const side = sideOf(box.getBoundingClientRect(), x);
    // In a seek streak a tap on that side seeks at once
    if (side !== 0 && streak && streak.side === side && time <= streak.until) {
      cancelPending();
      seekSide(side, time);
      return;
    }
    if (pending && pending.side === side && time - pending.time <= DOUBLE_MS + 60 &&
        Math.hypot(x - pending.x, y - pending.y) <= MAX_MOVEMENT_PX * 3) {
      cancelPending();
      double(side, time);
      return;
    }
    cancelPending();
    streak = null;
    const timer = setTimeout(() => {
      pending = null;
      single(side);
    }, DOUBLE_MS);
    pending = { side, time, x, y, timer };
  };

  const down = (event: PointerEvent): void => {
    if (event.button > 0 || !event.isPrimary) { press = null; return; }
    press = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp, valid: !!surface(event.target) };
  };
  const move = (event: PointerEvent): void => {
    if (press && press.id === event.pointerId && Math.hypot(event.clientX - press.x, event.clientY - press.y) > MAX_MOVEMENT_PX) press.valid = false;
  };
  const up = (event: PointerEvent): void => {
    const p = press;
    press = null;
    if (!p || p.id !== event.pointerId || !p.valid || event.type !== 'pointerup') return;
    if (event.timeStamp - p.time > MAX_TAP_MS || Math.hypot(event.clientX - p.x, event.clientY - p.y) > MAX_MOVEMENT_PX) return;
    const box = surface(event.target);
    if (!box) return;
    tap(box, event.clientX, event.clientY, event.timeStamp);
  };
  // Plyr toggles fullscreen on its own dblclick and plays on its own click: both are ours now. Capture runs first.
  const swallow = (event: MouseEvent): void => {
    if (!surface(event.target)) return;
    event.stopPropagation();
    if (event.type === 'dblclick') event.preventDefault();
  };

  host.addEventListener('pointerdown', down, { passive: true });
  host.addEventListener('pointermove', move, { passive: true });
  host.addEventListener('pointerup', up, { passive: true });
  host.addEventListener('pointercancel', up, { passive: true });
  host.addEventListener('dblclick', swallow, true);
  host.addEventListener('click', swallow, true);
  return () => {
    host.removeEventListener('pointerdown', down);
    host.removeEventListener('pointermove', move);
    host.removeEventListener('pointerup', up);
    host.removeEventListener('pointercancel', up);
    host.removeEventListener('dblclick', swallow, true);
    host.removeEventListener('click', swallow, true);
    cancelPending();
    press = null;
    streak = null;
  };
}
