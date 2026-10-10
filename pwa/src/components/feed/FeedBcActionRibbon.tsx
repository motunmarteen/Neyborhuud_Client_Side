'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShoppingBag,
  Briefcase,
  Megaphone,
  Calendar,
  HeartHandshake,
  Zap,
  CheckCircle2,
  Users,
  Flame,
  ArrowRight,
  Trophy,
  Clock,
  Crown,
  CreditCard,
} from 'lucide-react';
import { Eli5Tooltip } from '@/components/ui/Eli5Tooltip';

const QUICK_CATEGORIES = [
  { label: 'Marketplace', href: '/marketplace', Icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Gigs & Work', href: '/jobs', Icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'FYI Bulletins', href: '/fyi', Icon: Megaphone, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Huud Events', href: '/events', Icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Help Requests', href: '/help-request', Icon: HeartHandshake, color: 'text-rose-600', bg: 'bg-rose-50' },
  { label: 'Safety Watch', href: '/safety', Icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
];

const COMMUNITY_CIRCLES = [
  { id: 'c1', name: 'Security Patrol', zone: 'Lekki Phase 1', members: 42, tag: 'Sentinel', badgeBg: 'bg-emerald-50 text-emerald-700' },
  { id: 'c2', name: 'Direct Fresh Hub', zone: 'Admiralty Way', members: 128, tag: 'Zero-Escrow', badgeBg: 'bg-amber-50 text-amber-700' },
  { id: 'c3', name: 'Generators & Power', zone: 'Zone B Grid', members: 71, tag: 'Utility Watch', badgeBg: 'bg-blue-50 text-blue-700' },
  { id: 'c4', name: 'Saturday Runners', zone: 'Ikoyi Link Bridge', members: 36, tag: 'Health Club', badgeBg: 'bg-purple-50 text-purple-700' },
];

const LIVE_PULSES = [
  {
    id: 'p1',
    user: 'Chioma A.',
    action: 'Verified residence',
    target: 'Lekki Phase 1',
    time: '2m ago',
    type: 'trust',
  },
  {
    id: 'p2',
    user: 'Engr. Tunde',
    action: 'Listed service',
    target: 'Inverter maintenance',
    time: '6m ago',
    type: 'trade',
  },
  {
    id: 'p3',
    user: 'Estate Security',
    action: 'Cleared checkpoint',
    target: 'North Gate Access',
    time: '11m ago',
    type: 'safety',
  },
  {
    id: 'p4',
    user: 'Emeka O.',
    action: 'Completed trade',
    target: 'MacBook Charger',
    time: '18m ago',
    type: 'trade',
  },
];

export function FeedBcActionRibbon() {
  const [pulseFilter, setPulseFilter] = useState<'all' | 'safety' | 'trade'>('all');

  const filteredPulses = LIVE_PULSES.filter((p) => {
    if (pulseFilter === 'all') return true;
    return p.type === pulseFilter;
  });

  return (
    <div className="w-full space-y-3.5 px-3.5 sm:px-4 select-none">
      {/* 1. TOP 2 SPOTLIGHT HERO CARDS (Clean Daylight Solid Cards) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
        {/* Left Card: Sentinel Safety Radar */}
        <Link
          href="/safety"
          className="group relative overflow-hidden rounded-2xl bg-white border border-black/[0.08] p-3.5 sm:p-4 transition-all hover:border-[#0E8A3E]/40 hover:shadow-md active:scale-[0.98] flex flex-col justify-between min-h-[140px] shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
              RADAR LIVE
            </span>
            <Eli5Tooltip
              term="Street Radar"
              explanation="Real-time status of your street (power, traffic, or safety) up to 500 meters away."
            />
          </div>

          <div className="mt-2">
            <h4 className="text-sm sm:text-base font-black text-[#1D2433] group-hover:text-[#0E8A3E] transition-colors flex items-center gap-1.5">
              <span>Sentinel Radar</span>
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </h4>
            <p className="text-[11px] text-[#55635C] leading-snug line-clamp-2 mt-0.5 font-medium">
              Hyperlocal safety, power & road status within 500m
            </p>
          </div>

          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-[#0E8A3E]">
            <Users size={12} />
            <span>48 Verified Neighbors</span>
          </div>
        </Link>

        {/* Right Card: Zero-Escrow Marketplace */}
        <Link
          href="/marketplace"
          className="group relative overflow-hidden rounded-2xl bg-white border border-black/[0.08] p-3.5 sm:p-4 transition-all hover:border-amber-500/50 hover:shadow-md active:scale-[0.98] flex flex-col justify-between min-h-[140px] shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-black tracking-wide">
              <Flame size={11} className="text-amber-600" />
              DEALS
            </span>
            <Eli5Tooltip
              term="Zero-Escrow"
              explanation="Pay your neighbor directly face-to-face only after you inspect and like what you are buying."
            />
          </div>

          <div className="mt-2">
            <h4 className="text-sm sm:text-base font-black text-[#1D2433] group-hover:text-amber-700 transition-colors flex items-center gap-1.5">
              <span>Huud Market</span>
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </h4>
            <p className="text-[11px] text-[#55635C] leading-snug line-clamp-2 mt-0.5 font-medium">
              Zero escrow, zero platform fees. Trade face-to-face.
            </p>
          </div>

          <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-amber-700">
            <Zap size={12} />
            <span>Instant Direct Handovers</span>
          </div>
        </Link>
      </div>

      {/* 2. CATEGORY SQUIRCLE SCROLLER */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {QUICK_CATEGORIES.map((cat) => {
          const Icon = cat.Icon;
          return (
            <Link
              key={cat.label}
              href={cat.href}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-black/[0.08] hover:border-[#0E8A3E] transition-all shrink-0 active:scale-95 group shadow-xs"
            >
              <div className={`p-1.5 rounded-lg ${cat.bg} ${cat.color} group-hover:scale-110 transition-transform`}>
                <Icon size={14} strokeWidth={2.5} />
              </div>
              <span className="text-xs font-bold text-[#1D2433] group-hover:text-[#0E8A3E] transition-colors whitespace-nowrap">
                {cat.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* 3. LIVE NEIGHBORHOOD ACTIVITY / HEARTBEAT TICKER */}
      <div className="rounded-2xl bg-white border border-black/[0.08] p-3.5 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-black/[0.05]">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#9AA3B1]">
            <span className="w-2 h-2 rounded-full bg-[#00B82E] animate-pulse" />
            <span>Live Huud Pulse</span>
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center rounded-xl bg-black/[0.04] p-0.5 text-[10px] font-bold">
            {(['all', 'safety', 'trade'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setPulseFilter(filter)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                  pulseFilter === filter
                    ? 'bg-emerald-50 text-[#0E8A3E] font-bold shadow-xs'
                    : 'text-[#5B6478] hover:text-[#1D2433]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Live Event Stream Rows */}
        <div className="divide-y divide-black/[0.05] pt-1">
          {filteredPulses.map((pulse) => (
            <div key={pulse.id} className="flex items-center justify-between py-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 size={13} className="text-[#0E8A3E] shrink-0" />
                <span className="font-black text-[#1D2433] truncate">{pulse.user}</span>
                <span className="text-[#5B6478] truncate text-[11px] font-medium">{pulse.action}</span>
                <span className="font-bold text-[#0E8A3E] truncate text-[11px] hidden sm:inline">{pulse.target}</span>
              </div>
              <span className="text-[10px] font-medium text-[#9AA3B1] shrink-0 ml-2">
                {pulse.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
