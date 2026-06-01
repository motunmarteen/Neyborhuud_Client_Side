'use client';

import { useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

/** Legacy `/messages/:id` → `/chat/:id` */
export default function LegacyMessagesThreadRedirect() {
  const params = useParams<{ conversationId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const id = params.conversationId;
    const q = searchParams.toString();
    router.replace(q ? `/chat/${id}?${q}` : `/chat/${id}`);
  }, [params.conversationId, searchParams, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
      Opening chat…
    </div>
  );
}
