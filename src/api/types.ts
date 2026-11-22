export type UpdateCardStateFn = (card: HTMLElement | null, isFavorited: boolean, type: string) => void;

export interface IApiAdapter {
  name: 'kemono' | 'pawchive';

  // allowStale: false when the answer feeds a download (no copy older than its TTL)
  fetchPostData(service: string, userID: string, postID: string, options?: { allowStale?: boolean }): Promise<any>;
  fetchAllAuthorPosts(service: string, userID: string, progressTask?: any): Promise<any[]>;

  fetchUserFavorites(): Promise<boolean>;
  toggleFavorite(
    button: HTMLButtonElement,
    type: 'creator' | 'post',
    service: string,
    creatorId: string,
    postId?: string | null,
    updateCardStateFn?: UpdateCardStateFn
  ): Promise<void>;
}
