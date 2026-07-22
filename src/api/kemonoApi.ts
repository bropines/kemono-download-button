import { DEFAULT_SETTINGS } from '../config/constants';
import { appState, getSettings, state } from '../state/store';
import { showMessage } from '../ui/toast';
import { debugLog, getApiUrl } from '../utils/helpers';
import { gmXmlhttpRequestWithRetries } from '../utils/http';

export async function fetchPostDataFromAPI(service: string, userID: string, postID: string): Promise<any> {
  const url = getApiUrl(`/api/v1/${service}/user/${userID}/post/${postID}`);
  debugLog(`Fetching post data from API: ${url}`);
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
        debugLog('Reached end of posts (API returned 400). This is a normal exit condition.');
      } else {
        console.error(`Failed to fetch posts at offset ${offset}:`, error);
        showMessage('Error fetching full post list. The result may be incomplete.', 'error');
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

export async function fetchUserFavorites(): Promise<boolean> {
  if (appState.favoritesFetched) return true;
  await getSettings();
  if (!state.settings.sessionCookie) {
    return false;
  }
  debugLog('Fetching user favorites from API...');
  try {
    const [artistsRes, postsRes] = await Promise.all([
      gmXmlhttpRequestWithRetries({
        method: 'GET',
        url: getApiUrl('/api/v1/account/favorites?type=artist'),
        responseType: 'json'
      }),
      gmXmlhttpRequestWithRetries({
        method: 'GET',
        url: getApiUrl('/api/v1/account/favorites?type=post'),
        responseType: 'json'
      })
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
    } else {
      console.error('Failed to fetch favorites:', error);
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
  updateCardStateFn?: (card: HTMLElement | null, isFavorited: boolean, type: string) => void
): Promise<void> {
  await getSettings();
  if (!state.settings.sessionCookie) {
    showMessage('Session cookie is required to manage favorites. Please set it in the script settings.', 'error');
    return;
  }
  const artistKey = `${service}-${creatorId}`;
  const isFavorited = type === 'creator' ? appState.favoritedArtists.has(artistKey) : (postId ? appState.favoritedPosts.has(postId) : false);
  const method = isFavorited ? 'DELETE' : 'POST';
  const apiUrl = type === 'creator' ? `/api/v1/favorites/creator/${service}/${creatorId}` : `/api/v1/favorites/post/${service}/${creatorId}/${postId}`;

  button.textContent = '⏳';
  button.disabled = true;
  try {
    await gmXmlhttpRequestWithRetries({
      method,
      url: getApiUrl(apiUrl)
    });
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
    showMessage('Failed to update favorites. Check console for details.', 'error');
  } finally {
    button.textContent = '⭐';
    button.disabled = false;
  }
}
