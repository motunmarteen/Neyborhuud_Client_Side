'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import socketService from '@/lib/socket';
import apiClient from '@/lib/api-client';
import { callAudio } from '@/lib/callAudio';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/toast';

export type CallType = 'audio' | 'video';
export type CallStatus = 'idle' | 'outgoing_ringing' | 'incoming_ringing' | 'connected' | 'ended';

export interface CallerInfo {
  name: string;
  avatar?: string;
  huud?: string;
  trustScore?: number;
}

export interface ActiveCallInfo {
  callId: string;
  targetUserId: string;
  targetInfo: CallerInfo;
  callType: CallType;
  isCaller: boolean;
  conversationId?: string;
  startedAt?: number;
}

interface CallContextType {
  callStatus: CallStatus;
  activeCall: ActiveCallInfo | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  initiateCall: (targetUserId: string, callType: CallType, targetInfo: CallerInfo, conversationId?: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: (reason?: string) => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  simulateIncomingCall: (info?: Partial<CallerInfo>, type?: CallType) => void;
  simulateActiveCall: (info?: Partial<CallerInfo>, type?: CallType) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
];

export function CallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [activeCall, setActiveCall] = useState<ActiveCallInfo | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const iceServersRef = useRef<RTCIceServer[]>(DEFAULT_ICE_SERVERS);

  // Fetch dynamic TURN/STUN servers once signed in (the endpoint needs a
  // session). apiClient.get already unwraps the HTTP body, so the list is at
  // res.data.iceServers — the old res.data.data path never matched, so the
  // server's TURN config was silently ignored.
  const signedInUserId = (user as { id?: string } | null | undefined)?.id;
  useEffect(() => {
    if (!signedInUserId) return;
    let isMounted = true;
    apiClient
      .get<{ iceServers?: RTCIceServer[] }>('/chat/webrtc/ice-servers')
      .then((res) => {
        const servers = res.data?.iceServers;
        if (isMounted && Array.isArray(servers) && servers.length > 0) {
          iceServersRef.current = servers;
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [signedInUserId]);

  // Clean up peer connection and media tracks
  const cleanupMediaAndPeer = useCallback(() => {
    callAudio.stop();

    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    remoteStreamRef.current = null;
    setRemoteStream(null);
    setIsMuted(false);
    setIsVideoEnabled(true);
  }, []);

  // Initialize WebRTC Peer Connection
  const createPeerConnection = useCallback((targetUserId: string, callId: string) => {
    if (pcRef.current) {
      pcRef.current.close();
    }

    const pc = new RTCPeerConnection({
      iceServers: iceServersRef.current,
    });
    pcRef.current = pc;

    // Stream remote media
    const remote = new MediaStream();
    remoteStreamRef.current = remote;
    setRemoteStream(remote);

    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        remote.addTrack(track);
      });
    };

    // Trickle ICE candidate relay
    pc.onicecandidate = (event) => {
      if (event.candidate && socketService.socket) {
        socketService.socket.emit('call:signal', {
          callId,
          targetUserId,
          signal: event.candidate,
          type: 'ice-candidate',
        });
      }
    };

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    return pc;
  }, []);

  // Initiate an Outgoing Call
  const initiateCall = useCallback(
    async (
      targetUserId: string,
      callType: CallType,
      targetInfo: CallerInfo,
      conversationId?: string,
    ) => {
      if (!user) {
        toast.error('You must be logged in to make a call');
        return;
      }

      const socket = socketService.socket;
      if (!socket || !socket.connected) {
        toast.error('Network connection required to place calls');
        return;
      }

      cleanupMediaAndPeer();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video',
        });
        localStreamRef.current = stream;
        setLocalStream(stream);

        const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const callInfo: ActiveCallInfo = {
          callId,
          targetUserId,
          targetInfo,
          callType,
          isCaller: true,
          conversationId,
        };

        setActiveCall(callInfo);
        setCallStatus('outgoing_ringing');
        callAudio.startOutgoingDialtone();

        // Emit call initiation to backend
        socket.emit('call:initiate', {
          callId,
          calleeId: targetUserId,
          callType,
          conversationId,
          callerInfo: {
            name: (user as any).name || user.username || 'A neighbor',
            avatar: user.avatarUrl || (user as any).avatar,
            huud: (user as any).primaryCommunityName || 'Your Huud',
            trustScore: user.trustScore || 850,
          },
        });
      } catch (err) {
        toast.error(
          callType === 'video'
            ? 'Camera/microphone access required for video call'
            : 'Microphone access required for voice call',
        );
        cleanupMediaAndPeer();
        setCallStatus('idle');
      }
    },
    [user, cleanupMediaAndPeer],
  );

  // Reject Call
  const rejectCall = useCallback(
    (reason: string = 'declined') => {
      if (activeCall && socketService.socket) {
        socketService.socket.emit('call:reject', {
          callId: activeCall.callId,
          callerId: activeCall.targetUserId,
          reason,
        });
      }
      cleanupMediaAndPeer();
      setCallStatus('idle');
      setActiveCall(null);
    },
    [activeCall, cleanupMediaAndPeer],
  );

  // Accept an Incoming Call
  const acceptCall = useCallback(async () => {
    if (!activeCall) return;
    callAudio.stop();

    // If this is a simulated test call, connect immediately without hardware requirement
    if (activeCall.callId.startsWith('test-call-')) {
      setCallStatus('connected');
      setActiveCall((prev) => (prev ? { ...prev, startedAt: Date.now() } : null));
      toast.success('Call connected (Test Mode)');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: activeCall.callType === 'video',
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection(activeCall.targetUserId, activeCall.callId);

      // Notify caller of acceptance
      socketService.socket?.emit('call:accept', {
        callId: activeCall.callId,
        callerId: activeCall.targetUserId,
      });

      setCallStatus('connected');
      setActiveCall((prev) => (prev ? { ...prev, startedAt: Date.now() } : null));
    } catch (err) {
      toast.error('Could not access microphone/camera');
      rejectCall('device_error');
    }
  }, [activeCall, createPeerConnection, rejectCall]);

  // Test Simulation Methods
  const simulateIncomingCall = useCallback((info?: Partial<CallerInfo>, type: CallType = 'audio') => {
    callAudio.stop();
    callAudio.startIncomingRingtone();
    setActiveCall({
      callId: `test-call-${Date.now()}`,
      targetUserId: 'demo-user-fatima',
      targetInfo: {
        name: info?.name || 'Fatima Abdullahi',
        avatar: info?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        huud: info?.huud || 'Lekki Phase 1 · Verified Resident',
        trustScore: info?.trustScore || 940,
      },
      callType: type,
      isCaller: false,
    });
    setCallStatus('incoming_ringing');
  }, []);

  const simulateActiveCall = useCallback((info?: Partial<CallerInfo>, type: CallType = 'audio') => {
    callAudio.stop();
    setActiveCall({
      callId: `test-call-${Date.now()}`,
      targetUserId: 'demo-user-fatima',
      targetInfo: {
        name: info?.name || 'Fatima Abdullahi',
        avatar: info?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        huud: info?.huud || 'Lekki Phase 1 · Verified Resident',
        trustScore: info?.trustScore || 940,
      },
      callType: type,
      isCaller: false,
      startedAt: Date.now(),
    });
    setCallStatus('connected');
    toast.success('Active WebRTC call view opened');
  }, []);

  // End an Active Call
  const endCall = useCallback(() => {
    if (activeCall && socketService.socket) {
      socketService.socket.emit('call:end', {
        callId: activeCall.callId,
        targetUserId: activeCall.targetUserId,
      });
    }
    callAudio.playCallEndedTone();
    cleanupMediaAndPeer();
    setCallStatus('idle');
    setActiveCall(null);
  }, [activeCall, cleanupMediaAndPeer]);

  // Microphone toggle
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Camera video toggle
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  // Socket signaling listener registration
  useEffect(() => {
    const socket = socketService.socket;
    if (!socket) return;

    // Incoming Call listener
    const handleIncomingCall = (data: any) => {
      // If already in a call, send busy response
      if (callStatus !== 'idle') {
        socket.emit('call:reject', {
          callId: data.callId,
          callerId: data.callerId,
          reason: 'busy',
        });
        return;
      }

      setActiveCall({
        callId: data.callId,
        targetUserId: data.callerId,
        targetInfo: data.callerInfo || { name: 'A neighbor' },
        callType: data.callType || 'audio',
        isCaller: false,
        conversationId: data.conversationId,
      });
      setCallStatus('incoming_ringing');
      callAudio.startIncomingRingtone();
    };

    // Caller receives acceptance from callee
    const handleCallAccepted = async (data: any) => {
      callAudio.stop();
      setCallStatus('connected');
      setActiveCall((prev) => (prev ? { ...prev, startedAt: Date.now() } : null));

      if (activeCall) {
        const pc = createPeerConnection(data.calleeId, data.callId);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('call:signal', {
            callId: data.callId,
            targetUserId: data.calleeId,
            signal: offer,
            type: 'offer',
          });
        } catch (err) {
          console.error('[WebRTC] Error creating offer:', err);
        }
      }
    };

    // Call Rejected
    const handleCallRejected = (data: any) => {
      callAudio.playCallEndedTone();
      toast.info(data.reason === 'busy' ? 'User is on another call' : 'Call declined');
      cleanupMediaAndPeer();
      setCallStatus('idle');
      setActiveCall(null);
    };

    // WebRTC Signal Exchange (Offer, Answer, ICE Candidate)
    const handleCallSignal = async (data: any) => {
      const pc = pcRef.current;
      if (!pc) return;

      try {
        if (data.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('call:signal', {
            callId: data.callId,
            targetUserId: data.senderId,
            signal: answer,
            type: 'answer',
          });
        } else if (data.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
        } else if (data.type === 'ice-candidate') {
          if (data.signal) {
            await pc.addIceCandidate(new RTCIceCandidate(data.signal));
          }
        }
      } catch (err) {
        console.error('[WebRTC] Signaling error:', err);
      }
    };

    // Remote Ended Call
    const handleCallEnded = () => {
      callAudio.playCallEndedTone();
      toast.info('Call ended');
      cleanupMediaAndPeer();
      setCallStatus('idle');
      setActiveCall(null);
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:signal', handleCallSignal);
    socket.on('call:ended', handleCallEnded);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:rejected', handleCallRejected);
      socket.off('call:signal', handleCallSignal);
      socket.off('call:ended', handleCallEnded);
    };
  }, [callStatus, activeCall, createPeerConnection, cleanupMediaAndPeer]);

  return (
    <CallContext.Provider
      value={{
        callStatus,
        activeCall,
        localStream,
        remoteStream,
        isMuted,
        isVideoEnabled,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        simulateIncomingCall,
        simulateActiveCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
