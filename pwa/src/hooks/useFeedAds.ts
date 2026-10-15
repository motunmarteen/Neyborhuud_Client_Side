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
import { houseFeedAds, previewSamplesOn, sampleFeedAds } from '@/lib/houseAds';
import { isAdminUser } from '@/lib/adminAccess';

export function useFeedAds(user: unknown, enabled = true) {
  const area = userArea(user);
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const [samples, setSamples] = useState(false);
  const isAdmin = isAdminUser(user as Parameters<typeof isAdminUser>[0]);
  useEffect(() => {
    setHidden(readHiddenAds());
    setSamples(previewSamplesOn(isAdmin));
  }, [isAdmin]);

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

  const real = data ?? [];
  const all: Ad[] = [
    ...(samples && area ? sampleFeedAds(area) : []),
    ...real,
    ...(real.length === 0 && area ? houseFeedAds(area) : []),
  ];
  const ads = all.filter((a) => !hidden.has(a._id));
  return { ads, hide };
}
