'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';

interface PlatformStats {
  userCount: number;
  communityCount: number;
  jobCount: number;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function SocialProofBadge() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    apiClient
      .get<{ data?: PlatformStats }>('/stats/public')
      .then((res) => { if (res.data?.data) setStats(res.data.data); })
      .catch(() => {/* fail silently — stat is non-critical */});
  }, []);

  if (!stats || stats.userCount < 10) return null;

  return (
    <div className="flex items-center gap-2 mt-4">
      <div className="flex -space-x-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-emerald-600 border-2 border-black/30 flex items-center justify-center"
            aria-hidden
          >
            <span className="material-symbols-outlined text-white text-[12px]">person</span>
          </div>
        ))}
      </div>
      <p className="text-sm text-white/75 font-medium">
        <span className="text-white font-bold">{formatCount(stats.userCount)}</span>{' '}
        neighbours already in your Huud
      </p>
    </div>
  );
}
