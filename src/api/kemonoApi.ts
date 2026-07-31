import { appState, getSettings, state } from '../state/store';
import { showMessage } from '../ui/toast';
import { debugLog, getApiUrl } from '../utils/helpers';
import { gmXmlhttpRequestWithRetries } from '../utils/http';
import { IApiAdapter } from './types';

// 1. Post & Content Endpoints
export async function fetchPostDataFromAPI(service: string, userID: string, postID: string): Promise<any> {
  const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}`);
  debugLog(`[Kemono API] Fetching post data: ${url}`);
  const response = await gmXmlhttpRequestWithRetries({
    method: 'GET',
    url,
    responseType: 'json',
    timeout: 30000
  });
  return response.response;
}

export async function fetchAllAuthorPosts(service: string, userID: string, progressTask?: any): Promise<any[]> {
  let allPosts: any[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    try {
      if (progressTask) {
        progressTask.updateStatus(`Fetching page ${offset / limit + 1}... Found ${allPosts.length} posts.`);
      }
      const url = getApiUrl(`/api/v1/${service}/user/${userID}/posts?o=${offset}`);
      const response = await gmXmlhttpRequestWithRetries({
        method: 'GET',
        url,
        responseType: 'json',
        timeout: 30000
      });
      const postsOnPage = response.response;
      if (!Array.isArray(postsOnPage) || postsOnPage.length === 0) break;
      allPosts = allPosts.concat(postsOnPage);
      offset += limit;
      await new Promise((res) => setTimeout(res, 200));
    } catch (error: any) {
      if (error.message && error.message.includes('Status 400')) {
        debugLog('Reached end of posts (API returned 400). Normal exit condition.');
      } else {
        console.error(`Failed to fetch posts at offset ${offset}:`, error);
        showMessage('Error fetching full post list.', 'error');
        if (progressTask) {
          progressTask.updateStatus(`Error fetching posts: ${error.message}`);
        }
      }
      break;
    }
  }

  if (progressTask) {
    progressTask.updateStatus(`Complete! Found ${allPosts.length} posts.`);
    progressTask.finish(3000);
  }
  return allPosts;
}

export async function searchPosts(query = '', offset = 0, service = ''): Promise<any[]> {
  try {
    let path = `/api/v1/posts?o=${offset}`;
    if (query) path += `&q=${encodeURIComponent(query)}`;
    if (service) path += `&service=${encodeURIComponent(service)}`;
    const url = getApiUrl(path);
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return Array.isArray(res.response) ? res.response : [];
  } catch (e) {
    debugLog('[Kemono API] Failed searchPosts', e);
    return [];
  }
}

export async function fetchPopularPosts(): Promise<any[]> {
  try {
    const url = getApiUrl('/api/v1/posts/popular');
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return Array.isArray(res.response) ? res.response : [];
  } catch (e) {
    debugLog('[Kemono API] Failed fetchPopularPosts', e);
    return [];
  }
}

export async function fetchPostRevisions(service: string, userID: string, postID: string): Promise<any[] | null> {
  try {
    const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}/revisions`);
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return Array.isArray(res.response) ? res.response : null;
  } catch (e) {
    debugLog('[Kemono API] Failed fetchPostRevisions', e);
    return null;
  }
}

export async function fetchCommentsFromAPI(service: string, userID: string, postID: string): Promise<any[] | null> {
  try {
    const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}/comments`);
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return Array.isArray(res.response) ? res.response : null;
  } catch (e) {
    debugLog('[Kemono API] Failed fetchCommentsFromAPI', e);
    return null;
  }
}

export async function fetchTagsFromAPI(service: string, userID: string): Promise<string[] | null> {
  try {
    const url = getApiUrl(`/api/v1/${service}/user/${userID}/tags`);
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return Array.isArray(res.response) ? res.response : null;
  } catch (e) {
    debugLog('[Kemono API] Failed fetchTagsFromAPI', e);
    return null;
  }
}

export async function flagPost(service: string, userID: string, postID: string): Promise<boolean> {
  try {
    const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}/flag`);
    await gmXmlhttpRequestWithRetries({ method: 'POST', url });
    return true;
  } catch (e) {
    debugLog('[Kemono API] Failed flagPost', e);
    return false;
  }
}

// 2. Creators & Profiles Endpoints
export async function fetchCreators(): Promise<any> {
  try {
    const url = getApiUrl('/api/v1/creators.txt');
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return res.response;
  } catch (e) {
    debugLog('[Kemono API] Failed fetchCreators', e);
    return null;
  }
}

export async function fetchUpdatedCreators(): Promise<any> {
  try {
    const url = getApiUrl('/api/v1/creators/updated');
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return res.response;
  } catch (e) {
    debugLog('[Kemono API] Failed fetchUpdatedCreators', e);
    return null;
  }
}

export async function fetchCreatorProfile(service: string, userID: string): Promise<any> {
  try {
    const url = getApiUrl(`/api/v1/${service}/user/${userID}/profile`);
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return res.response;
  } catch (e) {
    debugLog('[Kemono API] Failed fetchCreatorProfile', e);
    return null;
  }
}

export async function fetchCreatorAnnouncements(service: string, userID: string): Promise<any[] | null> {
  try {
    const url = getApiUrl(`/api/v1/${service}/user/${userID}/announcements`);
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return Array.isArray(res.response) ? res.response : null;
  } catch (e) {
    debugLog('[Kemono API] Failed fetchCreatorAnnouncements', e);
    return null;
  }
}

export async function fetchCreatorFancards(service: string, userID: string): Promise<any[] | null> {
  try {
    const url = getApiUrl(`/api/v1/${service}/user/${userID}/fancards`);
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return Array.isArray(res.response) ? res.response : null;
  } catch (e) {
    debugLog('[Kemono API] Failed fetchCreatorFancards', e);
    return null;
  }
}

export async function fetchCreatorLinks(service: string, userID: string): Promise<any[] | null> {
  try {
    const url = getApiUrl(`/api/v1/${service}/user/${userID}/links`);
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return Array.isArray(res.response) ? res.response : null;
  } catch (e) {
    debugLog('[Kemono API] Failed fetchCreatorLinks', e);
    return null;
  }
}

// 3. Account & Favorites Endpoints
export async function fetchUserFavorites(): Promise<boolean> {
  if (appState.favoritesFetched) return true;
  await getSettings();
  if (!state.settings.sessionCookie) return false;
  debugLog('[Kemono API] Fetching user favorites...');
  try {
    const [artistsRes, postsRes] = await Promise.all([
      gmXmlhttpRequestWithRetries({ method: 'GET', url: getApiUrl('/api/v1/account/favorites?type=artist'), responseType: 'json' }),
      gmXmlhttpRequestWithRetries({ method: 'GET', url: getApiUrl('/api/v1/account/favorites?type=post'), responseType: 'json' })
    ]);
    if (artistsRes.response && Array.isArray(artistsRes.response)) {
      artistsRes.response.forEach((artist: any) => appState.favoritedArtists.add(`${artist.service}-${artist.id}`));
    }
    if (postsRes.response && Array.isArray(postsRes.response)) {
      postsRes.response.forEach((post: any) => appState.favoritedPosts.add(post.id));
    }
    appState.favoritesFetched = true;
    debugLog(`[Kemono API] Favorites loaded: ${appState.favoritedArtists.size} artists, ${appState.favoritedPosts.size} posts.`);
    return true;
  } catch (error: any) {
    if (error.message && error.message.includes('Status 401')) {
      showMessage('Favorites: Auth failed. Check your session cookie.', 'error');
    }
    return false;
  }
}

export async function fetchAccountProfile(): Promise<any | null> {
  try {
    const url = getApiUrl('/api/v1/account/profile');
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return res.response || null;
  } catch (e) {
    debugLog('[Kemono API] Failed fetchAccountProfile', e);
    return null;
  }
}

export async function toggleFavorite(
  button: HTMLButtonElement,
  type: 'creator' | 'post',
  service: string,
  creatorId: string,
  postId: string | null = null,
  updateCardStateFn?: (card: HTMLElement | null, isFavorited: boolean, type: string) => void
): Promise<void> {
  await getSettings();
  if (!state.settings.sessionCookie) {
    showMessage('Session cookie is required to manage favorites.', 'error');
    return;
  }
  const artistKey = `${service}-${creatorId}`;
  const isFavorited = type === 'creator' ? appState.favoritedArtists.has(artistKey) : (postId ? appState.favoritedPosts.has(postId) : false);
  const method = isFavorited ? 'DELETE' : 'POST';
  const apiUrl = type === 'creator' ? `/api/v1/favorites/creator/${service}/${creatorId}` : `/api/v1/favorites/post/${service}/${creatorId}/${postId}`;

  button.textContent = '⏳';
  button.disabled = true;
  try {
    await gmXmlhttpRequestWithRetries({ method, url: getApiUrl(apiUrl) });
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
    showMessage(`Successfully ${isFavorited ? 'removed from' : 'added to'} favorites!`, 'info');
  } catch (error) {
    console.error('[Kemono API] Favorite toggle failed:', error);
    showMessage('Failed to update favorites.', 'error');
  } finally {
    button.textContent = '⭐';
    button.disabled = false;
  }
}

// 4. DMs & Shares Endpoints
export async function fetchDMs(): Promise<any[] | null> {
  try {
    const url = getApiUrl('/api/v1/dms');
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return Array.isArray(res.response) ? res.response : null;
  } catch (e) {
    debugLog('[Kemono API] Failed fetchDMs', e);
    return null;
  }
}

export async function fetchCreatorDMs(service: string, userID: string): Promise<any[] | null> {
  try {
    const url = getApiUrl(`/api/v1/${service}/user/${userID}/dms`);
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return Array.isArray(res.response) ? res.response : null;
  } catch (e) {
    debugLog('[Kemono API] Failed fetchCreatorDMs', e);
    return null;
  }
}

export async function fetchShares(): Promise<any[] | null> {
  try {
    const url = getApiUrl('/api/v1/shares');
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return Array.isArray(res.response) ? res.response : null;
  } catch (e) {
    debugLog('[Kemono API] Failed fetchShares', e);
    return null;
  }
}

// 5. Tools, Hash & Discord Endpoints
export async function lookupHash(fileHash: string): Promise<any | null> {
  try {
    const url = getApiUrl(`/api/v1/search_hash/${encodeURIComponent(fileHash)}`);
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return res.response || null;
  } catch (e) {
    debugLog('[Kemono API] Failed lookupHash', e);
    return null;
  }
}

export async function fetchAppVersion(): Promise<any | null> {
  try {
    const url = getApiUrl('/api/v1/app_version');
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return res.response || null;
  } catch (e) {
    debugLog('[Kemono API] Failed fetchAppVersion', e);
    return null;
  }
}

export async function fetchDiscordChannels(): Promise<any[] | null> {
  try {
    const url = getApiUrl('/api/v1/discord/channels');
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return Array.isArray(res.response) ? res.response : null;
  } catch (e) {
    debugLog('[Kemono API] Failed fetchDiscordChannels', e);
    return null;
  }
}

export async function fetchDiscordChannelMessages(channelId: string): Promise<any[] | null> {
  try {
    const url = getApiUrl(`/api/v1/discord/channel/${encodeURIComponent(channelId)}`);
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return Array.isArray(res.response) ? res.response : null;
  } catch (e) {
    debugLog('[Kemono API] Failed fetchDiscordChannelMessages', e);
    return null;
  }
}

export const kemonoApiAdapter: IApiAdapter = {
  name: 'kemono',
  fetchCreators,
  fetchUpdatedCreators,
  fetchCreatorProfile,
  fetchCreatorAnnouncements,
  fetchCreatorFancards,
  fetchCreatorLinks,
  fetchPostData: fetchPostDataFromAPI,
  fetchAllAuthorPosts,
  searchPosts,
  fetchPopularPosts,
  fetchPostRevisions,
  fetchComments: fetchCommentsFromAPI,
  fetchTags: fetchTagsFromAPI,
  flagPost,
  fetchUserFavorites,
  fetchAccountProfile,
  toggleFavorite,
  fetchDMs,
  fetchCreatorDMs,
  fetchShares,
  lookupHash,
  fetchAppVersion,
  fetchDiscordChannels,
  fetchDiscordChannelMessages
};
