'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { ProductTourSlides } from '@/components/onboarding/ProductTourSlides';
import { hasCompletedProductTour, markProductTourComplete } from '@/lib/onboarding';

export default function OnboardingPage() {
    const router = useRouter();

    useEffect(() => {
        if (!apiClient.isAuthenticated()) {
            router.replace('/');
            return;
        }
        if (hasCompletedProductTour()) {
            router.replace('/feed');
        }
    }, [router]);

    const finishTour = () => {
        markProductTourComplete();
        router.replace('/feed');
    };

    return <ProductTourSlides onComplete={finishTour} onSkip={finishTour} />;
}
