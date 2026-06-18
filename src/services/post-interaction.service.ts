/**
 * Post interaction signals — feed tuning, moderation hooks
 */

import apiClient from '@/lib/api-client';

export type PostFeedSignal = 'interested' | 'not_interested' | 'hide';

export const postInteractionService = {
  async setFeedSignal(postId: string, signal: PostFeedSignal) {
    return apiClient.post<{ signal: PostFeedSignal; postId: string }>(
      `/content/posts/${postId}/feed-signal`,
      { signal },
    );
  },

  async clearFeedSignal(postId: string) {
    return apiClient.delete(`/content/posts/${postId}/feed-signal`);
  },

  async getFeedSignal(postId: string) {
    return apiClient.get<{ signal: PostFeedSignal | null }>(
      `/content/posts/${postId}/feed-signal`,
    );
  },
};
