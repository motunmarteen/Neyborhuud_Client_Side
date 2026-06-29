import { describe, expect, it } from 'vitest';
import { getVerificationDisplayStatus, isCommunityVerified } from '@/lib/userVerification';

describe('userVerification legacy wrappers', () => {
  it('maps gold tier to verified display status', () => {
    const input = {
      emailVerified: true,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      firstName: 'Ada',
      lastName: 'Okafor',
      avatarUrl: 'https://example.com/a.jpg',
      bio: 'Neighbour in Surulere',
      assignedCommunityId: 'c1',
      location: { latitude: 6.5, longitude: 3.3 },
      trustScore: 320,
      huudCoins: 600,
    };
    expect(isCommunityVerified(input)).toBe(true);
    expect(getVerificationDisplayStatus(input)).toBe('verified');
  });

  it('maps silver to progress display status', () => {
    const input = {
      emailVerified: true,
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      firstName: 'Ada',
      lastName: 'Okafor',
      avatarUrl: 'https://example.com/a.jpg',
      bio: 'Neighbour in Surulere',
      assignedCommunityId: 'c1',
    };
    expect(getVerificationDisplayStatus(input)).toBe('progress');
  });
});
