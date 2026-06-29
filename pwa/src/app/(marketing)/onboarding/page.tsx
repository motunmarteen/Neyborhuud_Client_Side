'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy route — product tour now lives on the feed as FeedWelcomeSheet. */
export default function OnboardingPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/feed');
    }, [router]);

    return (
        <div className="auth-signup-page fixed-app flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue/30 border-t-brand-blue" />
        </div>
    );
}
