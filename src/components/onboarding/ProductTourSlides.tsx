'use client';

import { useState } from 'react';
import { AuthFlowPage } from '@/components/auth/AuthFlowPage';
import { AuthFlowHero } from '@/components/auth/AuthFlowHero';

const TOUR_SLIDES = [
    {
        id: 'sos',
        stepLabel: 'Safety',
        eyebrow: 'Safety first',
        title: 'One-Tap SOS',
        meta: 'Help reaches your street in seconds',
        icon: 'bi-exclamation-octagon-fill',
        error: true,
        highlight: 'Trigger an emergency alert instantly — guardians and responders are notified with your location.',
        tip: 'The red SOS button lives on your feed and safety tab.',
    },
    {
        id: 'feed',
        stepLabel: 'Your feed',
        eyebrow: 'Street intelligence',
        title: 'Hyperlocal Feed',
        meta: 'Know before everyone else',
        icon: 'bi-newspaper',
        error: false,
        highlight:
            'Posts, FYI alerts, jobs, events, and marketplace listings — everything happening on your street, in real time.',
        tip: 'Sentinel AI surfaces what matters most near you.',
    },
    {
        id: 'community',
        stepLabel: 'Community',
        eyebrow: 'Your voice',
        title: 'Lead Your Street',
        meta: 'Reputation builds trust',
        icon: 'bi-people-fill',
        error: false,
        highlight: 'Join conversations, support neighbours, and grow your standing in the Huud.',
        tip: 'Verified profiles keep the neighbourhood safer for everyone.',
    },
    {
        id: 'economy',
        stepLabel: 'HuudCoins',
        eyebrow: 'Huud economy',
        title: 'Earn as You Participate',
        meta: 'Trust unlocks rewards',
        icon: 'bi-coin',
        error: false,
        highlight: 'HuudCoins, trust score, and tiers reward helpful neighbours — no subscription required.',
        tip: 'You already earned coins from signup. Daily check-ins add more.',
    },
] as const;

type ProductTourSlidesProps = {
    onComplete: () => void;
    onSkip?: () => void;
};

export function ProductTourSlides({ onComplete, onSkip }: ProductTourSlidesProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const slide = TOUR_SLIDES[currentSlide];
    const isLast = currentSlide === TOUR_SLIDES.length - 1;

    const goNext = () => {
        if (isLast) {
            onComplete();
            return;
        }
        setCurrentSlide((prev) => prev + 1);
    };

    const goBack = () => {
        if (currentSlide > 0) {
            setCurrentSlide((prev) => prev - 1);
        }
    };

    const handleSkip = () => {
        (onSkip ?? onComplete)();
    };

    return (
        <AuthFlowPage
            ariaLabel={`Product tour — ${slide.title}`}
            stageKey={`onboarding-${slide.id}`}
            stepLabel="Quick tour"
            progress={{
                active: currentSlide + 1,
                total: TOUR_SLIDES.length,
                stepLabel: slide.stepLabel,
            }}
            onBackClick={currentSlide > 0 ? goBack : undefined}
            backLabel="Previous slide"
            peek={
                <div className="auth-signup-location-peek">
                    <span className="auth-signup-location-peek__icon" aria-hidden>
                        <i className={`bi ${slide.icon}`} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="auth-signup-location-peek__label">
                            Step {currentSlide + 1} of {TOUR_SLIDES.length}
                        </p>
                        <p className="auth-signup-location-peek__name truncate">{slide.title}</p>
                    </div>
                    <span className="auth-signup-location-peek__chevron" aria-hidden>
                        <i className="bi bi-chevron-up" />
                    </span>
                </div>
            }
            footer={
                <div className="auth-signup-actions">
                    <button type="button" onClick={goNext} className="auth-btn auth-btn-primary">
                        <span>{isLast ? 'Enter your Huud' : 'Continue'}</span>
                        <i className={`bi ${isLast ? 'bi-arrow-right' : 'bi-arrow-right'} shrink-0`} aria-hidden />
                    </button>
                    {!isLast ? (
                        <button type="button" onClick={handleSkip} className="auth-btn auth-btn-secondary">
                            <i className="bi bi-skip-forward shrink-0" aria-hidden />
                            <span>Skip tour</span>
                        </button>
                    ) : null}
                </div>
            }
            footerLink={
                <p className="auth-signin-link auth-signin-link--sheet mt-3 border-t border-charcoal/8 pt-3">
                    {isLast
                        ? 'You are ready for your street feed — welcome to the Huud.'
                        : 'Skip anytime — explore SOS, feed, and marketplace from the app.'}
                </p>
            }
        >
            <AuthFlowHero
                icon={slide.icon}
                eyebrow={slide.eyebrow}
                title={slide.title}
                meta={slide.meta}
                error={slide.error}
            />

            <div className="auth-signup-sheet-fields flex flex-col gap-3">
                <div className="auth-flow-notice auth-flow-notice--info">
                    <i className={`bi ${slide.icon} shrink-0`} aria-hidden />
                    <span>{slide.highlight}</span>
                </div>
                <p className="text-center text-[10px] font-medium leading-relaxed text-[var(--neu-text-muted)]">
                    {slide.tip}
                </p>
            </div>
        </AuthFlowPage>
    );
}
