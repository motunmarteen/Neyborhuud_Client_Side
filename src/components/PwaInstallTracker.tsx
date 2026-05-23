'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { isAccountSetupIncomplete } from '@/lib/appShellGates';
import { SETUP_MILESTONE_EVENT } from '@/lib/onboarding';
import { recordAuthenticatedFeedVisit, recordPwaSession } from '@/lib/pwa-install';

/** Records session + feed intent signals for install prompt timing. */
export function PwaInstallTracker() {
    const pathname = usePathname();
    const { user } = useAuth();

    useEffect(() => {
        recordPwaSession();
    }, []);

    useEffect(() => {
        const tryRecord = () => {
            if (pathname !== '/feed' || !user?.id) return;
            if (isAccountSetupIncomplete()) return;
            recordAuthenticatedFeedVisit();
        };

        tryRecord();
        window.addEventListener(SETUP_MILESTONE_EVENT, tryRecord);
        return () => window.removeEventListener(SETUP_MILESTONE_EVENT, tryRecord);
    }, [pathname, user?.id]);

    return null;
}
