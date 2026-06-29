'use client';

import { useEffect, useState } from 'react';
import { resolveHuudDisplayName } from '@/lib/huudName';
import type { LocationData } from '@/types/api';

export const HUUD_NAME_FALLBACK = 'Your Huud';

type HuudNameUser = {
  location?: LocationData | null;
};

/** SSR-safe Huud label — matches server fallback until after mount. */
export function useHuudDisplayName(user?: HuudNameUser | null): string {
  const [huudName, setHuudName] = useState(HUUD_NAME_FALLBACK);

  useEffect(() => {
    setHuudName(resolveHuudDisplayName(user));
  }, [user]);

  return huudName;
}

export function useHuudFeedLabel(user?: HuudNameUser | null): string {
  const huudName = useHuudDisplayName(user);
  return `${huudName} right now`;
}
