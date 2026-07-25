import apiClient from "@/lib/api-client";

export type GuardianStatus = "pending" | "accepted" | "rejected" | "removed";

// ─── Geofence types ─────────────────────────────────────────────────────────

export type GeofenceType = "safe_zone" | "alert_zone" | "restricted_zone";

export interface Geofence {
  _id: string;
  userId: string;
  label: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  type: GeofenceType;
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
  notifyGuardians: boolean;
  triggerSos: boolean;
  lastStatus?: "inside" | "outside";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGeofencePayload {
  label: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  type?: GeofenceType;
  notifyOnEntry?: boolean;
  notifyOnExit?: boolean;
  notifyGuardians?: boolean;
  triggerSos?: boolean;
}

export interface GeofenceAlertEvent {
  geofenceId: string;
  label: string;
  type: GeofenceType;
  event: "entry" | "exit";
  location: { lat: number; lng: number };
  context: string;
  timestamp: string;
  message: string;
  /** Only present in guardian-facing alerts */
  userId?: string;
  userName?: string;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface GuardianRelationship {
  _id: string;
  userId: string | { _id: string; firstName?: string; lastName?: string; email?: string; avatarUrl?: string };
  guardianId:
    | string
    | { _id: string; firstName?: string; lastName?: string; email?: string; phoneNumber?: string; avatarUrl?: string };
  nickname?: string;
  relationshipType?: "parent" | "spouse" | "sibling" | "friend" | "colleague" | "other";
  priorityLevel: number;
  isTemporary: boolean;
  expiresAt?: string;
  status: GuardianStatus;
  createdAt: string;
}

export type CircleStatus = "pending" | "accepted" | "rejected" | "removed";

export interface CircleMember {
  _id: string;
  userId: string | { _id: string; firstName?: string; lastName?: string; username?: string; avatarUrl?: string };
  memberId: string | { _id: string; firstName?: string; lastName?: string; username?: string; avatarUrl?: string };
  status: CircleStatus;
  createdAt: string;
}

export interface SosEvent {
  _id: string;
  userId: string;
  status: "pending" | "triggered" | "active" | "resolved" | "cancelled";
  visibilityMode: "normal" | "silent";
  /** True when this event was a "Run a guardian drill" practice run, not a real emergency. */
  isDrill?: boolean;
  escalationLevel: number;
  countdownSeconds?: number;
  pendingUntil?: string | null;
  cancelReason?: string | null;
  cancelledDuringPending?: boolean;
  emergencyServicesEnabled?: boolean;
  emergencyServicesDispatchedAt?: string;
  emergencyServicesDispatch?: Record<string, any>;
  preSosContext?: {
    lastStatus?: string;
    statusTimestamp?: string;
    lastKnownLocation?: { lat: number; lng: number; address?: string };
  };
  location: {
    lat: number;
    lng: number;
    address?: string;
    lga?: string;
    state?: string;
  };
  createdAt: string;
  resolvedAt?: string;
}

export interface UserStatus {
  _id?: string;
  userId: string;
  currentStatus:
    | "safe"
    | "on_the_move"
    | "in_transit"
    | "unsafe"
    | "heading_home"
    | "arrived"
    | "need_attention";
  customMessage?: string;
  location?: {
    type: "Point";
    coordinates: [number, number];
    address?: string;
  };
  lastUpdatedAt: string;
  visibility: "guardians_only";
  isLocationStale?: boolean;
}

// ─── Emergency types ─────────────────────────────────────────────────────────

export type EmergencyType =
  | "sos"
  | "fire"
  | "medical"
  | "accident"
  | "crime"
  | "other"
  | "panic_button"
  | "armed_robbery"
  | "kidnapping"
  | "medical_emergency"
  | "fire_emergency"
  | "natural_disaster"
  | "security"
  | "harassment"
  | "unknown";

export type EmergencySource = "manual_report" | "manual_sos" | "trip_monitoring" | "geofence";
export type DispatchStatus = "pending" | "sent" | "failed" | "not_required";

export type AgencyName = "NPF" | "NEMA" | "DSS" | "NSCDC" | "Fire Service" | "Medical Services" | "FRSC";

export interface Emergency {
  _id: string;
  userId: string;
  type: EmergencyType;
  description?: string;
  location: { lat: number; lng: number; address?: string; lga?: string; state?: string };
  status: "active" | "responding" | "resolved" | "false_alarm";
  severity?: "low" | "medium" | "high" | "critical";
  priority: "low" | "medium" | "high" | "critical";
  source?: EmergencySource;
  dispatchStatus?: DispatchStatus;
  dispatchReferenceId?: string;
  dispatchAttempts?: number;
  respondersCount: number;
  assignedAgency?: AgencyName;
  agencyNotified?: boolean;
  agencyNotifiedAt?: string;
  escalationDetails?: Record<string, any>;
  reporterContact?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ReportEmergencyPayload {
  type: EmergencyType;
  severity?: "low" | "medium" | "high" | "critical";
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  reporterContact?: string;
  deviceInfo?: Record<string, any>;
}

// ─────────────────────────────────────────────────────────────────────────────

export const safetyService = {
  async requestGuardian(payload: {
    guardianId?: string;
    email?: string;
    phoneNumber?: string;
    nickname?: string;
    relationshipType?: "parent" | "spouse" | "sibling" | "friend" | "colleague" | "other";
    priorityLevel?: number;
    isTemporary?: boolean;
    expiresAt?: string;
  }) {
    return apiClient.post<{ guardian: GuardianRelationship }>("/safety/guardians/request", payload);
  },

  async respondGuardian(payload: { requestId: string; action: "accepted" | "rejected" }) {
    return apiClient.post<{ guardian: GuardianRelationship }>("/safety/guardians/respond", payload);
  },

  async getGuardians(status?: GuardianStatus) {
    return apiClient.get<{ guardians: GuardianRelationship[] }>("/safety/guardians", {
      params: status ? { status } : undefined,
    });
  },

  async getIncomingGuardianRequests() {
    return apiClient.get<{ requests: GuardianRelationship[] }>("/safety/guardians/requests/incoming");
  },

  async removeGuardian(guardianId: string) {
    return apiClient.delete(`/safety/guardians/${guardianId}`);
  },

  async getEligibleLinkers() {
    return apiClient.get<{ linkers: Array<{ _id: string; firstName: string; lastName: string; username: string; avatarUrl?: string; email?: string }> }>("/safety/guardians/eligible-linkers");
  },

  async triggerSos(payload: {
    latitude: number;
    longitude: number;
    address?: string;
    lga?: string;
    state?: string;
    visibilityMode?: "normal" | "silent";
    emergencyServicesEnabled?: boolean;
    /** 0..30. Defaults to 5 server-side. Forced to 0 when visibilityMode='silent'. */
    countdownSeconds?: number;
    deviceInfo?: Record<string, any>;
    /**
     * Client-generated idempotency key. Set this when a trigger might be
     * retried (e.g. queued offline and resent after reconnecting) so the
     * server can recognize a retry of an attempt that already succeeded
     * instead of creating a duplicate SOS.
     */
    clientId?: string;
  }) {
    return apiClient.post<{
      status: "pending" | "active" | "already_active";
      sosEventId: string;
      emergencyId: string | null;
      conversationId: string | null;
      guardiansTotal: number;
      escalationQueued: boolean;
      visibilityMode: "normal" | "silent";
      emergencyServicesEnabled?: boolean;
      countdownSeconds?: number;
      pendingUntil?: string | null;
      preSosContext?: SosEvent["preSosContext"] | null;
    }>("/safety/sos/trigger", payload);
  },

  async acknowledgeSos(sosEventId: string) {
    return apiClient.post(`/safety/sos/${sosEventId}/acknowledge`);
  },

  async resolveSos(sosEventId: string) {
    return apiClient.post<{ sosEvent: SosEvent; summary?: import("@/types/api").IncidentSummary }>(
      `/safety/sos/${sosEventId}/resolve`,
    );
  },

  async cancelSos(sosEventId: string, reason?: string) {
    return apiClient.post<{ sosEvent: SosEvent }>(`/safety/sos/${sosEventId}/cancel`, { reason });
  },

  async getSosSummary(sosEventId: string) {
    return apiClient.get<{ summary: import("@/types/api").IncidentSummary }>(
      `/safety/sos/${sosEventId}/summary`,
    );
  },

  /**
   * Attach or replace a short personal note on a resolved SOS incident
   * (e.g. "this was a training exercise"). Surfaced on the Incident Recap page.
   */
  async addSosIncidentNote(sosEventId: string, note: string) {
    return apiClient.post<{ sosEventId: string; note: string; noteUpdatedAt: string | null }>(
      `/safety/sos/${sosEventId}/note`,
      { note },
    );
  },

  /**
   * Fire a real, server-reaching SOS "drill" — notifies the caller's actual
   * guardians (clearly labeled as a practice run) so they get genuine
   * practice acknowledging an alert, WITHOUT ever creating a real Emergency
   * record or reaching agency dispatch, no matter what.
   */
  async triggerSosDrill(payload: { latitude: number; longitude: number; address?: string; lga?: string; state?: string }) {
    return apiClient.post<{ status: "active" | "already_active"; sosEventId: string; isDrill: true; guardiansNotified: number }>(
      "/safety/sos/drill",
      payload,
    );
  },

  /** Guardian acknowledges a drill SOS (distinct from the real SOS acknowledge). */
  async acknowledgeSosDrill(sosEventId: string) {
    return apiClient.post(`/safety/sos/${sosEventId}/drill-acknowledge`);
  },

  // ─── Safety Circle (opt-in, view-only status access for mutual followers) ─

  async inviteToCircle(memberId: string) {
    return apiClient.post<{ invite: CircleMember }>("/safety/circle/invite", { memberId });
  },

  async respondToCircleInvite(inviteId: string, action: "accepted" | "rejected") {
    return apiClient.post<{ invite: CircleMember }>(`/safety/circle/invites/${inviteId}/respond`, { action });
  },

  async removeCircleMember(memberId: string) {
    return apiClient.delete<{ removed: CircleMember }>(`/safety/circle/${memberId}`);
  },

  /** People I've invited into my own circle. */
  async getMyCircle() {
    return apiClient.get<{ members: CircleMember[] }>("/safety/circle/mine");
  },

  /** Circle invites sent to me, awaiting my response. */
  async getIncomingCircleInvites() {
    return apiClient.get<{ invites: CircleMember[] }>("/safety/circle/incoming");
  },

  /** Circles I belong to (i.e. whose status I can view). */
  async getCirclesIBelongTo() {
    return apiClient.get<{ circles: CircleMember[] }>("/safety/circle/belong-to");
  },

  // ─── Wellness Check-Ins (standalone, trip-independent) ───────────────────

  async startWellnessCheckIn(intervalMinutes?: number) {
    return apiClient.post<{ schedule: WellnessCheckIn }>("/safety/checkins/start", { intervalMinutes });
  },

  async getActiveWellnessCheckIn() {
    return apiClient.get<{ schedule: WellnessCheckIn | null }>("/safety/checkins/active");
  },

  async submitWellnessCheckIn() {
    return apiClient.post<{ schedule: WellnessCheckIn }>("/safety/checkins/checkin");
  },

  async pauseWellnessCheckIn() {
    return apiClient.post<{ schedule: WellnessCheckIn }>("/safety/checkins/pause");
  },

  async resumeWellnessCheckIn() {
    return apiClient.post<{ schedule: WellnessCheckIn }>("/safety/checkins/resume");
  },

  async stopWellnessCheckIn() {
    return apiClient.post<{ schedule: WellnessCheckIn | null }>("/safety/checkins/stop");
  },

  // ─── Panic PIN (duress code) ─────────────────────────────────────────────

  async getPanicPinStatus() {
    return apiClient.get<{ panicPinSet: boolean; panicPinUpdatedAt: string | null }>(
      "/safety/panic-pin/status",
    );
  },

  async setPanicPin(payload: { pin: string; currentPin?: string }) {
    return apiClient.post<{ panicPinSet: true }>("/safety/panic-pin", payload);
  },

  async removePanicPin(currentPin: string) {
    return apiClient.delete<{ panicPinSet: false }>("/safety/panic-pin", {
      data: { currentPin },
    });
  },

  async verifyPanicPin(payload: {
    pin: string;
    latitude?: number;
    longitude?: number;
    address?: string;
  }) {
    return apiClient.post<{ verified: true }>("/safety/panic-pin/verify", payload);
  },

  async getActiveSos() {
    return apiClient.get<{ sosEvent: SosEvent | null }>("/safety/sos/active");
  },

  async getSosHistory(limit = 20, page = 1) {
    return apiClient.get<{ events: SosEvent[]; total: number; page: number; limit: number }>("/safety/sos/history", {
      params: { limit, page },
    });
  },

  async getGuardianActivity(sosEventId: string) {
    return apiClient.get<{ logs: Array<{ _id: string; guardianId: any; action: string; timestamp: string }> }>(
      `/safety/guardian-activity/${sosEventId}`,
    );
  },

  async updateStatus(payload: {
    currentStatus:
      | "safe"
      | "on_the_move"
      | "in_transit"
      | "unsafe"
      | "heading_home"
      | "arrived"
      | "need_attention";
    customMessage?: string;
    location?: { latitude: number; longitude: number; address?: string };
    visibility?: "guardians_only";
  }) {
    return apiClient.post<{ status: UserStatus }>("/safety/status/update", payload);
  },

  /** Current user's latest guardian status (if exposed by API). */
  async getMyStatus() {
    return apiClient.get<{ status: UserStatus | null }>("/safety/status/me");
  },

  async getStatus(userId: string) {
    return apiClient.get<{ status: UserStatus | null }>(`/safety/status/${userId}`);
  },

  async getGuardiansFeed() {
    return apiClient.get<{ feed: UserStatus[] }>("/safety/status/guardians-feed");
  },

  // ─── Geofencing ────────────────────────────────────────────────────────

  async createGeofence(payload: CreateGeofencePayload) {
    return apiClient.post<{ geofence: Geofence }>("/safety/geofences", payload);
  },

  async listGeofences() {
    return apiClient.get<{ geofences: Geofence[] }>("/safety/geofences");
  },

  async updateGeofence(fenceId: string, payload: Partial<CreateGeofencePayload> & { isActive?: boolean }) {
    return apiClient.patch<{ geofence: Geofence }>(`/safety/geofences/${fenceId}`, payload);
  },

  async deleteGeofence(fenceId: string) {
    return apiClient.delete(`/safety/geofences/${fenceId}`);
  },

  /**
   * Send a GPS ping to the server for background geofence evaluation.
   * Call this from the PWA service worker or on foreground location updates.
   */
  async checkGeofenceLocation(latitude: number, longitude: number) {
    return apiClient.post<{ message: string }>("/safety/geofences/check", { latitude, longitude });
  },

  // ─── Emergency Reporting ─────────────────────────────────────────────────

  async reportEmergency(payload: ReportEmergencyPayload) {
    return apiClient.post<{
      report: Emergency;
      conversationId: string | null;
      /** A verified contact number to show alongside the dispatch — see agencyContact.ts for sourcing. */
      agencyContact: { agency: string; number: string; note: string } | null;
    }>("/safety/emergency/report", {
      type: payload.type,
      severity: payload.severity,
      description: payload.description,
      location: {
        latitude: payload.latitude,
        longitude: payload.longitude,
        address: payload.address,
      },
      reporterContact: payload.reporterContact,
      deviceInfo: payload.deviceInfo,
    });
  },

  async escalateEmergency(emergencyId: string) {
    return apiClient.post<{
      emergency: Emergency;
      agencyResponse: { success: boolean; referenceId: string; agencyName: string; message?: string };
    }>(`/safety/emergency/${emergencyId}/escalate`);
  },

  async getActiveEmergencies() {
    return apiClient.get<{ emergencies: Emergency[] }>("/safety/emergency/active");
  },

  async getRecentEmergencies(limit = 20) {
    return apiClient.get<{ emergencies: Emergency[] }>("/safety/emergency/history", {
      params: { limit },
    });
  },

  async resolveEmergency(emergencyId: string) {
    return apiClient.post(`/safety/emergency/${emergencyId}/resolve`, { status: "resolved" });
  },

  /** Cancel a mistakenly-filed emergency report ("never mind, that was wrong"). */
  async cancelEmergency(emergencyId: string, reason?: string) {
    return apiClient.post<{ emergency: Emergency }>(`/safety/emergency/${emergencyId}/cancel`, { reason });
  },

  /** Acknowledge an emergency report (distinct from acknowledging an SOS). */
  async acknowledgeEmergency(emergencyId: string) {
    return apiClient.post<{ emergencyId: string; acknowledged: true; totalAcknowledged: number }>(
      `/safety/emergency/${emergencyId}/acknowledge`,
    );
  },

  /** Summary stats for the user's own emergency-report history. */
  async getEmergencyStats() {
    return apiClient.get<{
      totalEmergencies: number;
      activeEmergencies: number;
      resolvedEmergencies: number;
      falseAlarms: number;
      avgResponseTimeMinutes: number;
    }>("/safety/emergency/stats");
  },

  /**
   * Fetch a forensic replay timeline for a single emergency incident.
   * Merges location pings, incident chat messages, and system state events
   * into a unified chronological timeline.
   *
   * Access: the victim, their accepted guardians, and admins.
   */
  async getIncidentReplay(emergencyId: string) {
    return apiClient.get<import("@/types/api").IncidentReplay>(
      `/safety/emergency/${emergencyId}/replay`,
    );
  },

  // ─── Safety Settings ─────────────────────────────────────────────────────
  // Matches exactly what the backend persists (UserPreference.safetySettings)
  // and returns — earlier versions of this type listed several fields
  // (defaultVisibilityMode, checkInIntervalMinutes, autoSosOnMissedCheckIns,
  // shareLocationWithGuardians) that the backend never actually implemented
  // or read; only emergencyServicesEnabled and the two redZone* fields below
  // are real.

  async getSafetySettings() {
    return apiClient.get<{
      safetySettings: {
        emergencyServicesEnabled: boolean;
        redZoneMinSeverity?: "all" | "high" | "critical";
        redZoneWorkAreaEnabled?: boolean;
        /** Personal Sentinel sensitivity dial: 0-10 floor on the underlying threat score. */
        redZoneMinThreatScore?: number;
      };
    }>("/safety/settings");
  },

  async updateSafetySettings(settings: {
    emergencyServicesEnabled?: boolean;
    redZoneMinSeverity?: "all" | "high" | "critical";
    redZoneWorkAreaEnabled?: boolean;
    redZoneMinThreatScore?: number;
  }) {
    return apiClient.patch<{
      safetySettings: {
        emergencyServicesEnabled: boolean;
        redZoneMinSeverity?: "all" | "high" | "critical";
        redZoneWorkAreaEnabled?: boolean;
        redZoneMinThreatScore?: number;
      };
    }>("/safety/settings", settings);
  },
};

// ─── Kidnapping Tracking Types ────────────────────────────────────────────────

export type KidnappingEmergencyType = "kidnapping" | "armed_robbery" | "other_critical";
export type TrackingSessionStatus = "active" | "ended" | "lost_signal";
export type LocationSource = "gps" | "network_estimate" | "network" | "carrier" | "triangulation";

export interface WellnessCheckIn {
  _id: string;
  userId: string;
  intervalMinutes: number;
  status: "active" | "paused" | "stopped";
  lastCheckIn: string;
  nextCheckInDue: string;
  missedCheckIns: number;
  escalationLevel: number;
  createdAt: string;
  updatedAt: string;
}

export interface KidnappingTrackingSession {
  _id: string;
  userId: string;
  emergencyId?: string;
  sosEventId?: string;
  activatedBy: "user" | "sos" | "emergency";
  emergencyType: KidnappingEmergencyType;
  status: TrackingSessionStatus;
  intervalSeconds: number;
  deviceInfo: {
    deviceType?: string;
    osVersion?: string;
    batteryLevel?: number;
    networkType?: string;
  };
  authorityNotified: boolean;
  authorityNotifiedAt?: string;
  assignedAgencies: string[];
  lastPingAt?: string;
  missedPings: number;
  startLocation?: { lat: number; lng: number; address?: string };
  summary: {
    totalDistanceMeters: number;
    totalPoints: number;
    avgSpeedKmh: number;
    maxSpeedKmh: number;
    stationarySeconds: number;
    lastMovedAt?: string;
  };
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** A session as returned to a guardian browsing what they can currently watch. */
export interface GuardianWatchableSession extends Omit<KidnappingTrackingSession, 'userId'> {
  userId: string | { _id: string; firstName?: string; lastName?: string };
}

export interface TrackingLocationPoint {
  _id: string;
  location: { lat: number; lng: number; address?: string };
  source: LocationSource;
  accuracy?: number;
  accuracyLevel?: "high" | "medium" | "low";
  speed?: number;
  heading?: number;
  battery?: number;
  networkType?: string;
  deviceType?: string;
  timestamp: string;
}

export interface TrackingSummary {
  totalDistanceMeters: number;
  totalPoints: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  stationarySeconds: number;
  durationSeconds: number;
  lastMovedAt?: string;
  lastPingAt?: string;
  startLocation?: { lat: number; lng: number };
}

export interface TriangulationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  method: LocationSource;
}

// ─── Kidnapping Tracking Service Methods ─────────────────────────────────────

export const kidnappingTrackingService = {
  /** Start a kidnapping tracking session manually. */
  async startSession(payload: {
    emergencyType?: KidnappingEmergencyType;
    emergencyId?: string;
    sosEventId?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    deviceInfo?: { deviceType?: string; osVersion?: string; batteryLevel?: number; networkType?: string };
    intervalSeconds?: number;
  }) {
    return apiClient.post<{ session: KidnappingTrackingSession }>(
      "/safety/kidnapping/sessions/start",
      payload,
    );
  },

  /** Log a location update to the active session. */
  async logLocation(
    sessionId: string,
    payload: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      heading?: number;
      speed?: number;
      source?: LocationSource;
      /** ISO string — device capture time (authoritative ordering for offline sync) */
      capturedAt?: string;
      /** Client-generated UUID — idempotency key preventing duplicate DB rows */
      clientId?: string;
      deviceInfo?: { deviceType?: string; osVersion?: string; batteryLevel?: number; networkType?: string };
    },
  ) {
    return apiClient.post<{ logged: boolean; sessionId: string }>(
      `/safety/kidnapping/sessions/${sessionId}/location`,
      payload,
    );
  },

  /** Upload multiple offline-queued points in a single request (max 100 per call). */
  async batchLogLocations(
    sessionId: string,
    points: Array<{
      latitude: number;
      longitude: number;
      accuracy?: number;
      heading?: number;
      speed?: number;
      source?: LocationSource;
      capturedAt?: string;
      clientId?: string;
      deviceInfo?: { batteryLevel?: number; networkType?: string };
    }>,
  ) {
    return apiClient.post<{
      summary: Array<{ index: number; clientId: string | null; status: 'ok' | 'failed'; duplicate: boolean; error?: string }>;
      failed: number;
    }>(
      `/safety/kidnapping/sessions/${sessionId}/location/batch`,
      { points },
    );
  },

  /** Get the caller's current active session. */
  async getActiveSession() {
    return apiClient.get<{ session: KidnappingTrackingSession | null }>(
      "/safety/kidnapping/sessions/active",
    );
  },

  /** Get a specific session (owner or guardian). */
  async getSession(sessionId: string) {
    return apiClient.get<{ session: KidnappingTrackingSession }>(
      `/safety/kidnapping/sessions/${sessionId}`,
    );
  },

  /** All live sessions the caller can currently watch as an accepted guardian. */
  async getActiveSessionsForGuardian() {
    return apiClient.get<{ sessions: GuardianWatchableSession[] }>(
      "/safety/kidnapping/sessions/guardian-active",
    );
  },

  /** Full location history with optional time slice. */
  async getLocationHistory(
    sessionId: string,
    params: { from?: string; to?: string; limit?: number; skip?: number } = {},
  ) {
    return apiClient.get<{ points: TrackingLocationPoint[]; total: number }>(
      `/safety/kidnapping/sessions/${sessionId}/history`,
      { params },
    );
  },

  /** Most recent location point. */
  async getLatestLocation(sessionId: string) {
    return apiClient.get<{ location: TrackingLocationPoint | null }>(
      `/safety/kidnapping/sessions/${sessionId}/latest`,
    );
  },

  /** Computed tracking summary. */
  async getTrackingSummary(sessionId: string) {
    return apiClient.get<{ summary: TrackingSummary }>(
      `/safety/kidnapping/sessions/${sessionId}/summary`,
    );
  },

  /** End the tracking session. */
  async stopSession(sessionId: string) {
    return apiClient.post<{ session: KidnappingTrackingSession }>(
      `/safety/kidnapping/sessions/${sessionId}/stop`,
      {},
    );
  },

  /** Fallback location estimation via network triangulation. */
  async triangulate(cellData?: {
    mcc: number;
    mnc: number;
    lac: number;
    cid: number;
  }) {
    return apiClient.post<{ location: TriangulationResult }>(
      "/safety/kidnapping/triangulate",
      cellData ? { cellData } : {},
    );
  },
};
