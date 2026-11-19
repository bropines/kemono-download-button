// The community creator-links index (https://github.com/bropines/creator-links): fetched from GitHub raw at
// most once a day, cached in storage, and consulted offline afterwards. Every failure is silent: the module
// then simply knows no links. Entries are re-validated here, so a bad index can only produce missing chips.
import { readStored, writeStored } from '../../state/gmStorage';
import { gmXmlhttpRequestWithRetries } from '../../utils/http';
import { debugLog } from '../../utils/helpers';

export const REPO = 'bropines/creator-links';
const DEFAULT_URL = `https://raw.githubusercontent.com/${REPO}/main/index.json`;
/** Debugging aid: point the loader at another index.json */
const URL_KEY = 'xlinks.url';
const INDEX_KEY = 'xlinks.index';
const CHECKED_KEY = 'xlinks.checked';
const FAILED_KEY = 'xlinks.failed';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const RETRY_INTERVAL_MS = 60 * 60 * 1000;
const TIMEOUT_MS = 15000;

export type LinkSite = 'e-hentai' | 'pixiv';
export interface CreatorLink {
  site: LinkSite;
  /** 'artist' | 'group' for e-hentai, '' for pixiv */
  type: string;
  value: string;
}

interface IndexData {
  version: number;
  creators: Record<string, unknown>;
}

const TAG_VALUE = /^[\p{Ll}\p{N}][\p{Ll}\p{N} .'&+_-]{0,79}$/u;
const PIXIV_ID = /^[1-9][0-9]{0,11}$/;

function sanitizeLink(raw: unknown): CreatorLink | null {
  if (!Array.isArray(raw) || raw.length !== 3 || raw.some((v) => typeof v !== 'string')) return null;
  const [site, type, value] = raw as string[];
  if (site === 'e-hentai' && (type === 'artist' || type === 'group') && TAG_VALUE.test(value)) return { site, type, value };
  if (site === 'pixiv' && PIXIV_ID.test(value)) return { site, type: '', value };
  return null;
}

function parseIndex(text: string): IndexData | null {
  try {
    const data = JSON.parse(text) as Partial<IndexData>;
    if (!data || typeof data !== 'object' || typeof data.version !== 'number') return null;
    if (!data.creators || typeof data.creators !== 'object' || Array.isArray(data.creators)) return null;
    return { version: data.version, creators: data.creators as Record<string, unknown> };
  } catch {
    return null;
  }
}

let cache: IndexData | null | undefined;

function cached(): IndexData | null {
  if (cache === undefined) {
    const text = readStored<string>(INDEX_KEY, '');
    cache = text ? parseIndex(text) : null;
  }
  return cache;
}

/** Known links of one creator from the cached index (empty when unknown or not loaded yet). */
export function linksFor(service: string, id: string): CreatorLink[] {
  const entry = cached()?.creators[`${service}:${id}`];
  if (!Array.isArray(entry)) return [];
  return entry.map(sanitizeLink).filter((l): l is CreatorLink => !!l);
}

/** Whether the cache is old enough to look for a newer index. */
export function isStale(now = Date.now()): boolean {
  const checked = readStored<number>(CHECKED_KEY, 0);
  const failed = readStored<number>(FAILED_KEY, 0);
  return now - checked >= CHECK_INTERVAL_MS && now - failed >= RETRY_INTERVAL_MS;
}

let running: Promise<boolean> | null = null;

/** Downloads the index when the cache is stale. Resolves true when the data changed; never rejects. */
export function refreshIndex(): Promise<boolean> {
  if (!isStale()) return Promise.resolve(false);
  running ??= download().finally(() => (running = null));
  return running;
}

async function download(): Promise<boolean> {
  const now = Date.now();
  try {
    const response = await gmXmlhttpRequestWithRetries({
      method: 'GET',
      url: readStored<string>(URL_KEY, '') || DEFAULT_URL,
      timeout: TIMEOUT_MS,
    });
    const text = response?.responseText;
    const data = typeof text === 'string' ? parseIndex(text) : null;
    if (!data) throw new Error('not a creator-links index');
    writeStored(CHECKED_KEY, now);
    const changed = data.version !== cached()?.version;
    if (changed) {
      writeStored(INDEX_KEY, text);
      cache = data;
    }
    return changed;
  } catch (error) {
    writeStored(FAILED_KEY, now);
    debugLog('[xlinks] index not updated:', (error as Error)?.message || error);
    return false;
  }
}
