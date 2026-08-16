/**
 * safety:emergency_contact_needed — fired when the automatic
 * guardian-no-response SOS escalation has no automated dispatch to fall
 * back on (backend ADR-0003: emergency-dispatch-client-initiated-contact).
 * The app has no unified emergency-dispatch API in Nigeria, so instead of
 * a server-side dispatch it hands the client real police contact numbers
 * and a pre-filled message for the user to call/text themselves.
 *
 * This test guards the one thing standing between that escalation firing
 * and the user actually seeing the numbers: the socket listener populating
 * emergencyContactNeeded, and it correctly clearing on cancel/resolve so a
 * stale "call the police" prompt never lingers after the emergency ends.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { useSos } from '@/hooks/useSos';

type Handler = (...args: unknown[]) => void;
const handlers = new Map<string, Handler>();

function emit(event: string, payload: unknown) {
  handlers.get(event)?.(payload);
}

// vi.mock factories for a given module path are shared across ALL test
// files in this worker (vitest.config.ts runs maxWorkers: 1 / pool:
// vmForks) — three other files already mock '@/lib/socket' with
// incompatible shapes (no getSocket, or getSocket() => null), and
// whichever file's factory registers first for that module path wins for
// the rest of the run. Declaring a minimal, always-mockable shape here and
// overriding behavior per-test via vi.mocked(...).mockReturnValue in
// beforeEach avoids depending on load order against those sibling files.
vi.mock('@/lib/socket', () => ({
  default: {
    emit: vi.fn(),
    getSocket: vi.fn(),
    connect: vi.fn(),
    authenticate: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
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

let mockActiveSos: Record<string, unknown> | null = {
  _id: 'sos-1',
  userId: 'victim-1',
  status: 'active',
  pendingUntil: null,
};

vi.mock('@/services/safety.service', () => ({
  safetyService: {
    getActiveSos: vi.fn(async () => ({ data: { sosEvent: mockActiveSos } })),
    triggerSos: vi.fn(),
    cancelSos: vi.fn(async () => ({ data: { sosEvent: { ...mockActiveSos, status: 'cancelled' } } })),
    resolveSos: vi.fn(async () => ({ data: { sosEvent: { ...mockActiveSos, status: 'resolved' } } })),
  },
}));

vi.mock('@/hooks/useSosOfflineQueue', () => ({
  useSosOfflineQueue: () => ({ status: 'idle', enqueue: vi.fn() }),
}));

vi.mock('@/lib/nativeGeolocation', () => ({
  getGeolocation: () => undefined,
}));

import { SosProvider } from './SosContext';
import mockedSocketService from '@/lib/socket';

let captured: ReturnType<typeof useSos> | null = null;
function Capture() {
  const value = useSos();
  useEffect(() => {
    captured = value;
  });
  return null;
}

function renderProvider() {
  return render(
    <SosProvider>
      <Capture />
    </SosProvider>,
  );
}

describe('SosContext — safety:emergency_contact_needed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    handlers.clear();
    captured = null;
    mockUser = { id: 'victim-1' };
    mockActiveSos = { _id: 'sos-1', userId: 'victim-1', status: 'active', pendingUntil: null };

    // Re-establish this test's socket behavior every run, regardless of
    // what a sibling file's vi.mock factory left the module cache in —
    // see the vi.mock('@/lib/socket', ...) comment above for why this is
    // necessary rather than relying on the factory alone.
    const mockedSocket = {
      on: vi.fn((event: string, cb: Handler) => handlers.set(event, cb)),
      off: vi.fn((event: string) => handlers.delete(event)),
    };
    // eslint-disable-next-line no-console
    console.log('DIAG typeof getSocket:', typeof mockedSocketService.getSocket, Object.keys(mockedSocketService));
    vi.mocked(mockedSocketService.getSocket).mockReturnValue(mockedSocket as never);
  });

  afterEach(() => cleanup());

  it('populates emergencyContactNeeded when the event fires', async () => {
    renderProvider();
    await waitFor(() => expect(handlers.has('safety:emergency_contact_needed')).toBe(true));

    expect(captured!.emergencyContactNeeded).toBeNull();

    emit('safety:emergency_contact_needed', {
      sosEventId: 'sos-1',
      options: [
        { label: 'Nigeria Police Force — Text/WhatsApp', number: '08057000003', method: 'sms' },
      ],
      smsMessage: '[NeyborHuud EMERGENCY] ID:sos-1 ...',
      timestamp: new Date().toISOString(),
    });

    await waitFor(() => expect(captured!.emergencyContactNeeded).not.toBeNull());
    expect(captured!.emergencyContactNeeded!.options[0].number).toBe('08057000003');
  });

  it('dismissEmergencyContactNeeded clears it', async () => {
    renderProvider();
    await waitFor(() => expect(handlers.has('safety:emergency_contact_needed')).toBe(true));

    emit('safety:emergency_contact_needed', {
      sosEventId: 'sos-1',
      options: [],
      smsMessage: '',
      timestamp: new Date().toISOString(),
    });
    await waitFor(() => expect(captured!.emergencyContactNeeded).not.toBeNull());

    captured!.dismissEmergencyContactNeeded();

    await waitFor(() => expect(captured!.emergencyContactNeeded).toBeNull());
  });

  it('clears emergencyContactNeeded when the SOS is resolved', async () => {
    renderProvider();
    await waitFor(() => expect(handlers.has('safety:emergency_contact_needed')).toBe(true));

    emit('safety:emergency_contact_needed', {
      sosEventId: 'sos-1',
      options: [],
      smsMessage: '',
      timestamp: new Date().toISOString(),
    });
    await waitFor(() => expect(captured!.emergencyContactNeeded).not.toBeNull());

    await captured!.resolveSos();

    await waitFor(() => expect(captured!.emergencyContactNeeded).toBeNull());
  });

  it('clears emergencyContactNeeded when the SOS is cancelled', async () => {
    renderProvider();
    await waitFor(() => expect(handlers.has('safety:emergency_contact_needed')).toBe(true));

    emit('safety:emergency_contact_needed', {
      sosEventId: 'sos-1',
      options: [],
      smsMessage: '',
      timestamp: new Date().toISOString(),
    });
    await waitFor(() => expect(captured!.emergencyContactNeeded).not.toBeNull());

    await captured!.cancelSos('false alarm');

    await waitFor(() => expect(captured!.emergencyContactNeeded).toBeNull());
  });
});
