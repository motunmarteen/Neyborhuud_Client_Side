'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { appendSentinelFromParam, labelForSentinelPath, rememberSentinelBack } from '@/lib/sentinelBrowseBack';

type SentinelHubHeroProps = {
  sosPhase: 'idle' | 'pending' | 'active' | 'resolved' | string;
  onCancelSos?: () => void;
  onResolveSos?: () => void;
  incidentHref?: string;
};

export function SentinelHubHero({
  sosPhase,
  onCancelSos,
  onResolveSos,
  incidentHref,
}: SentinelHubHeroProps) {
  const pathname = usePathname();
  const isActive = sosPhase === 'active';
  const isPending = sosPhase === 'pending';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 mod-card ${
        isActive
          ? 'ring-2 ring-brand-red/35'
          : isPending
            ? 'ring-2 ring-primary/30'
            : ''
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${
          isActive
            ? 'from-brand-red/20 via-transparent to-brand-red/5'
            : isPending
              ? 'from-primary/18 via-transparent to-amber-100/30 dark:to-amber-950/20'
              : 'from-brand-blue/14 via-primary/6 to-transparent'
        }`}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl"
        aria-hidden
      />

      <div className="relative flex items-start gap-4">
        <div
          className={`mod-inset flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
            isActive ? 'text-brand-red' : isPending ? 'text-primary' : 'text-brand-blue'
          }`}
        >
          <span
            className="material-symbols-outlined text-[32px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden
          >
            {isActive ? 'emergency_home' : 'shield'}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Sentinel AI</p>
          <h2 className="mt-1 text-xl font-extrabold leading-tight tracking-tight" style={{ color: 'var(--neu-text)' }}>
            {isActive ? 'SOS is live' : isPending ? 'SOS arming…' : 'Your safety command center'}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
            {isActive
              ? 'Guardians are notified. Mark safe when you are out of danger.'
              : isPending
                ? 'Cancel now if this was accidental.'
                : 'Tap a tool below — details live on each feature page.'}
          </p>
        </div>
      </div>

      <div className="relative mt-4">
        {isActive ? (
          <div className="flex flex-wrap gap-2">
            {incidentHref ? (
              <Link
                href={incidentHref}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand-red px-4 py-2.5 text-sm font-bold text-white no-underline shadow-[0_4px_14px_rgba(220,38,38,0.35)]"
              >
                View incident
              </Link>
            ) : null}
            <button
              type="button"
              onClick={onResolveSos}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white"
            >
              I&apos;m safe
            </button>
          </div>
        ) : isPending ? (
          <button
            type="button"
            onClick={onCancelSos}
            className="w-full rounded-full border border-primary/30 bg-[var(--neu-bg)] px-4 py-2.5 text-sm font-semibold text-primary"
          >
            Cancel SOS
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <Link
              href={appendSentinelFromParam('/sos', pathname)}
              onClick={() => rememberSentinelBack(pathname, labelForSentinelPath(pathname))}
              className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl bg-brand-red px-2 py-2.5 text-center text-white no-underline shadow-[0_4px_14px_rgba(220,38,38,0.3)]"
            >
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                emergency
              </span>
              <span className="text-[11px] font-bold leading-none">SOS</span>
            </Link>
            <Link
              href={appendSentinelFromParam('/safety/manage', pathname)}
              onClick={() => rememberSentinelBack(pathname, labelForSentinelPath(pathname))}
              className="mod-chip flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 text-center no-underline"
              style={{ color: 'var(--neu-text)' }}
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span className="text-[11px] font-bold leading-none">Dashboard</span>
            </Link>
            <Link
              href={appendSentinelFromParam('/safety/kidnapping-tracking', pathname)}
              onClick={() => rememberSentinelBack(pathname, labelForSentinelPath(pathname))}
              className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border border-primary/30 bg-primary/10 px-2 py-2.5 text-center no-underline"
            >
              <span className="material-symbols-outlined text-[20px] text-primary">my_location</span>
              <span className="text-[11px] font-bold leading-none text-primary">
                <span className="sm:hidden">Live</span>
                <span className="hidden sm:inline">Live track</span>
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
