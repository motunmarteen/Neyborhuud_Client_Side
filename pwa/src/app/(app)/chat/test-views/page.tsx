'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, notFound } from 'next/navigation';
import { DEMO_MODE } from '@/lib/demoMode';
import {
  ArrowLeft,
  Phone,
  Video,
  ShieldCheck,
  ShoppingBag,
  MessageSquare,
  Sparkles,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  ExternalLink,
} from 'lucide-react';
import { useCall } from '@/contexts/CallContext';
import { toast } from '@/lib/toast';
import { DealStatusCard } from '@/components/chat/DealStatusCard';
import type { ChatMessage } from '@/types/api';

// Developer simulation page (fake calls / deal cards) — never in production.
export default function Phase3TestViewsPage() {
  if (!DEMO_MODE) notFound();
  return <Phase3TestViews />;
}

function Phase3TestViews() {
  const router = useRouter();
  const { simulateIncomingCall, simulateActiveCall } = useCall();

  // Mock deal message for the embedded handshake test card
  const [dealStage, setDealStage] = useState<'accepted' | 'paid' | 'paid_confirmed' | 'shipped' | 'completed'>('accepted');

  const mockDealMessage: ChatMessage = {
    id: 'demo-test-deal-msg',
    conversationId: 'demo-marketplace',
    senderId: 'demo-kunle',
    content: '🤝 Offer accepted: Yamaha Generator 2.8kVA for ₦185,000.',
    type: 'system',
    createdAt: new Date().toISOString(),
    isEdited: false,
    isDeleted: false,
    priority: 'normal',
    status: 'read',
    meta: {
      dealAction: dealStage,
      orderId: 'demo-order-123',
      buyerId: 'current-user',
      sellerId: 'demo-kunle',
      itemTitle: 'Yamaha Generator 2.8kVA',
      amount: 185000,
      currency: 'NGN',
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 select-none">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/friendship?tab=chats')}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-95 transition-all cursor-pointer"
              aria-label="Back to chats"
            >
              <ArrowLeft size={20} strokeWidth={2.4} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900">Phase 3 Live Test Lab</h1>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-800">
                  Daylight
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">WhatsApp Chat · WebRTC Calling · P2P Deals</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push('/friendship?tab=chats')}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all"
          >
            Chats Stream
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* ── Section 1: WebRTC Calling Simulation ── */}
        <section className="rounded-3xl border border-black/[0.06] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Phone size={18} strokeWidth={2.4} />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">1. WebRTC Calling Studio</h2>
                <p className="text-xs text-slate-500">Free, no-airtime calling between verified estate neighbors</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
              Zero Airtime
            </span>
          </div>

          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Test the native WebRTC call state machine. Trigger the full-screen ringing screen or test the picture-in-picture active call view.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                simulateIncomingCall(
                  {
                    name: 'Fatima Abdullahi',
                    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                    huud: 'Lekki Phase 1 · Resident',
                    trustScore: 940,
                  },
                  'audio',
                );
              }}
              className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 p-3.5 text-left hover:border-emerald-300 active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
            >
              <div>
                <p className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                  <Phone size={14} className="text-emerald-700" /> Ring Incoming Audio Call
                </p>
                <p className="text-[11px] text-emerald-700/80 mt-0.5">Ringtone + pulsing avatar modal</p>
              </div>
              <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs">
                Launch
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                simulateIncomingCall(
                  {
                    name: 'Kunle Balogun',
                    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                    huud: 'Victoria Island · Resident',
                    trustScore: 880,
                  },
                  'video',
                );
              }}
              className="flex items-center justify-between rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/80 to-teal-100/40 p-3.5 text-left hover:border-teal-300 active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
            >
              <div>
                <p className="text-xs font-extrabold text-teal-950 flex items-center gap-1.5">
                  <Video size={14} className="text-teal-700" /> Ring Incoming Video Call
                </p>
                <p className="text-[11px] text-teal-700/80 mt-0.5">Video camera invitation modal</p>
              </div>
              <span className="rounded-full bg-teal-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs">
                Launch
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                simulateActiveCall(
                  {
                    name: 'Fatima Abdullahi',
                    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                    huud: 'Lekki Phase 1',
                  },
                  'audio',
                );
              }}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-left hover:border-slate-300 active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
            >
              <div>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Phone size={14} className="text-slate-700" /> Active Call (PiP Bubble)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Live timer & minifiable floating card</p>
              </div>
              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs">
                Test PiP
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                simulateActiveCall(
                  {
                    name: 'Kunle Balogun',
                    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                    huud: 'Victoria Island',
                  },
                  'video',
                );
              }}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-left hover:border-slate-300 active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
            >
              <div>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Video size={14} className="text-slate-700" /> Active Video Screen
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Fullscreen grid with mute & camera flips</p>
              </div>
              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs">
                Test Video
              </span>
            </button>
          </div>
        </section>

        {/* ── Section 2: Interactive Chat Rooms ── */}
        <section className="rounded-3xl border border-black/[0.06] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                <MessageSquare size={18} strokeWidth={2.4} />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">2. Interactive Chat Room Streams</h2>
                <p className="text-xs text-slate-500">Live active rooms with composer, audio notes, and responsive headers</p>
              </div>
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 border border-blue-200">
              4 Scenarios
            </span>
          </div>

          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Click into any chat room. Type messages to see optimistic delivery and auto-responses. Press the mic to record voice notes or tap the header to test calling directly.
          </p>

          <div className="space-y-2">
            {/* Room 1 */}
            <div
              onClick={() => router.push('/chat/demo-neighbor')}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 hover:bg-slate-100/70 active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-[#00B82E] ring-2 ring-[#00B82E]/20">
                  <Image
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                    alt="Fatima"
                    width={44}
                    height={44}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-extrabold text-slate-900">Fatima Abdullahi</p>
                    <ShieldCheck size={14} className="text-[#00B82E]" />
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-black text-emerald-800">
                      Resident
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    "The estate gate pass for visitors is active today..."
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-full bg-[#00B82E] px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                  1 Unread
                </span>
                <ExternalLink size={14} className="text-slate-400" />
              </div>
            </div>

            {/* Room 2 */}
            <div
              onClick={() => router.push('/chat/demo-marketplace')}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 hover:bg-slate-100/70 active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-amber-500 ring-2 ring-amber-500/20">
                  <Image
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                    alt="Kunle"
                    width={44}
                    height={44}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-extrabold text-slate-900">Kunle Balogun · P2P Deal</p>
                    <ShoppingBag size={13} className="text-amber-600" />
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    "🤝 Offer accepted: Yamaha Generator 2.8kVA for ₦185,000"
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                  Handshake
                </span>
                <ExternalLink size={14} className="text-slate-400" />
              </div>
            </div>

            {/* Room 3 */}
            <div
              onClick={() => router.push('/chat/demo-estate')}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 hover:bg-slate-100/70 active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Users size={20} strokeWidth={2.4} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-extrabold text-slate-900">Victoria Garden City (VGC) Hub</p>
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[9px] font-black text-blue-800">
                      Community
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    "Notice: Estate transformer inspection scheduled today."
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ExternalLink size={14} className="text-slate-400" />
              </div>
            </div>

            {/* Room 4 */}
            <div
              onClick={() => router.push('/chat/demo-security')}
              className="flex items-center justify-between gap-3 rounded-2xl border border-rose-100 bg-rose-50/40 p-3.5 hover:bg-rose-50/70 active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                  <AlertTriangle size={20} strokeWidth={2.4} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-extrabold text-rose-900">Estate Rapid Response Patrol</p>
                    <span className="rounded-full bg-rose-100 px-1.5 py-0.2 text-[9px] font-black text-rose-800">
                      Emergency
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-700/80 truncate mt-0.5">
                    "Night security patrol protocol active across Avenue 2 & 4."
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ExternalLink size={14} className="text-rose-400" />
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 3: In-Chat P2P Deal Handshake Card ── */}
        <section className="rounded-3xl border border-black/[0.06] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                <ShoppingBag size={18} strokeWidth={2.4} />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">3. In-Chat Deal Handshake Card</h2>
                <p className="text-xs text-slate-500">Live agreement card showing peer-to-peer progression stages</p>
              </div>
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 border border-amber-200">
              Interactive
            </span>
          </div>

          <p className="text-xs text-slate-600 mb-3 leading-relaxed">
            Switch stages to see how the card adapts to buyer and seller turns along the handshake process:
          </p>

          {/* Stage pills */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(['accepted', 'paid', 'paid_confirmed', 'shipped', 'completed'] as const).map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => setDealStage(stage)}
                className={`rounded-full px-2.5 py-1 text-xs font-bold transition-all ${
                  dealStage === stage
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {stage === 'accepted' && '1. Offer Agreed'}
                {stage === 'paid' && "2. Buyer Paid"}
                {stage === 'paid_confirmed' && '3. Seller Confirmed'}
                {stage === 'shipped' && '4. Inspected / Sent'}
                {stage === 'completed' && '5. Completed'}
              </button>
            ))}
          </div>

          {/* Embedded Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
            <DealStatusCard msg={mockDealMessage} currentUserId="current-user" />
          </div>
        </section>

        {/* ── Section 4: Daylight Toast System Verification ── */}
        <section className="rounded-3xl border border-black/[0.06] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-100">
                <Sparkles size={18} strokeWidth={2.4} />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">4. Unified Daylight Toast Feedback</h2>
                <p className="text-xs text-slate-500">Pure daylight light theme, high contrast, zero dark mode inversion</p>
              </div>
            </div>
            <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700 border border-purple-200">
              Tested
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => toast.success('Resident verification verified ✅')}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 active:scale-95 transition-all shadow-2xs cursor-pointer"
            >
              <CheckCircle2 size={14} className="text-emerald-600" /> Success Toast
            </button>

            <button
              type="button"
              onClick={() => toast.error('Peer connection timed out. Retrying...')}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-800 hover:bg-rose-100 active:scale-95 transition-all shadow-2xs cursor-pointer"
            >
              <XCircle size={14} className="text-rose-600" /> Error Toast
            </button>

            <button
              type="button"
              onClick={() => toast.info('WebRTC HD voice encryption enabled')}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-bold text-blue-800 hover:bg-blue-100 active:scale-95 transition-all shadow-2xs cursor-pointer"
            >
              <Info size={14} className="text-blue-600" /> Info Toast
            </button>

            <button
              type="button"
              onClick={() => toast.warning('Visitor pass expires at 6:00 PM')}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-800 hover:bg-amber-100 active:scale-95 transition-all shadow-2xs cursor-pointer"
            >
              <AlertTriangle size={14} className="text-amber-600" /> Warning Toast
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
