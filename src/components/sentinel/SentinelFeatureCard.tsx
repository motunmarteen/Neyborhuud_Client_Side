'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrowseInfoTip } from '@/components/ui/BrowseInfoTip';
import type { SentinelAccent, SentinelFeature } from '@/lib/sentinel-catalog';
import { appendSentinelFromParam, labelForSentinelPath, rememberSentinelBack } from '@/lib/sentinelBrowseBack';

const ACCENT: Record<
  SentinelAccent,
  { icon: string; ring: string; glow: string }
> = {
  primary: {
    icon: 'text-primary bg-primary/12',
    ring: 'ring-primary/12 hover:ring-primary/30',
    glow: 'group-hover:shadow-[0_8px_24px_rgba(0,111,53,0.12)]',
  },
  blue: {
    icon: 'text-brand-blue bg-brand-blue/10',
    ring: 'ring-brand-blue/10 hover:ring-brand-blue/25',
    glow: 'group-hover:shadow-[0_8px_24px_rgba(37,99,235,0.1)]',
  },
  red: {
    icon: 'text-brand-red bg-brand-red/10',
    ring: 'ring-brand-red/12 hover:ring-brand-red/30',
    glow: 'group-hover:shadow-[0_8px_24px_rgba(220,38,38,0.12)]',
  },
  muted: {
    icon: 'text-[var(--neu-text-muted)] bg-[var(--neu-shadow-dark)]/25',
    ring: 'ring-black/5 hover:ring-black/10',
    glow: 'group-hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)]',
  },
};

type SentinelFeatureCardProps = {
  feature: SentinelFeature;
  /** Tighter tile for overview grids */
  compact?: boolean;
};

export function SentinelFeatureCard({ feature, compact = false }: SentinelFeatureCardProps) {
  const pathname = usePathname();
  const href = appendSentinelFromParam(feature.href, pathname);
  const tone = ACCENT[feature.accent];

  return (
    <Link
      href={href}
      onClick={() => rememberSentinelBack(pathname, labelForSentinelPath(pathname))}
      className={`group relative flex no-underline ring-1 transition-all duration-200 active:scale-[0.98] ${tone.ring} ${tone.glow} mod-card mod-card-hover ${
        compact
          ? 'min-h-[5.5rem] flex-row items-center gap-3 rounded-2xl p-3'
          : 'min-h-[7.25rem] flex-col rounded-2xl p-3.5'
      }`}
    >
      <div
        className={`flex shrink-0 items-start justify-between gap-1 ${compact ? 'flex-col' : 'w-full'}`}
      >
        <div
          className={`mod-inset flex items-center justify-center rounded-xl ${tone.icon} ${
            compact ? 'h-10 w-10' : 'h-11 w-11'
          }`}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: compact ? 20 : 22, fontVariationSettings: "'FILL' 1" }}
            aria-hidden
          >
            {feature.icon}
          </span>
        </div>

        <div className={`flex items-center gap-1 ${compact ? 'absolute right-2 top-2' : ''}`}>
          {feature.badge ? (
            <span className="mod-chip mod-chip-active rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
              {feature.badge}
            </span>
          ) : null}
          <BrowseInfoTip label={feature.label}>
            <p>{feature.tagline}</p>
            <p className="mt-2 border-t pt-2" style={{ borderColor: 'var(--neu-shadow-dark)' }}>
              <span className="font-semibold text-primary">How: </span>
              {feature.howTo}
            </p>
          </BrowseInfoTip>
        </div>
      </div>

      <div className={`min-w-0 flex-1 ${compact ? '' : 'mt-2'}`}>
        <h3
          className={`font-bold leading-snug ${compact ? 'text-sm' : 'text-[15px]'}`}
          style={{ color: 'var(--neu-text)' }}
        >
          {feature.label}
        </h3>
        {!compact ? (
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
            {feature.tagline}
          </p>
        ) : null}
      </div>

      <span
        className={`material-symbols-outlined shrink-0 text-primary transition-transform group-hover:translate-x-0.5 ${
          compact ? 'text-[20px]' : 'absolute bottom-3.5 right-3.5 text-[18px]'
        }`}
        aria-hidden
      >
        arrow_forward
      </span>
    </Link>
  );
}
