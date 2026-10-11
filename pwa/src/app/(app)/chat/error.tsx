'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/ErrorState';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ChatError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      console.error('[ChatError]', error.digest ?? error.message);
    }
  }, [error]);

  return (
    <ErrorState
      fullPage
      onRetry={reset}
      digest={error.digest}
      title="Chats no load this time"
      description="Your messages are safe. Try again."
      homeHref="/chat"
      homeLabel="Back to chats"
    />
  );
}
