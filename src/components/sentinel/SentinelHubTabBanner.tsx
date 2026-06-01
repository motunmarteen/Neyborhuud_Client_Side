'use client';

import type { SentinelHubTab } from '@/lib/sentinel-catalog';
import { SENTINEL_TAB_BANNERS } from '@/lib/sentinel-hub-copy';

type SentinelHubTabBannerProps = {
  tab: Exclude<SentinelHubTab, 'overview'>;
  count: number;
};

export function SentinelHubTabBanner({ tab, count }: SentinelHubTabBannerProps) {
  const meta = SENTINEL_TAB_BANNERS[tab];

  return (
    <div className="relative overflow-hidden rounded-2xl mod-card p-4">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${meta.gradient}`} aria-hidden />
      <div className="relative flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">{meta.title}</p>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--neu-text-muted)' }}>
            {meta.subtitle}
          </p>
        </div>
        <span className="mod-chip rounded-full px-2.5 py-1 text-xs font-bold tabular-nums text-primary">
          {count}
        </span>
      </div>
    </div>
  );
}
