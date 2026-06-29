'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/** Client-side counterpart to the next.config redirect (static export safe). */
export default function MessagesConversationRedirectClient() {
  const router = useRouter();
  const params = useParams<{ conversationId: string }>();
  useEffect(() => {
    const id = params?.conversationId;
    router.replace(id ? `/chat/${id}` : '/chat');
  }, [router, params]);
  return null;
}
