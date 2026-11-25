'use client';

import type { ReactNode } from 'react';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import SosCountdownOverlay from '@/components/safety/SosCountdownOverlay';
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
  /** No longer used: the top bar has the back button. */
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
        header={
          <div className="flex flex-col gap-3">
            {/* The top bar shows the screen's name and the back button. */}
            <p className="px-1 text-[15px] leading-relaxed text-muted">
              <span className="sr-only">{pageTitle}: </span>
              {pageSubtitle}
            </p>
            {header}
          </div>
        }
      >
        <div className="space-y-4">{children}</div>
      </AppBrowseLayout>
    </>
  );
}
