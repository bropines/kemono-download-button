import { iconSvg } from '../config/icons';
import { appState, getSettings, state } from '../state/store';
import { showMessage } from '../ui/toast';
import { t } from '../i18n';
import { debugLog, getApiUrl } from '../utils/helpers';
import { gmXmlhttpRequestWithRetries } from '../utils/http';
import { IApiAdapter, UpdateCardStateFn } from './types';
import { apiGet, invalidateApiCache } from './apiCache';

// Kemono, Coomer and Pawchive share one REST layout: this module is the common implementation,
// and each site adapter only overrides what really differs (see pawchiveApi.ts)

// Every read goes through the API cache (apiCache.ts: TTL per endpoint, shared in-flight requests).
// allowStale = false where the answer feeds a download and must not be older than its TTL.
interface GetOptions { allowStale?: boolean; validate?: (data: unknown) => boolean; session?: boolean }
function getJson(path: string, timeout = 30000, options: GetOptions = {}): Promise<any> {
  return apiGet(getApiUrl(path), { timeout, ...options });
}

const isRows = (data: unknown, row: (value: Record<string, unknown>) => boolean): boolean =>
  Array.isArray(data) && data.every((value) => !!value && typeof value === 'object' && row(value as Record<string, unknown>));
const validAnnouncements = (data: unknown) => isRows(data, (row) => typeof row.content === 'string');
const validTags = (data: unknown) => isRows(data, (row) => typeof row.tag === 'string' && row.tag.length > 0);
const validLinks = (data: unknown) => isRows(data, (row) => typeof row.service === 'string' && row.service.length > 0 &&
  (typeof row.id === 'string' || typeof row.id === 'number') && String(row.id).length > 0);
const validProfile = (data: unknown) => !!data && typeof data === 'object' && !Array.isArray(data);

export async function fetchPostDataFromAPI(service: string, userID: string, postID: string, options: { allowStale?: boolean } = {}): Promise<any> {
  const path = `/api/v1/${service}/user/${userID}/post/${postID}`;
  debugLog('[API]', 'fetch-post');
  return getJson(path, 30000, { allowStale: options.allowStale });
}

/** The raw profile object (name, and post_count/dm_count/... where the site has them) */
export function fetchProfile(service: string, userID: string): Promise<any> {
  return getJson(`/api/v1/${service}/user/${userID}/profile`, 15000, { validate: validProfile });
}

/** Linked accounts of a creator (the Linked accounts tab); allowStale: an outdated copy may answer at once */
export function fetchCreatorLinks(service: string, userID: string, allowStale = false): Promise<any> {
  return getJson(`/api/v1/${service}/user/${userID}/links`, 15000, { allowStale, validate: validLinks });
}

/** A creator's announcements (the Announcements tab), newest first as the site sends them */
export function fetchAnnouncements(service: string, userID: string, allowStale = false): Promise<any> {
  return getJson(`/api/v1/${service}/user/${userID}/announcements`, 15000, { allowStale, validate: validAnnouncements });
}

/** A creator's display name from the profile endpoint; null when it cannot be read */
export function fetchCreatorName(service: string, userID: string): Promise<string | null> {
  return fetchProfile(service, userID)
    .then((profile) => (typeof profile?.name === 'string' && profile.name.trim()) || null)
    .catch(() => {
      debugLog('[API]', 'creator-name-failed');
      return null;
    });
}

type AuthorPostsPagePath = (service: string, userID: string, offset: number) => string;

export function createAuthorPostsFetcher(pagePath: AuthorPostsPagePath): IApiAdapter['fetchAllAuthorPosts'] {
  return async (service, userID, progressTask) => {
    let allPosts: any[] = [];
    let offset = 0;
    const limit = 50;

    while (true) {
      try {
        progressTask?.updateStatus(t('common.api.fetchingPage', { page: offset / limit + 1, count: allPosts.length }));
        const postsOnPage = await getJson(pagePath(service, userID, offset), 30000, { allowStale: false });
        if (!Array.isArray(postsOnPage) || postsOnPage.length === 0) break;
        allPosts = allPosts.concat(postsOnPage);
        offset += limit;
        await new Promise((res) => setTimeout(res, 200));
      } catch (error: any) {
        if (error.message && error.message.includes('Status 400')) {
          debugLog('Reached end of posts (API returned 400). Normal exit condition.');
        } else {
          console.error('[API] Failed to fetch posts.');
          showMessage(t('common.api.fetchListFailed'), 'error');
          progressTask?.updateStatus(t('common.api.fetchPostsError', { error: error.message }));
        }
        break;
      }
    }

    if (progressTask) {
      progressTask.updateStatus(t('common.api.fetchComplete', { count: allPosts.length }));
      progressTask.finish(3000);
    }
    return allPosts;
  };
}

export interface CreatorTag {
  tag: string;
  count: number;
}

/** A creator's tags with post counts (most used first); throws when the request fails */
export async function fetchCreatorTags(service: string, userID: string, allowStale = false): Promise<CreatorTag[]> {
  const data = await getJson(`/api/v1/${service}/user/${userID}/tags`, 20000, { allowStale, validate: validTags });
  if (!Array.isArray(data)) return [];
  return data
    .filter((row: any) => row && typeof row.tag === 'string' && row.tag)
    .map((row: any) => ({ tag: row.tag as string, count: Number(row.post_count) || 0 }))
    .sort((a, b) => b.count - a.count);
}

/** One page (50 posts) of a creator's posts carrying a tag; Pawchive has no `/posts` suffix */
export async function fetchTaggedPostsPage(service: string, userID: string, tag: string, offset: number): Promise<any[]> {
  const suffix = window.location.hostname.includes('pawchive') ? '' : '/posts';
  const data = await getJson(`/api/v1/${service}/user/${userID}${suffix}?o=${offset}&tag=${encodeURIComponent(tag)}`, 30000, { allowStale: false });
  return Array.isArray(data) ? data : [];
}

// The site's own login: its pages mark <html> with is-logged-in (and keep logged_in in localStorage)
function siteLoggedIn(): boolean {
  if (document.documentElement.classList.contains('is-logged-in')) return true;
  try {
    return localStorage.getItem('logged_in') === 'yes';
  } catch {
    return false;
  }
}

/**
 * Account requests (favourites): with a session cookie pasted in the settings they go through the userscript
 * host; without one, from the page itself, same origin, carrying the browser's own login.
 */
async function pageAccountRequest(method: string, path: string): Promise<any> {
  const response = await fetch(getApiUrl(path), { method, credentials: 'include', headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`HTTP Status ${response.status}`);
  if (method !== 'GET') return null;
  return JSON.parse(await response.text());
}
const canUseAccount = (): boolean => !!state.settings.sessionCookie || siteLoggedIn();

export async function fetchUserFavorites(): Promise<boolean> {
  if (appState.favoritesFetched) return true;
  await getSettings();
  if (!canUseAccount()) return false;
  debugLog('[API] Fetching user favorites...');
  const viaPage = !state.settings.sessionCookie;
  const list = (type: string) => {
    const path = `/api/v1/account/favorites?type=${type}`;
    return viaPage ? pageAccountRequest('GET', path) : getJson(path, 30000, { session: true });
  };
  try {
    const [artists, posts] = await Promise.all([list('artist'), list('post')]);
    if (Array.isArray(artists)) artists.forEach((artist: any) => appState.favoritedArtists.add(`${artist.service}-${artist.id}`));
    if (Array.isArray(posts)) posts.forEach((post: any) => appState.favoritedPosts.add(post.id));
    appState.favoritesFetched = true;
    debugLog(`[API] Favorites loaded: ${appState.favoritedArtists.size} artists, ${appState.favoritedPosts.size} posts.`);
    return true;
  } catch (error: any) {
    if (error.message && error.message.includes('Status 401')) {
      showMessage(t('common.api.favAuthFailed'), 'error');
    }
    return false;
  }
}

export async function toggleFavorite(
  button: HTMLButtonElement,
  type: 'creator' | 'post',
  service: string,
  creatorId: string,
  postId: string | null = null,
  updateCardStateFn?: UpdateCardStateFn
): Promise<void> {
  await getSettings();
  if (!canUseAccount()) {
    showMessage(t('common.api.favNeedsSession'), 'error');
    return;
  }
  const artistKey = `${service}-${creatorId}`;
  const isFavorited = type === 'creator' ? appState.favoritedArtists.has(artistKey) : (postId ? appState.favoritedPosts.has(postId) : false);
  const method = isFavorited ? 'DELETE' : 'POST';
  const apiUrl = type === 'creator' ? `/api/v1/favorites/creator/${service}/${creatorId}` : `/api/v1/favorites/post/${service}/${creatorId}/${postId}`;

  button.innerHTML = iconSvg('loader-circle', 'kdl-icon kdl-spin');
  button.disabled = true;
  try {
    if (state.settings.sessionCookie) await gmXmlhttpRequestWithRetries({ method, url: getApiUrl(apiUrl) });
    else await pageAccountRequest(method, apiUrl);
    // Answers that may reflect the old favourite state: account lists, the creator's profile, the post
    const creatorPath = `/${service}/user/${creatorId}`;
    void invalidateApiCache((url) => url.includes('/favorites') || url.includes(`${creatorPath}/profile`) ||
      (!!postId && url.includes(`${creatorPath}/post/${postId}`)));
    if (isFavorited) {
      if (type === 'creator') appState.favoritedArtists.delete(artistKey);
      else if (postId) appState.favoritedPosts.delete(postId);
    } else {
      if (type === 'creator') appState.favoritedArtists.add(artistKey);
      else if (postId) appState.favoritedPosts.add(postId);
    }
    if (updateCardStateFn) {
      updateCardStateFn(button.closest('.user-card, .post-card'), !isFavorited, type);
    }
    showMessage(t(isFavorited ? 'common.api.favRemoved' : 'common.api.favAdded'), 'info');
  } catch {
    console.error('[API] Favorite toggle failed.');
    showMessage(t('common.api.favFailed'), 'error');
  } finally {
    button.innerHTML = iconSvg('star');
    button.disabled = false;
  }
}

export const kemonoApiAdapter: IApiAdapter = {
  name: 'kemono',
  fetchPostData: fetchPostDataFromAPI,
  fetchAllAuthorPosts: createAuthorPostsFetcher((service, userID, offset) => `/api/v1/${service}/user/${userID}/posts?o=${offset}`),
  fetchUserFavorites,
  toggleFavorite
};
