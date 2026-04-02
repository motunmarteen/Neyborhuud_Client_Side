/**
 * Persists backend-assigned community (Mongo ObjectId) for geo routes and UI.
 * Backend returns community.id (24-char hex) + optional locationKey (slug); never send slug as :communityId.
 */

const COMMUNITY_KEY = "neyborhuud_community";
const USER_KEY = "neyborhuud_user";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

export type StoredCommunity = {
  id: string;
  locationKey?: string;
  communityName?: string;
  name?: string;
  state?: string;
  lga?: string;
  ward?: string;
};

function isObjectId(s: string): boolean {
  return OBJECT_ID_RE.test(s);
}

export function normalizeCommunityPayload(raw: unknown): StoredCommunity | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = o.id;
  if (typeof id !== "string" || !isObjectId(id)) return null;
  return {
    id,
    locationKey: typeof o.locationKey === "string" ? o.locationKey : undefined,
    communityName:
      typeof o.communityName === "string"
        ? o.communityName
        : typeof o.name === "string"
          ? o.name
          : undefined,
    name: typeof o.name === "string" ? o.name : undefined,
    state: typeof o.state === "string" ? o.state : undefined,
    lga: typeof o.lga === "string" ? o.lga : undefined,
    ward: typeof o.ward === "string" ? o.ward : undefined,
  };
}

function pickAssignedId(
  assignedCommunityId: string | null | undefined,
  user: unknown,
  community: StoredCommunity | null,
): string | null {
  if (typeof assignedCommunityId === "string" && isObjectId(assignedCommunityId)) {
    return assignedCommunityId;
  }
  if (user && typeof user === "object") {
    const v = (user as Record<string, unknown>).assignedCommunityId;
    if (typeof v === "string" && isObjectId(v)) return v;
  }
  return community?.id ?? null;
}

/** After login / register / verify-email: store user + community (full user replace). */
export function persistAuthSessionPayload(data: {
  user?: unknown;
  community?: unknown;
  assignedCommunityId?: string | null;
}): void {
  if (typeof window === "undefined") return;

  const comm = normalizeCommunityPayload(data.community);
  const assigned = pickAssignedId(
    data.assignedCommunityId,
    data.user,
    comm,
  );

  if (comm) {
    localStorage.setItem(COMMUNITY_KEY, JSON.stringify(comm));
  }

  if (data.user && typeof data.user === "object") {
    const u = { ...(data.user as Record<string, unknown>) };
    if (assigned) u.assignedCommunityId = assigned;
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    return;
  }

  if (assigned) {
    patchStoredUserCommunity(assigned, null);
  }
}

/** After GET /profile/me: only merge community fields (do not replace whole user). */
export function applyProfileMeCommunity(data: {
  assignedCommunityId?: string | null;
  community?: unknown;
}): void {
  if (typeof window === "undefined") return;
  patchStoredUserCommunity(
    typeof data.assignedCommunityId === "string"
      ? data.assignedCommunityId
      : undefined,
    data.community,
  );
}

export function patchStoredUserCommunity(
  assignedCommunityId: string | undefined,
  community: unknown | null,
): void {
  if (typeof window === "undefined") return;

  const comm =
    community === null ? null : normalizeCommunityPayload(community);
  if (comm) {
    localStorage.setItem(COMMUNITY_KEY, JSON.stringify(comm));
  }

  const id =
    assignedCommunityId && isObjectId(assignedCommunityId)
      ? assignedCommunityId
      : comm?.id ?? null;
  if (!id) return;

  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return;
  try {
    const u = JSON.parse(raw) as Record<string, unknown>;
    u.assignedCommunityId = id;
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  } catch {
    /* ignore */
  }
}

export function getStoredCommunity(): StoredCommunity | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(COMMUNITY_KEY);
  if (!raw) return null;
  try {
    return normalizeCommunityPayload(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Use for /geo/communities/:communityId/... */
export function getCommunityIdForApi(): string | null {
  const c = getStoredCommunity();
  if (c?.id) return c.id;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const u = JSON.parse(raw) as Record<string, unknown>;
    const id = u.assignedCommunityId;
    return typeof id === "string" && isObjectId(id) ? id : null;
  } catch {
    return null;
  }
}
