'use client';

import { useEffect, useState } from 'react';
import { gamificationService } from '@/services/gamification.service';
import { useAuth } from '@/hooks/useAuth';

interface HeroStats {
  trustScore: number;
  totalHuudCoins: number;
}

export function HeroStatsBar() {
  const { user } = useAuth();
  const [stats, setStats] = useState<HeroStats | null>(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    gamificationService.getHeroStats().then((res) => {
      if (!cancelled && res.data) {
        setStats(res.data);
      }
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [user]);

  if (!stats) return null;

  return (
    <div className="flex items-center justify-center gap-4 px-5 py-2 bg-[#1a1a2e]/80 backdrop-blur-md border-t border-white/[0.06]">
      {/* Trust Score */}
      <div className="flex items-center gap-1.5">
        <span className="text-[13px]" role="img" aria-label="Trust">🛡</span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">Trust</span>
        <span className="text-[13px] font-bold text-white/90 tabular-nums">{stats.trustScore}</span>
      </div>

      {/* Dot separator */}
      <span className="text-white/20 text-[8px]">●</span>

      {/* HuudCoins */}
      <div className="flex items-center gap-1.5">
        <span className="text-[13px]" role="img" aria-label="HuudCoins">⭐</span>
        <span className="text-[13px] font-bold text-white/90 tabular-nums">{stats.totalHuudCoins.toLocaleString()}</span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">HC</span>
      </div>
    </div>
  );
}
