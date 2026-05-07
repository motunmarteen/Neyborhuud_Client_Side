/**
 * Trust Service (TrustOS)
 * API calls for vouching, trust score management, and activity log.
 */

import apiClient from "@/lib/api-client";

export interface VouchStatus {
  hasVouched: boolean;          // current user has already vouched for this user
  canVouch: boolean;            // current user is eligible to vouch (Tier 3)
  vouchCount: number;           // total vouches target has received
  vouchesNeeded: number;        // vouches still needed to reach Tier 3 (0 if already Tier 3)
  // Hyperlocal proximity
  distanceMeters: number | null;  // null if either user has no location
  withinRange: boolean | null;    // null if location unavailable; true = ≤500m
  locationRequired: boolean;      // true if one/both users are missing location
}

export interface VouchRecord {
  id: string;
  voucherId: string;
  voucherUsername: string;
  voucherAvatar?: string;
  createdAt: string;
}

/**
 * A single trust activity event – mirrors TrustEvent enum on the backend
 * plus the wallet/gamification events we surface synthetically.
 */
export type TrustEventType =
  | "id_verified"
  | "job_completed"
  | "product_sold"
  | "helpful_vote_received"
  | "emergency_reported"
  | "vouch_received"
  | "vouch_given"
  | "vouch_revoked"
  | "vouch_lost"
  | "streak_milestone"
  | "badge_earned"
  | "penalty_abuse"
  | "toxic_report_resolved";

export const TRUST_EVENT_META: Record<
  TrustEventType,
  { label: string; icon: string; positive: boolean }
> = {
  id_verified:            { label: "Identity Verified",        icon: "verified",          positive: true  },
  job_completed:          { label: "Job Completed",            icon: "work",              positive: true  },
  product_sold:           { label: "Product Sold",             icon: "storefront",        positive: true  },
  helpful_vote_received:  { label: "Helpful Vote Received",    icon: "thumb_up",          positive: true  },
  emergency_reported:     { label: "Emergency Reported",       icon: "emergency",         positive: true  },
  vouch_received:         { label: "Vouch Received",           icon: "handshake",         positive: true  },
  vouch_given:            { label: "Vouched a Neighbour",      icon: "group_add",         positive: true  },
  vouch_revoked:          { label: "Vouch Revoked",            icon: "heart_broken",      positive: false },
  vouch_lost:             { label: "Vouch Lost",               icon: "person_remove",     positive: false },
  streak_milestone:       { label: "Streak Milestone",         icon: "local_fire_department", positive: true  },
  badge_earned:           { label: "Badge Earned",             icon: "military_tech",     positive: true  },
  penalty_abuse:          { label: "Community Penalty",        icon: "warning",           positive: false },
  toxic_report_resolved:  { label: "Report Resolved (penalty)", icon: "gavel",           positive: false },
};

export interface TrustActivityEntry {
  id: string;
  eventType: TrustEventType;
  pointsChange: number;       // positive = gain, negative = loss
  currentScore: number;       // score after this event
  reason?: string;            // free-text context
  metadata?: Record<string, unknown>;
  createdAt: string;          // ISO timestamp
}

export interface TrustProfileResponse {
  score: number;
  isVerified: boolean;
  recentEvents: TrustActivityEntry[];
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

  /**
   * Get the authenticated user's trust profile, including activity log.
   * GET /gamification/trust-profile
   */
  async getMyTrustProfile() {
    return await apiClient.get<TrustProfileResponse>(`/gamification/trust-profile`);
  },

  /**
   * Get a specific user's public trust profile.
   * GET /gamification/users/:userId/trust-profile  (falls back to /users/:userId/stats)
   */
  async getUserTrustProfile(userId: string) {
    return await apiClient.get<TrustProfileResponse>(
      `/gamification/users/${userId}/trust-profile`
    );
  },
};
