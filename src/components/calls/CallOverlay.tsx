'use client';

/**
 * CallOverlay — full-screen UI for the active/incoming/outgoing call.
 * Reads everything from CallProvider via useCall(); renders nothing when idle.
 */

import { useEffect, useRef, useState } from 'react';
import { useCall } from './CallProvider';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function CallOverlay() {
  const {
    phase,
    call,
    localStream,
    remoteStream,
    micEnabled,
    cameraEnabled,
    acceptCall,
    rejectCall,
    hangup,
    toggleMic,
    toggleCamera,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Bind streams to media elements.
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Call timer — runs while active.
  useEffect(() => {
    if (phase !== 'active') {
      setElapsed(0);
      return;
    }
    const t = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  if (phase === 'idle' || !call) return null;

  const isVideo = call.type === 'video';
  const statusText =
    phase === 'incoming'
      ? `Incoming ${call.type} call`
      : phase === 'outgoing'
        ? 'Calling…'
        : phase === 'connecting'
          ? 'Connecting…'
          : phase === 'active'
            ? formatDuration(elapsed)
            : 'Call ended';

  const initials = call.peerName
    .replace(/^@/, '')
    .slice(0, 2)
    .toUpperCase();

  const showRemoteVideo = isVideo && phase === 'active' && !!remoteStream;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-[#0a1a0f] text-white">
      {/* Remote audio always present so audio calls have sound */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* Remote video fills the screen for video calls */}
      {showRemoteVideo ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 h-full w-full bg-black object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary/30 text-4xl font-black ring-4 ring-primary/40">
            {initials || '👤'}
          </div>
        </div>
      )}

      {/* Local preview (picture-in-picture) for video calls */}
      {isVideo && localStream && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute right-4 top-4 z-10 h-40 w-28 rounded-2xl border-2 border-white/20 bg-black object-cover shadow-xl"
          style={{ transform: 'scaleX(-1)' }}
        />
      )}

      {/* Header: name + status */}
      <div className="relative z-10 flex flex-col items-center gap-1 px-6 pt-12 text-center">
        <h2 className="text-2xl font-black tracking-tight drop-shadow">{call.peerName}</h2>
        <p className="flex items-center gap-2 text-sm font-medium text-white/80 drop-shadow">
          {(phase === 'outgoing' || phase === 'connecting') && (
            <span className="material-symbols-outlined animate-pulse text-[1.1rem]" aria-hidden="true">
              {phase === 'connecting' ? 'sync' : 'call'}
            </span>
          )}
          {statusText}
        </p>
      </div>

      <div className="flex-1" />

      {/* Controls */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 pb-12">
        {phase === 'incoming' ? (
          <div className="flex w-full max-w-xs items-center justify-between">
            {/* Decline */}
            <button
              onClick={rejectCall}
              className="flex flex-col items-center gap-2"
              aria-label="Decline call"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-red text-white shadow-lg transition-transform active:scale-95">
                <span className="material-symbols-outlined text-[1.75rem]" aria-hidden="true">call_end</span>
              </span>
              <span className="text-xs font-semibold">Decline</span>
            </button>
            {/* Accept */}
            <button
              onClick={() => void acceptCall()}
              className="flex flex-col items-center gap-2"
              aria-label="Accept call"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform active:scale-95">
                <span className="material-symbols-outlined text-[1.75rem]" aria-hidden="true">
                  {isVideo ? 'videocam' : 'call'}
                </span>
              </span>
              <span className="text-xs font-semibold">Accept</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-5">
            {/* Mute */}
            <button
              onClick={toggleMic}
              className="flex flex-col items-center gap-1.5"
              aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-full shadow-md transition-transform active:scale-95 ${
                  micEnabled ? 'bg-white/15 text-white' : 'bg-white text-[#0a1a0f]'
                }`}
              >
                <span className="material-symbols-outlined text-[1.5rem]" aria-hidden="true">
                  {micEnabled ? 'mic' : 'mic_off'}
                </span>
              </span>
              <span className="text-[10px] font-medium text-white/70">
                {micEnabled ? 'Mute' : 'Unmute'}
              </span>
            </button>

            {/* Camera toggle (video calls only) */}
            {isVideo && (
              <button
                onClick={toggleCamera}
                className="flex flex-col items-center gap-1.5"
                aria-label={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-full shadow-md transition-transform active:scale-95 ${
                    cameraEnabled ? 'bg-white/15 text-white' : 'bg-white text-[#0a1a0f]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[1.5rem]" aria-hidden="true">
                    {cameraEnabled ? 'videocam' : 'videocam_off'}
                  </span>
                </span>
                <span className="text-[10px] font-medium text-white/70">
                  {cameraEnabled ? 'Camera' : 'Camera off'}
                </span>
              </button>
            )}

            {/* Hang up */}
            <button
              onClick={hangup}
              className="flex flex-col items-center gap-1.5"
              aria-label="End call"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-red text-white shadow-lg transition-transform active:scale-95">
                <span className="material-symbols-outlined text-[1.75rem]" aria-hidden="true">call_end</span>
              </span>
              <span className="text-[10px] font-medium text-white/70">End</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
