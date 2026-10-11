'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/ErrorState';

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
    <ErrorState
      fullPage
      onRetry={reset}
      digest={error.digest}
      title="Marketplace no load this time"
      description="Your listings and deals are safe. Try again."
      homeHref="/marketplace"
      homeLabel="Back to marketplace"
    />
  );
}
