import { resolveProfilePersonalName, type ProfileNameSource } from '@/lib/profileSnapHelpers';
import type { User } from '@/types/api';

export type ProfileFieldSource = ProfileNameSource &
  Record<string, unknown> & {
    phoneNumber?: string | null;
    phone?: string | null;
    phone_number?: string | null;
    mobile?: string | null;
    mobileNumber?: string | null;
  };

function readString(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

/** Phone may live on different keys depending on auth vs identity vs /profile/me. */
export function resolveUserPhone(source?: ProfileFieldSource | User | null): string {
  if (!source || typeof source !== 'object') return '';
  const u = source as ProfileFieldSource;
  for (const key of ['phoneNumber', 'phone_number', 'phone', 'mobile', 'mobileNumber'] as const) {
    const v = readString(u[key]);
    if (v) return v;
  }
  return '';
}

export function resolveUserFirstName(source?: ProfileFieldSource | User | null): string {
  if (!source || typeof source !== 'object') return '';
  const u = source as ProfileFieldSource;
  const direct = readString(u.firstName ?? u.first_name);
  if (direct) return direct;

  const personal = resolveProfilePersonalName(u, u.username);
  if (!personal) return '';
  return personal.split(/\s+/)[0] ?? '';
}

export function resolveUserLastName(source?: ProfileFieldSource | User | null): string {
  if (!source || typeof source !== 'object') return '';
  const u = source as ProfileFieldSource;
  const direct = readString(u.lastName ?? u.last_name);
  if (direct) return direct;

  const personal = resolveProfilePersonalName(u, u.username);
  if (!personal) return '';
  const parts = personal.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return '';
  return parts.slice(1).join(' ');
}

export type SafetyProfileGap = 'firstName' | 'lastName' | 'phone';

export function getSafetyProfileGaps(source?: ProfileFieldSource | User | null): SafetyProfileGap[] {
  const gaps: SafetyProfileGap[] = [];
  if (!resolveUserFirstName(source)) gaps.push('firstName');
  if (!resolveUserLastName(source)) gaps.push('lastName');
  if (!resolveUserPhone(source)) gaps.push('phone');
  return gaps;
}

export function hasSafetyProfileFields(source?: ProfileFieldSource | User | null): boolean {
  return getSafetyProfileGaps(source).length === 0;
}

/** Align auth cache + React Query user with fields safety middleware expects. */
export function normalizeAuthProfileFields<T extends User>(user: T): T {
  const firstName = resolveUserFirstName(user) || user.firstName;
  const lastName = resolveUserLastName(user) || user.lastName;
  const phoneNumber = resolveUserPhone(user) || user.phoneNumber;

  return {
    ...user,
    ...(firstName ? { firstName } : {}),
    ...(lastName ? { lastName } : {}),
    ...(phoneNumber ? { phoneNumber } : {}),
  };
}
