// Search sites of the creator links menu: "search this creator on ..." entries.

import { getModuleSetting, setModuleSetting } from '../../core/registry';
import { t } from '../../i18n';
import { DEFAULT_SEARCHES, parseSearchSites, searchSiteProblem, serializeSearchSites, type SearchSite } from '../../modules/creatorLinks/searchSites';
import { composeAiPrompt, registerAiPack } from '../aiPack';

const MODULE = 'creators.xlinks';
const KEY = 'searches';
const MAX_SITES = 100;

/** Valid sites (label, http(s) URL with a placeholder), or null when any entry is wrong */
export function parseSearchSiteList(value: unknown): SearchSite[] | null {
  if (!Array.isArray(value) || value.length > MAX_SITES) return null;
  const sites: SearchSite[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const { label, url } = item as Record<string, unknown>;
    if (typeof label !== 'string' || typeof url !== 'string' || label.length > 100 || url.length > 2000) return null;
    const site = { label: label.trim().replace(/\s+/g, ' '), url: url.trim() };
    if (searchSiteProblem(site)) return null;
    sites.push(site);
  }
  return sites;
}

function prompt(): string {
  const defaults = parseSearchSites(DEFAULT_SEARCHES).map((site) => `  - ${site.label}: ${site.url}`).join('\n');
  return composeAiPrompt(searchSitesPack, {
    role: 'Your job: edit the "search this creator on other sites" entries of the creator menu (opened from a creator\'s name).',
    body: `
## Fields in "settings"
- \`sites\`: an array of {"label": string, "url": string}, shown in this order, at most ${MAX_SITES}. Returning it replaces the whole list, so keep the entries you do not mean to remove.
  - \`label\`: the menu text, 1 to 100 characters, must not contain "|".
  - \`url\`: an http:// or https:// URL template containing at least one placeholder:
    - \`{name}\`: the creator name, URL-encoded. Example: "Mira%20Art".
    - \`{tag}\`: the name in lower case with spaces turned into underscores, URL-encoded (booru-style tag). Example: "mira_art".
  - Write any other URL-encoding yourself (e.g. %22 for a quote, %3A for a colon).

## Default list
${defaults}

## Examples
- "Add Twitter search": {"label": "X", "url": "https://x.com/search?q={name}&f=user"}.
- "Only boorus": keep Danbooru, Gelbooru, Rule34 and Yande.re, drop the rest.`,
    example: { sites: [{ label: 'Danbooru', url: 'https://danbooru.donmai.us/posts?tags={tag}' }] },
  });
}

export const searchSitesPack = registerAiPack({
  id: 'searchSites',
  order: 40,
  title: () => t('ai.pack.searchSites'),
  fields: () => [{
    key: 'sites',
    get: () => parseSearchSites(String(getModuleSetting<string>(MODULE, KEY) ?? '')),
    set: (value) => {
      const sites = parseSearchSiteList(value);
      if (!sites) return false;
      setModuleSetting(MODULE, KEY, serializeSearchSites(sites));
      return true;
    },
  }],
  systemPrompt: prompt,
});
