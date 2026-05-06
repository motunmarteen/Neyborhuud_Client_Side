/**
 * Trust Service (TrustOS)
 * API calls for vouching and trust score management.
 */

import apiClient from "@/lib/api-client";

export interface VouchStatus {
  hasVouched: boolean;          // current user has already vouched for this user
  canVouch: boolean;            // current user is eligible to vouch (Tier 3)
  vouchCount: number;           // total vouches target has received
  vouchesNeeded: number;        // vouches still needed to reach Tier 3 (0 if already Tier 3)
}

export interface VouchRecord {
  id: string;
  voucherId: string;
  voucherUsername: string;
  voucherAvatar?: string;
  createdAt: string;
}

export const trustService = {
  /**
   * Get vouch status for a target user from the current user's perspective.
   * GET /trust/vouch-status/:userId
   */
  async getVouchStatus(userId: string) {
    return await apiClient.get<VouchStatus>(`/trust/vouch-status/${userId}`);
  },

  /**
   * Vouch for a user.
   * POST /trust/vouch/:userId
   */
  async vouchForUser(userId: string) {
    return await apiClient.post<{ message: string; trustScore: number }>(
      `/trust/vouch/${userId}`,
      {}
    );
  },

  /**
   * Revoke an existing vouch.
   * DELETE /trust/vouch/:userId
   */
  async revokeVouch(userId: string) {
    return await apiClient.delete<{ message: string }>(`/trust/vouch/${userId}`);
  },

  /**
   * Get all vouches received by a user (list).
   * GET /trust/vouches/:userId
   */
  async getVouches(userId: string) {
    return await apiClient.get<VouchRecord[]>(`/trust/vouches/${userId}`);
  },
};
