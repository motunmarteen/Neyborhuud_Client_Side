'use client';

import React from 'react';
import Image from 'next/image';
import { Phone, Video, PhoneOff, ShieldCheck, MapPin } from 'lucide-react';
import { useCall } from '@/contexts/CallContext';

export function IncomingCallModal() {
  const { callStatus, activeCall, acceptCall, rejectCall } = useCall();

  if (callStatus !== 'incoming_ringing' || !activeCall) {
    return null;
  }

  const caller = activeCall.targetInfo;
  const isVideo = activeCall.callType === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4 animate-in fade-in duration-300 select-none">
      <div className="flex flex-col items-center text-center max-w-sm w-full mx-auto text-white">
        {/* Pulsing Avatar Ring */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-emerald-500/25 animate-ping" />
          <div className="relative h-28 w-28 rounded-full overflow-hidden border-4 border-[#00B82E]/50 shadow-2xl bg-slate-900 flex items-center justify-center">
            {caller.avatar ? (
              <Image
                src={caller.avatar}
                alt={caller.name}
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-4xl font-black text-[#00B82E]">
                {caller.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Caller Name */}
        <h2 className="text-2xl font-black tracking-tight text-white mb-2">
          {caller.name}
        </h2>

        {/* Hyperlocal Trust Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 text-xs font-semibold text-emerald-300 mb-3 shadow-xs">
          <ShieldCheck size={14} className="text-[#00B82E] shrink-0" />
          <span>Verified Resident • 📍 {caller.huud || 'Your Huud'}</span>
          {caller.trustScore ? (
            <span className="text-slate-300 font-bold">({caller.trustScore} Trust)</span>
          ) : null}
        </div>

        {/* Call Type Indicator */}
        <p className="text-sm font-medium text-slate-300 mb-10 flex items-center gap-1.5">
          {isVideo ? <Video size={16} className="text-emerald-400" /> : <Phone size={16} className="text-emerald-400" />}
          <span>Incoming {isVideo ? 'Video Call' : 'Voice Call'}…</span>
        </p>

        {/* Action Controls (Decline vs Answer) */}
        <div className="flex items-center justify-center gap-14 w-full">
          {/* Decline Button */}
          <button
            type="button"
            onClick={() => rejectCall('declined')}
            className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
            aria-label="Decline Call"
          >
            <div className="h-16 w-16 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-90 text-white flex items-center justify-center shadow-lg shadow-rose-950/50 transition-all">
              <PhoneOff size={28} strokeWidth={2.4} />
            </div>
            <span className="text-xs font-bold text-slate-400 group-hover:text-white uppercase tracking-wider">
              Decline
            </span>
          </button>

          {/* Accept Button */}
          <button
            type="button"
            onClick={acceptCall}
            className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
            aria-label="Answer Call"
          >
            <div className="h-16 w-16 rounded-full bg-[#00B82E] hover:bg-[#00B02A] active:scale-90 text-white flex items-center justify-center shadow-lg shadow-emerald-950/50 animate-bounce transition-all">
              {isVideo ? <Video size={28} strokeWidth={2.4} /> : <Phone size={28} strokeWidth={2.4} />}
            </div>
            <span className="text-xs font-bold text-[#00B82E] group-hover:text-emerald-300 uppercase tracking-wider">
              Answer
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
