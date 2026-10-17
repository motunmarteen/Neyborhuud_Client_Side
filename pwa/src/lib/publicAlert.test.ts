import { describe, expect, it } from 'vitest';
import { ageWords, areaName, statusWords, type LiveAlert } from './publicAlert';
import { alertShareStatus } from '@/components/feed/ShareModal';

const live = (o: Partial<LiveAlert>): LiveAlert => ({
  state: 'live', title: 'Fire', body: '', emergencyType: 'fire', severity: 'critical',
  area: { lga: 'Alimosho', state: 'Lagos' }, mapCentre: null, createdAt: new Date().toISOString(), expiresAt: null,
  status: 'unconfirmed', confirmCount: 0, disputeCount: 0, nearbyCount: 0, ...o,
});

describe('shared safety alerts (share safely)', () => {
  it('says plainly whether neighbours confirmed it', () => {
    expect(statusWords(live({})).badge).toBe('⚠️ Unconfirmed');
    expect(statusWords(live({ status: 'confirmed', confirmCount: 3, nearbyCount: 2 })).line).toBe('Confirmed by neighbours (5)');
    expect(statusWords(live({ status: 'disputed', disputeCount: 4 })).tone).toBe('red');
  });
  it('shows age and area', () => {
    const now = Date.parse('2026-10-17T12:00:00Z');
    expect(ageWords('2026-10-17T11:48:00Z', now)).toBe('12 min ago');
    expect(ageWords('2026-10-15T12:00:00Z', now)).toBe('2 days ago');
    expect(areaName({ lga: 'Alimosho', state: 'Lagos' })).toBe('Alimosho, Lagos');
  });
  it('knows which posts are safety alerts and how they stand', () => {
    expect(alertShareStatus({ contentType: 'post' })).toBeUndefined();
    expect(alertShareStatus({ contentType: 'emergency', verificationStatus: 'unverified' })).toBe('unconfirmed');
    expect(alertShareStatus({ contentType: 'emergency', verificationStatus: 'community_confirmed' })).toBe('confirmed');
    expect(alertShareStatus({ contentType: 'emergency', verificationStatus: 'disputed' })).toBe('disputed');
  });
});
