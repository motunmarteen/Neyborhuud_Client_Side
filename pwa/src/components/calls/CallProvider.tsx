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
 *
 * Caller-side phase progression: idle → outgoing (invite sent, waiting on
 * our own server) → ringing (call:ringing confirms the callee's device was
 * actually notified) → connecting (call:accepted, negotiating media) →
 * active. call:error is surfaced to the user via toast — it used to fail
 * silently, which looked identical to "the call never rang" for things like
 * the mutual-follow gate rejecting an invite server-side.
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
import * as ringtone from '@/lib/callRingtone';
import { getGuestDisplayName } from '@/lib/profileSnapHelpers';
import { toast } from 'sonner';

// Slightly longer than the server's 45s auto-miss window so the server's
// authoritative call:ended normally arrives first; this only fires if it doesn't.
const CLIENT_RING_TIMEOUT_MS = 50_000;

// pc.connectionState's 'connected' transition is unreliable on some browsers
// (notably older Safari/iOS WebViews never fire it despite media genuinely
// flowing) — this is a backstop so the UI doesn't get stuck on "Connecting…"
// forever when that happens. iceConnectionState is the other, independently-
// unreliable signal; if EITHER fires we treat the call as active.
const CONNECTING_FALLBACK_MS = 12_000;

export type CallPhase =
  | 'idle'
  | 'outgoing' // we called, waiting for the server to confirm the callee was rung
  | 'ringing' // callee's device has been notified — waiting for them to answer
  | 'incoming' // someone is calling us
  | 'connecting' // accepted, negotiating media
  | 'active' // media flowing
  | 'ended';

export interface ActiveCall {
  callId: string;
  peerId: string;
  peerName: string;
  peerAvatar: string | null;
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
  /** Snapshot of the most recently ended call, kept around purely so the UI can offer "Call again" after hangup — cleared the moment a new call starts. */
  lastCall: ActiveCall | null;
  startCall: (args: {
    peerId: string;
    peerName: string;
    peerAvatar?: string | null;
    conversationId: string | null;
    type: CallType;
  }) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  hangup: () => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  /** Re-place a call to the same peer/type as the last one — convenience wrapper around startCall(). */
  redial: () => Promise<void>;
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
  const phaseRef = useRef<CallPhase>('idle');
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  const [call, setCall] = useState<ActiveCall | null>(null);
  const [lastCall, setLastCall] = useState<ActiveCall | null>(null);
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
  // Client-side backstop for an unanswered outgoing call. The server already
  // auto-misses a call after ~45s and tells both sides via call:ended — this
  // is only a safety net in case that message is lost (e.g. brief network
  // blip), so the caller's UI is never stuck on "Calling…" indefinitely.
  const ringTimeoutRef = useRef<number | null>(null);
  // Backstop for the post-accept "Connecting…" window: if neither
  // connectionState nor iceConnectionState ever reaches 'connected' (a real
  // browser quirk, not hypothetical — see CONNECTING_FALLBACK_MS), don't
  // strand the UI — end the call with a clear error instead of a silent hang.
  const connectingFallbackRef = useRef<number | null>(null);

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
    if (ringTimeoutRef.current !== null) {
      window.clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
    if (connectingFallbackRef.current !== null) {
      window.clearTimeout(connectingFallbackRef.current);
      connectingFallbackRef.current = null;
    }
  }, []);

  // endCall is defined below (after this function, which needs to call it
  // from a timeout closure) — this ref is populated right after endCall's
  // own declaration so startConnectingFallback always calls the latest
  // version without needing endCall in its own dependency array.
  const endCallRef = useRef<(nextPhase?: CallPhase) => void>(() => {});

  const startConnectingFallback = useCallback(() => {
    if (connectingFallbackRef.current !== null) window.clearTimeout(connectingFallbackRef.current);
    connectingFallbackRef.current = window.setTimeout(() => {
      connectingFallbackRef.current = null;
      if (phaseRef.current !== 'connecting') return;
      console.warn('[Call] Never reached "connected" within fallback window — ending call');
      toast.error('Call could not connect. Please try again.');
      const id = liveCallIdRef.current;
      if (id) socketService.emit('call:hangup', { callId: id });
      endCallRef.current('ended');
    }, CONNECTING_FALLBACK_MS);
  }, []);

  const endCall = useCallback(
    (nextPhase: CallPhase = 'ended') => {
      cleanup();
      setPhase(nextPhase);
      // Remember who we just called/were called by so the UI can offer
      // "Call again" — snapshotted here (not read later from `call`, which
      // is about to be nulled) so it survives the idle reset below.
      if (callRef.current) setLastCall(callRef.current);
      // Briefly show "ended", then reset to idle.
      window.setTimeout(() => {
        setPhase('idle');
        setCallState(null);
      }, 1500);
    },
    [cleanup, setCallState],
  );
  useEffect(() => { endCallRef.current = endCall; }, [endCall]);

  // ── Build the peer connection ───────────────────────────────────────────────
  const createPeerConnection = useCallback(
    async () => {
      const iceServers = await callService.getIceServers();
      // Diagnostic: log whether TURN actually made it into the ICE config.
      const hasTurn = iceServers.some((s) => {
        const u = s.urls;
        const list = Array.isArray(u) ? u : [u];
        return list.some((x) => typeof x === 'string' && x.startsWith('turn'));
      });
      console.log('[Call] ICE servers loaded:', iceServers.length, 'TURN present:', hasTurn);

      const pc = new RTCPeerConnection({ iceServers });

      // A single MediaStream we add remote tracks onto, so audio + video that
      // arrive in separate ontrack events both end up on the same stream the UI
      // is bound to (more robust than relying on e.streams[0]).
      const remote = new MediaStream();
      remoteStreamRef.current = remote;

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          // Diagnostic: 'relay' = via TURN, 'srflx' = STUN, 'host' = local.
          console.log('[Call] local candidate:', e.candidate.type, e.candidate.protocol);
          sendLocalCandidate(e.candidate.toJSON());
        } else {
          console.log('[Call] ICE gathering complete');
        }
      };

      // pc.connectionState is the primary "are we actually connected" signal,
      // but it's unreliable on some browsers (older Safari/iOS in particular
      // has shipped versions that never fire 'connected' even once media is
      // genuinely flowing both ways). iceConnectionState reaching
      // 'connected'/'completed' is a second, independent signal for the same
      // underlying fact — if EITHER fires, treat the call as active, so a
      // browser quirk in one API doesn't strand the UI on "Connecting…"
      // forever while audio/video actually works.
      let markedActive = false;
      const markActiveOnce = () => {
        if (markedActive) return;
        markedActive = true;
        if (connectingFallbackRef.current !== null) {
          window.clearTimeout(connectingFallbackRef.current);
          connectingFallbackRef.current = null;
        }
        setPhase('active');
      };

      pc.oniceconnectionstatechange = () => {
        const st = pc.iceConnectionState;
        console.log('[Call] ICE connection state:', st);
        if (st === 'connected' || st === 'completed') markActiveOnce();
        if (st === 'failed') {
          const id = liveCallIdRef.current;
          if (id) socketService.emit('call:hangup', { callId: id });
          endCall('ended');
        }
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
        console.log('[Call] connection state:', st);
        if (st === 'connected') markActiveOnce();
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
      peerAvatar = null,
      conversationId,
      type,
    }: {
      peerId: string;
      peerName: string;
      peerAvatar?: string | null;
      conversationId: string | null;
      type: CallType;
    }) => {
      if (phase !== 'idle' || !myId) return;
      setLastCall(null); // a fresh call is starting — stale "call again" info no longer applies
      // Provisional call object; real callId comes back on call:ringing.
      const provisional: ActiveCall = {
        callId: '',
        peerId,
        peerName,
        peerAvatar,
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
          // So the callee's incoming screen can show our name + photo.
          fromName: user?.username ? `@${user.username}` : (user?.firstName ?? getGuestDisplayName()),
          fromAvatar: user?.avatarUrl ?? null,
        });

        // Backstop: if the server's own auto-miss call:ended never arrives,
        // don't leave the caller stuck on "Calling…" forever.
        if (ringTimeoutRef.current !== null) window.clearTimeout(ringTimeoutRef.current);
        ringTimeoutRef.current = window.setTimeout(() => {
          ringTimeoutRef.current = null;
          if (
            callRef.current?.isCaller &&
            (phaseRef.current === 'outgoing' || phaseRef.current === 'ringing')
          ) {
            const id = liveCallIdRef.current;
            if (id) socketService.emit('call:hangup', { callId: id });
            endCall('ended');
          }
        }, CLIENT_RING_TIMEOUT_MS);
      } catch (err) {
        console.error('[Call] startCall failed', err);
        endCall('ended');
      }
    },
    [phase, myId, user, setCallState, createPeerConnection, attachLocalMedia, endCall],
  );

  const acceptCall = useCallback(async () => {
    const current = callRef.current;
    const offer = pendingOfferRef.current;
    if (!current || !offer) return;
    setPhase('connecting');
    startConnectingFallback();

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
      toast.error('Could not join the call. Please check your camera/microphone permissions and try again.');
      socketService.emit('call:hangup', { callId: current.callId });
      endCall('ended');
    }
  }, [createPeerConnection, attachLocalMedia, flushPendingCandidates, flushOutgoingCandidates, endCall, startConnectingFallback]);

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

  // Ringtone: ring while a call is incoming, ringback while outgoing/ringing
  // (the callee's device has been notified but hasn't answered yet — still a
  // "ringing" state from the caller's side), silence otherwise. Stops on
  // unmount too.
  useEffect(() => {
    if (phase === 'incoming') ringtone.ring();
    else if (phase === 'outgoing' || phase === 'ringing') ringtone.ringback();
    else ringtone.stop();
    return () => ringtone.stop();
  }, [phase]);

  // Keep the latest endCall/hangup in a ref so the socket-listener effect can
  // call fresh versions without depending on them (the effect must run once per
  // user session, not re-subscribe whenever a callback identity changes — that
  // was causing a changing-dependency-array warning under Fast Refresh).
  const handlersRef = useRef({ endCall, hangup, startConnectingFallback });
  useEffect(() => {
    handlersRef.current = { endCall, hangup, startConnectingFallback };
  }, [endCall, hangup, startConnectingFallback]);

  // ── Socket signaling listeners ──────────────────────────────────────────────
  useEffect(() => {
    if (!myId) return;
    const socket = socketService.getSocket() ?? socketService.connect();
    if (!socket) return;
    socketService.authenticate(myId);

    const onRinging = (data: { callId: string }) => {
      // Backend assigned the real callId AND confirms the callee's device
      // was actually notified — this is the true "ringing" moment, distinct
      // from "outgoing" (still talking to our own server). Record the id and
      // flush any ICE candidates the caller's PC produced before this
      // arrived — otherwise those early candidates are lost and media may
      // not connect both ways.
      const current = callRef.current;
      if (current && current.isCaller) {
        setCallState({ ...current, callId: data.callId });
        liveCallIdRef.current = data.callId;
        flushOutgoingCandidates();
        if (phaseRef.current === 'outgoing') setPhase('ringing');
      }
    };

    const onIncoming = (data: {
      callId: string;
      from: string;
      fromName: string;
      fromAvatar?: string | null;
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
        peerAvatar: data.fromAvatar ?? null,
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
      handlersRef.current.startConnectingFallback();
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        await flushPendingCandidates();
      } catch (err) {
        console.error('[Call] failed to apply answer', err);
        toast.error('Call could not connect. Please try again.');
        handlersRef.current.hangup();
      }
    };

    const onRemoteCandidate = async (data: { callId: string; candidate: RTCIceCandidateInit }) => {
      const pc = pcRef.current;
      if (!pc || !data.candidate) return;
      if (pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          console.log('[Call] added remote candidate');
        } catch (err) {
          console.warn('[Call] failed to add remote candidate', err);
        }
      } else {
        // Buffer until remoteDescription is set (flushed in accept/answer).
        console.log('[Call] buffering remote candidate (no remoteDescription yet)');
        pendingCandidatesRef.current.push(data.candidate);
      }
    };

    const onRejected = () => {
      // Only the caller sees this (the callee is the one who rejected); if
      // WE were the one calling, it's worth a clear "declined" toast rather
      // than the call just silently vanishing back to idle.
      if (callRef.current?.isCaller) toast(`${callRef.current.peerName.replace(/^@/, '')} declined the call`);
      handlersRef.current.endCall('ended');
    };
    const onEnded = () => handlersRef.current.endCall('ended');
    const onError = (data: { message?: string }) => {
      // Previously this only logged to the console and silently ended the
      // call — from the user's side that looked exactly like "the call
      // never rang" (e.g. the mutual-follow gate rejecting the invite
      // server-side gives zero visible feedback otherwise). Surface it.
      console.warn('[Call] error:', data?.message);
      toast.error(data?.message || 'Call could not be started.');
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

  // Bridge from the service worker: when the user taps Accept/Decline on an
  // incoming-call push notification, the SW posts a message here so we can
  // answer or decline the live call (the offer arrives over the socket).
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) return;
    const onMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || msg.source !== 'neyborhuud-call') return;
      const current = callRef.current;
      if (!current || current.isCaller) return;
      // Only act on the matching call.
      if (msg.callId && current.callId && msg.callId !== current.callId) return;
      if (msg.action === 'accept') void acceptCall();
      else if (msg.action === 'decline') rejectCall();
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [acceptCall, rejectCall]);

  const redial = useCallback(async () => {
    const target = lastCall;
    if (!target) return;
    await startCall({
      peerId: target.peerId,
      peerName: target.peerName,
      peerAvatar: target.peerAvatar,
      conversationId: target.conversationId,
      type: target.type,
    });
  }, [lastCall, startCall]);

  return (
    <CallContext.Provider
      value={{
        phase,
        call,
        lastCall,
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
        redial,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}
