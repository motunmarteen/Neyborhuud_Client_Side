'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MarketplaceError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      console.error('[MarketplaceError]', error.digest ?? error.message);
    }
  }, [error]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12 bg-soft-bg">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center">
        <div className="w-20 h-20 rounded-2xl bg-status-danger/8 flex items-center justify-center">
          <span className="material-symbols-outlined text-[42px] text-brand-red">storefront</span>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="type-display font-black text-white">Marketplace hit a snag</h1>
          <p className="text-sm text-[var(--text-secondary-light)] dark:text-[var(--text-secondary-dark)]">
            We hit an unexpected error loading this page. Your listings and deals are safe — try again.
          </p>
          {error.digest && (
            <p className="text-[11px] font-mono text-[var(--neu-text-muted)] mt-1">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={reset}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm transition-opacity hover:opacity-90 active:opacity-80"
          >
            Try again
          </button>
          <Link
            href="/marketplace"
            className="w-full py-3 rounded-xl border border-border text-charcoal dark:text-[var(--text-primary-dark)] font-bold text-sm text-center transition-colors hover:bg-black/5"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}
