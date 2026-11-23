// The "Search sites" setting of the creator links module, stored as plain text: one "Label | URL template"
// per line. {name} in the template is the creator name, {tag} the same in lower case with underscores.
// The settings editor and the menu both go through parse/serialize here, so the stored text keeps its
// format (older versions and exported settings read the same lines).

export interface SearchSite {
  label: string;
  url: string;
}

export type SearchSiteProblem = 'labelMissing' | 'labelPipe' | 'urlMissing' | 'urlScheme' | 'urlInvalid' | 'placeholderMissing';

export const SEARCH_PLACEHOLDERS = ['{name}', '{tag}'] as const;

export const DEFAULT_SEARCHES = [
  'E-Hentai | https://e-hentai.org/?f_search=artist%3A%22{name}%24%22',
  'nhentai | https://nhentai.net/search/?q=artist%3A%22{name}%22',
  'Hitomi | https://hitomi.la/search.html?artist%3A{tag}',
  'Danbooru | https://danbooru.donmai.us/posts?tags={tag}',
  'Gelbooru | https://gelbooru.com/index.php?page=post&s=list&tags={tag}',
  'Rule34 | https://rule34.xxx/index.php?page=post&s=list&tags={tag}',
  'Yande.re | https://yande.re/post?tags={tag}',
  'Pixiv | https://www.pixiv.net/search_user.php?nick={name}',
  'Kemono | https://kemono.cr/artists?q={name}',
  'Coomer | https://coomer.st/artists?q={name}',
  'Pawchive | https://pawchive.pw/artists?q={name}',
].join('\n');

const SCHEME = /^https?:\/\//i;

/**
 * Every non-blank line becomes an entry, broken ones included, so the editor shows them instead of dropping
 * them on the next save. The label ends at the first "|"; a line without one is a bare URL or a bare label.
 */
export function parseSearchSites(text: string): SearchSite[] {
  return String(text ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const bar = line.indexOf('|');
      if (bar < 0) return SCHEME.test(line) ? { label: '', url: line } : { label: line, url: '' };
      return { label: line.slice(0, bar).trim(), url: line.slice(bar + 1).trim() };
    });
}

export function serializeSearchSites(sites: readonly SearchSite[]): string {
  return sites
    .map((site) => ({ label: site.label.replace(/\s+/g, ' ').trim(), url: site.url.replace(/[\r\n]+/g, '').trim() }))
    .filter((site) => site.label || site.url)
    .map((site) => `${site.label} | ${site.url}`)
    .join('\n');
}

/** The template with every placeholder filled, or null when it is not an http(s) URL. */
export function fillSearchUrl(template: string, values: { name: string; tag: string }): string | null {
  if (!SCHEME.test(template)) return null;
  const url = template.replace(/\{name\}/g, values.name).replace(/\{tag\}/g, values.tag);
  try {
    new URL(url);
  } catch {
    return null;
  }
  return url;
}

/** What keeps an entry from working, checked in the order a user fixes them; null when it is fine. */
export function searchSiteProblem(site: SearchSite): SearchSiteProblem | null {
  const label = site.label.trim();
  const url = site.url.trim();
  if (!label) return 'labelMissing';
  if (label.includes('|')) return 'labelPipe';
  if (!url) return 'urlMissing';
  if (!SCHEME.test(url)) return 'urlScheme';
  if (!fillSearchUrl(url, { name: 'x', tag: 'x' })) return 'urlInvalid';
  if (!SEARCH_PLACEHOLDERS.some((p) => url.includes(p))) return 'placeholderMissing';
  return null;
}
