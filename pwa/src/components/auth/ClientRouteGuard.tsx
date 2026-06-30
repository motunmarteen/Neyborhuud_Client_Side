'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { isOnboardingOrAuthRoute } from '@/lib/appShellGates';

export function ClientRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Check if the route is a private route (not onboarding, auth, or marketing)
    const isPrivate = !isOnboardingOrAuthRoute(pathname);
    const isAuthed = apiClient.isAuthenticated();

    if (isPrivate && !isAuthed) {
      // Redirect to login page
      router.replace('/login');
    }
  }, [pathname, mounted, router]);

  // Prevent flicker of private content while redirecting
  const isPrivate = !isOnboardingOrAuthRoute(pathname);
  const isAuthed = typeof window !== 'undefined' ? apiClient.isAuthenticated() : false;

  if (mounted && isPrivate && !isAuthed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--neu-bg,#f5f7f5)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
