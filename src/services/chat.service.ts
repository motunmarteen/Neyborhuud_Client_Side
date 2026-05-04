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

/** Generate a UUID v4 idempotency key. Uses browser crypto when available, otherwise falls back to RFC 4122-compliant manual generation. */
function newClientMessageId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // RFC 4122 version 4 UUID fallback (no external dep)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const chatService = {
  // ─── Conversations ──────────────────────────────────────────────────────

  /** List all conversations the calling user participates in. */
  async getConversations(page = 1, limit = 20) {
    return await apiClient.get<{ conversations: Conversation[]; pagination: any }>(
      "/chat/conversations",
      { params: { page, limit } },
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
   * Fetch messages for a conversation (newest-first; reverse for display).
   * This call also triggers server-side auto-delivery marking.
   */
  async getMessages(conversationId: string, page = 1, limit = 50) {
    return await apiClient.get<{ messages: ChatMessage[]; pagination: any }>(
      `/chat/messages/${conversationId}`,
      { params: { page, limit } },
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

  /** Soft-delete a message (sets isDeleted = true). */
  async deleteMessage(messageId: string) {
    return await apiClient.delete(`/chat/messages/${messageId}`);
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
};
