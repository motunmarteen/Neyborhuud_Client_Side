import { describe, expect, it } from 'vitest';
import {
  getVerificationTier,
  getVerificationProgress,
  isSilverProfileReady,
} from '@/lib/verificationIdentity';

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

describe('verificationIdentity', () => {
  it('starts at none before email and account age', () => {
    expect(getVerificationTier({ isVerified: true, createdAt: new Date().toISOString() })).toBe(
      'none',
    );
  });

  it('reaches bronze with email and account age', () => {
    expect(
      getVerificationTier({
        emailVerified: true,
        createdAt: daysAgo(5),
      }),
    ).toBe('bronze');
  });

  it('reaches silver without phone or KYC — profile + community instead', () => {
    expect(
      isSilverProfileReady({
        firstName: 'Ada',
        lastName: 'Okafor',
        avatarUrl: 'https://example.com/a.jpg',
        bio: 'Neighbour in Surulere',
        assignedCommunityId: 'community-1',
      }),
    ).toBe(true);

    expect(
      getVerificationTier({
        emailVerified: true,
        createdAt: daysAgo(10),
        firstName: 'Ada',
        lastName: 'Okafor',
        avatarUrl: 'https://example.com/a.jpg',
        bio: 'Neighbour in Surulere',
        assignedCommunityId: 'community-1',
      }),
    ).toBe('silver');
  });

  it('does not use identityVerified as a shortcut to gold', () => {
    expect(
      getVerificationTier({
        emailVerified: true,
        createdAt: daysAgo(30),
        firstName: 'Ada',
        lastName: 'Okafor',
        avatarUrl: 'https://example.com/a.jpg',
        bio: 'Neighbour in Surulere',
        assignedCommunityId: 'community-1',
        identityVerified: true,
        trustScore: 50,
      }),
    ).toBe('silver');
  });

  it('reaches gold with trust, location, and activity', () => {
    expect(
      getVerificationTier({
        emailVerified: true,
        createdAt: daysAgo(30),
        firstName: 'Ada',
        lastName: 'Okafor',
        avatarUrl: 'https://example.com/a.jpg',
        bio: 'Neighbour in Surulere',
        assignedCommunityId: 'community-1',
        location: { latitude: 6.5, longitude: 3.3 },
        trustScore: 320,
        huudCoins: 600,
      }),
    ).toBe('gold');
  });

  it('returns progress blockers for next tier', () => {
    const progress = getVerificationProgress({
      emailVerified: true,
      createdAt: daysAgo(10),
      firstName: 'Ada',
      lastName: 'Okafor',
    });
    expect(progress.tier).toBe('bronze');
    expect(progress.blockers.length).toBeGreaterThan(0);
  });
});
