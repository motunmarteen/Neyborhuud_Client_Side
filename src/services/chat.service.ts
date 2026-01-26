/**
 * Chat Service
 * Handles messaging and conversations
 */

import apiClient from "@/lib/api-client";
import { Conversation, ChatMessage, PaginatedResponse } from "@/types/api";

export const chatService = {
  /**
   * Get all conversations
   */
  async getConversations(page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<Conversation>>(
      "/social/conversations",
      {
        params: { page, limit },
      },
    );
  },

  /**
   * Get a single conversation
   */
  async getConversation(conversationId: string) {
    return await apiClient.get<Conversation>(
      `/social/conversations/${conversationId}`,
    );
  },

  /**
   * Create a new conversation
   */
  async createConversation(participantIds: string[], groupName?: string) {
    return await apiClient.post<Conversation>("/social/conversations", {
      participantIds,
      type: participantIds.length > 1 ? "group" : "direct",
      groupName,
    });
  },

  /**
   * Get messages in a conversation
   */
  async getMessages(conversationId: string, page = 1, limit = 50) {
    return await apiClient.get<PaginatedResponse<ChatMessage>>(
      `/social/conversations/${conversationId}/messages`,
      {
        params: { page, limit },
      },
    );
  },

  /**
   * Send a text message
   */
  async sendMessage(conversationId: string, content: string, replyTo?: string) {
    return await apiClient.post<ChatMessage>(
      `/social/conversations/${conversationId}/messages`,
      {
        content,
        type: "text",
        replyTo,
      },
    );
  },

  /**
   * Send a media message
   */
  async sendMediaMessage(
    conversationId: string,
    file: File,
    content?: string,
    onProgress?: (progress: number) => void,
  ) {
    return await apiClient.uploadFile<ChatMessage>(
      `/social/conversations/${conversationId}/messages`,
      file,
      {
        content: content || "",
        type: file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
            ? "video"
            : "file",
      },
      onProgress,
    );
  },

  /**
   * Edit a message
   */
  async editMessage(messageId: string, content: string) {
    return await apiClient.put<ChatMessage>(`/social/messages/${messageId}`, {
      content,
    });
  },

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string) {
    return await apiClient.delete(`/social/messages/${messageId}`);
  },

  /**
   * Mark conversation as read
   */
  async markAsRead(conversationId: string) {
    return await apiClient.post(`/social/conversations/${conversationId}/read`);
  },

  /**
   * Pin a conversation
   */
  async pinConversation(conversationId: string) {
    return await apiClient.post(`/social/conversations/${conversationId}/pin`);
  },

  /**
   * Unpin a conversation
   */
  async unpinConversation(conversationId: string) {
    return await apiClient.delete(
      `/social/conversations/${conversationId}/pin`,
    );
  },

  /**
   * Mute a conversation
   */
  async muteConversation(conversationId: string) {
    return await apiClient.post(`/social/conversations/${conversationId}/mute`);
  },

  /**
   * Unmute a conversation
   */
  async unmuteConversation(conversationId: string) {
    return await apiClient.delete(
      `/social/conversations/${conversationId}/mute`,
    );
  },

  /**
   * Leave a group conversation
   */
  async leaveConversation(conversationId: string) {
    return await apiClient.post(
      `/social/conversations/${conversationId}/leave`,
    );
  },

  /**
   * Add participants to group
   */
  async addParticipants(conversationId: string, userIds: string[]) {
    return await apiClient.post(
      `/social/conversations/${conversationId}/participants`,
      {
        userIds,
      },
    );
  },

  /**
   * Remove participant from group
   */
  async removeParticipant(conversationId: string, userId: string) {
    return await apiClient.delete(
      `/social/conversations/${conversationId}/participants/${userId}`,
    );
  },

  /**
   * Update group details
   */
  async updateGroup(
    conversationId: string,
    groupName?: string,
    groupPhoto?: File,
  ) {
    if (groupPhoto) {
      return await apiClient.uploadFile(
        `/social/conversations/${conversationId}`,
        groupPhoto,
        { groupName },
      );
    }
    return await apiClient.put(`/social/conversations/${conversationId}`, {
      groupName,
    });
  },
};
