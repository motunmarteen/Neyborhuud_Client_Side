/**
 * Call service — REST endpoints for WebRTC audio/video calls.
 * Live signaling (offer/answer/ICE) goes over Socket.IO; this just covers
 * config (ICE/TURN servers) and persisted call history.
 */
import apiClient from '@/lib/api-client';

export type CallType = 'audio' | 'video';

export type CallStatus =
  | 'ringing'
  | 'ongoing'
  | 'ended'
  | 'missed'
  | 'rejected'
  | 'cancelled'
  | 'failed';

export interface CallRecord {
  _id: string;
  conversationId: string;
  caller: string | { _id: string; username?: string; firstName?: string; lastName?: string; avatarUrl?: string };
  callee: string | { _id: string; username?: string; firstName?: string; lastName?: string; avatarUrl?: string };
  type: CallType;
  status: CallStatus;
  startedAt: string;
  answeredAt?: string;
  endedAt?: string;
  durationSeconds: number;
  createdAt: string;
}

// Sensible fallback so a call can still attempt to connect even if the
// config endpoint fails (same-network / good-NAT cases).
const FALLBACK_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

let cachedIceServers: RTCIceServer[] | null = null;

export const callService = {
  /** Fetch ICE/TURN servers from the backend (cached for the session). */
  async getIceServers(): Promise<RTCIceServer[]> {
    if (cachedIceServers) return cachedIceServers;
    try {
      const res = await apiClient.get<{ iceServers: RTCIceServer[] }>(
        '/calls/ice-servers',
      );
      const servers = res.data?.iceServers;
      cachedIceServers =
        Array.isArray(servers) && servers.length > 0 ? servers : FALLBACK_ICE_SERVERS;
    } catch {
      cachedIceServers = FALLBACK_ICE_SERVERS;
    }
    return cachedIceServers;
  },

  async getCallHistory(conversationId: string, page = 1, limit = 20) {
    const res = await apiClient.get<{ calls: CallRecord[]; pagination: unknown }>(
      `/calls/history/${conversationId}?page=${page}&limit=${limit}`,
    );
    return res.data;
  },

  async getRecentCalls(limit = 30) {
    const res = await apiClient.get<{ calls: CallRecord[] }>(
      `/calls/recent?limit=${limit}`,
    );
    return res.data?.calls ?? [];
  },
};
