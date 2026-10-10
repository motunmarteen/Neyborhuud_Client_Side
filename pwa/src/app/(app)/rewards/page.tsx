'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Crown,
  Gift,
  Zap,
  Sparkles,
  Coins,
  Award,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMyGamificationStats } from '@/hooks/useGamification';
import { Eli5Tooltip } from '@/components/ui/Eli5Tooltip';
import { toast } from 'sonner';

export default function RewardsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: stats } = useMyGamificationStats();
  const [activeTab, setActiveTab] = useState<'rewards' | 'vip'>('rewards');
  const [promoCode, setPromoCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [claimedAll, setClaimedAll] = useState(false);

  const huudCoins = stats?.totalHuudCoins ?? 150;
  const trustScore = stats?.trustScore ?? 88;
  const claimableAmount = claimedAll ? 0 : 500;

  const handleClaimAll = () => {
    if (claimableAmount === 0) {
      toast.info('No pending rewards to claim right now');
      return;
    }
    setClaimedAll(true);
    toast.success('Successfully claimed ₦500.00 in community rewards!');
  };

  const handleRedeemCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    setRedeeming(true);
    setTimeout(() => {
      setRedeeming(false);
      setPromoCode('');
      toast.success(`Code "${promoCode.toUpperCase()}" redeemed for +50 HuudCredit!`);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-white flex flex-col select-none pb-20">
      {/* 1. TOP HEADER WITH TABS */}
      <header className="sticky top-0 z-30 px-4 py-3 bg-[#0E1317]/95 backdrop-blur-xl border-b border-white/5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-1 rounded-xl text-white/70 hover:text-white transition-colors"
          aria-label="Back"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Segmented Pill Header Tabs (Screenshot 1) */}
        <div className="flex items-center rounded-xl bg-black/40 border border-white/5 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('rewards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'rewards'
                ? 'bg-[#1C252E] text-white shadow-sm'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Gift size={14} className="text-amber-400" />
            <span>Rewards</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vip')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'vip'
                ? 'bg-[#1C252E] text-white shadow-sm'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Crown size={14} className="text-[#00B82E]" />
            <span>VIP</span>
          </button>
        </div>

        <div className="w-8" />
      </header>

      <main className="flex-1 p-3 sm:p-4 max-w-lg w-full mx-auto space-y-4">
        {/* 2. LEVEL & CLAIMABLE CARDS (Dual Spotlight Cards) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Left: Level Status */}
          <div className="p-3.5 rounded-2xl bg-[#141A20] border border-primary/20 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-primary/20 text-[#00B82E] flex items-center justify-center font-bold">
                <Award size={16} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-white/40">Tier</span>
            </div>

            <div className="my-2">
              <span className="text-xs text-white/60 block">Level</span>
              <span className="text-sm font-black text-white">Bronze IV</span>
            </div>

            <div>
              <div className="flex items-center justify-between text-[10px] text-white/60 mb-1">
                <span>9.11%</span>
                <span>13.6K XP to Silver I</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                <div className="w-[45%] h-full rounded-full bg-[#00B82E]" />
              </div>
            </div>
          </div>

          {/* Right: Total Claimable Card */}
          <div className="p-3.5 rounded-2xl bg-[#141A20] border border-primary/20 flex flex-col justify-between">
            <div>
              <span className="text-xs text-white/60 block">Total Claimable</span>
              <span className="text-lg font-black text-[#00B82E] tracking-tight">
                ₦{claimableAmount.toFixed(2)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleClaimAll}
              disabled={claimableAmount === 0}
              className="mt-3 w-full py-2.5 px-3 rounded-xl bg-[#00B82E] hover:bg-[#00E536] disabled:opacity-40 text-black font-black text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-md shadow-[#00B82E]/20"
            >
              <Zap size={14} className="stroke-[3]" />
              <span>Claim All</span>
            </button>
          </div>
        </div>

        {/* 3. REALTIME REWARDS SECTION */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Realtime</h3>
            <Eli5Tooltip
              term="Realtime Rewards"
              explanation="Instant community points earned as you chat, vouch for neighbors, or trade in the marketplace."
            />
          </div>

          <div className="rounded-2xl bg-[#12171B] border border-white/5 divide-y divide-white/5">
            {/* Item 1 */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <Coins size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Instant HuudCredit f(x)</h4>
                  <p className="text-[11px] text-white/50">Post, help neighbors, collect earnings.</p>
                </div>
              </div>
              <span className="text-xs font-black text-[#00B82E]">
                {huudCoins} HC
              </span>
            </div>

            {/* Item 2 */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[#00B82E] flex items-center justify-center shrink-0">
                  <Zap size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Trade Rakeback f(x)</h4>
                  <p className="text-[11px] text-white/50">Trade more, earn cash rebate back.</p>
                </div>
              </div>
              <span className="text-xs font-black text-white/60">
                ₦0.00
              </span>
            </div>
          </div>
        </section>

        {/* 4. RECURRING REWARDS SECTION */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Recurring</h3>
            <Eli5Tooltip
              term="Recurring Bonuses"
              explanation="Daily login streak gifts, Friday weekend bonuses, and monthly top-resident grants."
            />
          </div>

          <div className="rounded-2xl bg-[#12171B] border border-white/5 divide-y divide-white/5">
            {/* Level Up Bonus */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <Award size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Level Up Bonus</h4>
                  <p className="text-[11px] text-white/50">Available upon reaching Silver I.</p>
                </div>
              </div>
              <span className="text-xs font-black text-[#00B82E]">₦500.00</span>
            </div>

            {/* Daily Bonus */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <span className="font-black text-xs">D</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Daily Bonus f(x)</h4>
                  <p className="text-[11px] text-white/50">Drops every day at midnight WAT.</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-white/40">In Progress</span>
            </div>

            {/* Weekly Bonus */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                  <span className="font-black text-xs">W</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Weekly Bonus f(x)</h4>
                  <p className="text-[11px] text-white/50">Drops every Friday.</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-white/40">In Progress</span>
            </div>

            {/* Monthly Bonus */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                  <span className="font-black text-xs">M</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Monthly Grant f(x)</h4>
                  <p className="text-[11px] text-white/50">Drops on the 15th of each month.</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-white/40">In Progress</span>
            </div>
          </div>
        </section>

        {/* 5. CODE REDEEM INPUT (Screenshot 1 Footer) */}
        <form onSubmit={handleRedeemCode} className="flex items-center gap-2 pt-2">
          <input
            type="text"
            placeholder="Enter promo or invite code..."
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="flex-1 px-4 py-3 rounded-2xl bg-[#141A20] border border-white/10 text-xs text-white placeholder:text-white/40 outline-none focus:border-primary/50 transition-colors"
          />
          <button
            type="submit"
            disabled={redeeming || !promoCode.trim()}
            className="px-5 py-3 rounded-2xl bg-[#1C252E] hover:bg-[#00B82E] hover:text-black disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider border border-white/10 transition-all active:scale-95"
          >
            {redeeming ? 'Redeeming…' : 'Redeem'}
          </button>
        </form>
      </main>
    </div>
  );
}
