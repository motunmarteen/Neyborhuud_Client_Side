import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  extractAccessToken,
  parseSafeNextPath,
  resolvePostAuthRoute,
} from './authSession';

vi.mock('@/lib/api-client', () => ({
  default: {
    isAuthenticated: vi.fn(),
    get: vi.fn(),
    clearToken: vi.fn(),
  },
}));

vi.mock('@/lib/communityContext', () => ({
  getNeedsCommunitySelection: vi.fn(() => false),
  getNeedsGpsLocationVerification: vi.fn(() => false),
}));

vi.mock('@/lib/onboarding', () => ({
  getPostSetupRoute: vi.fn(() => '/setup-complete'),
}));

import {
  getNeedsCommunitySelection,
  getNeedsGpsLocationVerification,
} from '@/lib/communityContext';

describe('extractAccessToken', () => {
  it('reads nested session tokens', () => {
    expect(
      extractAccessToken({ session: { access_token: 'abc' } }),
    ).toBe('abc');
  });

  it('prefers top-level token', () => {
    expect(
      extractAccessToken({ token: 'top', session: { access_token: 'nested' } }),
    ).toBe('top');
  });
});

describe('parseSafeNextPath', () => {
  it('allows internal paths', () => {
    expect(parseSafeNextPath('/admin')).toBe('/admin');
    expect(parseSafeNextPath('/feed?tab=1')).toBe('/feed?tab=1');
  });

  it('blocks open redirects', () => {
    expect(parseSafeNextPath('https://evil.com')).toBeNull();
    expect(parseSafeNextPath('//evil.com')).toBeNull();
    expect(parseSafeNextPath('')).toBeNull();
  });
});

describe('resolvePostAuthRoute', () => {
  beforeEach(() => {
    vi.mocked(getNeedsCommunitySelection).mockReturnValue(false);
    vi.mocked(getNeedsGpsLocationVerification).mockReturnValue(false);
  });

  it('prioritizes community selection gate', () => {
    vi.mocked(getNeedsCommunitySelection).mockReturnValue(true);
    expect(resolvePostAuthRoute('/admin')).toBe('/pick-community');
  });

  it('honors safe next when no gates', () => {
    expect(resolvePostAuthRoute('/admin')).toBe('/admin');
  });

  it('falls back to setup-complete', () => {
    expect(resolvePostAuthRoute()).toBe('/setup-complete');
  });
});

describe('resolvePostVerifyRoute', () => {
  beforeEach(() => {
    vi.mocked(getNeedsCommunitySelection).mockReturnValue(false);
    vi.mocked(getNeedsGpsLocationVerification).mockReturnValue(false);
  });

  it('returns pick-community when gate active', async () => {
    const { resolvePostVerifyRoute } = await import('./authSession');
    vi.mocked(getNeedsCommunitySelection).mockReturnValue(true);
    expect(resolvePostVerifyRoute()).toBe('/pick-community');
  });
});
