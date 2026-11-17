import { createAuthorPostsFetcher, kemonoApiAdapter } from './kemonoApi';
import { IApiAdapter } from './types';

// Pawchive mirrors the Kemono API except for the author post listing, which has no `/posts` suffix
export const pawchiveApiAdapter: IApiAdapter = {
  ...kemonoApiAdapter,
  name: 'pawchive',
  fetchAllAuthorPosts: createAuthorPostsFetcher((service, userID, offset) => `/api/v1/${service}/user/${userID}?o=${offset}`)
};
