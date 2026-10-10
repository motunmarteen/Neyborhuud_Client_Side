'use client';

import React, { useState } from 'react';
import {
  Zap,
  Car,
  ShieldAlert,
  Droplets,
  Flame,
  CheckCircle2,
  X,
  Sparkles,
  MapPin,
  AlertTriangle,
  Lightbulb,
  Radio,
} from 'lucide-react';
import { nhToast } from '@/lib/toast';
import { useQueryClient } from '@tanstack/react-query';
import { contentService } from '@/services/content.service';
import { incidentService } from '@/services/incident.service';
import { useAuth } from '@/hooks/useAuth';
import { useHuudDisplayName } from '@/hooks/useHuudDisplayName';
import { getCurrentLocation } from '@/lib/geolocation';

type SignalCategory = 'power' | 'traffic' | 'safety';

interface SignalPreset {
  id: string;
  emoji: string;
  label: string;
  sub: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'fyi' | 'incident';
  category: 'infrastructure' | 'traffic' | 'safety';
  defaultTitle: string;
}

const POWER_SIGNALS: SignalPreset[] = [
  {
    id: 'p_outage',
    emoji: '⚡',
    label: 'No Light (Outage)',
    sub: 'DisCo power is off in the area',
    severity: 'medium',
    type: 'fyi',
    category: 'infrastructure',
    defaultTitle: 'Power Outage (Light Off)',
  },
  {
    id: 'p_restored',
    emoji: '💡',
    label: 'Light Don Come!',
    sub: 'Grid power restored to our street',
    severity: 'low',
    type: 'fyi',
    category: 'infrastructure',
    defaultTitle: 'Power Restored (Light is Back)',
  },
  {
    id: 'p_fault',
    emoji: '⚠️',
    label: 'Transformer / Cable Fault',
    sub: 'Sparking wire, blown fuse or pole issue',
    severity: 'high',
    type: 'incident',
    category: 'infrastructure',
    defaultTitle: 'Transformer / Electrical Fault',
  },
];

const TRAFFIC_SIGNALS: SignalPreset[] = [
  {
    id: 't_gridlock',
    emoji: '🚗',
    label: 'Heavy Gridlock',
    sub: 'Stationary or moving very slowly',
    severity: 'medium',
    type: 'fyi',
    category: 'traffic',
    defaultTitle: 'Heavy Traffic Gridlock',
  },
  {
    id: 't_flood',
    emoji: '🌊',
    label: 'Street Flooded',
    sub: 'High standing water, risky for small cars',
    severity: 'high',
    type: 'incident',
    category: 'traffic',
    defaultTitle: 'Road Flooded / High Water',
  },
  {
    id: 't_gate',
    emoji: '🚧',
    label: 'Gate Locked / Blocked',
    sub: 'Estate gate restricted or closed early',
    severity: 'medium',
    type: 'fyi',
    category: 'traffic',
    defaultTitle: 'Estate Gate Access Locked',
  },
  {
    id: 't_checkpoint',
    emoji: '🛑',
    label: 'Security Checkpoint',
    sub: 'Stop-and-search causing delay',
    severity: 'low',
    type: 'fyi',
    category: 'traffic',
    defaultTitle: 'Security Checkpoint Active',
  },
];

const SAFETY_SIGNALS: SignalPreset[] = [
  {
    id: 's_suspicious',
    emoji: '👁️',
    label: 'Suspicious Movement',
    sub: 'Unidentified prowler or loitering vehicle',
    severity: 'high',
    type: 'incident',
    category: 'safety',
    defaultTitle: 'Suspicious Activity Reported',
  },
  {
    id: 's_disturbance',
    emoji: '🚨',
    label: 'Security Disturbance',
    sub: 'Urgent dispute or threat requiring watch',
    severity: 'critical',
    type: 'incident',
    category: 'safety',
    defaultTitle: 'Urgent Security Incident',
  },
  {
    id: 's_hazard',
    emoji: '🔥',
    label: 'Fire / Hazard Threat',
    sub: 'Open fire, fallen pole, or hazard',
    severity: 'critical',
    type: 'incident',
    category: 'safety',
    defaultTitle: 'Fire / Physical Hazard Alert',
  },
];

export function QuickSignalBar() {
  const { user } = useAuth();
  const huudName = useHuudDisplayName();
  const queryClient = useQueryClient();

  const [activeCategory, setActiveCategory] = useState<SignalCategory | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [recentSignal, setRecentSignal] = useState<string | null>(null);

  const handleOpenSheet = (cat: SignalCategory) => {
    setActiveCategory(cat);
  };

  const handleClose = () => {
    setActiveCategory(null);
  };

  const handleSendSignal = async (preset: SignalPreset) => {
    setSubmittingId(preset.id);

    try {
      // 1. Real GPS only. A safety signal pinned to a made-up default
      // location would send neighbours to the wrong place.
      let lat: number | null = null;
      let lng: number | null = null;
      try {
        const coords = await getCurrentLocation();
        // getCurrentLocation() returns { lat, lng } — reading .latitude here
        // used to silently pin every signal to a hard-coded Lagos default.
        if (coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
          lat = coords.lat;
          lng = coords.lng;
        }
      } catch {
        // handled below
      }
      if (lat === null || lng === null) {
        nhToast.error('Location needed', 'Turn on location so neighbours know where this is happening.');
        return;
      }

      const locationName = huudName && huudName !== 'your neighborhood' ? huudName : 'your area';

      // 2. Send to the server. Only a confirmed server write counts as
      // "logged" — the server also awards any HuudCredit for it.
      try {
        if (preset.type === 'incident') {
          await incidentService.create({
            title: `${preset.defaultTitle} — ${locationName}`,
            description: `${preset.sub}. Reported via 1-Tap Quick Signal near ${locationName}.`,
            category: (preset.category === 'traffic' ? 'traffic_accident' : preset.category === 'safety' ? 'other' : 'utility_outage') as any,
            severity: preset.severity as any,
            incidentDate: new Date().toISOString(),
            location: {
              latitude: lat,
              longitude: lng,
              landmark: locationName,
            },
          });
        } else {
          // POST /content/posts contract (createPostApiSchema): { type,
          // content, contentType, visibility, location{latitude,longitude} }.
          await contentService.createPost({
            type: 'text',
            content: `${preset.defaultTitle} — ${locationName}
${preset.sub}. Reported via 1-Tap Quick Signal.`,
            contentType: 'fyi',
            visibility: 'neighborhood',
            location: {
              latitude: lat,
              longitude: lng,
            },
          });
        }
      } catch (networkErr: any) {
        nhToast.error(
          'Signal not sent',
          networkErr?.message || 'Please check your connection and try again.',
        );
        return;
      }

      // 3. Confirm only what the server accepted
      setRecentSignal(preset.label);
      nhToast.signal({
        emoji: preset.emoji,
        title: 'Signal Logged!',
        signalLabel: preset.label,
        locationName,
        coinsEarned: 0,
      });

      // 5. Refresh radar & feed
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['radar'] });
      queryClient.invalidateQueries({ queryKey: ['gamification-stats'] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'wallet'] });

      handleClose();
    } catch (err: any) {
      console.error('Signal logging error:', err);
      nhToast.error('Could not log signal', 'Please check your connection and try again.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleShareToWhatsApp = () => {
    const locationName = huudName && huudName !== 'your neighborhood' ? huudName : 'My Neighborhood';
    const text = `🛡️ *NeyborHuud Live Street Radar — ${locationName}*\n\n⚡ *Power & Grid:* Real-time street monitoring\n🚦 *Traffic & Roads:* Live flood & gridlock check\n🛡️ *Huud Watch:* Active community safety\n\n👉 *View live street radar or log an alert (Earn +15 HC):*\nhttps://neyborhuud.com/feed`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getPresetsForCategory = () => {
    switch (activeCategory) {
      case 'power':
        return POWER_SIGNALS;
      case 'traffic':
        return TRAFFIC_SIGNALS;
      case 'safety':
        return SAFETY_SIGNALS;
      default:
        return [];
    }
  };

  return (
    <>
      {/* ── THE 1-TAP QUICK SIGNAL BAR (Waze-style dock) ── */}
      <div className="w-full px-3 sm:px-4 py-2 select-none">
        <div className="relative overflow-hidden rounded-2xl bg-white  border border-black/[0.08]  shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-3">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <p className="text-xs font-black text-slate-900  uppercase tracking-wider">
                1-Tap Street Signals
              </p>
              <span className="hidden sm:inline-block text-[11px] font-medium text-slate-400 ">
                • Waze for your Huud
              </span>
            </div>

            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50  border border-emerald-500/20 text-[11px] font-extrabold text-emerald-700  shrink-0">
              <Sparkles size={11} className="text-emerald-500" />
              <span>+15 HC each</span>
            </div>
          </div>

          {/* 3 Action Buttons */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {/* 1. POWER & LIGHT */}
            <button
              type="button"
              onClick={() => handleOpenSheet('power')}
              className="flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl bg-amber-500/8 hover:bg-amber-500/15 border border-amber-500/20 active:scale-95 transition-all text-center group cursor-pointer"
            >
              <div className="size-8 rounded-full bg-amber-500/15 text-amber-600  flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <Zap size={16} strokeWidth={2.5} />
              </div>
              <span className="text-[11px] sm:text-xs font-extrabold text-slate-900  leading-tight">
                Power & Light
              </span>
              <span className="text-[9px] sm:text-[10px] font-medium text-amber-700  leading-tight truncate max-w-full">
                Light Don Go?
              </span>
            </button>

            {/* 2. ROADS & TRAFFIC */}
            <button
              type="button"
              onClick={() => handleOpenSheet('traffic')}
              className="flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl bg-blue-500/8 hover:bg-blue-500/15 border border-blue-500/20 active:scale-95 transition-all text-center group cursor-pointer"
            >
              <div className="size-8 rounded-full bg-blue-500/15 text-blue-600  flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <Car size={16} strokeWidth={2.5} />
              </div>
              <span className="text-[11px] sm:text-xs font-extrabold text-slate-900  leading-tight">
                Road & Traffic
              </span>
              <span className="text-[9px] sm:text-[10px] font-medium text-blue-700  leading-tight truncate max-w-full">
                Gridlock / Flood
              </span>
            </button>

            {/* 3. SAFETY & HAZARD */}
            <button
              type="button"
              onClick={() => handleOpenSheet('safety')}
              className="flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl bg-rose-500/8 hover:bg-rose-500/15 border border-rose-500/20 active:scale-95 transition-all text-center group cursor-pointer"
            >
              <div className="size-8 rounded-full bg-rose-500/15 text-rose-600  flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <ShieldAlert size={16} strokeWidth={2.5} />
              </div>
              <span className="text-[11px] sm:text-xs font-extrabold text-slate-900  leading-tight">
                Safety & Gate
              </span>
              <span className="text-[9px] sm:text-[10px] font-medium text-rose-700  leading-tight truncate max-w-full">
                Prowler / Threat
              </span>
            </button>
          </div>

          {/* Share to Estate WhatsApp Action */}
          <div className="mt-2.5 pt-2 border-t border-black/[0.06]  flex items-center justify-between gap-2">
            {recentSignal ? (
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-700  font-semibold truncate">
                <CheckCircle2 size={13} className="shrink-0" />
                <span className="truncate">"{recentSignal}" fed to Sentinel</span>
              </span>
            ) : (
              <span className="text-[11px] text-slate-500  flex items-center gap-1 truncate">
                <Radio size={12} className="text-emerald-500 shrink-0" />
                <span className="truncate">Live radar fed by verified neighbors</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleShareToWhatsApp}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E]  text-[11px] font-extrabold transition-colors active:scale-95 shrink-0 cursor-pointer"
              title="Share live status to estate WhatsApp group"
            >
              <span>Share to WhatsApp</span>
              <span className="text-xs">💬</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 1-TAP ACTION MODAL SHEET ── */}
      {activeCategory && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-md bg-white  rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-black/10  animate-in slide-in-from-bottom duration-200 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/[0.06] ">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 ">
                  <Radio size={18} strokeWidth={2.5} />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900  leading-tight">
                    {activeCategory === 'power' && 'Log Power & Grid Status'}
                    {activeCategory === 'traffic' && 'Log Road & Traffic Condition'}
                    {activeCategory === 'safety' && 'Log Security or Hazard Signal'}
                  </h3>
                  <p className="text-[11px] text-slate-500 ">
                    1 tap notifies neighbors & powers Sentinel AI
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-full text-slate-400 hover:text-slate-900  hover:bg-black/5  transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Presets List */}
            <div className="flex flex-col gap-2 mb-4">
              {getPresetsForCategory().map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  disabled={submittingId !== null}
                  onClick={() => handleSendSignal(preset)}
                  className={`w-full p-3 rounded-2xl border transition-all text-left flex items-center gap-3.5 group cursor-pointer ${
                    submittingId === preset.id
                      ? 'bg-emerald-500/10 border-emerald-500/30 opacity-75'
                      : 'bg-black/[0.02]  hover:bg-emerald-500/8  border-black/[0.06]  hover:border-emerald-500/30'
                  }`}
                >
                  <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">
                    {preset.emoji}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-slate-900  leading-tight">
                        {preset.label}
                      </p>
                      {preset.severity === 'critical' && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500/15 text-rose-600  uppercase">
                          Alert
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500  leading-snug mt-0.5 truncate">
                      {preset.sub}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-700  text-[11px] font-black group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <span>+15 HC</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer Disclaimer */}
            <div className="flex items-center justify-between text-[11px] text-slate-400  px-1">
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-emerald-500" />
                <span>Tagged to {huudName && huudName !== 'your neighborhood' ? huudName : 'your live area'}</span>
              </span>
              <span>Anonymous to neighbors</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
