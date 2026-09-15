import { iconSvg } from '../config/icons';
import { appState, getSettings, state } from '../state/store';
import { showMessage } from '../ui/toast';
import { debugLog, getApiUrl } from '../utils/helpers';
import { gmXmlhttpRequestWithRetries } from '../utils/http';
import { IApiAdapter } from './types';

export async function fetchPostDataFromPawchive(service: string, userID: string, postID: string): Promise<any> {
  const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}`);
  debugLog(`Fetching post data from Pawchive API: ${url}`);
  const response = await gmXmlhttpRequestWithRetries({
    method: 'GET',
    url,
    responseType: 'json',
    timeout: 30000
  });
  return response.response;
}

export async function fetchAllAuthorPostsPawchive(service: string, userID: string, progressTask?: any): Promise<any[]> {
  let allPosts: any[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    try {
      if (progressTask) {
        progressTask.updateStatus(`Fetching page ${offset / limit + 1}... Found ${allPosts.length} posts.`);
      }
      const url = getApiUrl(`/api/v1/${service}/user/${userID}?o=${offset}`);
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

export async function fetchUserFavoritesPawchive(): Promise<boolean> {
  if (appState.favoritesFetched) return true;
  await getSettings();
  if (!state.settings.sessionCookie) return false;
  debugLog('Fetching user favorites from Pawchive API...');
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
    debugLog(`Favorites loaded: ${appState.favoritedArtists.size} artists, ${appState.favoritedPosts.size} posts.`);
    return true;
  } catch (error: any) {
    if (error.message && error.message.includes('Status 401')) {
      showMessage('Favorites: Auth failed. Check your session cookie.', 'error');
    }
    return false;
  }
}

export async function toggleFavoritePawchive(
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

  button.innerHTML = iconSvg('loader-circle', 'kdl-icon kdl-spin');
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
    console.error('Favorite toggle failed:', error);
    showMessage('Failed to update favorites.', 'error');
  } finally {
    button.innerHTML = iconSvg('star');
    button.disabled = false;
  }
}

export async function fetchCommentsPawchive(service: string, userID: string, postID: string): Promise<any[] | null> {
  try {
    const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}/comments`);
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return Array.isArray(res.response) ? res.response : null;
  } catch (e) {
    debugLog('Failed to fetch Pawchive comments', e);
    return null;
  }
}

export async function fetchCreatorProfilePawchive(service: string, userID: string): Promise<any> {
  try {
    const url = getApiUrl(`/api/v1/${service}/user/${userID}/profile`);
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return res.response;
  } catch (e) {
    debugLog('Failed to fetch Pawchive profile', e);
    return null;
  }
}

export async function fetchCreatorAnnouncementsPawchive(service: string, userID: string): Promise<any[] | null> {
  try {
    const url = getApiUrl(`/api/v1/${service}/user/${userID}/announcements`);
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return Array.isArray(res.response) ? res.response : null;
  } catch (e) {
    debugLog('Failed to fetch Pawchive announcements', e);
    return null;
  }
}

export async function fetchCreatorFancardsPawchive(service: string, userID: string): Promise<any[] | null> {
  try {
    const url = getApiUrl(`/api/v1/${service}/user/${userID}/fancards`);
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return Array.isArray(res.response) ? res.response : null;
  } catch (e) {
    debugLog('Failed to fetch Pawchive fancards', e);
    return null;
  }
}

export async function fetchCreatorLinksPawchive(service: string, userID: string): Promise<any[] | null> {
  try {
    const url = getApiUrl(`/api/v1/${service}/user/${userID}/links`);
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return Array.isArray(res.response) ? res.response : null;
  } catch (e) {
    debugLog('Failed to fetch Pawchive links', e);
    return null;
  }
}

export async function fetchCreatorsPawchive(): Promise<any> {
  try {
    const url = getApiUrl('/api/v1/creators');
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return res.response;
  } catch (e) {
    debugLog('Failed to fetch Pawchive creators', e);
    return null;
  }
}

export async function searchPostsPawchive(query: string, offset = 0): Promise<any[]> {
  try {
    const url = getApiUrl(`/api/v1/posts?q=${encodeURIComponent(query)}&o=${offset}`);
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return Array.isArray(res.response) ? res.response : [];
  } catch (e) {
    debugLog('Failed to search Pawchive posts', e);
    return [];
  }
}

export async function fetchPostRevisionsPawchive(service: string, userID: string, postID: string): Promise<any[] | null> {
  try {
    const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}/revisions`);
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return Array.isArray(res.response) ? res.response : null;
  } catch (e) {
    debugLog('Failed to fetch Pawchive revisions', e);
    return null;
  }
}

export async function lookupHashPawchive(fileHash: string): Promise<any | null> {
  try {
    const url = getApiUrl(`/api/v1/search_hash/${encodeURIComponent(fileHash)}`);
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return res.response || null;
  } catch (e) {
    debugLog('Failed Pawchive hash lookup', e);
    return null;
  }
}

export async function flagPostPawchive(service: string, userID: string, postID: string): Promise<boolean> {
  try {
    const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}/flag`);
    await gmXmlhttpRequestWithRetries({ method: 'POST', url });
    return true;
  } catch (e) {
    debugLog('Failed flag post Pawchive', e);
    return false;
  }
}

export async function fetchAppVersionPawchive(): Promise<any | null> {
  try {
    const url = getApiUrl('/api/v1/app_version');
    const res = await gmXmlhttpRequestWithRetries({ method: 'GET', url, responseType: 'json' });
    return res.response || null;
  } catch (e) {
    debugLog('Failed fetch Pawchive app version', e);
    return null;
  }
}

export const pawchiveApiAdapter: IApiAdapter = {
  name: 'pawchive',
  fetchPostData: fetchPostDataFromPawchive,
  fetchAllAuthorPosts: fetchAllAuthorPostsPawchive,
  fetchCreatorProfile: fetchCreatorProfilePawchive,
  fetchCreatorAnnouncements: fetchCreatorAnnouncementsPawchive,
  fetchCreatorFancards: fetchCreatorFancardsPawchive,
  fetchCreatorLinks: fetchCreatorLinksPawchive,
  fetchCreators: fetchCreatorsPawchive,
  searchPosts: searchPostsPawchive,
  fetchUserFavorites: fetchUserFavoritesPawchive,
  toggleFavorite: toggleFavoritePawchive,
  // Pawchive does NOT have a tags endpoint - returns null immediately
  fetchTags: async () => null,
  fetchComments: fetchCommentsPawchive,
  fetchPostRevisions: fetchPostRevisionsPawchive,
  lookupHash: lookupHashPawchive,
  flagPost: flagPostPawchive
};
