'use client';

import { useEffect, useState } from 'react';
import { contentService } from '@/services/content.service';

/**
 * Polls the neighborhood emergency feed every 60 seconds.
 * Returns true when at least one active emergency post exists in the user's area.
 * Used to light up the SOS ring on BottomNav without constant pulsing.
 */
export function useNeighborhoodEmergency(): boolean {
  const [hasActive, setHasActive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await contentService.getEmergencyFeed({ limit: 5 });
        const posts: Array<{ status?: string; contentType?: string }> =
          (res.data as any)?.posts ??
          (res.data as any)?.data?.posts ??
          (res.data as any)?.data ??
          [];
        const active = Array.isArray(posts) && posts.some(
          (p) => p.status === 'active' || p.contentType === 'emergency',
        );
        if (!cancelled) setHasActive(active);
      } catch {
        // Fail silently — ring stays static, not a critical path
      }
    };

    void check();
    const id = setInterval(() => void check(), 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return hasActive;
}
