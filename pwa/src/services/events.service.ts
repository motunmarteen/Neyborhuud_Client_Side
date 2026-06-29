/**
 * Events Service
 * Handles event creation, management, and attendance
 */

import apiClient from "@/lib/api-client";
import {
  Event,
  PaginatedResponse,
  CreateEventPayload,
  User,
  Comment,
} from "@/types/api";

export interface EventCommentInput {
  body: string;
  mediaUrls?: string[];
  parentId?: string;
}

/** Share payload from GET /events/:id/share (also used when parsing wrapped API responses). */
export interface EventSharePlatforms {
  whatsapp?: string;
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  telegram?: string;
  email?: string;
}

export interface EventSharePayload {
  eventId: string;
  title: string;
  webUrl: string;
  deepLink: string;
  message: string;
  platforms: EventSharePlatforms;
  /** True when GET /share failed and we built links from the open event page (dev / older API). */
  clientFallback?: boolean;
}

/** Fields from the event detail page used when GET /events/:id/share is unavailable (404/503). */
export interface EventShareFallbackInput {
  title: string;
  startDate?: string;
  venue?: string;
}

function httpStatusFromUnknownError(e: unknown): number | undefined {
  if (!e || typeof e !== "object") return undefined;
  const res = (e as { response?: { status?: number } }).response;
  return typeof res?.status === "number" ? res.status : undefined;
}

function formatShareWhen(d: string | undefined): string | null {
  if (!d) return null;
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return null;
  return new Date(d).toLocaleString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Build share text and platform intents in the browser (matches common server patterns). */
export function buildClientEventSharePayload(
  eventId: string,
  input: EventShareFallbackInput,
): EventSharePayload {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const webUrl = `${origin}/events/${eventId}`;
  const deepLink = `neyborhuud://events/${eventId}`;
  const when = formatShareWhen(input.startDate);
  const lines = [
    input.title,
    when ? `When: ${when}` : null,
    input.venue ? `Where: ${input.venue}` : null,
    `Link: ${webUrl}`,
  ].filter(Boolean) as string[];
  const message = lines.join("\n");
  const textEnc = encodeURIComponent(message);
  const urlEnc = encodeURIComponent(webUrl);
  const titleEnc = encodeURIComponent(input.title);
  const tweet = encodeURIComponent(`${input.title}\n${webUrl}`);
  return {
    eventId,
    title: input.title,
    webUrl,
    deepLink,
    message,
    clientFallback: true,
    platforms: {
      whatsapp: `https://wa.me/?text=${textEnc}`,
      twitter: `https://twitter.com/intent/tweet?text=${tweet}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${urlEnc}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${urlEnc}`,
      telegram: `https://t.me/share/url?url=${urlEnc}&text=${titleEnc}`,
      email: `mailto:?subject=${titleEnc}&body=${textEnc}`,
    },
  };
}

/** Unwrap `share` from typical `{ success, data: { share } }` (or root `share`) shapes. */
export function extractEventSharePayload(res: unknown): EventSharePayload | null {
  if (!res || typeof res !== "object") return null;
  const r = res as Record<string, unknown>;
  let share: unknown = r.share;
  if (!share && r.data != null && typeof r.data === "object") {
    const d = r.data as Record<string, unknown>;
    share = d.share;
    if (!share && d.data != null && typeof d.data === "object") {
      share = (d.data as Record<string, unknown>).share;
    }
  }
  if (!share || typeof share !== "object") return null;
  const s = share as Record<string, unknown>;
  const webUrl = typeof s.webUrl === "string" ? s.webUrl.trim() : "";
  const message = typeof s.message === "string" ? s.message.trim() : "";
  if (!webUrl && !message) return null;

  const platformsRaw = s.platforms;
  const platforms: EventSharePlatforms = {};
  if (platformsRaw && typeof platformsRaw === "object") {
    const p = platformsRaw as Record<string, unknown>;
    (["whatsapp", "twitter", "facebook", "linkedin", "telegram", "email"] as const).forEach((key) => {
      if (typeof p[key] === "string" && p[key]) platforms[key] = p[key] as string;
    });
  }

  return {
    eventId: String(s.eventId ?? ""),
    title: typeof s.title === "string" ? s.title : "",
    webUrl,
    deepLink: typeof s.deepLink === "string" ? s.deepLink : "",
    message: typeof s.message === "string" ? s.message : "",
    platforms,
  };
}

export const eventsService = {
  /**
   * Create a new event
   */
  async createEvent(
    payload: CreateEventPayload,
    onProgress?: (progress: number) => void,
  ) {
    if (payload.coverImage) {
      const { coverImage, ...eventData } = payload;
      return await apiClient.uploadFile<Event>(
        "/events",
        coverImage,
        eventData,
        onProgress,
      );
    }

    return await apiClient.post<Event>("/events", payload);
  },

  /**
   * Get all events
   */
  async getEvents(
    page = 1,
    limit = 20,
    filter?: {
      type?: string;
      date?: string;
      location?: string;
      status?: string;
      organizerId?: string;
    },
  ) {
    return await apiClient.get<PaginatedResponse<Event>>("/events", {
      params: { page, limit, ...filter },
    });
  },

  /**
   * Get nearby events
   */
  async getNearbyEvents(
    latitude: number,
    longitude: number,
    radius = 5000,
    page = 1,
    limit = 20,
  ) {
    return await apiClient.get<PaginatedResponse<Event>>("/events/nearby", {
      params: { lat: latitude, lng: longitude, radius, page, limit },
    });
  },

  /**
   * Get a single event
   */
  async getEvent(eventId: string) {
    return await apiClient.get<Event>(`/events/${eventId}`);
  },

  /**
   * Update an event
   */
  async updateEvent(eventId: string, data: Partial<CreateEventPayload>) {
    return await apiClient.put<Event>(`/events/${eventId}`, data);
  },

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string) {
    return await apiClient.delete(`/events/${eventId}`);
  },

  /**
   * Attend an event
   */
  async attendEvent(eventId: string) {
    return await apiClient.post(`/events/${eventId}/attend`);
  },

  /**
   * Unattend an event
   */
  async unattendEvent(eventId: string) {
    return await apiClient.delete(`/events/${eventId}/attend`);
  },

  /**
   * Get event attendees
   */
  async getAttendees(eventId: string, page = 1, limit = 50) {
    return await apiClient.get<PaginatedResponse<User>>(
      `/events/${eventId}/attendees`,
      {
        params: { page, limit },
      },
    );
  },

  /**
   * Get events I'm attending
   */
  async getMyEvents(page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<Event>>("/events/my/attending", {
      params: { page, limit },
    });
  },

  /**
   * Get events I organized
   */
  async getMyOrganizedEvents(page = 1, limit = 20) {
    return await apiClient.get<PaginatedResponse<Event>>("/events/my/organized", {
      params: { page, limit },
    });
  },

  /**
   * Cancel an event
   */
  async cancelEvent(eventId: string, reason: string) {
    return await apiClient.post(`/events/${eventId}/cancel`, { reason });
  },

  /**
   * Get server-built share text, URLs, and platform intents (public; optional auth).
   */
  async getEventSharePayload(eventId: string) {
    const res = await apiClient.get(`/events/${eventId}/share`);
    const share = extractEventSharePayload(res);
    if (!share) {
      throw new Error("Invalid share response from server.");
    }
    return share;
  },

  /**
   * Same as getEventSharePayload, but if the route is missing (404) or temporarily down (502/503)
   * and `fallback` is provided, returns {@link buildClientEventSharePayload} instead of throwing.
   */
  async getEventSharePayloadWithFallback(
    eventId: string,
    fallback?: EventShareFallbackInput | null,
  ): Promise<EventSharePayload> {
    try {
      const res = await apiClient.get(`/events/${eventId}/share`);
      const share = extractEventSharePayload(res);
      if (share) return share;
    } catch (e) {
      const st = httpStatusFromUnknownError(e);
      if (fallback?.title && (st === 404 || st === 502 || st === 503)) {
        return buildClientEventSharePayload(eventId, fallback);
      }
      throw e;
    }
    if (fallback?.title) {
      return buildClientEventSharePayload(eventId, fallback);
    }
    throw new Error("Invalid share response from server.");
  },

  /**
   * Record a completed share for analytics (authenticated users).
   */
  async recordEventShare(eventId: string) {
    return await apiClient.post(`/events/${eventId}/share`, {});
  },

  /**
   * Report an event
   */
  async reportEvent(eventId: string, reason: string, description?: string) {
    return await apiClient.post(`/events/${eventId}/report`, {
      reason,
      description,
    });
  },

  /**
   * Boost an event with HuudCoins
   */
  async boostEvent(eventId: string, days: 3 | 7) {
    return await apiClient.post<{ deducted: number; days: number; boostedUntil: string }>(
      `/events/${eventId}/boost`,
      { days },
    );
  },

  // ── Comments ────────────────────────────────────────────────────────────────

  /** List top-level comments for an event (public; optional auth). */
  async listComments(eventId: string, page = 1, limit = 30) {
    return await apiClient.get<{
      comments: Comment[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/events/${eventId}/comments`, { params: { page, limit } });
  },

  /** Add a comment (or reply, via parentId) to an event. */
  async addComment(eventId: string, input: EventCommentInput) {
    return await apiClient.post<{ comment: Comment }>(
      `/events/${eventId}/comments`,
      {
        body: input.body,
        ...(input.mediaUrls?.length ? { mediaUrls: input.mediaUrls } : {}),
        ...(input.parentId ? { parentId: input.parentId } : {}),
      },
    );
  },

  /** Soft-delete a comment (author or admin). */
  async deleteComment(commentId: string) {
    return await apiClient.delete<null>(`/events/comments/${commentId}`);
  },
};
