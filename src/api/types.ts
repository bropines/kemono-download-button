export interface IApiAdapter {
  name: 'kemono' | 'pawchive';

  // Creators & Profiles
  fetchCreators(): Promise<any>;
  fetchUpdatedCreators?(): Promise<any>;
  fetchCreatorProfile(service: string, userID: string): Promise<any>;
  fetchCreatorAnnouncements(service: string, userID: string): Promise<any[] | null>;
  fetchCreatorFancards(service: string, userID: string): Promise<any[] | null>;
  fetchCreatorLinks(service: string, userID: string): Promise<any[] | null>;

  // Posts & Content
  fetchPostData(service: string, userID: string, postID: string): Promise<any>;
  fetchAllAuthorPosts(service: string, userID: string, progressTask?: any): Promise<any[]>;
  searchPosts(query?: string, offset?: number, service?: string): Promise<any[]>;
  fetchPopularPosts?(): Promise<any[]>;
  fetchPostRevisions(service: string, userID: string, postID: string): Promise<any[] | null>;
  fetchComments(service: string, userID: string, postID: string): Promise<any[] | null>;
  fetchTags(service: string, userID: string): Promise<string[] | null>;
  flagPost(service: string, userID: string, postID: string): Promise<boolean>;

  // Account & Favorites
  fetchUserFavorites(): Promise<boolean>;
  fetchAccountProfile?(): Promise<any | null>;
  toggleFavorite(
    button: HTMLButtonElement,
    type: 'creator' | 'post',
    service: string,
    creatorId: string,
    postId?: string | null,
    updateCardStateFn?: (card: HTMLElement | null, isFavorited: boolean, type: string) => void
  ): Promise<void>;

  // DMs & Shares
  fetchDMs?(): Promise<any[] | null>;
  fetchCreatorDMs?(service: string, userID: string): Promise<any[] | null>;
  fetchShares?(): Promise<any[] | null>;

  // Tools & Version
  lookupHash(fileHash: string): Promise<any | null>;
  fetchAppVersion?(): Promise<any | null>;
  fetchDiscordChannels?(): Promise<any[] | null>;
  fetchDiscordChannelMessages?(channelId: string): Promise<any[] | null>;
}
