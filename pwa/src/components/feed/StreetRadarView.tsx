'use client';

import React, { useState, useEffect } from 'react';
import {
  Radar,
  ShieldAlert,
  Car,
  Zap,
  ShieldCheck,
  Users,
  Bot,
  Sparkles,
  HelpCircle,
  ThumbsUp,
  MapPin,
  Clock,
  Loader2,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { DEMO_MODE } from '@/lib/demoMode';

export type RadarCategory = 'all' | 'safety' | 'traffic' | 'infrastructure' | 'community';

export interface RadarSignal {
  id: string;
  sourceType: string;
  category: 'safety' | 'traffic' | 'infrastructure' | 'community';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  approxDistanceMeters: number;
  distanceLabel: string;
  maskedPostcode?: string;
  landmark?: string;
  areaName?: string;
  districtName?: string;
  timestamp: string;
  confirmCount: number;
  witnessCount?: number;
  isVerified: boolean;
}

interface RadarData {
  summary: {
    totalSignals: number;
    safetyCount: number;
    trafficCount: number;
    infrastructureCount: number;
    communityCount: number;
    activeClusterDetected: boolean;
    radarCenter: {
      latitude: number;
      longitude: number;
      district?: string;
      lga?: string;
      state?: string;
    };
  };
  signals: {
    safety: RadarSignal[];
    traffic: RadarSignal[];
    infrastructure: RadarSignal[];
    community: RadarSignal[];
  };
}

interface StreetRadarViewProps {
  onOpenWhoIsInMyHuud?: () => void;
  onOpenAskSentinel?: () => void;
}

export function StreetRadarView({ onOpenWhoIsInMyHuud, onOpenAskSentinel }: StreetRadarViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<RadarCategory>('all');
  const [loading, setLoading] = useState(true);
  const [radarData, setRadarData] = useState<RadarData | null>(null);
  const [showEli5, setShowEli5] = useState(false);

  useEffect(() => {
    async function fetchRadar() {
      try {
        setLoading(true);
        const res = await apiClient.get<RadarData>('/geo/radar', {
          params: { radiusMeters: 2000, category: selectedCategory },
        });
        if (res && res.data) {
          setRadarData(res.data);
        }
      } catch (err) {
        // No fabricated signals outside demo mode — a made-up "suspicious
        // vehicle" on a safety radar is misinformation. Show nothing instead.
        if (!DEMO_MODE) {
          setRadarData(null);
          return;
        }
        setRadarData({
          summary: {
            totalSignals: 4,
            safetyCount: 1,
            trafficCount: 1,
            infrastructureCount: 1,
            communityCount: 1,
            activeClusterDetected: false,
            radarCenter: {
              latitude: 6.4474,
              longitude: 3.4723,
              district: 'Lekki Phase 1',
              lga: 'Eti-Osa',
              state: 'Lagos',
            },
          },
          signals: {
            safety: [
              {
                id: 'sig-1',
                sourceType: 'incident',
                category: 'safety',
                title: 'Suspicious Vehicle Reported',
                description: 'Unmarked dark sedan idling near Commercial Road with hazard lights on',
                severity: 'high',
                approxDistanceMeters: 250,
                distanceLabel: '250m away',
                maskedPostcode: 'LA 08 *** ** 04',
                timestamp: new Date().toISOString(),
                confirmCount: 4,
                isVerified: true,
              },
            ],
            traffic: [
              {
                id: 'sig-2',
                sourceType: 'fyi',
                category: 'traffic',
                title: 'Admiralty Way Slowdown',
                description: 'Slow traffic moving toward Lekki-Ikoyi link bridge due to lane resurfacing',
                severity: 'medium',
                approxDistanceMeters: 400,
                distanceLabel: '400m away',
                maskedPostcode: 'LA 08 *** ** 12',
                timestamp: new Date().toISOString(),
                confirmCount: 7,
                isVerified: true,
              },
            ],
            infrastructure: [
              {
                id: 'sig-3',
                sourceType: 'fyi',
                category: 'infrastructure',
                title: 'Grid Power Restored',
                description: 'EKEDC 33kV feeder online across Sector 2 and surrounding streets',
                severity: 'low',
                approxDistanceMeters: 150,
                distanceLabel: '150m away',
                maskedPostcode: 'LA 08 *** ** 01',
                timestamp: new Date().toISOString(),
                confirmCount: 19,
                isVerified: true,
              },
            ],
            community: [
              {
                id: 'sig-4',
                sourceType: 'event',
                category: 'community',
                title: 'Huud Watch Evening Patrol',
                description: 'Volunteer estate security shift active from 8:00 PM to 11:30 PM',
                severity: 'low',
                approxDistanceMeters: 100,
                distanceLabel: '100m away',
                maskedPostcode: 'LA 08 *** ** 09',
                timestamp: new Date().toISOString(),
                confirmCount: 12,
                isVerified: true,
              },
            ],
          },
        });
      } finally {
        setLoading(false);
      }
    }

    fetchRadar();
  }, [selectedCategory]);

  const allSignalsList: RadarSignal[] = radarData
    ? selectedCategory === 'all'
      ? [
          ...radarData.signals.safety,
          ...radarData.signals.traffic,
          ...radarData.signals.infrastructure,
          ...radarData.signals.community,
        ].sort((a, b) => a.approxDistanceMeters - b.approxDistanceMeters)
      : radarData.signals[selectedCategory] || []
    : [];

  const getCategoryTheme = (cat: RadarSignal['category']) => {
    switch (cat) {
      case 'safety':
        return {
          pill: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          icon: ShieldAlert,
          label: 'Safety Alert',
        };
      case 'traffic':
        return {
          pill: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          icon: Car,
          label: 'Traffic & Transit',
        };
      case 'infrastructure':
        return {
          pill: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          icon: Zap,
          label: 'Utilities & Power',
        };
      case 'community':
        return {
          pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-[#00B82E]',
          icon: ShieldCheck,
          label: 'Community Patrol',
        };
    }
  };

  return (
    <div className="w-full rounded-3xl border border-black/[0.08] bg-white p-4 sm:p-5 shadow-sm mb-5 select-none">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-black/[0.05]">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#00B82E] border border-emerald-100 shadow-2xs">
            <Radar size={22} strokeWidth={2.4} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold tracking-tight text-slate-900">Street Radar</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/70 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-800 border border-emerald-200/60">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00B82E] animate-pulse" />
                Live 2km
              </span>
              <button
                type="button"
                onClick={() => setShowEli5(!showEli5)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                aria-label="Explain Like I'm 5"
              >
                <HelpCircle size={14} />
              </button>
            </div>
            <p className="text-[12px] font-medium text-slate-500">
              {radarData?.summary.radarCenter.district || 'Your area'} · Privacy Shielded
            </p>
          </div>
        </div>

        {/* ── Action Badges ── */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {onOpenWhoIsInMyHuud && (
            <button
              type="button"
              onClick={onOpenWhoIsInMyHuud}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            >
              <Users size={14} className="text-[#00B82E]" />
              Who is around?
            </button>
          )}
          {onOpenAskSentinel && (
            <button
              type="button"
              onClick={onOpenAskSentinel}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#00B82E] px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#00B82E] active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles size={14} />
              Ask Sentinel
            </button>
          )}
        </div>
      </div>

      {/* ── Kid-Friendly ELI5 Tooltip Card ── */}
      {showEli5 && (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-950 animate-in fade-in duration-200">
          <div className="flex items-start gap-2">
            <Sparkles size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">What is Street Radar? (ELI5)</p>
              <p className="mt-0.5 text-emerald-900 leading-relaxed">
                A live sensor showing what is happening on your street right now (power, traffic, or safety) up to 2km away. Nobody sees your exact door number—your privacy is 100% safe!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Category Filter Pills (BC.Game Game Bar) ── */}
      <div className="flex items-center gap-1.5 py-3 overflow-x-auto no-scrollbar">
        {[
          { key: 'all', label: 'All Signals', count: radarData?.summary.totalSignals || 0 },
          { key: 'safety', label: 'Safety', count: radarData?.summary.safetyCount || 0 },
          { key: 'traffic', label: 'Traffic', count: radarData?.summary.trafficCount || 0 },
          { key: 'infrastructure', label: 'Power/Utility', count: radarData?.summary.infrastructureCount || 0 },
          { key: 'community', label: 'Patrol', count: radarData?.summary.communityCount || 0 },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSelectedCategory(tab.key as RadarCategory)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === tab.key
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            {tab.label}
            <span
              className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                selectedCategory === tab.key ? 'bg-white/20 text-white' : 'bg-black/[0.06] text-slate-500'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Signal Cards Feed ── */}
      <div className="space-y-2.5 mt-1">
        {loading ? (
          <div className="py-8 text-center text-slate-500 text-[12px] flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin text-[#00B82E]" />
            Scanning street signals...
          </div>
        ) : allSignalsList.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-[12px] rounded-2xl bg-slate-50 border border-slate-100">
            No active street signals in this category within 2km.
          </div>
        ) : (
          allSignalsList.map((signal) => {
            const theme = getCategoryTheme(signal.category);
            const CategoryIcon = theme.icon;

            return (
              <div
                key={signal.id}
                className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/70 transition-all shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${theme.pill}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                      {theme.label}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 font-mono bg-white px-2 py-0.5 rounded-full border border-black/[0.06]">
                      {signal.distanceLabel}
                    </span>
                    {signal.maskedPostcode && (
                      <span className="text-[10px] font-bold text-emerald-800 font-mono bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                        {signal.maskedPostcode}
                      </span>
                    )}
                  </div>
                  {signal.isVerified && (
                    <span className="text-[10px] text-[#00B82E] flex items-center gap-1 font-bold">
                      <ShieldCheck size={13} className="fill-[#00B82E]/10" />
                      Verified
                    </span>
                  )}
                </div>

                <h3 className="text-[14px] font-extrabold text-slate-900 mb-0.5">{signal.title}</h3>
                <p className="text-[12.5px] font-medium text-slate-600 line-clamp-2 leading-relaxed">
                  {signal.description}
                </p>

                <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mt-2.5 pt-2 border-t border-black/[0.04]">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(signal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-semibold text-slate-600">
                      <ThumbsUp size={12} className="text-[#00B82E]" />
                      {signal.confirmCount} confirmed
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
