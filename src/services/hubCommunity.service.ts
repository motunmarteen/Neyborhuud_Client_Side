import apiClient from '@/lib/api-client';
import type { CreateHubPayload, HubCommunity, HubInviteInfo } from '@/types/hubCommunity';

const BASE = '/hub-communities';

export const hubCommunityService = {
  async list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    joined?: 'true' | 'false' | 'all';
  }) {
    return apiClient.get<{
      hubs: HubCommunity[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(BASE, { params });
  },

  async get(hubId: string) {
    return apiClient.get<{ hub: HubCommunity }>(`${BASE}/${hubId}`);
  },

  async getByConversation(conversationId: string) {
    return apiClient.get<{ hub: HubCommunity }>(
      `${BASE}/conversation/${conversationId}`,
    );
  },

  async create(payload: CreateHubPayload) {
    return apiClient.post<{ hub: HubCommunity }>(BASE, payload);
  },

  async join(hubId: string, message?: string) {
    return apiClient.post<{
      hub: HubCommunity;
      conversationId?: string;
      chatSynced?: boolean;
      alreadyMember?: boolean;
      pending?: boolean;
      requestId?: string;
    }>(`${BASE}/${hubId}/join`, { message });
  },

  async leave(hubId: string) {
    return apiClient.post(`${BASE}/${hubId}/leave`);
  },

  async getMembers(hubId: string, page = 1, limit = 30) {
    return apiClient.get<{
      members: Array<{
        id: string;
        role: string;
        username?: string;
        firstName?: string;
        lastName?: string;
        avatarUrl: string | null;
      }>;
      pagination: { page: number; total: number; totalPages: number };
    }>(`${BASE}/${hubId}/members`, { params: { page, limit } });
  },

  async createInvite(hubId: string, opts?: { expiresInHours?: number; maxUses?: number }) {
    return apiClient.post<HubInviteInfo>(`${BASE}/${hubId}/invites`, opts);
  },

  async listInvites(hubId: string) {
    return apiClient.get<{ invites: HubInviteInfo[] }>(`${BASE}/${hubId}/invites`);
  },

  async joinByCode(code: string) {
    return apiClient.post<{
      hub: HubCommunity;
      conversationId?: string;
      pending?: boolean;
    }>(`${BASE}/join/${code}`);
  },

  async previewInvite(code: string) {
    return apiClient.get<{ hub: Partial<HubCommunity>; code: string }>(
      `${BASE}/join/${code}/preview`,
    );
  },

  async listJoinRequests(hubId: string) {
    return apiClient.get<{ requests: import('@/types/hubCommunity').HubJoinRequestItem[] }>(
      `${BASE}/${hubId}/join-requests`,
    );
  },

  async reviewJoinRequest(
    hubId: string,
    requestId: string,
    action: 'approve' | 'reject',
  ) {
    return apiClient.post(`${BASE}/${hubId}/join-requests/${requestId}/review`, { action });
  },
};
