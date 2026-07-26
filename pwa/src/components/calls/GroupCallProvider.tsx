'use client';

/**
 * GroupCallProvider — app-wide WebRTC N-party (mesh) group/community calling.
 *
 * Deliberately separate from CallProvider (1:1 calls): a mesh call has an
 * entirely different shape (a roster of peers, one RTCPeerConnection PER
 * peer) than a 2-party call (one peer, one callId). Sharing one state
 * machine for both was exactly the payload-shape bug the chat-system audit
 * flagged — group call events used to reuse 1:1's "call:incoming"/"call:ended"
 * names with an incompatible payload, which could have corrupted
 * CallProvider's state for anyone who received both. This provider owns its
 * own phase, its own socket events ("group-call:*"), and its own overlay.
 *
 * Mesh topology: every participant holds one RTCPeerConnection to every
 * OTHER participant. The server (socket.service.ts) only relays signaling
 * (SDP offer/answer, ICE candidates) between specific userIds — media always
 * flows peer-to-peer (or via TURN). This does not scale indefinitely: mesh
 * cost is O(N^2) connections, so the server enforces a hard participant cap
 * (see GROUP_CALL_MAX_PARTICIPANTS) and rejects joins beyond it rather than
 * silently degrading call quality.
 *
 * Signaling contract (server relays by userId, not a single callId):
 *   out: group-call:join { sessionId }
 *   in:  group-call:joined { sessionId, callType, conversationId, existingParticipants: string[] }
 *   in:  group-call:peer-joined { sessionId, userId, userName, userAvatar }
 *   out: group-call:offer { sessionId, to, sdp }        in: group-call:offer { sessionId, from, sdp }
 *   out: group-call:answer { sessionId, to, sdp }       in: group-call:answer { sessionId, from, sdp }
 *   both: group-call:ice-candidate { sessionId, to/from, candidate }
 *   out: group-call:leave { sessionId }
 *   in:  group-call:peer-left { sessionId, userId }
 *   in:  group-call:ended { sessionId }
 *   in:  group-call:error { sessionId, message, code? }
 *
 * Join choreography (avoids N-way offer/answer glare): a joiner only ever
 * ANSWERS — every participant already in the call is told about the joiner
 * (peer-joined) and is the one who creates the offer. This guarantees
 * exactly one offer/answer pair per pairwise connection.
 */

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import socketService from '@/lib/socket';
import { callService } from '@/services/call.service';
import { useClientAuthUser } from '@/hooks/useClientAuthUser';
import * as ringtone from '@/lib/callRingtone';

// Fallback only — the server (socket.service.ts's GROUP_CALL_MAX_PARTICIPANTS)
// is the source of truth and always sends the real cap on join/incoming.
const DEFAULT_MAX_PARTICIPANTS = 8;

export type GroupCallType = 'voice' | 'video';
export type GroupCallPhase = 'idle' | 'joining' | 'active' | 'ended';

export interface GroupCallPeer {
  userId: string;
  userName: string;
  userAvatar: string | null;
  stream: MediaStream | null;
}

export interface ActiveGroupCall {
  sessionId: string;
  conversationId: string;
  callType: GroupCallType;
  maxParticipants: number;
}

interface GroupCallContextValue {
  phase: GroupCallPhase;
  call: ActiveGroupCall | null;
  peers: GroupCallPeer[];
  localStream: MediaStream | null;
  micEnabled: boolean;
  cameraEnabled: boolean;
  /** Incoming "a group call just started" banner state (before joining). */
  incomingCall: { sessionId: string; conversationId: string; callType: GroupCallType; startedBy: string } | null;
  joinCall: (args: { sessionId: string; conversationId: string; callType: GroupCallType }) => Promise<void>;
  leaveCall: () => void;
  dismissIncoming: () => void;
  toggleMic: () => void;
  toggleCamera: () => void;
}

const GroupCallContext = createContext<GroupCallContextValue | null>(null);

export function useGroupCall(): GroupCallContextValue {
  const ctx = useContext(GroupCallContext);
  if (!ctx) throw new Error('useGroupCall must be used within <GroupCallProvider>');
  return ctx;
}

type PeerConn = { pc: RTCPeerConnection; pendingCandidates: RTCIceCandidateInit[] };

export function GroupCallProvider({ children }: { children: ReactNode }) {
  const { user } = useClientAuthUser();
  const myId = user?.id ?? null;

  const [phase, setPhase] = useState<GroupCallPhase>('idle');
  const [call, setCall] = useState<ActiveGroupCall | null>(null);
  const [peers, setPeers] = useState<GroupCallPeer[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [incomingCall, setIncomingCall] = useState<GroupCallContextValue['incomingCall']>(null);

  const callRef = useRef<ActiveGroupCall | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnsRef = useRef<Map<string, PeerConn>>(new Map());
  const peersMetaRef = useRef<Map<string, { userName: string; userAvatar: string | null }>>(new Map());

  const setCallState = useCallback((c: ActiveGroupCall | null) => {
    callRef.current = c;
    setCall(c);
  }, []);

  const syncPeersState = useCallback(() => {
    // Source of truth for "who's in this call" is peersMetaRef (populated
    // immediately from the server roster on join/peer-joined), NOT
    // peerConnsRef — a joiner is passive and doesn't get an RTCPeerConnection
    // for an existing participant until THEIR offer arrives, so keying off
    // peerConnsRef alone left the roster showing nobody until the first
    // offer landed even though the server had already told us who's there.
    const list: GroupCallPeer[] = [];
    peersMetaRef.current.forEach((meta, userId) => {
      const conn = peerConnsRef.current.get(userId);
      const remote = conn
        ? (conn.pc.getReceivers().map((r) => r.track).filter(Boolean) as MediaStreamTrack[])
        : [];
      const stream = remote.length > 0 ? new MediaStream(remote) : null;
      list.push({
        userId,
        userName: meta.userName,
        userAvatar: meta.userAvatar,
        stream,
      });
    });
    setPeers(list);
  }, []);

  // ── Teardown ──────────────────────────────────────────────────────────────
  const teardownPeer = useCallback((userId: string) => {
    const conn = peerConnsRef.current.get(userId);
    if (conn) {
      try { conn.pc.close(); } catch { /* noop */ }
      peerConnsRef.current.delete(userId);
    }
    peersMetaRef.current.delete(userId);
  }, []);

  const cleanup = useCallback(() => {
    peerConnsRef.current.forEach((_conn, userId) => teardownPeer(userId));
    peerConnsRef.current.clear();
    peersMetaRef.current.clear();
    setPeers([]);
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setMicEnabled(true);
    setCameraEnabled(true);
  }, [teardownPeer]);

  const leaveCall = useCallback(() => {
    const current = callRef.current;
    if (current) {
      socketService.emit('group-call:leave', { sessionId: current.sessionId });
    }
    cleanup();
    setCallState(null);
    setPhase('ended');
    window.setTimeout(() => setPhase('idle'), 1200);
  }, [cleanup, setCallState]);

  const dismissIncoming = useCallback(() => setIncomingCall(null), []);

  // ── Peer connection factory ─────────────────────────────────────────────
  const createPeerConnFor = useCallback(
    async (peerId: string, meta: { userName: string; userAvatar: string | null }) => {
      const existing = peerConnsRef.current.get(peerId);
      if (existing) return existing;

      const iceServers = await callService.getIceServers();
      const pc = new RTCPeerConnection({ iceServers });
      const entry: PeerConn = { pc, pendingCandidates: [] };
      peerConnsRef.current.set(peerId, entry);
      peersMetaRef.current.set(peerId, meta);

      const sessionId = callRef.current?.sessionId;
      pc.onicecandidate = (e) => {
        if (e.candidate && sessionId) {
          socketService.emit('group-call:ice-candidate', {
            sessionId,
            to: peerId,
            candidate: e.candidate.toJSON(),
          });
        }
      };
      pc.ontrack = () => syncPeersState();
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          // Don't tear down proactively here — a "failed" ICE state on one
          // pairwise mesh link doesn't necessarily mean that peer left; a
          // group-call:peer-left event (explicit leave/disconnect) is the
          // authoritative signal for removing them. This just logs for
          // diagnostics so a bad mesh link isn't silently invisible.
          console.warn('[GroupCall] peer connection state:', peerId, pc.connectionState);
        }
      };

      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }

      return entry;
    },
    [syncPeersState],
  );

  const flushPendingCandidates = useCallback(async (peerId: string) => {
    const conn = peerConnsRef.current.get(peerId);
    if (!conn) return;
    const pending = conn.pendingCandidates;
    conn.pendingCandidates = [];
    for (const c of pending) {
      try { await conn.pc.addIceCandidate(new RTCIceCandidate(c)); } catch { /* noop */ }
    }
  }, []);

  // ── Join ─────────────────────────────────────────────────────────────────
  const joinCall = useCallback(
    async ({ sessionId, conversationId, callType }: { sessionId: string; conversationId: string; callType: GroupCallType }) => {
      if (!myId || phase === 'joining' || phase === 'active') return;
      setIncomingCall(null);
      setPhase('joining');
      setCallState({ sessionId, conversationId, callType, maxParticipants: DEFAULT_MAX_PARTICIPANTS });

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video' ? { facingMode: 'user' } : false,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);

        const socket = socketService.getSocket() ?? socketService.connect();
        if (!socket) throw new Error('No socket connection');
        socketService.emit('group-call:join', { sessionId });
      } catch (err) {
        console.error('[GroupCall] joinCall failed', err);
        cleanup();
        setCallState(null);
        setPhase('idle');
      }
    },
    [myId, phase, setCallState, cleanup],
  );

  // ── Socket listeners ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!myId) return;
    const socket = socketService.getSocket() ?? socketService.connect();
    if (!socket) return;
    socketService.authenticate(myId);

    const onIncoming = (data: {
      conversationId: string;
      sessionId: string;
      callType: GroupCallType;
      startedBy: string;
    }) => {
      // Don't interrupt an active call with a banner for a different one.
      if (callRef.current) return;
      if (data.startedBy === myId) return;
      setIncomingCall(data);
    };

    const onJoined = (data: {
      sessionId: string;
      callType: GroupCallType;
      conversationId: string;
      existingParticipants: string[];
      maxParticipants?: number;
    }) => {
      if (callRef.current?.sessionId !== data.sessionId) return;
      setCallState({
        sessionId: data.sessionId,
        conversationId: data.conversationId,
        callType: data.callType,
        maxParticipants: data.maxParticipants ?? DEFAULT_MAX_PARTICIPANTS,
      });
      setPhase('active');
      // We are the joiner — we do NOT create offers; existing participants
      // will each send us one (see group-call:offer handler below). We just
      // need placeholder metadata so the roster shows them immediately.
      data.existingParticipants.forEach((peerId) => {
        if (!peersMetaRef.current.has(peerId)) {
          peersMetaRef.current.set(peerId, { userName: 'Neybor', userAvatar: null });
        }
      });
      syncPeersState();
    };

    const onPeerJoined = async (data: { sessionId: string; userId: string; userName: string; userAvatar: string | null }) => {
      if (callRef.current?.sessionId !== data.sessionId || data.userId === myId) return;
      // We are an existing participant — create the offer to the new joiner.
      const conn = await createPeerConnFor(data.userId, { userName: data.userName, userAvatar: data.userAvatar });
      try {
        const offer = await conn.pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: callRef.current?.callType === 'video',
        });
        await conn.pc.setLocalDescription(offer);
        socketService.emit('group-call:offer', { sessionId: data.sessionId, to: data.userId, sdp: offer });
      } catch (err) {
        console.error('[GroupCall] failed to create offer for new peer', err);
      }
      syncPeersState();
    };

    const onOffer = async (data: { sessionId: string; from: string; sdp: RTCSessionDescriptionInit }) => {
      if (callRef.current?.sessionId !== data.sessionId) return;
      const meta = peersMetaRef.current.get(data.from) ?? { userName: 'Neybor', userAvatar: null };
      const conn = await createPeerConnFor(data.from, meta);
      try {
        await conn.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        await flushPendingCandidates(data.from);
        const answer = await conn.pc.createAnswer();
        await conn.pc.setLocalDescription(answer);
        socketService.emit('group-call:answer', { sessionId: data.sessionId, to: data.from, sdp: answer });
      } catch (err) {
        console.error('[GroupCall] failed to answer offer', err);
      }
      syncPeersState();
    };

    const onAnswer = async (data: { sessionId: string; from: string; sdp: RTCSessionDescriptionInit }) => {
      if (callRef.current?.sessionId !== data.sessionId) return;
      const conn = peerConnsRef.current.get(data.from);
      if (!conn) return;
      try {
        await conn.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        await flushPendingCandidates(data.from);
      } catch (err) {
        console.error('[GroupCall] failed to apply answer', err);
      }
    };

    const onIceCandidate = async (data: { sessionId: string; from: string; candidate: RTCIceCandidateInit }) => {
      if (callRef.current?.sessionId !== data.sessionId || !data.candidate) return;
      const conn = peerConnsRef.current.get(data.from);
      if (!conn) return;
      if (conn.pc.remoteDescription && conn.pc.remoteDescription.type) {
        try { await conn.pc.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch { /* noop */ }
      } else {
        conn.pendingCandidates.push(data.candidate);
      }
    };

    const onPeerLeft = (data: { sessionId: string; userId: string }) => {
      if (callRef.current?.sessionId !== data.sessionId) return;
      teardownPeer(data.userId);
      syncPeersState();
    };

    const onEnded = (data: { sessionId: string }) => {
      // If we're actually in this call, tear it down properly.
      if (callRef.current?.sessionId === data.sessionId) {
        cleanup();
        setCallState(null);
        setPhase('ended');
        window.setTimeout(() => setPhase('idle'), 1200);
        return;
      }
      // Otherwise, if we were just shown an "incoming call" banner for this
      // same session (e.g. it timed out with nobody ever joining — see the
      // backend's GROUP_CALL_ORPHAN_TIMEOUT_MS), clear the now-stale banner
      // instead of leaving a dead "Join" button on screen.
      setIncomingCall((current) => (current?.sessionId === data.sessionId ? null : current));
    };

    const onError = (data: { sessionId?: string; message?: string }) => {
      console.warn('[GroupCall] error:', data?.message);
      if (phase === 'joining' && (!data.sessionId || data.sessionId === callRef.current?.sessionId)) {
        cleanup();
        setCallState(null);
        setPhase('idle');
      }
    };

    socketService.on('group-call:incoming', onIncoming);
    socketService.on('group-call:joined', onJoined);
    socketService.on('group-call:peer-joined', onPeerJoined);
    socketService.on('group-call:offer', onOffer);
    socketService.on('group-call:answer', onAnswer);
    socketService.on('group-call:ice-candidate', onIceCandidate);
    socketService.on('group-call:peer-left', onPeerLeft);
    socketService.on('group-call:ended', onEnded);
    socketService.on('group-call:error', onError);

    return () => {
      socketService.off('group-call:incoming', onIncoming);
      socketService.off('group-call:joined', onJoined);
      socketService.off('group-call:peer-joined', onPeerJoined);
      socketService.off('group-call:offer', onOffer);
      socketService.off('group-call:answer', onAnswer);
      socketService.off('group-call:ice-candidate', onIceCandidate);
      socketService.off('group-call:peer-left', onPeerLeft);
      socketService.off('group-call:ended', onEnded);
      socketService.off('group-call:error', onError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId]);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const enabled = !micEnabled;
    stream.getAudioTracks().forEach((t) => (t.enabled = enabled));
    setMicEnabled(enabled);
  }, [micEnabled]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const enabled = !cameraEnabled;
    stream.getVideoTracks().forEach((t) => (t.enabled = enabled));
    setCameraEnabled(enabled);
  }, [cameraEnabled]);

  // Soft ring cue while a call banner is showing (not a hard ring — nobody
  // is "calling YOU specifically" the way 1:1 works).
  useEffect(() => {
    if (incomingCall && phase === 'idle') ringtone.ringback();
    else ringtone.stop();
    return () => ringtone.stop();
  }, [incomingCall, phase]);

  return (
    <GroupCallContext.Provider
      value={{
        phase,
        call,
        peers,
        localStream,
        micEnabled,
        cameraEnabled,
        incomingCall,
        joinCall,
        leaveCall,
        dismissIncoming,
        toggleMic,
        toggleCamera,
      }}
    >
      {children}
    </GroupCallContext.Provider>
  );
}
