import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  canPopHistory,
  navigateBack,
  resolveBackFallback,
} from './navigateBack';

describe('resolveBackFallback', () => {
  it('maps nested routes to section hubs', () => {
    expect(resolveBackFallback('/settings/location')).toBe('/huud');
    expect(resolveBackFallback('/profile/motun')).toBe('/huud');
    expect(resolveBackFallback('/marketplace/abc123')).toBe('/marketplace');
    expect(resolveBackFallback('/events/create')).toBe('/events');
    expect(resolveBackFallback('/jobs/saved')).toBe('/jobs');
  });

  it('defaults unknown paths to the map (home)', () => {
    expect(resolveBackFallback('/unknown-page')).toBe('/huud');
  });
});

describe('navigateBack', () => {
  const back = vi.fn();
  const push = vi.fn();
  const router = { back, push };

  beforeEach(() => {
    back.mockReset();
    push.mockReset();
    vi.stubGlobal('history', { length: 2 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('pops history when stack depth allows', () => {
    vi.stubGlobal('history', { length: 3 });
    navigateBack(router, { pathname: '/settings' });
    expect(back).toHaveBeenCalledOnce();
    expect(push).not.toHaveBeenCalled();
  });

  it('pushes fallback when history cannot pop', () => {
    vi.stubGlobal('history', { length: 1 });
    navigateBack(router, { pathname: '/settings/blocked' });
    expect(back).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/huud');
  });

  it('honours explicit fallback', () => {
    vi.stubGlobal('history', { length: 1 });
    navigateBack(router, { pathname: '/settings', fallback: '/login' });
    expect(push).toHaveBeenCalledWith('/login');
  });
});

describe('canPopHistory', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns false when history stack is shallow', () => {
    vi.stubGlobal('history', { length: 1 });
    expect(canPopHistory()).toBe(false);
  });

  it('returns true when history stack can pop', () => {
    vi.stubGlobal('history', { length: 2 });
    expect(canPopHistory()).toBe(true);
  });
});
