'use client';

/**
 * CallProvider — app-wide WebRTC 1-on-1 audio/video calling.
 *
 * Owns the RTCPeerConnection, local/remote media streams, and all Socket.IO
 * signaling (offer/answer/ICE/hangup). Exposed via useCall() so any component
 * (e.g. the chat header) can start a call, and a single global overlay renders
 * the call UI. Mounted once near the app root.
 *
 * Signaling contract (server relays between the two users):
 *   out: call:invite { to, conversationId, type, sdp(offer) }
 *   in:  call:incoming { callId, from, fromName, conversationId, type, sdp(offer) }
 *   out: call:accept { callId, sdp(answer) }
 *   in:  call:accepted { callId, sdp(answer) }
 *   both: call:ice-candidate { callId, candidate }
 *   out: call:reject { callId }   in: call:rejected { callId }
 *   out: call:hangup { callId }    in: call:ended { callId, status }
 *   in:  call:ringing { callId }   in: call:error { message }
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
import { callService, type CallType } from '@/services/call.service';
import { useClientAuthUser } from '@/hooks/useClientAuthUser';

export type CallPhase =
  | 'idle'
  | 'outgoing' // we called, waiting for accept
  | 'incoming' // someone is calling us
  | 'connecting' // accepted, negotiating media
  | 'active' // media flowing
  | 'ended';

export interface ActiveCall {
  callId: string;
  peerId: string;
  peerName: string;
  conversationId: string | null;
  type: CallType;
  isCaller: boolean;
}

interface CallContextValue {
  phase: CallPhase;
  call: ActiveCall | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  micEnabled: boolean;
  cameraEnabled: boolean;
  startCall: (args: {
    peerId: string;
    peerName: string;
    conversationId: string | null;
    type: CallType;
  }) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  hangup: () => void;
  toggleMic: () => void;
  toggleCamera: () => void;
}

const CallContext = createContext<CallContextValue | null>(null);

export function useCall(): CallContextValue {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within <CallProvider>');
  return ctx;
}

export function CallProvider({ children }: { children: ReactNode }) {
  const { user } = useClientAuthUser();
  const myId = user?.id ?? null;

  const [phase, setPhase] = useState<CallPhase>('idle');
  const [call, setCall] = useState<ActiveCall | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  // Mutable refs (avoid stale closures inside socket handlers)
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const callRef = useRef<ActiveCall | null>(null);
  // Incoming offer held until the user accepts.
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  // Remote ICE candidates that arrive before remoteDescription is set.
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  // The authoritative callId for routing OUR ICE candidates. For the caller this
  // is unknown until `call:ringing`; candidates that fire before then are buffered
  // here and flushed once the id is known (otherwise they'd be lost → no media).
  const liveCallIdRef = useRef<string | null>(null);
  const outgoingIceBufferRef = useRef<RTCIceCandidateInit[]>([]);

  // Send (or buffer) one of our local ICE candidates.
  const sendLocalCandidate = useCallback((candidate: RTCIceCandidateInit) => {
    const id = liveCallIdRef.current;
    if (id) {
      socketService.emit('call:ice-candidate', { callId: id, candidate });
    } else {
      outgoingIceBufferRef.current.push(candidate);
    }
  }, []);

  // Once we know the real callId, flush any buffered local candidates.
  const flushOutgoingCandidates = useCallback(() => {
    const id = liveCallIdRef.current;
    if (!id) return;
    const buffered = outgoingIceBufferRef.current;
    outgoingIceBufferRef.current = [];
    for (const candidate of buffered) {
      socketService.emit('call:ice-candidate', { callId: id, candidate });
    }
  }, []);

  const setCallState = useCallback((c: ActiveCall | null) => {
    callRef.current = c;
    setCall(c);
  }, []);

  // ── Teardown ──────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    pcRef.current?.getSenders().forEach((s) => {
      try { s.track?.stop(); } catch { /* noop */ }
    });
    try { pcRef.current?.close(); } catch { /* noop */ }
    pcRef.current = null;

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    pendingOfferRef.current = null;
    pendingCandidatesRef.current = [];
    liveCallIdRef.current = null;
    outgoingIceBufferRef.current = [];
    setMicEnabled(true);
    setCameraEnabled(true);
  }, []);

  const endCall = useCallback(
    (nextPhase: CallPhase = 'ended') => {
      cleanup();
      setPhase(nextPhase);
      // Briefly show "ended", then reset to idle.
      window.setTimeout(() => {
        setPhase('idle');
        setCallState(null);
      }, 1500);
    },
    [cleanup, setCallState],
  );

  // ── Build the peer connection ───────────────────────────────────────────────
  const createPeerConnection = useCallback(
    async () => {
      const iceServers = await callService.getIceServers();
      const pc = new RTCPeerConnection({ iceServers });

      // A single MediaStream we add remote tracks onto, so audio + video that
      // arrive in separate ontrack events both end up on the same stream the UI
      // is bound to (more robust than relying on e.streams[0]).
      const remote = new MediaStream();
      remoteStreamRef.current = remote;

      pc.onicecandidate = (e) => {
        if (e.candidate) sendLocalCandidate(e.candidate.toJSON());
      };

      pc.ontrack = (e) => {
        // Prefer the stream the sender grouped tracks into; fall back to our
        // own aggregate stream so a lone track still shows up.
        if (e.streams && e.streams[0]) {
          setRemoteStream(e.streams[0]);
        } else {
          remote.addTrack(e.track);
          setRemoteStream(remote);
        }
      };

      pc.onconnectionstatechange = () => {
        const st = pc.connectionState;
        if (st === 'connected') setPhase('active');
        if (st === 'failed') {
          const id = liveCallIdRef.current;
          if (id) socketService.emit('call:hangup', { callId: id });
          endCall('ended');
        }
      };

      pcRef.current = pc;
      return pc;
    },
    [endCall, sendLocalCandidate],
  );

  // Acquire mic (+ camera for video) and attach tracks to the connection.
  const attachLocalMedia = useCallback(
    async (pc: RTCPeerConnection, type: CallType) => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video' ? { facingMode: 'user' } : false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      return stream;
    },
    [],
  );

  // Drain any ICE candidates that arrived before remoteDescription was ready.
  const flushPendingCandidates = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    const pending = pendingCandidatesRef.current;
    pendingCandidatesRef.current = [];
    for (const c of pending) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch { /* noop */ }
    }
  }, []);

  // ── Public actions ──────────────────────────────────────────────────────────

  const startCall = useCallback(
    async ({
      peerId,
      peerName,
      conversationId,
      type,
    }: {
      peerId: string;
      peerName: string;
      conversationId: string | null;
      type: CallType;
    }) => {
      if (phase !== 'idle' || !myId) return;
      // Provisional call object; real callId comes back on call:ringing.
      const provisional: ActiveCall = {
        callId: '',
        peerId,
        peerName,
        conversationId,
        type,
        isCaller: true,
      };
      setCallState(provisional);
      setPhase('outgoing');

      try {
        // The real callId comes back on call:ringing; until then our ICE
        // candidates are buffered (see sendLocalCandidate) and flushed once known.
        liveCallIdRef.current = null;
        outgoingIceBufferRef.current = [];
        const pc = await createPeerConnection();
        await attachLocalMedia(pc, type);
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: type === 'video',
        });
        await pc.setLocalDescription(offer);

        socketService.emit('call:invite', {
          to: peerId,
          conversationId,
          type,
          sdp: offer,
        });
      } catch (err) {
        console.error('[Call] startCall failed', err);
        endCall('ended');
      }
    },
    [phase, myId, setCallState, createPeerConnection, attachLocalMedia, endCall],
  );

  const acceptCall = useCallback(async () => {
    const current = callRef.current;
    const offer = pendingOfferRef.current;
    if (!current || !offer) return;
    setPhase('connecting');

    try {
      // Callee knows the real callId up front, so ICE can be sent immediately.
      liveCallIdRef.current = current.callId;
      const pc = await createPeerConnection();
      await attachLocalMedia(pc, current.type);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await flushPendingCandidates();
      flushOutgoingCandidates();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketService.emit('call:accept', { callId: current.callId, sdp: answer });
    } catch (err) {
      console.error('[Call] acceptCall failed', err);
      socketService.emit('call:hangup', { callId: current.callId });
      endCall('ended');
    }
  }, [createPeerConnection, attachLocalMedia, flushPendingCandidates, flushOutgoingCandidates, endCall]);

  const rejectCall = useCallback(() => {
    const current = callRef.current;
    if (current) socketService.emit('call:reject', { callId: current.callId });
    cleanup();
    setPhase('idle');
    setCallState(null);
  }, [cleanup, setCallState]);

  const hangup = useCallback(() => {
    const current = callRef.current;
    if (current?.callId) socketService.emit('call:hangup', { callId: current.callId });
    endCall('ended');
  }, [endCall]);

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

  // Keep the latest endCall/hangup in a ref so the socket-listener effect can
  // call fresh versions without depending on them (the effect must run once per
  // user session, not re-subscribe whenever a callback identity changes — that
  // was causing a changing-dependency-array warning under Fast Refresh).
  const handlersRef = useRef({ endCall, hangup });
  useEffect(() => {
    handlersRef.current = { endCall, hangup };
  }, [endCall, hangup]);

  // ── Socket signaling listeners ──────────────────────────────────────────────
  useEffect(() => {
    if (!myId) return;
    const socket = socketService.getSocket() ?? socketService.connect();
    if (!socket) return;
    socketService.authenticate(myId);

    const onRinging = (data: { callId: string }) => {
      // Backend assigned the real callId. Record it and flush any ICE
      // candidates the caller's PC produced before this arrived — otherwise
      // those early candidates are lost and media may not connect both ways.
      const current = callRef.current;
      if (current && current.isCaller) {
        setCallState({ ...current, callId: data.callId });
        liveCallIdRef.current = data.callId;
        flushOutgoingCandidates();
      }
    };

    const onIncoming = (data: {
      callId: string;
      from: string;
      fromName: string;
      conversationId: string | null;
      type: CallType;
      sdp: RTCSessionDescriptionInit;
    }) => {
      // If already in a call, auto-reject the new one as busy.
      if (callRef.current) {
        socketService.emit('call:reject', { callId: data.callId });
        return;
      }
      pendingOfferRef.current = data.sdp;
      setCallState({
        callId: data.callId,
        peerId: data.from,
        peerName: data.fromName || 'Neybor',
        conversationId: data.conversationId,
        type: data.type,
        isCaller: false,
      });
      setPhase('incoming');
    };

    const onAccepted = async (data: { callId: string; sdp: RTCSessionDescriptionInit }) => {
      const pc = pcRef.current;
      if (!pc) return;
      setPhase('connecting');
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        await flushPendingCandidates();
      } catch (err) {
        console.error('[Call] failed to apply answer', err);
        handlersRef.current.hangup();
      }
    };

    const onRemoteCandidate = async (data: { callId: string; candidate: RTCIceCandidateInit }) => {
      const pc = pcRef.current;
      if (!pc || !data.candidate) return;
      if (pc.remoteDescription && pc.remoteDescription.type) {
        try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch { /* noop */ }
      } else {
        pendingCandidatesRef.current.push(data.candidate);
      }
    };

    const onRejected = () => handlersRef.current.endCall('ended');
    const onEnded = () => handlersRef.current.endCall('ended');
    const onError = (data: { message?: string }) => {
      console.warn('[Call] error:', data?.message);
      handlersRef.current.endCall('ended');
    };

    socketService.on('call:ringing', onRinging);
    socketService.on('call:incoming', onIncoming);
    socketService.on('call:accepted', onAccepted);
    socketService.on('call:ice-candidate', onRemoteCandidate);
    socketService.on('call:rejected', onRejected);
    socketService.on('call:ended', onEnded);
    socketService.on('call:error', onError);

    return () => {
      socketService.off('call:ringing', onRinging);
      socketService.off('call:incoming', onIncoming);
      socketService.off('call:accepted', onAccepted);
      socketService.off('call:ice-candidate', onRemoteCandidate);
      socketService.off('call:rejected', onRejected);
      socketService.off('call:ended', onEnded);
      socketService.off('call:error', onError);
    };
    // Depends only on myId — set up listeners once per user session. All
    // referenced callbacks are either ref-stable (empty-dep useCallback) or
    // accessed via handlersRef, so they never need to re-subscribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId]);

  return (
    <CallContext.Provider
      value={{
        phase,
        call,
        localStream,
        remoteStream,
        micEnabled,
        cameraEnabled,
        startCall,
        acceptCall,
        rejectCall,
        hangup,
        toggleMic,
        toggleCamera,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}
