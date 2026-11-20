// Touch-only double tap on Plyr's video surface. Controls keep their normal pointer/click behavior.
const DOUBLE_TAP_MS = 350;
const MAX_TAP_MS = 300;
const MAX_MOVEMENT_PX = 24;
const SEEK_SECONDS = 10;

interface Tap { x: number; y: number; time: number; side: -1 | 1; media: HTMLVideoElement }
interface Press { x: number; y: number; time: number; valid: boolean }

function seek(media: HTMLVideoElement, side: -1 | 1): void {
  const current = media.currentTime;
  if (!Number.isFinite(current)) return;
  let start = 0;
  let end = media.duration;
  // A live stream can have an infinite duration, but a finite seekable window.
  if (!Number.isFinite(end)) {
    const ranges = media.seekable;
    if (!ranges?.length) return;
    start = ranges.start(ranges.length - 1);
    end = ranges.end(ranges.length - 1);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return;
  try { media.currentTime = Math.max(start, Math.min(end, current + side * SEEK_SECONDS)); }
  catch { /* The browser may reject seeking before metadata is ready. */ }
}

/** Bind to the stable player host: Plyr replaces its video on source changes. */
export function installDoubleTapSeek(host: HTMLElement, getMedia: () => HTMLVideoElement | undefined): () => void {
  const active = new Map<number, Press>();
  let last: Tap | null = null;
  const interactive = 'button, a, input, select, textarea, [role="button"], .plyr__controls, .plyr__menu';
  const surface = (target: EventTarget | null): HTMLElement | null => {
    const element = target as Element | null;
    if (!element?.closest || element.closest(interactive)) return null;
    const wrapper = element.closest<HTMLElement>('.plyr__video-wrapper');
    return wrapper && host.contains(wrapper) ? wrapper : null;
  };
  const down = (event: PointerEvent): void => {
    if (event.pointerType !== 'touch') return;
    const valid = !!surface(event.target) && active.size === 0;
    if (!valid) last = null;
    if (active.size) active.forEach((press) => { press.valid = false; });
    active.set(event.pointerId, { x: event.clientX, y: event.clientY, time: event.timeStamp, valid });
  };
  const move = (event: PointerEvent): void => {
    const press = active.get(event.pointerId);
    if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > MAX_MOVEMENT_PX) {
      press.valid = false;
      last = null;
    }
  };
  const end = (event: PointerEvent): void => {
    const press = active.get(event.pointerId);
    if (!press) return;
    active.delete(event.pointerId);
    const wrapper = surface(event.target);
    if (event.type !== 'pointerup' || active.size || !press.valid || !wrapper ||
        event.timeStamp - press.time > MAX_TAP_MS ||
        Math.hypot(event.clientX - press.x, event.clientY - press.y) > MAX_MOVEMENT_PX) {
      last = null;
      return;
    }
    const rect = wrapper.getBoundingClientRect();
    const media = getMedia();
    if (!media || rect.width <= 0 || event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) { last = null; return; }
    const side: -1 | 1 = event.clientX < rect.left + rect.width / 2 ? -1 : 1;
    if (last && last.media === media && last.side === side && event.timeStamp - last.time <= DOUBLE_TAP_MS &&
        event.timeStamp >= last.time && Math.hypot(event.clientX - last.x, event.clientY - last.y) <= MAX_MOVEMENT_PX * 2) {
      last = null;
      seek(media, side);
    } else {
      last = { x: event.clientX, y: event.clientY, time: event.timeStamp, side, media };
    }
  };
  host.addEventListener('pointerdown', down, { passive: true });
  host.addEventListener('pointermove', move, { passive: true });
  host.addEventListener('pointerup', end, { passive: true });
  host.addEventListener('pointercancel', end, { passive: true });
  return () => {
    host.removeEventListener('pointerdown', down);
    host.removeEventListener('pointermove', move);
    host.removeEventListener('pointerup', end);
    host.removeEventListener('pointercancel', end);
    active.clear();
    last = null;
  };
}
