'use client';

/**
 * Sponsored cards for the feed (owner, 2026-10-15): live ads for the person's area, state and
 * all of Nigeria, minus the ones they hid on this device. Ads are extra: on any error the
 * feed simply shows none.
 */

import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchFeedAds, userArea, type Ad } from '@/lib/adsApi';
import { readHiddenAds, saveHiddenAd } from '@/lib/feedAds';

export function useFeedAds(user: unknown, enabled = true) {
  const area = userArea(user);
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  useEffect(() => setHidden(readHiddenAds()), []);

  const { data } = useQuery({
    queryKey: ['ads', 'feed', area?.lga, area?.state],
    queryFn: () => fetchFeedAds(area!.lga, area!.state),
    enabled: enabled && !!area,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const hide = useCallback((id: string) => {
    saveHiddenAd(id);
    setHidden((prev) => new Set(prev).add(id));
  }, []);

  const ads: Ad[] = (data ?? []).filter((a) => !hidden.has(a._id));
  return { ads, hide };
}
