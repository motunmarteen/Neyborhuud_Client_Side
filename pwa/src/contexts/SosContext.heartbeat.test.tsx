/**
 * The location_heartbeat emitted while an SOS is active.
 *
 * This one socket event drives the server's entire emergency-tracking
 * pipeline: the encrypted EmergencyTrackingLog forensic trail, the
 * sos:location_update fanout to guardians, and the live location card in the
 * incident chat. Nothing else in the app emits it, so these tests guard the
 * only thing standing between a real SOS and no live location at all.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';

const emitMock = vi.fn();
vi.mock('@/lib/socket', () => ({
  default: {
    emit: (...args: unknown[]) => emitMock(...args),
    getSocket: () => null,
    connect: vi.fn(),
    authenticate: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

const toastErrorMock = vi.fn();
vi.mock('sonner', () => ({
  toast: { error: (...args: unknown[]) => toastErrorMock(...args), success: vi.fn() },
}));

let mockUser: { id: string } | null = { id: 'victim-1' };
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock('@/lib/api-client', () => ({
  default: { isAuthenticated: () => true, getToken: () => 'tok' },
  shouldConnectSocket: () => false,
  getSocketUrl: () => '',
}));

let mockSosStatus = 'active';
vi.mock('@/services/safety.service', () => ({
  safetyService: {
    getActiveSos: vi.fn(async () => ({
      data: {
        sosEvent: {
          _id: 'sos-1',
          userId: 'victim-1',
          status: mockSosStatus,
          pendingUntil: null,
        },
      },
    })),
    triggerSos: vi.fn(),
    cancelSos: vi.fn(),
    resolveSos: vi.fn(),
  },
}));

vi.mock('@/hooks/useSosOfflineQueue', () => ({
  useSosOfflineQueue: () => ({ status: 'idle', enqueue: vi.fn() }),
}));

// Geolocation shim — the app never touches navigator.geolocation directly.
type WatchSuccess = (pos: { coords: { latitude: number; longitude: number } }) => void;
type WatchError = (err: { code: number; PERMISSION_DENIED: number }) => void;

let watchSuccess: WatchSuccess | null = null;
let watchError: WatchError | null = null;
const clearWatchMock = vi.fn();
let geoAvailable = true;

vi.mock('@/lib/nativeGeolocation', () => ({
  getGeolocation: () =>
    geoAvailable
      ? {
          getCurrentPosition: vi.fn(),
          watchPosition: (success: WatchSuccess, error: WatchError) => {
            watchSuccess = success;
            watchError = error;
            return 42;
          },
          clearWatch: (id: number) => clearWatchMock(id),
        }
      : undefined,
}));

import { SosProvider } from './SosContext';

function renderProvider() {
  return render(<SosProvider>{null}</SosProvider>);
}

describe('SosContext — location heartbeat during an active SOS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    watchSuccess = null;
    watchError = null;
    geoAvailable = true;
    mockUser = { id: 'victim-1' };
    mockSosStatus = 'active';
  });

  afterEach(() => cleanup());

  it('emits location_heartbeat with the victim id and coordinates once SOS is active', async () => {
    renderProvider();
    await waitFor(() => expect(watchSuccess).not.toBeNull());

    watchSuccess!({ coords: { latitude: 6.5, longitude: 3.3 } });

    expect(emitMock).toHaveBeenCalledWith('location_heartbeat', {
      userId: 'victim-1',
      location: { lat: 6.5, lng: 3.3 },
    });
  });

  it('throttles rapid watchPosition callbacks into at most one emit per window', async () => {
    renderProvider();
    await waitFor(() => expect(watchSuccess).not.toBeNull());

    watchSuccess!({ coords: { latitude: 6.5, longitude: 3.3 } });
    watchSuccess!({ coords: { latitude: 6.6, longitude: 3.4 } });
    watchSuccess!({ coords: { latitude: 6.7, longitude: 3.5 } });

    expect(emitMock).toHaveBeenCalledTimes(1);
  });

  it('does not start a watch when there is no active SOS', async () => {
    mockSosStatus = 'resolved';
    renderProvider();

    // Give the initial refresh() a chance to settle before asserting.
    await waitFor(() => expect(emitMock).not.toHaveBeenCalled());
    expect(watchSuccess).toBeNull();
  });

  it('stops watching when the SOS is no longer active', async () => {
    const { unmount } = renderProvider();
    await waitFor(() => expect(watchSuccess).not.toBeNull());

    unmount();

    expect(clearWatchMock).toHaveBeenCalledWith(42);
  });

  it('surfaces a toast when location permission is denied rather than failing silently', async () => {
    renderProvider();
    await waitFor(() => expect(watchError).not.toBeNull());

    watchError!({ code: 1, PERMISSION_DENIED: 1 });

    expect(toastErrorMock).toHaveBeenCalledWith(
      expect.stringContaining('guardians cannot see where you are'),
    );
  });

  it('warns only once even if the geolocation error repeats', async () => {
    renderProvider();
    await waitFor(() => expect(watchError).not.toBeNull());

    watchError!({ code: 1, PERMISSION_DENIED: 1 });
    watchError!({ code: 1, PERMISSION_DENIED: 1 });
    watchError!({ code: 1, PERMISSION_DENIED: 1 });

    expect(toastErrorMock).toHaveBeenCalledTimes(1);
  });

  it('warns when the device has no geolocation provider at all', async () => {
    geoAvailable = false;
    renderProvider();

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith(
        expect.stringContaining('Location sharing unavailable'),
      ),
    );
    expect(emitMock).not.toHaveBeenCalled();
  });
});
