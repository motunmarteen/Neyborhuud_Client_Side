import { getApiUrl } from '@/lib/api';
import type { User } from '@/types/api';

export type AvatarSource = {
  profilePicture?: string | null;
  avatarUrl?: string | null;
  avatar?: string | null;
};

/** Turn API-relative media paths into absolute URLs the browser can load. */
export function resolveMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  try {
    const origin = new URL(getApiUrl()).origin;
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${origin}${path}`;
  } catch {
    return trimmed;
  }
}

/**
 * Best-effort avatar URL for the signed-in user or any author/profile shape.
 * Backend fields vary (`profilePicture` vs `avatarUrl`); prefer the uploaded photo field first.
 */
export function resolveUserAvatarUrl(source?: AvatarSource | null): string | null {
  if (!source) return null;

  const raw =
    source.profilePicture?.trim() ||
    source.avatarUrl?.trim() ||
    source.avatar?.trim() ||
    '';

  if (!raw) return null;
  return resolveMediaUrl(raw);
}

/** Keep both avatar fields aligned in auth cache after /profile/me or uploads. */
export function normalizeUserAvatarFields<T extends AvatarSource>(user: T): T {
  const resolved = resolveUserAvatarUrl(user);
  if (!resolved) return user;

  return {
    ...user,
    profilePicture: user.profilePicture?.trim() || resolved,
    avatarUrl: user.avatarUrl?.trim() || resolved,
  };
}

export function normalizeAuthUser(user: User): User {
  return normalizeUserAvatarFields(user);
}
