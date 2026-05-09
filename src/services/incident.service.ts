/**
 * Incident Report Service
 * All API calls for community incident reports
 */

import apiClient from "@/lib/api-client";
import type {
  IncidentReport,
  IncidentListResponse,
  IncidentComment,
  IncidentStats,
  CreateIncidentPayload,
  UpdateIncidentPayload,
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
} from "@/types/incident";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export const incidentService = {
  // ── CRUD ──────────────────────────────────────────────────────────────────

  async create(payload: CreateIncidentPayload) {
    return apiClient.post<ApiResponse<{ incident: IncidentReport }>>(
      "/incident-reports",
      payload,
    );
  },

  async list(filters?: {
    page?: number;
    limit?: number;
    category?: IncidentCategory;
    severity?: IncidentSeverity;
    status?: IncidentStatus;
    lga?: string;
    state?: string;
    communityId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    return apiClient.get<ApiResponse<IncidentListResponse>>("/incident-reports", {
      params: filters,
    });
  },

  async getById(id: string) {
    return apiClient.get<ApiResponse<{ incident: IncidentReport }>>(
      `/incident-reports/${id}`,
    );
  },

  async update(id: string, payload: UpdateIncidentPayload) {
    return apiClient.patch<ApiResponse<{ incident: IncidentReport }>>(
      `/incident-reports/${id}`,
      payload,
    );
  },

  async delete(id: string) {
    return apiClient.delete<ApiResponse<null>>(`/incident-reports/${id}`);
  },

  // ── Interactions ──────────────────────────────────────────────────────────

  async interact(
    id: string,
    type: "witness" | "confirm" | "dispute",
    note?: string,
  ) {
    return apiClient.post<ApiResponse<{ toggled: boolean; message: string }>>(
      `/incident-reports/${id}/interact/${type}`,
      note ? { note } : {},
    );
  },

  // ── Comments ──────────────────────────────────────────────────────────────

  async listComments(id: string, page = 1, limit = 30) {
    return apiClient.get<
      ApiResponse<{ comments: IncidentComment[]; pagination: unknown }>
    >(`/incident-reports/${id}/comments`, { params: { page, limit } });
  },

  async addComment(
    id: string,
    body: string,
    isAnonymous = false,
    parentId?: string,
  ) {
    return apiClient.post<ApiResponse<{ comment: IncidentComment }>>(
      `/incident-reports/${id}/comments`,
      { body, isAnonymous, ...(parentId ? { parentId } : {}) },
    );
  },

  async deleteComment(commentId: string) {
    return apiClient.delete<ApiResponse<null>>(
      `/incident-reports/comments/${commentId}`,
    );
  },

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  async addUpdate(id: string, message: string, isAuthorityUpdate = false) {
    return apiClient.post<ApiResponse<{ incident: IncidentReport }>>(
      `/incident-reports/${id}/updates`,
      { message, isAuthorityUpdate },
    );
  },

  async escalate(id: string, escalatedTo: string, note?: string) {
    return apiClient.post<ApiResponse<{ incident: IncidentReport }>>(
      `/incident-reports/${id}/escalate`,
      { escalatedTo, ...(note ? { note } : {}) },
    );
  },

  async resolve(id: string, resolution: string) {
    return apiClient.post<ApiResponse<{ incident: IncidentReport }>>(
      `/incident-reports/${id}/resolve`,
      { resolution },
    );
  },

  async changeStatus(id: string, status: IncidentStatus, note?: string) {
    return apiClient.patch<ApiResponse<{ incident: IncidentReport }>>(
      `/incident-reports/${id}/status`,
      { status, ...(note ? { note } : {}) },
    );
  },

  // ── My reports & stats ────────────────────────────────────────────────────

  async getMyReports(page = 1, limit = 20) {
    return apiClient.get<ApiResponse<IncidentListResponse>>(
      "/incident-reports/my",
      { params: { page, limit } },
    );
  },

  async getStats(lga?: string, state?: string) {
    return apiClient.get<ApiResponse<IncidentStats>>("/incident-reports/stats", {
      params: { ...(lga ? { lga } : {}), ...(state ? { state } : {}) },
    });
  },
};
