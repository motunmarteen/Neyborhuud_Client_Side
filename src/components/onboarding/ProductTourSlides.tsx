'use client';

import React, { useState } from 'react';
import { NeyborHuudLogo } from '@/components/brand/NeyborHuudLogo';

const slides = [
    {
        id: 'sos',
        title: 'One-Tap SOS',
        subtitle: 'Trigger an emergency alert in 2 seconds. Trusted guardians and responders are notified instantly.',
        icon: 'bi-exclamation-octagon-fill',
        accentColor: '#FF0000',
    },
    {
        id: 'sentinel',
        title: 'Sentinel AI',
        subtitle: "Your street's always-on intelligence. Sentinel AI detects threats, monitors safety patterns, and keeps you ahead of danger.",
        icon: 'bi-cpu-fill',
        accentColor: '#0000FF',
    },
    {
        id: 'feed',
        title: 'Hyperlocal Feed',
        subtitle: 'Posts, FYI alerts, local jobs, events & marketplace — everything happening on your street, in real time.',
        icon: 'bi-newspaper',
        accentColor: '#00D431',
    },
    {
        id: 'community',
        title: 'Your Voice Matters',
        subtitle: 'Join the conversation. Build your Reputation. Lead your street.',
        icon: 'bi-people-fill',
        accentColor: '#006F35',
    },
    {
        id: 'identity',
        title: 'Identity is Power',
        subtitle: 'Build your Trust Score. Unlock the Huud Economy.',
        icon: 'bi-patch-check-fill',
        accentColor: '#0000FF',
    },
];

type ProductTourSlidesProps = {
    onComplete: () => void;
    onSkip?: () => void;
};

export function ProductTourSlides({ onComplete, onSkip }: ProductTourSlidesProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    const activeSlide = slides[currentSlide];

    const nextSlide = () => {
        if (isAnimating) return;
        if (currentSlide < slides.length - 1) {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentSlide((prev) => prev + 1);
                setIsAnimating(false);
            }, 300);
        } else {
            onComplete();
        }
    };

    const goToSlide = (idx: number) => {
        if (idx !== currentSlide && !isAnimating) {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentSlide(idx);
                setIsAnimating(false);
            }, 300);
        }
    };

    return (
        <div className="neu-base relative flex min-h-[100dvh] flex-col items-center justify-between overflow-hidden px-6 py-10">
            {onSkip ? (
                <button
                    type="button"
                    onClick={onSkip}
                    className="absolute right-6 top-6 z-30 rounded-full px-4 py-2 text-sm font-semibold text-[var(--neu-text-muted)] transition-colors hover:text-[var(--neu-text)]"
                >
                    Skip
                </button>
            ) : null}

            <div className="absolute left-0 right-0 top-8 z-20 flex justify-center px-6">
                <NeyborHuudLogo layout="inline" size="lg" tone="dark" />
            </div>

            <div
                className={`pointer-events-none absolute left-1/2 top-[-30%] h-[500px] w-[500px] -translate-x-1/2 rounded-full blur-[160px] transition-all duration-1000 ${activeSlide.id === 'sos' ? 'opacity-[0.18]' : 'opacity-[0.06]'}`}
                style={{ backgroundColor: activeSlide.accentColor }}
            />

            <div className="z-10 flex w-full max-w-md grow flex-col items-center justify-center gap-10">
                <div className="relative flex items-center justify-center">
                    {activeSlide.id === 'sos' ? (
                        <div
                            className={`neu-card-raised flex h-56 w-56 items-center justify-center rounded-[2.5rem] transition-all duration-500 animate-neu-float ${isAnimating ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}`}
                        >
                            <div
                                className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-full"
                                style={{
                                    background: 'radial-gradient(circle at 38% 32%, #FF4D4D 0%, #FF0000 50%, #B30000 100%)',
                                    boxShadow: '0 10px 40px rgba(255,0,0,0.55), 0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.18)',
                                }}
                            >
                                <div
                                    className="pointer-events-none absolute left-5 top-3 h-7 w-14 rounded-full"
                                    style={{ background: 'linear-gradient(150deg, rgba(255,255,255,0.28) 0%, transparent 100%)' }}
                                />
                                <span
                                    className="material-symbols-outlined relative z-10 select-none fill-1 text-white"
                                    style={{ fontSize: '5rem', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.45))' }}
                                >
                                    sos
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div
                            className={`neu-card-raised flex h-56 w-56 items-center justify-center rounded-[2.5rem] transition-all duration-500 animate-neu-float ${isAnimating ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}`}
                        >
                            <div
                                className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-full"
                                style={{
                                    background: `radial-gradient(circle at 38% 32%, ${activeSlide.accentColor}CC 0%, ${activeSlide.accentColor} 50%, ${activeSlide.accentColor}CC 100%)`,
                                    boxShadow: `0 10px 40px ${activeSlide.accentColor}55, 0 4px 12px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.22)`,
                                }}
                            >
                                <div
                                    className="pointer-events-none absolute left-5 top-3 h-7 w-14 rounded-full"
                                    style={{ background: 'linear-gradient(150deg, rgba(255,255,255,0.32) 0%, transparent 100%)' }}
                                />
                                <i
                                    className={`bi ${activeSlide.icon} relative z-10 select-none text-white`}
                                    style={{ fontSize: '4.5rem', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))' }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div
                    className={`flex flex-col gap-3 text-center transition-all duration-500 delay-75 ${isAnimating ? 'translate-y-5 opacity-0' : 'translate-y-0 opacity-100'}`}
                >
                    <h1 className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--neu-text)' }}>
                        {activeSlide.title}
                    </h1>
                    <p className="mx-auto max-w-xs text-base leading-relaxed" style={{ color: 'var(--neu-text-secondary)' }}>
                        {activeSlide.subtitle}
                    </p>
                </div>
            </div>

            <div className="z-20 flex w-full max-w-md flex-col gap-7">
                <div className="flex justify-center">
                    <div className="neu-track flex items-center gap-3 rounded-full px-5 py-2.5">
                        {slides.map((slide, idx) => (
                            <button
                                key={slide.id}
                                type="button"
                                onClick={() => goToSlide(idx)}
                                className={`cursor-pointer rounded-full transition-all duration-500 ${currentSlide === idx ? 'neu-dot-active h-2.5 w-8' : 'neu-dot h-2.5 w-2.5 hover:scale-110'}`}
                                style={currentSlide === idx ? { backgroundColor: slide.accentColor } : undefined}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={nextSlide}
                    onMouseDown={() => setIsPressed(true)}
                    onMouseUp={() => setIsPressed(false)}
                    onMouseLeave={() => setIsPressed(false)}
                    onTouchStart={() => setIsPressed(true)}
                    onTouchEnd={() => setIsPressed(false)}
                    className={`flex w-full cursor-pointer items-center justify-center rounded-2xl py-5 transition-all duration-150 ${isPressed ? 'neu-btn-active' : 'neu-btn'}`}
                >
                    <span className="text-sm font-black uppercase tracking-[0.25em]" style={{ color: 'var(--neu-text)' }}>
                        {currentSlide === slides.length - 1 ? 'Enter your Huud' : 'Continue'}
                    </span>
                </button>
            </div>
        </div>
    );
}
