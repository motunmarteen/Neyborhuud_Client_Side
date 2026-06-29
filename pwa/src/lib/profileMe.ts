import type { ApiResponse } from '@/types/api';
import type { User } from '@/types/api';
import { normalizeAuthProfileFields, resolveUserPhone } from '@/lib/userProfileFields';

/** /profile/me payloads vary — user may be nested or at the root. */
export function extractUserFromProfileMePayload(data: unknown): User | null {
  if (!data || typeof data !== 'object') return null;
  const root = data as Record<string, unknown>;

  if (root.user && typeof root.user === 'object') {
    return root.user as User;
  }

  if (
    typeof root.username === 'string' ||
    typeof root.email === 'string' ||
    typeof root.id === 'string'
  ) {
    return root as unknown as User;
  }

  if (root.profile && typeof root.profile === 'object') {
    return root.profile as User;
  }

  return null;
}

export function extractUserFromProfileMeResponse(
  res: ApiResponse<unknown> | null | undefined,
): User | null {
  if (!res?.success || !res.data) return null;
  return extractUserFromProfileMePayload(res.data);
}

/** Identity service often stores phone/name when auth user document does not. */
export function extractUserFromIdentityPayload(data: unknown): Partial<User> | null {
  if (!data || typeof data !== 'object') return null;
  const root = data as Record<string, unknown>;
  const raw =
    (root.user && typeof root.user === 'object' ? root.user : null) ??
    (root.profile && typeof root.profile === 'object' ? root.profile : null) ??
    root;

  if (!raw || typeof raw !== 'object') return null;
  const u = raw as Record<string, unknown>;

  const patch: Partial<User> = {};
  const firstName = String(u.firstName ?? u.first_name ?? '').trim();
  const lastName = String(u.lastName ?? u.last_name ?? '').trim();
  const phone = resolveUserPhone(u as unknown as User);

  if (firstName) patch.firstName = firstName;
  if (lastName) patch.lastName = lastName;
  if (phone) patch.phoneNumber = phone;

  return Object.keys(patch).length > 0 ? patch : null;
}

/** Prefer main profile; fill gaps from identity (phone is the usual gap). */
export function mergeAuthUserRecords(
  primary: User | null | undefined,
  secondary: Partial<User> | null | undefined,
): User | null {
  if (!primary && !secondary) return null;
  if (!primary) return secondary ? normalizeAuthProfileFields(secondary as User) : null;

  const merged = {
    ...primary,
    ...secondary,
    firstName: primary.firstName?.trim() || secondary?.firstName,
    lastName: primary.lastName?.trim() || secondary?.lastName,
    phoneNumber: resolveUserPhone(primary) || secondary?.phoneNumber,
  } as User;

  return normalizeAuthProfileFields(merged);
}
