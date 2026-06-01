import { followService } from '@/services/follow.service';
import { safetyService, type GuardianRelationship } from '@/services/safety.service';

export type GuardianCandidate = {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl?: string;
};

export type LoadGuardianCandidatesResult = {
  candidates: GuardianCandidate[];
  source: 'eligible-linkers-api' | 'mutual-followers';
  error?: string;
};

function normalizeCandidate(raw: Record<string, unknown>): GuardianCandidate | null {
  const id = raw._id ?? raw.id;
  if (!id) return null;
  return {
    _id: String(id),
    firstName: String(raw.firstName ?? ''),
    lastName: String(raw.lastName ?? ''),
    username: String(raw.username ?? ''),
    avatarUrl:
      (typeof raw.avatarUrl === 'string' ? raw.avatarUrl : undefined) ||
      (typeof raw.profilePicture === 'string' ? raw.profilePicture : undefined),
  };
}

/** Parse eligible-linkers API — handles single- and double-wrapped `data`. */
function extractLinkersFromApiResponse(res: unknown): GuardianCandidate[] {
  if (!res || typeof res !== 'object') return [];
  const root = res as Record<string, unknown>;
  const data = root.data;
  const buckets: unknown[] = [];

  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    buckets.push(d.linkers, d.users, d.followers);
    if (d.data && typeof d.data === 'object') {
      const inner = d.data as Record<string, unknown>;
      buckets.push(inner.linkers, inner.users, inner.followers);
    }
  }
  buckets.push(root.linkers);

  for (const bucket of buckets) {
    if (!Array.isArray(bucket)) continue;
    const mapped = bucket
      .map((item) => (item && typeof item === 'object' ? normalizeCandidate(item as Record<string, unknown>) : null))
      .filter((u): u is GuardianCandidate => u !== null);
    if (mapped.length > 0) return mapped;
  }
  return [];
}

function extractFollowList(res: unknown, key: 'followers' | 'following'): Record<string, unknown>[] {
  if (!res || typeof res !== 'object') return [];
  const root = res as Record<string, unknown>;
  const data = root.data;
  if (!data || typeof data !== 'object') return [];
  const d = data as Record<string, unknown>;
  const list = d[key];
  if (Array.isArray(list)) return list.filter((x) => x && typeof x === 'object') as Record<string, unknown>[];
  if (d.data && typeof d.data === 'object') {
    const inner = d.data as Record<string, unknown>;
    const nested = inner[key];
    if (Array.isArray(nested)) {
      return nested.filter((x) => x && typeof x === 'object') as Record<string, unknown>[];
    }
  }
  return [];
}

function guardianUserId(g: GuardianRelationship): string | null {
  const gid = g.guardianId;
  if (typeof gid === 'string') return gid;
  return gid?._id ? String(gid._id) : null;
}

function excludeExistingGuardians(
  candidates: GuardianCandidate[],
  guardians: GuardianRelationship[],
): GuardianCandidate[] {
  const blocked = new Set<string>();
  for (const g of guardians) {
    if (g.status === 'accepted' || g.status === 'pending') {
      const id = guardianUserId(g);
      if (id) blocked.add(id);
    }
  }
  return candidates.filter((c) => !blocked.has(c._id));
}

async function fetchMutualFollowers(userId: string): Promise<GuardianCandidate[]> {
  const [followersRes, followingRes] = await Promise.all([
    followService.getFollowers(userId, 1, 100),
    followService.getFollowing(userId, 1, 100),
  ]);

  const followerRows = extractFollowList(followersRes, 'followers');
  const followingRows = extractFollowList(followingRes, 'following');

  const followerIds = new Set(
    followerRows.map((u) => String(u._id ?? u.id)).filter(Boolean),
  );

  const mutual: GuardianCandidate[] = [];
  const seen = new Set<string>();

  for (const row of followingRows) {
    const id = String(row._id ?? row.id ?? '');
    if (!id || !followerIds.has(id) || seen.has(id)) continue;
    const candidate = normalizeCandidate(row);
    if (candidate) {
      seen.add(id);
      mutual.push(candidate);
    }
  }

  return mutual;
}

function apiErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { message?: string }; status?: number } }).response;
    if (resp?.data?.message) return resp.data.message;
    if (resp?.status === 404) return 'Guardian picker API is not available — using mutual followers instead.';
  }
  if (err instanceof Error && err.message) return err.message;
  return 'Could not load followers';
}

/**
 * Load people the current user can add as guardians (mutual followers, minus pending/accepted).
 */
export async function fetchEligibleGuardianCandidates(
  userId: string,
  guardians: GuardianRelationship[],
): Promise<LoadGuardianCandidatesResult> {
  let apiError: string | undefined;

  try {
    const res = await safetyService.getEligibleLinkers();
    const fromApi = excludeExistingGuardians(extractLinkersFromApiResponse(res), guardians);
    if (fromApi.length > 0) {
      return { candidates: fromApi, source: 'eligible-linkers-api' };
    }
  } catch (err) {
    apiError = apiErrorMessage(err);
  }

  try {
    const mutual = excludeExistingGuardians(await fetchMutualFollowers(userId), guardians);
    if (mutual.length > 0) {
      return { candidates: mutual, source: 'mutual-followers' };
    }
    return {
      candidates: [],
      source: 'mutual-followers',
      error:
        apiError ??
        'No mutual followers found. Follow someone who follows you back, then try again.',
    };
  } catch (err) {
    return {
      candidates: [],
      source: 'mutual-followers',
      error: apiError ?? apiErrorMessage(err),
    };
  }
}
