import { describe, expect, it } from 'vitest';
import { extractLocationPoints, normalizeTrackingPoint } from '@/lib/liveTrackingApi';
import {
  getSafetyProfileGaps,
  normalizeAuthProfileFields,
  resolveUserPhone,
} from '@/lib/userProfileFields';
import type { User } from '@/types/api';

describe('resolveUserPhone', () => {
  it('reads phone_number and phone aliases', () => {
    expect(resolveUserPhone({ phone_number: '08012345678' })).toBe('08012345678');
    expect(resolveUserPhone({ phone: '+2348012345678' })).toBe('+2348012345678');
    expect(resolveUserPhone({ phoneNumber: '08099998888' })).toBe('08099998888');
  });
});

describe('normalizeTrackingPoint', () => {
  it('maps latitude/longitude at root', () => {
    const p = normalizeTrackingPoint({
      latitude: 6.58,
      longitude: 3.28,
      timestamp: '2026-01-01T12:00:00.000Z',
      source: 'network_estimate',
    });
    expect(p?.location.lat).toBe(6.58);
    expect(p?.location.lng).toBe(3.28);
  });
});

describe('extractLocationPoints', () => {
  it('reads locations array alias', () => {
    const points = extractLocationPoints({
      success: true,
      data: {
        locations: [{ lat: 1, lng: 2, timestamp: '2026-01-01T00:00:00.000Z' }],
      },
    });
    expect(points).toHaveLength(1);
  });
});

describe('normalizeAuthProfileFields', () => {
  it('maps snake_case phone onto phoneNumber', () => {
    const user = normalizeAuthProfileFields({
      id: '1',
      username: 'jane',
      email: 'j@x.com',
      first_name: 'Jane',
      last_name: 'Doe',
      phone_number: '08011112222',
      location: {} as User['location'],
      verificationStatus: 'verified',
      identityVerified: false,
      isAdmin: false,
      role: 'user',
      gamification: {} as User['gamification'],
      settings: {} as User['settings'],
      createdAt: '',
      updatedAt: '',
    } as User);

    expect(user.firstName).toBe('Jane');
    expect(user.lastName).toBe('Doe');
    expect(user.phoneNumber).toBe('08011112222');
    expect(getSafetyProfileGaps(user)).toEqual([]);
  });
});
