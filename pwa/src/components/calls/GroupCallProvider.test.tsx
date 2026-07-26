import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';

/**
 * GroupCallProvider — mesh group-call state machine (Phase 3).
 *
 * Scope note: jsdom has no real RTCPeerConnection/getUserMedia, so this test
 * verifies what a frontend unit test CAN meaningfully verify — that the
 * provider wires up the right socket listeners, transitions phase/peers
 * state correctly in response to server events, and emits the right events
 * back (with a lightweight FakeRTCPeerConnection standing in for the real
 * one). The actual wire-protocol correctness (does the server relay to the
 * right userId, does a 3rd joiner get offers from everyone already present,
 * etc.) is covered by the backend's real multi-socket-client integration
 * tests (NeyborHuud-ServerSide/tests/socket.calls.integration.test.ts) —
 * that's the only way to genuinely verify a signaling handshake, not
 * something a single-process frontend unit test can substitute for.
 */

// ── socket.service mock: event registry + emit-tracking, same pattern as
// ChatMessageCard.phase2.test.tsx ──────────────────────────────────────────
const socketHandlers: Record<string, ((data: unknown) => void)[]> = {};
const emitMock = vi.fn();
vi.mock('@/lib/socket', () => ({
  default: {
    getSocket: () => ({ connected: true }),
    connect: () => ({ connected: true }),
    authenticate: vi.fn(),
    on: (event: string, cb: (data: unknown) => void) => {
      socketHandlers[event] = socketHandlers[event] || [];
      socketHandlers[event].push(cb);
    },
    off: (event: string, cb: (data: unknown) => void) => {
      socketHandlers[event] = (socketHandlers[event] || []).filter((h) => h !== cb);
    },
    emit: (event: string, ...args: unknown[]) => emitMock(event, ...args),
  },
}));

function emitFromServer(event: string, data: unknown) {
  (socketHandlers[event] || []).forEach((cb) => cb(data));
}

vi.mock('@/hooks/useClientAuthUser', () => ({
  useClientAuthUser: () => ({ user: { id: 'me-1' }, mounted: true }),
}));

vi.mock('@/lib/callRingtone', () => ({
  ring: vi.fn(),
  ringback: vi.fn(),
  stop: vi.fn(),
}));

vi.mock('@/services/call.service', () => ({
  callService: {
    getIceServers: vi.fn().mockResolvedValue([{ urls: 'stun:stun.example.com' }]),
  },
}));

// ── Minimal fake RTCPeerConnection — enough surface area for the provider's
// logic (onicecandidate/ontrack/onconnectionstatechange, createOffer/Answer,
// setLocalDescription/setRemoteDescription, addTrack, addIceCandidate,
// getReceivers, close) without needing a real WebRTC stack. ────────────────
class FakeRTCPeerConnection {
  onicecandidate: ((e: { candidate: unknown }) => void) | null = null;
  ontrack: (() => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;
  connectionState = 'new';
  remoteDescription: { type: string } | null = null;
  localDescription: unknown = null;
  private tracks: unknown[] = [];

  addTrack(track: unknown) {
    this.tracks.push(track);
  }
  async createOffer() {
    return { type: 'offer', sdp: 'fake-offer-sdp' };
  }
  async createAnswer() {
    return { type: 'answer', sdp: 'fake-answer-sdp' };
  }
  async setLocalDescription(desc: unknown) {
    this.localDescription = desc;
  }
  async setRemoteDescription(desc: { type: string }) {
    this.remoteDescription = desc;
  }
  async addIceCandidate() {
    /* no-op */
  }
  getReceivers() {
    return [];
  }
  close() {
    /* no-op */
  }
}

beforeEach(() => {
  vi.stubGlobal('RTCPeerConnection', FakeRTCPeerConnection);
  vi.stubGlobal('RTCSessionDescription', class {
    type: string;
    sdp: string;
    constructor(init: { type: string; sdp: string }) {
      this.type = init.type;
      this.sdp = init.sdp;
    }
  });
  vi.stubGlobal('RTCIceCandidate', class {
    candidate: unknown;
    constructor(init: unknown) {
      this.candidate = init;
    }
  });
  vi.stubGlobal('navigator', {
    ...globalThis.navigator,
    mediaDevices: {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [],
        getAudioTracks: () => [],
        getVideoTracks: () => [],
      }),
    },
  });
  Object.keys(socketHandlers).forEach((k) => delete socketHandlers[k]);
  emitMock.mockClear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

import { GroupCallProvider, useGroupCall } from './GroupCallProvider';
import type { ReactNode } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  return <GroupCallProvider>{children}</GroupCallProvider>;
}

describe('GroupCallProvider — state machine', () => {
  it('starts idle with no active call and no incoming banner', () => {
    const { result } = renderHook(() => useGroupCall(), { wrapper });
    expect(result.current.phase).toBe('idle');
    expect(result.current.call).toBeNull();
    expect(result.current.peers).toEqual([]);
    expect(result.current.incomingCall).toBeNull();
  });

  it('shows an incoming-call banner when group-call:incoming arrives from someone else', () => {
    const { result } = renderHook(() => useGroupCall(), { wrapper });

    act(() => {
      emitFromServer('group-call:incoming', {
        conversationId: 'conv-1',
        sessionId: 'sess-1',
        callType: 'voice',
        startedBy: 'other-user',
      });
    });

    expect(result.current.incomingCall).toEqual(
      expect.objectContaining({ sessionId: 'sess-1', conversationId: 'conv-1', callType: 'voice' }),
    );
  });

  it('does NOT show a banner for a call started by the current user', () => {
    const { result } = renderHook(() => useGroupCall(), { wrapper });

    act(() => {
      emitFromServer('group-call:incoming', {
        conversationId: 'conv-1',
        sessionId: 'sess-1',
        callType: 'voice',
        startedBy: 'me-1', // same as the mocked authed user
      });
    });

    expect(result.current.incomingCall).toBeNull();
  });

  it('dismissIncoming clears the banner without joining', () => {
    const { result } = renderHook(() => useGroupCall(), { wrapper });
    act(() => {
      emitFromServer('group-call:incoming', {
        conversationId: 'conv-1',
        sessionId: 'sess-1',
        callType: 'voice',
        startedBy: 'other-user',
      });
    });
    expect(result.current.incomingCall).not.toBeNull();

    act(() => result.current.dismissIncoming());
    expect(result.current.incomingCall).toBeNull();
    expect(emitMock).not.toHaveBeenCalledWith('group-call:join', expect.anything());
  });

  it('clears a stale incoming-call banner if the call ends (e.g. orphan timeout) before anyone taps Join', () => {
    const { result } = renderHook(() => useGroupCall(), { wrapper });
    act(() => {
      emitFromServer('group-call:incoming', {
        conversationId: 'conv-1',
        sessionId: 'sess-orphan',
        callType: 'voice',
        startedBy: 'other-user',
      });
    });
    expect(result.current.incomingCall).not.toBeNull();

    act(() => {
      emitFromServer('group-call:ended', { sessionId: 'sess-orphan' });
    });

    expect(result.current.incomingCall).toBeNull();
  });

  it('leaves an unrelated incoming-call banner alone when a DIFFERENT session ends', () => {
    const { result } = renderHook(() => useGroupCall(), { wrapper });
    act(() => {
      emitFromServer('group-call:incoming', {
        conversationId: 'conv-1',
        sessionId: 'sess-still-live',
        callType: 'voice',
        startedBy: 'other-user',
      });
    });

    act(() => {
      emitFromServer('group-call:ended', { sessionId: 'some-other-session' });
    });

    expect(result.current.incomingCall).toEqual(
      expect.objectContaining({ sessionId: 'sess-still-live' }),
    );
  });

  it('joinCall acquires media and emits group-call:join, then transitions to active on group-call:joined', async () => {
    const { result } = renderHook(() => useGroupCall(), { wrapper });

    await act(async () => {
      await result.current.joinCall({ sessionId: 'sess-2', conversationId: 'conv-2', callType: 'voice' });
    });

    expect(result.current.phase).toBe('joining');
    expect(emitMock).toHaveBeenCalledWith('group-call:join', { sessionId: 'sess-2' });

    act(() => {
      emitFromServer('group-call:joined', {
        sessionId: 'sess-2',
        callType: 'voice',
        conversationId: 'conv-2',
        existingParticipants: ['peer-a', 'peer-b'],
        maxParticipants: 8,
      });
    });

    await waitFor(() => expect(result.current.phase).toBe('active'));
    expect(result.current.call).toEqual(
      expect.objectContaining({ sessionId: 'sess-2', conversationId: 'conv-2', maxParticipants: 8 }),
    );
    // Both pre-existing participants should appear in the roster immediately
    // (as placeholders) even before any offer/track has arrived.
    expect(result.current.peers.map((p) => p.userId).sort()).toEqual(['peer-a', 'peer-b']);
  });

  it('a peer-joined event causes an offer to be sent to the new joiner', async () => {
    const { result } = renderHook(() => useGroupCall(), { wrapper });
    await act(async () => {
      await result.current.joinCall({ sessionId: 'sess-3', conversationId: 'conv-3', callType: 'voice' });
    });
    act(() => {
      emitFromServer('group-call:joined', {
        sessionId: 'sess-3',
        callType: 'voice',
        conversationId: 'conv-3',
        existingParticipants: [],
        maxParticipants: 8,
      });
    });
    await waitFor(() => expect(result.current.phase).toBe('active'));
    emitMock.mockClear();

    await act(async () => {
      emitFromServer('group-call:peer-joined', {
        sessionId: 'sess-3',
        userId: 'newcomer-1',
        userName: 'Newcomer',
        userAvatar: null,
      });
      // Let the async offer-creation microtasks resolve.
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(emitMock).toHaveBeenCalledWith(
        'group-call:offer',
        expect.objectContaining({ sessionId: 'sess-3', to: 'newcomer-1' }),
      );
    });
  });

  it('a peer-left event removes that peer from the roster without ending the call', async () => {
    const { result } = renderHook(() => useGroupCall(), { wrapper });
    await act(async () => {
      await result.current.joinCall({ sessionId: 'sess-4', conversationId: 'conv-4', callType: 'voice' });
    });
    act(() => {
      emitFromServer('group-call:joined', {
        sessionId: 'sess-4',
        callType: 'voice',
        conversationId: 'conv-4',
        existingParticipants: ['peer-x', 'peer-y'],
        maxParticipants: 8,
      });
    });
    await waitFor(() => expect(result.current.phase).toBe('active'));
    expect(result.current.peers.length).toBe(2);

    act(() => {
      emitFromServer('group-call:peer-left', { sessionId: 'sess-4', userId: 'peer-x' });
    });

    expect(result.current.peers.map((p) => p.userId)).toEqual(['peer-y']);
    expect(result.current.phase).toBe('active'); // call itself must stay alive
  });

  it('leaveCall emits group-call:leave and resets to idle', async () => {
    const { result } = renderHook(() => useGroupCall(), { wrapper });
    await act(async () => {
      await result.current.joinCall({ sessionId: 'sess-5', conversationId: 'conv-5', callType: 'voice' });
    });
    act(() => {
      emitFromServer('group-call:joined', {
        sessionId: 'sess-5',
        callType: 'voice',
        conversationId: 'conv-5',
        existingParticipants: [],
        maxParticipants: 8,
      });
    });
    await waitFor(() => expect(result.current.phase).toBe('active'));

    act(() => result.current.leaveCall());

    expect(emitMock).toHaveBeenCalledWith('group-call:leave', { sessionId: 'sess-5' });
    expect(result.current.call).toBeNull();
  });

  it('group-call:ended resets an active call to idle for everyone still in it', async () => {
    const { result } = renderHook(() => useGroupCall(), { wrapper });
    await act(async () => {
      await result.current.joinCall({ sessionId: 'sess-6', conversationId: 'conv-6', callType: 'voice' });
    });
    act(() => {
      emitFromServer('group-call:joined', {
        sessionId: 'sess-6',
        callType: 'voice',
        conversationId: 'conv-6',
        existingParticipants: ['last-other'],
        maxParticipants: 8,
      });
    });
    await waitFor(() => expect(result.current.phase).toBe('active'));

    act(() => {
      emitFromServer('group-call:ended', { sessionId: 'sess-6' });
    });

    expect(result.current.call).toBeNull();
    expect(result.current.peers).toEqual([]);
  });

  it('joining while already active is a no-op (does not re-emit group-call:join)', async () => {
    const { result } = renderHook(() => useGroupCall(), { wrapper });
    await act(async () => {
      await result.current.joinCall({ sessionId: 'sess-7', conversationId: 'conv-7', callType: 'voice' });
    });
    act(() => {
      emitFromServer('group-call:joined', {
        sessionId: 'sess-7',
        callType: 'voice',
        conversationId: 'conv-7',
        existingParticipants: [],
        maxParticipants: 8,
      });
    });
    await waitFor(() => expect(result.current.phase).toBe('active'));
    emitMock.mockClear();

    await act(async () => {
      await result.current.joinCall({ sessionId: 'sess-8', conversationId: 'conv-8', callType: 'voice' });
    });

    expect(emitMock).not.toHaveBeenCalledWith('group-call:join', { sessionId: 'sess-8' });
  });
});
