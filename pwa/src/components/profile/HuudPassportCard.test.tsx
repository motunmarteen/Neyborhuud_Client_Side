import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { HuudPassportCard } from './HuudPassportCard';

afterEach(() => {
  cleanup();
});

describe('HuudPassportCard', () => {
  const samplePassport = {
    userId: 'user-123',
    userName: 'Chinedu Eze',
    communityName: 'Victoria Island',
    lga: 'Eti-Osa',
    state: 'Lagos',
    maskedPostcode: 'LA 01 *** ** 09',
    addressProofLevel: 4,
    addressProofLevelName: 'Neighbor Attested (Trust Graph)',
    residenceTenureMonths: 14,
    trustScore: 480,
    verificationDate: '2026-10-01T12:00:00Z',
    qrPayload: '{"uid":"user-123"}',
    qrHash: 'a1b2c3d4e5f67890abcdef1234567890',
  };

  it('renders resident name and community location correctly', () => {
    render(<HuudPassportCard passport={samplePassport} />);

    expect(screen.getByText('Chinedu Eze')).toBeDefined();
    expect(screen.getByText(/Victoria Island, Eti-Osa, Lagos/)).toBeDefined();
  });

  it('displays masked digital postcode for privacy preservation', () => {
    render(<HuudPassportCard passport={samplePassport} />);

    expect(screen.getByText('LA 01 *** ** 09')).toBeDefined();
    expect(screen.getByText('Physical Building ID (NIPOST NDAPS)')).toBeDefined();
  });

  it('displays proof level and tenure properly', () => {
    render(<HuudPassportCard passport={samplePassport} />);

    expect(screen.getByText('L4 Verified')).toBeDefined();
    expect(screen.getByText('Neighbor Attested (Trust Graph)')).toBeDefined();
    expect(screen.getByText(/1 yr, 2 mos/)).toBeDefined();
    expect(screen.getByText(/480 Pts/)).toBeDefined();
  });
});
