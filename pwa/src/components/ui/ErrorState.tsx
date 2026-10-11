'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Design foundation F-09: error states.
 *
 * Calm and practical: say what happened in plain words, reassure that nothing is lost,
 * and give one way forward (Try again) plus a way out (Go home). Knows when the phone is
 * offline and says so instead of blaming the app.
 *
 *   <ErrorState onRetry={refetch} />                 inside a page (a list that failed)
 *   <ErrorState fullPage onRetry={reset} digest=… /> an error.tsx boundary
 *   <ErrorState kind="not_found" fullPage />         the 404 page
 */

type Kind = 'error' | 'not_found';

const COPY: Record<Kind | 'offline', { icon: string; title: string; description: string }> = {
  error: { icon: '😕', title: 'E no load this time', description: 'No wahala, nothing is lost. Try again.' },
  offline: { icon: '📶', title: 'Network no gree', description: 'You are offline. Check your data or Wi-Fi, then try again.' },
  not_found: { icon: '🧭', title: 'This page no dey', description: 'The link may be old, or the page has moved.' },
};

type ErrorStateProps = {
  kind?: Kind;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retrying?: boolean;
  /** Where "Go home" leads. Pass null to hide it. */
  homeHref?: string | null;
  homeLabel?: string;
  /** Error id from Next.js, shown small so support can find it. */
  digest?: string;
  fullPage?: boolean;
  className?: string;
};

export function ErrorState({
  kind = 'error',
  title,
  description,
  onRetry,
  retrying = false,
  homeHref = '/feed',
  homeLabel = 'Go home',
  digest,
  fullPage = false,
  className = '',
}: ErrorStateProps) {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(typeof navigator !== 'undefined' && navigator.onLine === false);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  const isOffline = kind === 'error' && offline;
  const copy = COPY[isOffline ? 'offline' : kind];
  // Offline beats a page's own title (it is the real reason); a page's description still shows.
  if (isOffline) title = undefined;

  const body = (
    <div role="alert" className={`flex flex-col items-center gap-3 text-center ${fullPage ? 'max-w-sm' : 'px-6 py-10'} ${className}`.trim()}>
      <span aria-hidden className="grid h-16 w-16 place-items-center rounded-full bg-amber-soft text-3xl">
        {copy.icon}
      </span>
      <h2 className="font-heading text-xl font-extrabold text-navy">{title ?? copy.title}</h2>
      <p className="max-w-xs text-sm leading-relaxed text-muted">{description ?? copy.description}</p>
      <div className="mt-2 flex w-full max-w-xs flex-col gap-2">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(0,184,46,0.28)] transition-colors hover:bg-brand-green-dark disabled:opacity-60"
          >
            {retrying ? 'Trying…' : 'Try again'}
          </button>
        ) : null}
        {homeHref ? (
          <Link
            href={homeHref}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-line bg-white px-6 text-[15px] font-bold text-navy transition-colors hover:bg-background"
          >
            {homeLabel}
          </Link>
        ) : null}
      </div>
      {digest ? <p className="text-[11px] font-semibold text-faint">Error ID: {digest}</p> : null}
    </div>
  );

  if (!fullPage) return body;
  return <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6 py-12">{body}</div>;
}
