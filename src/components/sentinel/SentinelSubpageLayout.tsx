'use client';

import { Suspense, type ReactNode } from 'react';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import SosCountdownOverlay from '@/components/safety/SosCountdownOverlay';
import { SentinelBackLink } from '@/components/sentinel/SentinelBackLink';
import { useSos } from '@/hooks/useSos';
import type { SentinelBackTarget } from '@/lib/sentinelBrowseBack';

type SentinelSubpageLayoutProps = {
  children: ReactNode;
  /** Shown under TopNav title area */
  pageTitle: string;
  pageSubtitle: string;
  icon: string;
  iconAccent?: 'primary' | 'blue' | 'red' | 'muted';
  header?: ReactNode;
  maxWidth?: '680' | '920';
  /** Used when no stored return path exists */
  backFallback?: SentinelBackTarget;
};

const ICON_ACCENTS = {
  primary: 'text-primary bg-primary/12',
  blue: 'text-brand-blue bg-brand-blue/10',
  red: 'text-brand-red bg-brand-red/10',
  muted: 'text-[var(--neu-text-muted)] bg-[var(--neu-shadow-dark)]/25',
};

/**
 * Huud Score–style shell for Sentinel sub-pages: AppBrowseLayout + back link + optional SOS overlay.
 */
export function SentinelSubpageLayout({
  children,
  pageTitle,
  pageSubtitle,
  icon,
  iconAccent = 'blue',
  header,
  maxWidth = '680',
  backFallback = { href: '/safety', label: 'Sentinel AI hub' },
}: SentinelSubpageLayoutProps) {
  const sos = useSos();

  return (
    <>
      <SosCountdownOverlay
        phase={sos.phase}
        secondsRemaining={sos.secondsRemaining}
        visibilityMode={sos.activeSos?.visibilityMode ?? 'normal'}
        onCancel={() => void sos.cancelSos('User cancelled countdown')}
      />
      <AppBrowseLayout
        maxWidth={maxWidth}
        subtitle={
          <span className="flex items-center gap-2">
            <span
              className={`mod-inset flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ICON_ACCENTS[iconAccent]}`}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden>
                {icon}
              </span>
            </span>
            <span className="min-w-0 truncate text-sm" style={{ color: 'var(--neu-text-muted)' }}>
              {pageSubtitle}
            </span>
          </span>
        }
        header={
          <div className="flex flex-col gap-3">
            <Suspense fallback={null}>
              <SentinelBackLink fallback={backFallback} />
            </Suspense>
            <div className="mod-card rounded-2xl p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">{pageTitle}</p>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
                {pageSubtitle}
              </p>
            </div>
            {header}
          </div>
        }
      >
        <div className="space-y-5">{children}</div>
      </AppBrowseLayout>
    </>
  );
}
