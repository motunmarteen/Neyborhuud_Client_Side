/**
 * Gossip Service
 * API calls for anonymous gossip posts and comments
 */

import apiClient from '@/lib/api-client';
import { GossipPost, GossipComment, CreateGossipPayload, CreateCommentPayload } from '@/types/gossip';

export const gossipService = {
  /**
   * Create a new gossip post
   */
  async createGossip(payload: CreateGossipPayload) {
    return await apiClient.post<{ gossip: GossipPost }>('/gossip', payload);
  },

  /**
   * List gossip posts with optional filters
   */
  async listGossip(filters?: { 
    type?: string; 
    lga?: string; 
    page?: number;
    limit?: number;
  }) {
    return await apiClient.get<{ gossip: GossipPost[] }>('/gossip', {
      params: filters,
    });
  },

  /**
   * Get a single gossip post
   */
  async getGossip(gossipId: string) {
    return await apiClient.get<{ gossip: GossipPost }>(`/gossip/${gossipId}`);
  },

  /**
   * Add a comment to a gossip post
   */
  async addComment(gossipId: string, payload: CreateCommentPayload) {
    return await apiClient.post<{ comment: GossipComment }>(
      `/gossip/${gossipId}/comments`,
      payload
    );
  },

  /**
   * Get comments for a gossip post
   */
  async getComments(gossipId: string, page = 1, limit = 20) {
    return await apiClient.get<{ comments: GossipComment[] }>(
      `/gossip/${gossipId}/comments`,
      {
        params: { page, limit },
      }
    );
  },
};
