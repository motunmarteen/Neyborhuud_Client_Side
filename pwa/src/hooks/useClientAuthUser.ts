'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/types/api';

/**
 * Auth user safe for SSR — returns null until after mount so server and client HTML match.
 */
export function useClientAuthUser() {
  const auth = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const user: User | null = mounted ? auth.user ?? null : null;

  return { ...auth, user, mounted };
}
