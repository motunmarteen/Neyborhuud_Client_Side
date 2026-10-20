'use client';

/**
 * HuudPulseWidget — Hyperlocal Live Street Consensus & Survival Engine
 * Built with the NeyborHuud Phase 2 Design Kit Template.
 *
 * Covers 6 essential daily channels: Power, Fuel, Waste/Water, Traffic, Gate, Essentials.
 * Allows 1-tap broadcasting and 1-tap confirmation (with HuudCredit rewards).
 */

import React, { useState } from 'react';
import {
  Zap,
  Fuel,
  Truck,
  Car,
  Shield,
  Coins,
  Radio,
  CheckCircle2,
  X,
  Share2,
  Plus,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { signalsIn, useQuickSignal, type SignalCategory, type SignalPreset } from '@/hooks/useQuickSignal';
import { Button } from '@/components/ui/Button';
import { nhToast } from '@/lib/toast';

interface ActiveStreetPulse {
  id: string;
  category: SignalCategory;
  emoji: string;
  title: string;
  sub: string;
  timeAgo: string;
  confirmsCount: number;
  isConfirmedByUser?: boolean;
}

const CHANNELS: { id: SignalCategory; label: string; icon: typeof Zap; color: string; bg: string }[] = [
  { id: 'power', label: 'Light', icon: Zap, color: 'text-amber-600', bg: 'bg-[#FFF4E5]' },
  { id: 'fuel', label: 'Fuel/Gas', icon: Fuel, color: 'text-blue-600', bg: 'bg-[#E6F0FA]' },
  { id: 'water_waste', label: 'LAWMA/Water', icon: Truck, color: 'text-emerald-600', bg: 'bg-[#E8F7EC]' },
  { id: 'traffic', label: 'Roads', icon: Car, color: 'text-purple-600', bg: 'bg-[#F0EBFF]' },
  { id: 'safety', label: 'Gate/Safety', icon: Shield, color: 'text-rose-600', bg: 'bg-[#FDECEC]' },
  { id: 'essentials', label: 'Cash/Market', icon: Coins, color: 'text-emerald-700', bg: 'bg-[#E8F7EC]' },
];

export function HuudPulseWidget() {
  const { user } = useAuth();
  const { send, submittingId, areaName } = useQuickSignal();
  const locationLabel = areaName || 'your neighborhood';

  const [activeChannel, setActiveChannel] = useState<SignalCategory | null>(null);
  const [confirmedPulses, setConfirmedPulses] = useState<Set<string>>(new Set());

  // Demo active pulse representing the latest street consensus
  const [activePulse, setActivePulse] = useState<ActiveStreetPulse | null>({
    id: 'demo_pulse_1',
    category: 'power',
    emoji: '💡',
    title: 'Light Don Come!',
    sub: `Grid power restored near ${locationLabel}. Switch off generators.`,
    timeAgo: '12m ago',
    confirmsCount: 4,
  });

  const handleOpenChannel = (ch: SignalCategory) => {
    setActiveChannel(ch);
  };

  const handleClose = () => {
    setActiveChannel(null);
  };

  const handleSendSignal = async (preset: SignalPreset) => {
    const ok = await send(preset);
    if (ok) {
      setActivePulse({
        id: `pulse_${Date.now()}`,
        category: preset.group,
        emoji: preset.emoji,
        title: preset.label,
        sub: `${preset.sub} near ${locationLabel}`,
        timeAgo: 'Just now',
        confirmsCount: 1,
        isConfirmedByUser: true,
      });
      nhToast.success(
        'Signal Broadcasted',
        `Your street report "${preset.label}" was broadcast to neighbors on Sentinel Radar.`
      );
      handleClose();
    }
  };

  const handleConfirmPulse = (pulseId: string) => {
    if (confirmedPulses.has(pulseId)) return;
    setConfirmedPulses((prev) => new Set([...prev, pulseId]));
    if (activePulse && activePulse.id === pulseId) {
      setActivePulse({
        ...activePulse,
        confirmsCount: activePulse.confirmsCount + 1,
        isConfirmedByUser: true,
      });
    }
    nhToast.success('Consensus Confirmed (+5 🪙)', 'You earned 5 HuudCredits for verifying your street status!');
  };

  const handleShareWhatsApp = () => {
    const text = `⚡ *NeyborHuud Live Street Pulse — ${locationLabel}*\n\n` +
      (activePulse ? `📢 *Active Status:* ${activePulse.emoji} ${activePulse.title} (${activePulse.timeAgo})\n` : '') +
      `• Power & Light updates\n• LAWMA & Water alerts\n• Fuel station queues\n• Road & Gate status\n\n` +
      `Check live status or log an update: https://app.neyborhuud.com/feed`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="w-full select-none pb-2">
      <div className="overflow-hidden rounded-3xl border border-[#DDE3EC] bg-white p-4 shadow-sm">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 border-b border-[#DDE3EC]/70 pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00B82E] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00B82E]" />
            </span>
            <div className="min-w-0">
              <h2 className="font-heading text-xs font-black uppercase tracking-wider text-[#1D2433] truncate">
                Huud Street Pulse
              </h2>
              <p className="text-[11px] font-medium text-[#5B6478] truncate">
                Live utility, fuel &amp; road consensus for {locationLabel}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="tap-target inline-flex items-center gap-1.5 rounded-full bg-[#E8F7EC] px-3 py-1.5 text-xs font-extrabold text-[#0E8A3E] hover:bg-[#D4F0DB] transition active:scale-95 shrink-0"
            title="Share street pulse to WhatsApp"
          >
            <Share2 size={13} />
            <span className="hidden min-[380px]:inline">WhatsApp</span>
          </button>
        </div>

        {/* Active Street Pulse Spotlight Banner */}
        {activePulse && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-[#00B82E]/30 bg-[#E8F7EC]/60 p-3.5 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="text-2xl shrink-0 mt-0.5">{activePulse.emoji}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading text-sm font-black text-[#1D2433]">
                      {activePulse.title}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-[#0E8A3E] border border-[#00B82E]/20">
                      <Clock size={10} />
                      {activePulse.timeAgo}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-[#5B6478] line-clamp-1">
                    {activePulse.sub}
                  </p>
                </div>
              </div>

              {/* Confirm Button */}
              <button
                type="button"
                onClick={() => handleConfirmPulse(activePulse.id)}
                disabled={activePulse.isConfirmedByUser || confirmedPulses.has(activePulse.id)}
                className={`tap-target shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-all active:scale-95 ${
                  activePulse.isConfirmedByUser || confirmedPulses.has(activePulse.id)
                    ? 'bg-[#0E8A3E] text-white shadow-xs'
                    : 'bg-[#00B82E] text-white hover:bg-[#0E8A3E] shadow-sm'
                }`}
              >
                <CheckCircle2 size={14} />
                <span>
                  {activePulse.isConfirmedByUser || confirmedPulses.has(activePulse.id)
                    ? `Confirmed (${activePulse.confirmsCount})`
                    : `Confirm (+5 🪙)`}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* 6 Quick Broadcast Channels */}
        <div className="mt-3">
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-[#9AA3B1]">
            1-Tap Street Broadcast
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {CHANNELS.map((ch) => {
              const Icon = ch.icon;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleOpenChannel(ch.id)}
                  className={`tap-target flex flex-col items-center justify-center rounded-2xl border border-[#DDE3EC] p-2.5 text-center transition-all hover:border-[#00B82E]/40 hover:shadow-xs active:scale-95 ${ch.bg}`}
                >
                  <div className={`grid h-8 w-8 place-items-center rounded-full bg-white shadow-2xs mb-1.5 ${ch.color}`}>
                    <Icon size={16} strokeWidth={2.5} />
                  </div>
                  <span className="font-heading text-[11px] font-black text-[#1D2433] truncate w-full">
                    {ch.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 1-Tap Signal Bottom Sheet ── */}
      {activeChannel && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-[#DDE3EC] animate-in slide-in-from-bottom duration-200 select-none max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#DDE3EC]">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#E8F7EC] text-[#0E8A3E]">
                  <Radio size={18} strokeWidth={2.5} />
                </span>
                <div>
                  <h3 className="font-heading text-sm font-black text-[#1D2433]">
                    Broadcast to {locationLabel}
                  </h3>
                  <p className="text-[11px] font-medium text-[#5B6478]">
                    1 tap sends live consensus &amp; alerts neighbors
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="tap-target grid h-8 w-8 place-items-center rounded-full text-[#5B6478] hover:bg-[#EEF2F7] transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Presets List */}
            <div className="flex flex-col gap-2 overflow-y-auto pr-1 pb-2">
              {signalsIn(activeChannel).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  disabled={submittingId !== null}
                  onClick={() => handleSendSignal(preset)}
                  className={`tap-target w-full rounded-2xl border p-3.5 text-left flex items-center gap-3.5 transition-all group ${
                    submittingId === preset.id
                      ? 'bg-[#E8F7EC] border-[#00B82E]/40 opacity-75'
                      : 'border-[#DDE3EC] bg-white hover:border-[#00B82E]/40 hover:bg-[#EEF2F7]/50 active:scale-98'
                  }`}
                >
                  <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">
                    {preset.emoji}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-heading text-xs font-black text-[#1D2433]">
                        {preset.label}
                      </p>
                      {preset.severity === 'critical' && (
                        <span className="rounded-full bg-[#FDECEC] px-1.5 py-0.2 text-[9px] font-black text-[#E5484D] uppercase">
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] font-medium text-[#5B6478] truncate">
                      {preset.sub}
                    </p>
                  </div>

                  <div className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#00B82E] px-3 py-1.5 text-xs font-extrabold text-white group-hover:bg-[#0E8A3E] transition-colors">
                    <span>Send</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-3 pt-2 border-t border-[#DDE3EC] flex items-center justify-between text-[11px] text-[#9AA3B1]">
              <span className="flex items-center gap-1 text-[#0E8A3E] font-semibold">
                <Sparkles size={12} />
                <span>Earns 10 HuudCredit on confirmation</span>
              </span>
              <span>Anonymous to neighbors</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
