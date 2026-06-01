/**
 * Huud Gist service — community threads for Local News (/huud-gist API)
 */

import apiClient from '@/lib/api-client';
import { buildGistSectionList } from '@/lib/huudGistConfig';
import type {
  CreateGistCommentPayload,
  CreateHuudGistPayload,
  GistLikeResponse,
  GistSection,
  HuudGistComment,
  HuudGistDetailResponse,
  HuudGistListResponse,
  HuudGistPagination,
  HuudGistPost,
  UpdateHuudGistPayload,
} from '@/types/huudGist';

const BASE = '/huud-gist';

export const huudGistService = {
  async getSections(): Promise<GistSection[]> {
    try {
      const response = await apiClient.get<{
        sections: Array<{ id: string; label: string; description?: string | null }>;
      }>(`${BASE}/sections`);
      if (response.data?.sections?.length) {
        return buildGistSectionList(response.data.sections);
      }
    } catch {
      // fall through
    }
    return buildGistSectionList([]);
  },

  async createThread(payload: CreateHuudGistPayload) {
    return await apiClient.post<{ gossip: HuudGistPost }>(BASE, payload);
  },

  async listThreads(filters?: {
    type?: string;
    section?: string;
    lga?: string;
    state?: string;
    tag?: string;
    language?: string;
    page?: number;
    limit?: number;
  }) {
    return await apiClient.get<HuudGistListResponse>(BASE, { params: filters });
  },

  async getThread(threadId: string) {
    return await apiClient.get<HuudGistDetailResponse>(`${BASE}/${threadId}`);
  },

  async updateThread(threadId: string, payload: UpdateHuudGistPayload) {
    return await apiClient.put<{ gossip: HuudGistPost }>(`${BASE}/${threadId}`, payload);
  },

  async deleteThread(threadId: string) {
    return await apiClient.delete(`${BASE}/${threadId}`);
  },

  async likeThread(threadId: string) {
    return await apiClient.post<GistLikeResponse>(`${BASE}/${threadId}/like`, {});
  },

  async addComment(threadId: string, payload: CreateGistCommentPayload) {
    return await apiClient.post<{ comment: HuudGistComment }>(
      `${BASE}/${threadId}/comments`,
      payload,
    );
  },

  async getComments(
    threadId: string,
    options?: { parentId?: string; page?: number; limit?: number },
  ) {
    return await apiClient.get<{
      comments: HuudGistComment[];
      pagination: HuudGistPagination;
    }>(`${BASE}/${threadId}/comments`, { params: options });
  },

  async likeComment(threadId: string, commentId: string) {
    return await apiClient.post<GistLikeResponse>(
      `${BASE}/${threadId}/comments/${commentId}/like`,
      {},
    );
  },

  async deleteComment(threadId: string, commentId: string) {
    return await apiClient.delete(`${BASE}/${threadId}/comments/${commentId}`);
  },
};
