import { iconSvg } from '../config/icons';
import { appState, getSettings, state } from '../state/store';
import { showMessage } from '../ui/toast';
import { debugLog, getApiUrl } from '../utils/helpers';
import { gmXmlhttpRequestWithRetries } from '../utils/http';
import { IApiAdapter, UpdateCardStateFn } from './types';

// Kemono, Coomer and Pawchive share one REST layout: this module is the common implementation,
// and each site adapter only overrides what really differs (see pawchiveApi.ts)

async function getJson(path: string, timeout = 30000): Promise<any> {
  const response = await gmXmlhttpRequestWithRetries({ method: 'GET', url: getApiUrl(path), responseType: 'json', timeout });
  return response.response;
}

export async function fetchPostDataFromAPI(service: string, userID: string, postID: string): Promise<any> {
  const path = `/api/v1/${service}/user/${userID}/post/${postID}`;
  debugLog(`[API] Fetching post data: ${path}`);
  return getJson(path);
}

type AuthorPostsPagePath = (service: string, userID: string, offset: number) => string;

export function createAuthorPostsFetcher(pagePath: AuthorPostsPagePath): IApiAdapter['fetchAllAuthorPosts'] {
  return async (service, userID, progressTask) => {
    let allPosts: any[] = [];
    let offset = 0;
    const limit = 50;

    while (true) {
      try {
        progressTask?.updateStatus(`Fetching page ${offset / limit + 1}... Found ${allPosts.length} posts.`);
        const postsOnPage = await getJson(pagePath(service, userID, offset));
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
          progressTask?.updateStatus(`Error fetching posts: ${error.message}`);
        }
        break;
      }
    }

    if (progressTask) {
      progressTask.updateStatus(`Complete! Found ${allPosts.length} posts.`);
      progressTask.finish(3000);
    }
    return allPosts;
  };
}

export async function fetchUserFavorites(): Promise<boolean> {
  if (appState.favoritesFetched) return true;
  await getSettings();
  if (!state.settings.sessionCookie) return false;
  debugLog('[API] Fetching user favorites...');
  try {
    const [artists, posts] = await Promise.all([
      getJson('/api/v1/account/favorites?type=artist'),
      getJson('/api/v1/account/favorites?type=post')
    ]);
    if (Array.isArray(artists)) artists.forEach((artist: any) => appState.favoritedArtists.add(`${artist.service}-${artist.id}`));
    if (Array.isArray(posts)) posts.forEach((post: any) => appState.favoritedPosts.add(post.id));
    appState.favoritesFetched = true;
    debugLog(`[API] Favorites loaded: ${appState.favoritedArtists.size} artists, ${appState.favoritedPosts.size} posts.`);
    return true;
  } catch (error: any) {
    if (error.message && error.message.includes('Status 401')) {
      showMessage('Favorites: Auth failed. Check your session cookie.', 'error');
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
    console.error('[API] Favorite toggle failed:', error);
    showMessage('Failed to update favorites.', 'error');
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
