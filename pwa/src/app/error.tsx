'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to an error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // Replace with Sentry or similar when available
      console.error('[GlobalError]', error.digest ?? error.message);
    }
  }, [error]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12 bg-soft-bg">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-status-danger/8 flex items-center justify-center">
          <span className="material-symbols-outlined text-[42px] text-brand-red">error</span>
        </div>

        {/* Copy */}
        <div className="flex flex-col gap-2">
          <h1 className="type-display font-black text-white">Something went wrong</h1>
          <p className="text-sm text-[var(--text-secondary-light)] dark:text-[var(--text-secondary-dark)]">
            We hit an unexpected error. This has been noted and we&apos;re looking into it.
          </p>
          {error.digest && (
            <p className="text-[11px] font-mono text-[var(--neu-text-muted)] mt-1">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={reset}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm transition-opacity hover:opacity-90 active:opacity-80"
          >
            Try again
          </button>
          <Link
            href="/feed"
            className="w-full py-3 rounded-xl border border-border text-charcoal dark:text-[var(--text-primary-dark)] font-bold text-sm text-center transition-colors hover:bg-black/5"
          >
            Go to Feed
          </Link>
        </div>
      </div>
    </div>
  );
}
