'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { recordAuthenticatedFeedVisit, recordPwaSession } from '@/lib/pwa-install';

/** Records session + feed intent signals for install prompt timing. */
export function PwaInstallTracker() {
    const pathname = usePathname();
    const { user } = useAuth();

    useEffect(() => {
        recordPwaSession();
    }, []);

    useEffect(() => {
        if (pathname === '/feed' && user?.id) {
            recordAuthenticatedFeedVisit();
        }
    }, [pathname, user?.id]);

    return null;
}
