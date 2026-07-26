'use client';

/**
 * GroupCallOverlay — full-screen grid UI for an active mesh group call, plus
 * a lightweight banner when a group call is starting but we haven't joined.
 * Deliberately simple (a grid of tiles, no fancy layout logic) — the goal for
 * this pass is a working N-party call, not a polished video-conferencing UI.
 */

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useGroupCall, type GroupCallPeer } from './GroupCallProvider';

function PeerTile({ peer, isVideo }: { peer: GroupCallPeer; isVideo: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = peer.stream;
    if (audioRef.current) audioRef.current.srcObject = peer.stream;
    videoRef.current?.play?.().catch(() => {});
    audioRef.current?.play?.().catch(() => {});
  }, [peer.stream]);

  const hasVideoTrack = isVideo && !!peer.stream?.getVideoTracks().length;
  const initials = (peer.userName || '?').replace(/^@/, '').slice(0, 2).toUpperCase();

  return (
    <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-white/5">
      {isVideo && <video ref={videoRef} autoPlay playsInline className={`h-full w-full object-cover ${hasVideoTrack ? '' : 'hidden'}`} />}
      {!isVideo && <audio ref={audioRef} autoPlay playsInline className="hidden" />}
      {!hasVideoTrack && (
        <div className="flex flex-col items-center gap-2">
          {peer.userAvatar ? (
            <Image src={peer.userAvatar} alt="" width={64} height={64} className="h-16 w-16 rounded-full object-cover ring-2 ring-white/20" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/30 text-xl font-black ring-2 ring-white/20">
              {initials}
            </div>
          )}
        </div>
      )}
      <span className="absolute bottom-1.5 left-2 truncate text-[11px] font-semibold text-white drop-shadow">
        {peer.userName}
      </span>
    </div>
  );
}

export function GroupCallOverlay() {
  const {
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
  } = useGroupCall();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  // ── "A group call is starting" banner (not yet joined) ─────────────────
  if (phase === 'idle' && incomingCall) {
    const isVideo = incomingCall.callType === 'video';
    return (
      <div className="fixed inset-x-3 top-[calc(env(safe-area-inset-top,0px)+0.75rem)] z-[290] flex items-center gap-3 rounded-2xl bg-[#0a1a0f] px-4 py-3 text-white shadow-2xl">
        <span className="material-symbols-outlined text-[1.4rem] text-primary" aria-hidden="true">
          {isVideo ? 'videocam' : 'call'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold">Group {isVideo ? 'video' : 'voice'} call started</p>
          <p className="truncate text-[11px] text-white/60">Tap to join</p>
        </div>
        <button
          type="button"
          onClick={() => void joinCall(incomingCall)}
          className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-[12px] font-bold text-white active:scale-95"
        >
          Join
        </button>
        <button
          type="button"
          onClick={dismissIncoming}
          aria-label="Dismiss"
          className="shrink-0 text-white/50 active:scale-95"
        >
          <span className="material-symbols-outlined text-[1.2rem]" aria-hidden="true">close</span>
        </button>
      </div>
    );
  }

  if (phase === 'idle' || phase === 'ended' || !call) return null;

  const isVideo = call.callType === 'video';
  const atCap = peers.length + 1 >= call.maxParticipants;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-[#0a1a0f] text-white">
      <div className="relative z-10 flex flex-col items-center gap-1 px-6 pt-12 text-center">
        <h2 className="text-lg font-black tracking-tight">
          {phase === 'joining' ? 'Joining call…' : `Group ${isVideo ? 'video' : 'voice'} call`}
        </h2>
        <p className="text-xs font-medium text-white/60">
          {peers.length + 1} / {call.maxParticipants} in call
          {atCap ? ' · full' : ''}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {/* Local tile */}
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-white/5">
            {isVideo && (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${cameraEnabled ? '' : 'hidden'}`}
              />
            )}
            {(!isVideo || !cameraEnabled) && (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/40 text-xl font-black ring-2 ring-white/20">
                <span className="material-symbols-outlined text-[1.8rem]" aria-hidden="true">
                  person
                </span>
              </div>
            )}
            <span className="absolute bottom-1.5 left-2 text-[11px] font-semibold text-white drop-shadow">You</span>
            {!micEnabled && (
              <span className="material-symbols-outlined absolute right-2 top-2 text-[1rem] text-brand-red" aria-hidden="true">
                mic_off
              </span>
            )}
          </div>

          {peers.map((peer) => (
            <PeerTile key={peer.userId} peer={peer} isVideo={isVideo} />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 pb-12">
        <div className="flex items-center justify-center gap-5">
          <button onClick={toggleMic} className="flex flex-col items-center gap-1.5" aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}>
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full shadow-md transition-transform active:scale-95 ${
                micEnabled ? 'bg-white/15 text-white' : 'bg-white text-[#0a1a0f]'
              }`}
            >
              <span className="material-symbols-outlined text-[1.5rem]" aria-hidden="true">
                {micEnabled ? 'mic' : 'mic_off'}
              </span>
            </span>
            <span className="text-[10px] font-medium text-white/70">{micEnabled ? 'Mute' : 'Unmute'}</span>
          </button>

          {isVideo && (
            <button onClick={toggleCamera} className="flex flex-col items-center gap-1.5" aria-label={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}>
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-full shadow-md transition-transform active:scale-95 ${
                  cameraEnabled ? 'bg-white/15 text-white' : 'bg-white text-[#0a1a0f]'
                }`}
              >
                <span className="material-symbols-outlined text-[1.5rem]" aria-hidden="true">
                  {cameraEnabled ? 'videocam' : 'videocam_off'}
                </span>
              </span>
              <span className="text-[10px] font-medium text-white/70">{cameraEnabled ? 'Camera' : 'Camera off'}</span>
            </button>
          )}

          <button onClick={leaveCall} className="flex flex-col items-center gap-1.5" aria-label="Leave call">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-red text-white shadow-lg transition-transform active:scale-95">
              <span className="material-symbols-outlined text-[1.75rem]" aria-hidden="true">call_end</span>
            </span>
            <span className="text-[10px] font-medium text-white/70">Leave</span>
          </button>
        </div>
      </div>
    </div>
  );
}
