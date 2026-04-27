/**
 * Gossip Service
 * API calls for anonymous gossip posts and comments
 */

import apiClient from "@/lib/api-client";
import {
  GossipPost,
  GossipComment,
  CreateGossipPayload,
  CreateCommentPayload,
  UpdateGossipPayload,
  GossipListResponse,
  GossipDetailResponse,
  GossipPagination,
  LikeResponse,
} from "@/types/gossip";

export const gossipService = {
  async createGossip(payload: CreateGossipPayload) {
    return await apiClient.post<{ gossip: GossipPost }>("/gossip", payload);
  },

  async listGossip(filters?: {
    type?: string;
    lga?: string;
    state?: string;
    tag?: string;
    language?: string;
    feedTab?: string;
    page?: number;
    limit?: number;
  }) {
    return await apiClient.get<GossipListResponse>("/gossip", {
      params: filters,
    });
  },

  async getGossip(gossipId: string) {
    return await apiClient.get<GossipDetailResponse>(`/gossip/${gossipId}`);
  },

  async updateGossip(gossipId: string, payload: UpdateGossipPayload) {
    return await apiClient.put<{ gossip: GossipPost }>(
      `/gossip/${gossipId}`,
      payload,
    );
  },

  async deleteGossip(gossipId: string) {
    return await apiClient.delete(`/gossip/${gossipId}`);
  },

  async likeGossip(gossipId: string) {
    return await apiClient.post<LikeResponse>(`/gossip/${gossipId}/like`, {});
  },

  async addComment(gossipId: string, payload: CreateCommentPayload) {
    return await apiClient.post<{ comment: GossipComment }>(
      `/gossip/${gossipId}/comments`,
      payload,
    );
  },

  async getComments(
    gossipId: string,
    options?: { parentId?: string; page?: number; limit?: number },
  ) {
    return await apiClient.get<{
      comments: GossipComment[];
      pagination: GossipPagination;
    }>(`/gossip/${gossipId}/comments`, { params: options });
  },

  async likeComment(gossipId: string, commentId: string) {
    return await apiClient.post<LikeResponse>(
      `/gossip/${gossipId}/comments/${commentId}/like`,
      {},
    );
  },

  async deleteComment(gossipId: string, commentId: string) {
    return await apiClient.delete(`/gossip/${gossipId}/comments/${commentId}`);
  },

  async getUserGossips(options?: { page?: number; limit?: number }) {
    return await apiClient.get<GossipListResponse>("/gossip/me", {
      params: options,
    });
  },
};
