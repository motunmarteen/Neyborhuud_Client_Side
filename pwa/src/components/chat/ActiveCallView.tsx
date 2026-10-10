'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Minimize2,
  Maximize2,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  ShieldCheck,
} from 'lucide-react';
import { useCall } from '@/contexts/CallContext';

export function ActiveCallView() {
  const {
    callStatus,
    activeCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoEnabled,
    endCall,
    toggleMute,
    toggleVideo,
  } = useCall();

  const [callDuration, setCallDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Hook up video streams to HTML video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callStatus]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callStatus]);

  // Call duration counter
  useEffect(() => {
    if (callStatus !== 'connected') {
      setCallDuration(0);
      return;
    }

    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [callStatus]);

  if (callStatus !== 'outgoing_ringing' && callStatus !== 'connected') {
    return null;
  }

  if (!activeCall) return null;

  const target = activeCall.targetInfo;
  const isVideo = activeCall.callType === 'video';

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Minimized Floating Pill View
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 z-50 flex items-center gap-3 bg-slate-900/95 backdrop-blur-2xl border border-white/20 text-white px-4 py-2.5 rounded-full shadow-2xl animate-in slide-in-from-bottom duration-300 select-none">
        <div className="h-2.5 w-2.5 rounded-full bg-[#00B82E] animate-pulse" />
        <span className="text-xs font-bold truncate max-w-[100px]">{target.name}</span>
        <span className="text-xs font-semibold text-slate-300">
          {callStatus === 'connected' ? formatTime(callDuration) : 'Ringing…'}
        </span>
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="p-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
          aria-label="Expand call"
        >
          <Maximize2 size={16} strokeWidth={2.2} />
        </button>
        <button
          type="button"
          onClick={endCall}
          className="h-7 w-7 rounded-full bg-rose-600 flex items-center justify-center hover:bg-rose-500 active:scale-90 transition-all cursor-pointer shadow-xs"
          aria-label="End call"
        >
          <PhoneOff size={14} strokeWidth={2.4} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-950 text-white overflow-hidden animate-in fade-in duration-300 select-none">
      {/* Top Header Bar */}
      <header className="relative z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
        <button
          type="button"
          onClick={() => setIsMinimized(true)}
          className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
          aria-label="Minimize Call"
        >
          <Minimize2 size={19} strokeWidth={2.2} />
        </button>

        <div className="flex flex-col items-center">
          <h3 className="text-base font-bold text-white tracking-tight">{target.name}</h3>
          <p className="text-xs font-semibold text-[#00B82E] flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00B82E] animate-pulse" />
            <span>{callStatus === 'connected' ? formatTime(callDuration) : 'Calling…'}</span>
          </p>
        </div>

        <div className="h-9 px-2.5 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-xl text-emerald-400 text-xs font-bold border border-white/10">
          HD Audio
        </div>
      </header>

      {/* Main Stream Area */}
      <div className="relative flex-1 flex items-center justify-center">
        {isVideo ? (
          <>
            {/* Remote Video Stream (Full-Screen) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Local Video Stream (Floating PiP Preview) */}
            <div className="absolute top-4 right-4 z-20 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/25 shadow-2xl bg-slate-900">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          </>
        ) : (
          /* Voice Call Mode (Audio Avatar & Soundwave) */
          <div className="flex flex-col items-center text-center p-6">
            <div className="relative mb-6">
              <div
                className={`absolute inset-0 rounded-full bg-emerald-500/20 ${
                  callStatus === 'connected' ? 'animate-pulse' : 'animate-ping'
                }`}
              />
              <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-[#00B82E]/40 shadow-2xl bg-slate-900 flex items-center justify-center">
                {target.avatar ? (
                  <Image src={target.avatar} alt={target.name} fill className="object-cover" />
                ) : (
                  <span className="text-5xl font-black text-[#00B82E]">
                    {target.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <h2 className="text-2xl font-black text-white mb-2">{target.name}</h2>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-xl text-xs font-semibold text-emerald-300 border border-white/10 shadow-xs">
              <ShieldCheck size={14} className="text-[#00B82E] shrink-0" />
              <span>Verified Resident • 📍 {target.huud || 'Your Huud'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <footer className="relative z-20 p-6 pb-10 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex items-center justify-center gap-7">
        {/* Mute Microphone Button */}
        <button
          type="button"
          onClick={toggleMute}
          className={`h-14 w-14 rounded-full flex items-center justify-center backdrop-blur-xl transition-all active:scale-95 cursor-pointer ${
            isMuted ? 'bg-rose-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
          }`}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff size={24} strokeWidth={2.4} /> : <Mic size={24} strokeWidth={2.4} />}
        </button>

        {/* Video Toggle Button (Only in Video Calls) */}
        {isVideo ? (
          <button
            type="button"
            onClick={toggleVideo}
            className={`h-14 w-14 rounded-full flex items-center justify-center backdrop-blur-xl transition-all active:scale-95 cursor-pointer ${
              !isVideoEnabled ? 'bg-rose-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            aria-label={isVideoEnabled ? 'Turn camera off' : 'Turn camera on'}
          >
            {!isVideoEnabled ? <VideoOff size={24} strokeWidth={2.4} /> : <Video size={24} strokeWidth={2.4} />}
          </button>
        ) : null}

        {/* End Call Button */}
        <button
          type="button"
          onClick={endCall}
          className="h-16 w-16 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-90 text-white flex items-center justify-center shadow-xl shadow-rose-950/60 transition-all cursor-pointer"
          aria-label="End call"
        >
          <PhoneOff size={30} strokeWidth={2.4} />
        </button>
      </footer>
    </div>
  );
}
