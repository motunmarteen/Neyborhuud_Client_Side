'use client';

import { useQuery } from '@tanstack/react-query';
import { callService } from '@/services/call.service';

/** Recent 1-on-1 call history (audio + video) for the call log. */
export function useRecentCalls(limit = 30) {
  return useQuery({
    queryKey: ['calls', 'recent', limit],
    queryFn: () => callService.getRecentCalls(limit),
    staleTime: 30_000,
  });
}
