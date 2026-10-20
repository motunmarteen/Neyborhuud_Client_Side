'use client';

/**
 * /alert — Community Safety Alerts & Sentinel Overview
 *
 * Built with the NeyborHuud Design Kit & AppBrowseLayout template.
 * Displays active red zones, verified safety signals, emergency hotlines,
 * and quick-action links to report threats or view incident maps.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  AlertTriangle,
  Siren,
  Phone,
  Flame,
  Activity,
  Plus,
  ArrowRight,
  ShieldCheck,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { useSos } from '@/hooks/useSos';
import { useAuth } from '@/hooks/useAuth';
import { useHuudDisplayName } from '@/hooks/useHuudDisplayName';

const QUICK_FILTERS = [
  { id: 'all', label: 'All Alerts' },
  { id: 'security', label: 'Security & Watch' },
  { id: 'hazard', label: 'Hazards & Fire' },
  { id: 'hotlines', label: 'Hotlines' },
] as const;

type FilterId = (typeof QUICK_FILTERS)[number]['id'];

export default function SafetyAlertsHubPage() {
  const router = useRouter();
  const { user } = useAuth();
  const huudName = useHuudDisplayName(user);
  const { phase: sosPhase, triggerSos } = useSos();
  const [filter, setFilter] = useState<FilterId>('all');

  const isSosActive = sosPhase !== 'idle';

  return (
    <AppBrowseLayout
      maxWidth="680"
      header={
        <div className="flex flex-col gap-3 pt-2">
          {/* Top Banner / Hero */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1D2433] to-[#0B0E11] p-5 text-white shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-red-400 border border-red-500/30">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                  Live Safety Radar
                </span>
                <h1 className="font-heading text-xl font-black text-white">
                  {huudName ? `${huudName} Safety Hub` : 'Neighborhood Safety Hub'}
                </h1>
                <p className="text-xs font-medium text-white/70">
                  Real-time security signals, active hazard bulletins, and official rapid responders.
                </p>
              </div>
              <Link
                href="/sentinel"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-colors"
                aria-label="Open Sentinel Security Suite"
              >
                <Siren size={20} className="text-red-400" />
              </Link>
            </div>

            {/* Quick Actions Row */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link
                href="/community-emergency"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#E5484D] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-600 active:scale-95 transition-transform"
              >
                <Plus size={14} strokeWidth={2.5} />
                Post Alert
              </Link>
              <Link
                href="/incident-reports"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/25 active:scale-95 transition-transform"
              >
                Incident Log <ArrowRight size={13} />
              </Link>
              <Link
                href="/sentinel"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-xs font-bold text-white/80 hover:bg-white/20 active:scale-95 transition-transform"
              >
                Sentinel Suite
              </Link>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar" role="tablist">
            {QUICK_FILTERS.map((item) => (
              <button
                key={item.id}
                role="tab"
                aria-selected={filter === item.id}
                onClick={() => setFilter(item.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all shrink-0 ${
                  filter === item.id
                    ? 'bg-[#00B82E] text-white shadow-xs'
                    : 'bg-white border border-[#DDE3EC] text-[#5B6478] hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        {/* SOS Alert Active Warning if currently triggered */}
        {isSosActive && (
          <div className="rounded-2xl border-2 border-red-500 bg-red-50 p-4 text-red-950 shadow-md">
            <div className="flex items-center gap-3">
              <Siren size={28} className="text-red-600 animate-bounce shrink-0" />
              <div>
                <h2 className="text-sm font-black text-red-950">Emergency SOS Currently Active</h2>
                <p className="text-xs text-red-800">
                  Guardians and estate security have been alerted to your position.
                </p>
              </div>
            </div>
            <Link
              href="/sos"
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-red-600 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700"
            >
              Open Active SOS View →
            </Link>
          </div>
        )}

        {/* 1. Official Nigerian Rapid Response Hotlines */}
        {(filter === 'all' || filter === 'hotlines') && (
          <div className="rounded-3xl border border-[#DDE3EC] bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-50 text-[#00B82E]">
                  <Phone size={15} strokeWidth={2.5} />
                </span>
                <h2 className="text-sm font-black text-[#1D2433]">Official Emergency Hotlines</h2>
              </div>
              <span className="text-[11px] font-bold text-[#5B6478]">Tap to call</span>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <a
                href="tel:08057000003"
                className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3 hover:bg-emerald-50 transition-colors"
              >
                <div>
                  <p className="text-xs font-black text-[#1D2433]">Nigeria Police Force</p>
                  <p className="text-[11px] font-medium text-emerald-800">08057000003 · Voice / WhatsApp</p>
                </div>
                <Phone size={16} className="text-[#00B82E]" />
              </a>

              <a
                href="tel:112"
                className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/50 p-3 hover:bg-blue-50 transition-colors"
              >
                <div>
                  <p className="text-xs font-black text-[#1D2433]">National Emergency (NEMA)</p>
                  <p className="text-[11px] font-medium text-blue-800">112 · Toll Free</p>
                </div>
                <Phone size={16} className="text-blue-600" />
              </a>

              <a
                href="tel:199"
                className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50/50 p-3 hover:bg-red-50 transition-colors"
              >
                <div>
                  <p className="text-xs font-black text-[#1D2433]">Federal Fire Service</p>
                  <p className="text-[11px] font-medium text-red-800">199 / 112</p>
                </div>
                <Flame size={16} className="text-red-600" />
              </a>

              <a
                href="tel:08007233827"
                className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50/50 p-3 hover:bg-amber-50 transition-colors"
              >
                <div>
                  <p className="text-xs font-black text-[#1D2433]">Lagos State Emergency</p>
                  <p className="text-[11px] font-medium text-amber-800">767 / 112</p>
                </div>
                <Phone size={16} className="text-amber-600" />
              </a>
            </div>
          </div>
        )}

        {/* 2. Hub Status & Quick Links */}
        {(filter === 'all' || filter === 'security') && (
          <div className="rounded-3xl border border-[#DDE3EC] bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-50 text-blue-600">
                <ShieldCheck size={16} strokeWidth={2.5} />
              </span>
              <h2 className="text-sm font-black text-[#1D2433]">Community Watch & Sentinel Units</h2>
            </div>

            <p className="text-xs text-[#5B6478] leading-relaxed">
              Volunteer night patrol, gate guards, and verified responders look out for our street.
              All active reports are mapped with differential privacy coordinates.
            </p>

            <div className="flex flex-col gap-2">
              <Link
                href="/community-emergency"
                className="flex items-center justify-between rounded-2xl border border-[#DDE3EC] p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-red-100 text-red-700">
                    <Siren size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1D2433]">Community Emergency Posts</p>
                    <p className="text-[11px] text-[#5B6478]">Browse active alerts reported by neighbors</p>
                  </div>
                </div>
                <ArrowRight size={15} className="text-[#5B6478]" />
              </Link>

              <Link
                href="/incident-reports"
                className="flex items-center justify-between rounded-2xl border border-[#DDE3EC] p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-amber-100 text-amber-800">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1D2433]">Incident Reports & Threat Radar</p>
                    <p className="text-[11px] text-[#5B6478]">Vetted crime, prowler, and utility hazard reports</p>
                  </div>
                </div>
                <ArrowRight size={15} className="text-[#5B6478]" />
              </Link>
            </div>
          </div>
        )}

        {/* 3. Safety Best Practices Card */}
        <div className="rounded-3xl border border-[#DDE3EC] bg-gradient-to-r from-emerald-50/60 via-teal-50/40 to-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#00B82E] text-white text-[11px] font-black">
              ✓
            </span>
            <h3 className="text-xs font-extrabold text-[#0E8A3E] uppercase tracking-wider">
              Hyperlocal Safety Tip
            </h3>
          </div>
          <p className="text-xs text-[#1D2433] leading-relaxed font-medium">
            When meeting neighbors for Marketplace transactions, always arrange handovers during daylight
            hours in public spots (such as your estate gate or main security post). NeyborHuud never holds
            escrow funds—inspect items thoroughly before any bank transfer.
          </p>
        </div>
      </div>
    </AppBrowseLayout>
  );
}
