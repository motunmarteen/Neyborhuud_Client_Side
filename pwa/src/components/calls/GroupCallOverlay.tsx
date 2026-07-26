'use client';

/**
 * GroupCallOverlay — full-screen grid UI for an active mesh group call, plus
 * a lightweight banner when a group call is starting but we haven't joined.
 *
 * Shares the 1:1 CallOverlay's visual language: a tile without a live video
 * track shows the person's own full-bleed photo (or a gradient initials
 * tile) rather than a small floating circle, so a voice-only group call
 * still feels like a room full of people instead of a grid of dots.
 */

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useGroupCall, type GroupCallPeer } from './GroupCallProvider';

function TilePortrait({ avatarUrl, initials }: { avatarUrl: string | null | undefined; initials: string }) {
  if (avatarUrl) {
    return <Image src={avatarUrl} alt="" fill sizes="33vw" className="object-cover" />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/70 via-primary/35 to-[#0a1a0f] text-2xl font-black text-white/90">
      {initials || '👤'}
    </div>
  );
}

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
    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-white/5 ring-2 ring-white/10">
      {isVideo && <video ref={videoRef} autoPlay playsInline className={`absolute inset-0 h-full w-full object-cover ${hasVideoTrack ? '' : 'hidden'}`} />}
      {!isVideo && <audio ref={audioRef} autoPlay playsInline className="hidden" />}
      {!hasVideoTrack && (
        <div className="absolute inset-0">
          <TilePortrait avatarUrl={peer.userAvatar} initials={initials} />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 pb-1.5 pt-5">
        <span className="truncate text-[11px] font-semibold text-white drop-shadow">{peer.userName}</span>
      </div>
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
  const localHasVideo = isVideo && cameraEnabled;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col overflow-hidden bg-black text-white">
      {/* Ambient backdrop, echoing the 1:1 call screen: a soft dark-green wash
          rather than a flat block, so a voice-only room still feels alive. */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f2417] via-[#0a1a0f] to-black" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

      <div className="relative z-10 flex flex-col items-center gap-1 px-6 pt-14 text-center">
        <h2 className="text-[1.35rem] font-black tracking-tight drop-shadow-lg">
          {phase === 'joining' ? 'Joining call…' : `Group ${isVideo ? 'video' : 'voice'} call`}
        </h2>
        <p className="text-xs font-semibold text-white/70 drop-shadow">
          {peers.length + 1} / {call.maxParticipants} in call
          {atCap ? ' · full' : ''}
        </p>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-5">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {/* Local tile — same portrait treatment as everyone else's tile. */}
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-white/5 ring-2 ring-primary/40">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 h-full w-full object-cover ${localHasVideo ? '' : 'hidden'}`}
            />
            {!localHasVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/70 via-primary/35 to-[#0a1a0f]">
                <span className="material-symbols-outlined text-[2.2rem] text-white/90" aria-hidden="true">person</span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 pb-1.5 pt-5">
              <span className="text-[11px] font-semibold text-white drop-shadow">You</span>
            </div>
            {!micEnabled && (
              <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50">
                <span className="material-symbols-outlined text-[0.9rem] text-brand-red" aria-hidden="true">mic_off</span>
              </span>
            )}
          </div>

          {peers.map((peer) => (
            <PeerTile key={peer.userId} peer={peer} isVideo={isVideo} />
          ))}
        </div>
      </div>

      {/* Controls — same frosted-glass bar as the 1:1 call screen. */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 pb-12">
        <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-black/40 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-center justify-center gap-4">
            <button onClick={toggleMic} className="flex flex-col items-center gap-1.5" aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}>
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-full shadow-md transition-transform active:scale-95 ${
                  micEnabled ? 'bg-white/12 text-white' : 'bg-white text-[#0a1a0f]'
                }`}
              >
                <span className="material-symbols-outlined text-[1.4rem]" aria-hidden="true">
                  {micEnabled ? 'mic' : 'mic_off'}
                </span>
              </span>
              <span className="text-[10px] font-medium text-white/70">{micEnabled ? 'Mute' : 'Unmute'}</span>
            </button>

            {isVideo && (
              <button onClick={toggleCamera} className="flex flex-col items-center gap-1.5" aria-label={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}>
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-full shadow-md transition-transform active:scale-95 ${
                    cameraEnabled ? 'bg-white/12 text-white' : 'bg-white text-[#0a1a0f]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[1.4rem]" aria-hidden="true">
                    {cameraEnabled ? 'videocam' : 'videocam_off'}
                  </span>
                </span>
                <span className="text-[10px] font-medium text-white/70">{cameraEnabled ? 'Camera' : 'Off'}</span>
              </button>
            )}

            <button onClick={leaveCall} className="flex flex-col items-center gap-1.5" aria-label="Leave call">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-red text-white shadow-lg transition-transform active:scale-95">
                <span className="material-symbols-outlined text-[1.4rem]" aria-hidden="true">call_end</span>
              </span>
              <span className="text-[10px] font-medium text-white/70">Leave</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
