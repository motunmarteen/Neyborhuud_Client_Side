'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/ErrorState';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SafetyError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      console.error('[SafetyError]', error.digest ?? error.message);
    }
  }, [error]);

  return (
    <ErrorState
      fullPage
      onRetry={reset}
      digest={error.digest}
      title="This safety page no load"
      description="In an emergency, use the red SOS button or hold Sentinel. They work even when this page does not."
      homeHref="/sos"
      homeLabel="Go to SOS"
    />
  );
}
