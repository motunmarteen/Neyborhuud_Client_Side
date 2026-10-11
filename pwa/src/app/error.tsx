'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/ErrorState';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      console.error('[GlobalError]', error.digest ?? error.message);
    }
  }, [error]);

  return (
    <ErrorState
      fullPage
      onRetry={reset}
      digest={error.digest}
      homeHref="/feed"
      homeLabel="Go to my Huud"
    />
  );
}
