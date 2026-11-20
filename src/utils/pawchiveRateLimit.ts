// Pawchive asks clients to start at most one file request per second and to keep no more
// than five downloads active. This queue covers one userscript instance (one browser tab).
const MIN_INTERVAL_MS = 1050;
const MAX_ACTIVE = 5;

interface Waiter {
  signal?: AbortSignal;
  resolve: (release: () => void) => void;
  reject: (error: DOMException) => void;
  onAbort: () => void;
}

/** FIFO request-start limiter; aborting a waiting entry removes it immediately. */
export class RequestStartLimiter {
  private readonly queue: Waiter[] = [];
  private active = 0;
  private lastStart = -Infinity;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly intervalMs: number, private readonly maxActive: number) {}

  acquire(signal?: AbortSignal): Promise<() => void> {
    if (signal?.aborted) return Promise.reject(new DOMException('Download cancelled', 'AbortError'));
    return new Promise((resolve, reject) => {
      const entry: Waiter = {
        signal, resolve, reject,
        onAbort: () => {
          const index = this.queue.indexOf(entry);
          if (index < 0) return;
          this.queue.splice(index, 1);
          signal?.removeEventListener('abort', entry.onAbort);
          reject(new DOMException('Download cancelled', 'AbortError'));
          this.drain();
        },
      };
      this.queue.push(entry);
      signal?.addEventListener('abort', entry.onAbort, { once: true });
      this.drain();
    });
  }

  private drain(): void {
    clearTimeout(this.timer);
    this.timer = undefined;
    if (!this.queue.length || this.active >= this.maxActive) return;
    const now = performance.now();
    const wait = this.intervalMs - (now - this.lastStart);
    if (wait > 0) {
      this.timer = setTimeout(() => this.drain(), wait);
      return;
    }
    const entry = this.queue.shift()!;
    entry.signal?.removeEventListener('abort', entry.onAbort);
    this.active++;
    this.lastStart = now;
    let released = false;
    entry.resolve(() => {
      if (released) return;
      released = true;
      this.active--;
      this.drain();
    });
    this.drain();
  }
}

const limiter = new RequestStartLimiter(MIN_INTERVAL_MS, MAX_ACTIVE);

export function isPawchiveFile(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.href);
    return /(^|\.)pawchive\.(pw|st)$/i.test(parsed.hostname) && parsed.pathname.startsWith('/data/');
  } catch {
    return false;
  }
}

/** The slot is released even on failure or cancellation, before a fallback starts. */
export async function withPawchiveFileLimit<T>(url: string, signal: AbortSignal | undefined, work: () => Promise<T>): Promise<T> {
  if (!isPawchiveFile(url)) return work();
  const release = await limiter.acquire(signal);
  try {
    if (signal?.aborted) throw new DOMException('Download cancelled', 'AbortError');
    return await work();
  } finally {
    release();
  }
}
