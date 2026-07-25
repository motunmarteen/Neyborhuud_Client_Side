/**
 * Chat Service
 * Handles messaging and conversations — wired to /api/v1/chat/* endpoints.
 *
 * Key design decisions:
 *  - Every sendMessage call generates a clientMessageId (UUID v4) for server-side
 *    deduplication. If the server returns { duplicate: true } the caller can safely ignore.
 *  - API base is /chat/* (NOT /social/conversations/*)
 */

import apiClient from "@/lib/api-client";
import { Conversation, ChatMessage } from "@/types/api";
import { newIdempotencyKey as newClientMessageId } from "@/lib/idempotency";

export const chatService = {
  // ─── Conversations ──────────────────────────────────────────────────────

  /**
   * List all conversations the calling user participates in.
   *
   * Pagination (audit finding #23/#24/#26): the backend reads `before`
   * (a createdAt cursor on ConversationParticipant, for the primary
   * infinite-scroll path) and, only as a legacy fallback when `before` is
   * omitted, a numeric `offset`. It has never read `page` — the frontend
   * used to send `page` here, which the server silently ignored. `before`
   * is what real "load more" pagination should use going forward.
   */
  async getConversations(opts: { limit?: number; before?: string } = {}) {
    const { limit = 20, before } = opts;
    return await apiClient.get<{ conversations: Conversation[]; pagination: any }>(
      "/chat/conversations",
      { params: { limit, ...(before ? { before } : {}) } },
    );
  },

  /**
   * Get or create a 1-to-1 (direct) conversation with another user.
   * Backend finds an existing DM before creating a new one.
   */
  async getOrCreateDirectConversation(userId: string) {
    return await apiClient.get<Conversation>(`/chat/conversations/${userId}`);
  },

  /**
   * Start (or resume) a marketplace-tagged conversation about a specific product.
   * Call this instead of getOrCreateDirectConversation when the user taps
   * "Message Seller" / "Contact Seller" on a product listing.
   *
   * POST /chat/conversations/marketplace/:productId
   *
   * Error codes to handle:
   *   400 — Cannot message yourself about your own product
   *   404 — Product not found
   *   410 — Product is no longer active/available
   */
  async startMarketplaceConversation(productId: string) {
    return await apiClient.post<{ conversation: Conversation }>(
      `/chat/conversations/marketplace/${productId}`,
    );
  },

  /**
   * Get conversation detail by conversation ID — returns metadata + participants.
   */
  async getConversationDetail(conversationId: string) {
    return await apiClient.get<{ conversation: Conversation }>(`/chat/conversations/detail/${conversationId}`);
  },

  /** Create a named group conversation. */
  async createGroup(name: string, participantIds: string[]) {
    return await apiClient.post<Conversation>("/chat/groups", {
      name,
      participantIds,
    });
  },

  /** Leave a conversation. Blocked for incident-type conversations (403). */
  async leaveConversation(conversationId: string) {
    return await apiClient.post(`/chat/conversations/${conversationId}/leave`);
  },

  /** Mute or unmute a conversation. */
  async muteConversation(conversationId: string, muted: boolean) {
    return await apiClient.post(`/chat/conversations/${conversationId}/mute`, { muted });
  },

  // ─── Participants ───────────────────────────────────────────────────────

  /** Add a participant to a group. Caller must be admin or moderator. */
  async addParticipant(conversationId: string, userId: string, role: "member" | "moderator" = "member") {
    return await apiClient.post(
      `/chat/groups/${conversationId}/participants`,
      { userId, role },
    );
  },

  /** Remove a participant from a group. Blocked for incident-type conversations. */
  async removeParticipant(conversationId: string, userId: string) {
    return await apiClient.delete(
      `/chat/groups/${conversationId}/participants/${userId}`,
    );
  },

  // ─── Messages ───────────────────────────────────────────────────────────

  /**
   * Fetch messages for a conversation (newest-first from the server, already
   * reversed to oldest-first before it responds). This call also triggers
   * server-side auto-delivery marking.
   *
   * Pagination (audit finding #23/#24/#26): the backend's cursor is `before`
   * (an ISO createdAt cursor on Message) — it never read `page`. Pass
   * `before` = the createdAt of the OLDEST currently-loaded message to load
   * older history (used by the chat thread's scroll-to-top "load more").
   */
  async getMessages(conversationId: string, opts: { limit?: number; before?: string } = {}) {
    const { limit = 50, before } = opts;
    return await apiClient.get<{ messages: ChatMessage[]; pagination: { limit: number; nextCursor: string | null } }>(
      `/chat/messages/${conversationId}`,
      { params: { limit, ...(before ? { before } : {}) } },
    );
  },

  /**
   * Send a message. A clientMessageId is auto-generated for deduplication.
   * If the server returns { duplicate: true } the message was already received.
   */
  async sendMessage(params: {
    conversationId: string;
    content: string;
    type?: string;
    mediaUrl?: string;
    thumbnailUrl?: string;
    replyTo?: string;
    locationSnapshot?: { latitude: number; longitude: number; address?: string };
    emergencyRef?: string;
    trackingSessionRef?: string;
    meta?: Record<string, any>;
  }) {
    const clientMessageId = newClientMessageId();
    return await apiClient.post<ChatMessage | { duplicate: boolean }>("/chat/send", {
      ...params,
      type: params.type ?? "text",
      clientMessageId,
    });
  },

  /** Edit the content of a sent message. */
  async editMessage(messageId: string, content: string) {
    return await apiClient.put<ChatMessage>(`/chat/messages/${messageId}`, { content });
  },

  /**
   * Delete a message. `deleteForEveryone: false` (the default) is a
   * per-viewer "delete for me" — hides the message only for the requester,
   * everyone else keeps seeing it unchanged (audit finding #18/#26).
   * `deleteForEveryone: true` replaces the content for all participants;
   * only the sender or a group admin/moderator may do this.
   */
  async deleteMessage(messageId: string, deleteForEveryone = false) {
    return await apiClient.delete(`/chat/messages/${messageId}`, {
      data: { deleteForEveryone },
    });
  },

  /**
   * Report a specific message for moderation review (audit finding #9/#16).
   * Mirrors the reason categories used elsewhere (post/comment reporting).
   */
  async reportMessage(messageId: string, reason: string, description?: string) {
    return await apiClient.post(`/chat/messages/${messageId}/report`, {
      reason,
      description,
    });
  },

  // ─── Read / Delivered ───────────────────────────────────────────────────

  /** Mark all messages in a conversation as read for the calling user. */
  async markAsRead(conversationId: string) {
    return await apiClient.post(`/chat/conversations/${conversationId}/read`);
  },

  /**
   * Explicitly mark messages as delivered (optional — getMessages auto-delivers).
   */
  async markAsDelivered(conversationId: string) {
    return await apiClient.post(`/chat/conversations/${conversationId}/delivered`);
  },

  // ─── Media ──────────────────────────────────────────────────────────────

  /** Upload a media file for use in a chat message. Returns mediaUrl + thumbnailUrl. */
  async uploadChatMedia(file: File, onProgress?: (percent: number) => void) {
    return await apiClient.uploadFile<{
      url: string;
      mediaUrl?: string; // alias, may also be present
      thumbnailUrl?: string;
      mediaType: string;
    }>("/chat/upload", file, undefined, onProgress);
  },

  // ─── E2EE Key Bundle ────────────────────────────────────────────────────

  /** Fetch active public keys for all participants in a conversation. */
  async getKeyBundle(conversationId: string) {
    return await apiClient.get<{
      conversationId: string;
      bundle: Record<string, { publicKey: string; algorithm: string; publishedAt: string }>;
      participantCount: number;
      keysAvailable: number;
      /** UserIds of participants who have NOT registered a public key. */
      missingKeys: string[];
    }>(`/chat/conversations/${conversationId}/key-bundle`);
  },

  async setReaction(messageId: string, emoji: string) {
    return await apiClient.post<{ reactions: Record<string, { count: number; userIds: string[] }> }>(
      `/chat/messages/${messageId}/reactions`,
      { emoji },
    );
  },

  async removeReaction(messageId: string) {
    return await apiClient.delete<{ reactions: Record<string, { count: number; userIds: string[] }> }>(
      `/chat/messages/${messageId}/reactions`,
    );
  },

  async startCall(conversationId: string, callType: 'voice' | 'video' = 'voice') {
    return await apiClient.post(`/chat/conversations/${conversationId}/calls`, { callType });
  },

  async endCall(conversationId: string, sessionId: string) {
    return await apiClient.post(`/chat/conversations/${conversationId}/calls/${sessionId}/end`);
  },

  async getActiveCall(conversationId: string) {
    return await apiClient.get<{ session: { id: string; callType: string; status: string } | null }>(
      `/chat/conversations/${conversationId}/calls/active`,
    );
  },

  // ── Incognito Invite (time-boxed "witness" participants) ──

  /** Propose inviting a user into this chat for `durationSeconds`. */
  async proposeIncognitoInvite(conversationId: string, inviteeId: string, durationSeconds: number) {
    return await apiClient.post<{ invite: { _id: string; status: string } }>(
      `/chat/${conversationId}/incognito/invite`,
      { inviteeId, durationSeconds },
    );
  },

  /** Approve (or decline) a proposed invite (dual consent). */
  async reviewIncognitoInvite(inviteId: string, approve: boolean) {
    return await apiClient.post(`/chat/incognito/${inviteId}/approve`, { approve });
  },

  /** Invitee accepts an approved invite and joins for the window. */
  async acceptIncognitoInvite(inviteId: string) {
    return await apiClient.post<{ conversationId: string; windowStart: string; expiresAt: string }>(
      `/chat/incognito/${inviteId}/accept`,
    );
  },
};
