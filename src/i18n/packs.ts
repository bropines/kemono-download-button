// Downloads translation packs from the repo, verifies them and caches them in storage.
//
// locales/index.json (+ .sig) lists every pack with its version and SHA-256. A pack is used only when
// the index signature verifies, the pack's digest matches the index and the pack's own signature
// verifies. Anything else is rejected and the cached (or bundled) pack stays in use.
// Checked at most once a day, or on demand from the settings.
import { readStored, writeStored } from '../state/gmStorage';
import { gmXmlhttpRequestWithRetries } from '../utils/http';
import { debugLog } from '../utils/helpers';
import { INDEX_KEY, PACK_KEY_PREFIX, localPack, readCachedPack, reloadLanguage, resolveLanguage, type LocaleIndex, type LocalePack } from './index';
import { sha256Hex, utf8, verifySignature } from './verify';

const DEFAULT_BASE_URL = 'https://raw.githubusercontent.com/bropines/kemono-download-button/main/locales/';
/** Debugging aid: point the updater at another folder (must end with a slash). */
const BASE_URL_KEY = 'i18n.baseUrl';
const STATUS_KEY = 'i18n.status';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15000;

export interface UpdateStatus {
  /** Last attempt, ms since epoch */
  checkedAt: number;
  ok: boolean;
  /** Pack language and version the attempt ended with */
  code?: string;
  version?: number;
  /** 'updated' | 'current' | 'english' | 'missing' | 'rejected' | 'failed' */
  result: string;
  message?: string;
}

const baseUrl = (): string => readStored<string>(BASE_URL_KEY, '') || DEFAULT_BASE_URL;

export function getUpdateStatus(): UpdateStatus | null {
  return readStored<UpdateStatus | null>(STATUS_KEY, null);
}

/** Where the active pack came from: 'downloaded' (verified), 'bundled', or null for English. */
export function packSource(code: string): { source: 'downloaded' | 'bundled'; pack: LocalePack } | null {
  const pack = localPack(code);
  if (!pack) return null;
  const cached = readCachedPack(code);
  return { source: cached && cached.version === pack.version ? 'downloaded' : 'bundled', pack };
}

async function fetchText(name: string, stamp: number): Promise<string> {
  // AdGuard ignores responseType and calls onload only for 2xx; plain text works on every host
  const response = await gmXmlhttpRequestWithRetries({
    method: 'GET',
    url: `${baseUrl()}${name}?t=${stamp}`,
    timeout: REQUEST_TIMEOUT_MS,
    headers: { 'Cache-Control': 'no-cache' },
  });
  const text = response?.responseText;
  if (typeof text !== 'string' || !text) throw new Error(`Empty response for ${name}`);
  return text;
}

class Rejected extends Error {}

/** Fetches a file and its .sig, returning the text only when the signature verifies. */
async function fetchSigned(name: string, stamp: number): Promise<{ text: string; bytes: Uint8Array }> {
  const [text, signature] = await Promise.all([fetchText(name, stamp), fetchText(`${name}.sig`, stamp)]);
  const bytes = utf8(text);
  if (!(await verifySignature(bytes, signature))) throw new Rejected(`Bad signature on ${name}`);
  return { text, bytes };
}

let running: Promise<UpdateStatus> | null = null;

/**
 * Checks the repo for a newer pack of the current language. Skipped when the last check is less
 * than a day old, unless forced. Never throws; the result is also stored for the settings.
 */
export function updateTranslations(force = false): Promise<UpdateStatus> {
  const last = getUpdateStatus();
  const wanted = resolveLanguage();
  // A language without a local pack (picked from the index) is fetched right away
  const needed = wanted !== 'en' && !localPack(wanted);
  if (!force && !needed && last && Date.now() - last.checkedAt < CHECK_INTERVAL_MS) return Promise.resolve(last);
  running ??= run(wanted).finally(() => (running = null));
  return running;
}

async function run(code: string): Promise<UpdateStatus> {
  const stamp = Date.now();
  const finish = (status: Omit<UpdateStatus, 'checkedAt'>): UpdateStatus => {
    const full = { checkedAt: stamp, ...status };
    writeStored(STATUS_KEY, full);
    if (!full.ok) debugLog('[i18n] translation update:', full.result, full.message ?? '');
    return full;
  };
  try {
    const index = await fetchSigned('index.json', stamp);
    const parsed = JSON.parse(index.text) as LocaleIndex;
    if (!Array.isArray(parsed?.packs)) throw new Rejected('index.json has no packs list');
    writeStored(INDEX_KEY, index.text);

    if (code === 'en') return finish({ ok: true, result: 'english', code });
    const entry = parsed.packs.find((p) => p.code === code);
    const current = localPack(code);
    if (!entry) return finish({ ok: !!current, result: 'missing', code, version: current?.version });
    if (current && current.version >= entry.version) return finish({ ok: true, result: 'current', code, version: current.version });

    const file = await fetchSigned(`${code}.json`, stamp);
    const digest = await sha256Hex(file.bytes);
    if (digest !== entry.sha256.toLowerCase()) throw new Rejected(`${code}.json digest does not match the index`);
    const pack = JSON.parse(file.text) as LocalePack;
    if (pack?.code !== code || pack.version !== entry.version || typeof pack.ui !== 'object' || typeof pack.site !== 'object') {
      throw new Rejected(`${code}.json does not match its index entry`);
    }
    writeStored(PACK_KEY_PREFIX + code, file.text);
    reloadLanguage();
    return finish({ ok: true, result: 'updated', code, version: pack.version });
  } catch (error) {
    const rejected = error instanceof Rejected;
    const current = localPack(code);
    return finish({
      ok: false,
      result: rejected ? 'rejected' : 'failed',
      code,
      version: current?.version,
      message: (error as Error)?.message || String(error),
    });
  }
}

/** Startup: one check in the background, after the page has settled. */
export function scheduleTranslationUpdate(delayMs = 4000): void {
  window.setTimeout(() => void updateTranslations(), delayMs);
}
