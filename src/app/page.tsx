'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const slides = [
    {
        id: 'safety',
        title: 'Zero-Lag Safety',
        subtitle: 'Trigger an SOS in 2 seconds. Sentinel AI watches over your street.',
        icon: 'bi-shield-check',
        accentColor: '#11d473',
    },
    {
        id: 'community',
        title: 'Your Voice Matters',
        subtitle: 'Join the conversation. Build your Reputation. Lead your street.',
        icon: 'bi-people-fill',
        accentColor: '#FF6B6B',
    },
    {
        id: 'identity',
        title: 'Identity is Power',
        subtitle: 'Build your Trust Score. Unlock the Huud Economy.',
        icon: 'bi-patch-check-fill',
        accentColor: '#9F7AEA',
    },
];

export default function Home() {
    const router = useRouter();
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
            router.push('/signup');
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

    const handleSkip = () => router.push('/signup');

    return (
        <div className="neu-base min-h-[100dvh] flex flex-col items-center justify-between py-10 px-6 overflow-hidden relative">
            {/* Very subtle ambient glow */}
            <div
                className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[160px] opacity-[0.05] pointer-events-none transition-all duration-1000"
                style={{ backgroundColor: activeSlide.accentColor }}
            />

            {/* ── Skip Button ── */}
            <div className="w-full flex justify-end z-20 max-w-md lg:max-w-none lg:absolute lg:top-8 lg:right-10">
                <button
                    onClick={handleSkip}
                    className="neu-btn-pill"
                    aria-label="Skip onboarding"
                >
                    Skip
                </button>
            </div>

            {/* ── Main Content ── */}
            <div className="grow flex flex-col items-center justify-center w-full max-w-md z-10 gap-10">
                {/* Raised Icon Container */}
                <div
                    className={`
                        neu-card-raised rounded-[2.5rem] w-56 h-56 flex items-center justify-center
                        animate-neu-float transition-all duration-500
                        ${isAnimating ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}
                    `}
                >
                    {/* Inset Icon Socket */}
                    <div
                        className="neu-socket rounded-full w-36 h-36 flex items-center justify-center transition-shadow duration-700"
                        style={{
                            boxShadow: `inset 6px 6px 14px var(--neu-shadow-dark), inset -6px -6px 14px var(--neu-shadow-light), 0 0 25px ${activeSlide.accentColor}12`,
                        }}
                    >
                        <i
                            className={`bi ${activeSlide.icon} text-7xl drop-shadow-sm transition-colors duration-500`}
                            style={{ color: activeSlide.accentColor }}
                        />
                    </div>
                </div>

                {/* Text */}
                <div
                    className={`
                        text-center flex flex-col gap-3 transition-all duration-500 delay-75
                        ${isAnimating ? 'translate-y-5 opacity-0' : 'translate-y-0 opacity-100'}
                    `}
                >
                    <h1
                        className="text-3xl font-semibold tracking-tight"
                        style={{ color: 'var(--neu-text)' }}
                    >
                        {activeSlide.title}
                    </h1>
                    <p
                        className="leading-relaxed max-w-xs mx-auto text-base"
                        style={{ color: 'var(--neu-text-secondary)' }}
                    >
                        {activeSlide.subtitle}
                    </p>
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="w-full max-w-md flex flex-col gap-7 z-20">
                {/* Neumorphic Indicator Track */}
                <div className="flex justify-center">
                    <div className="neu-track rounded-full px-5 py-2.5 flex gap-3 items-center">
                        {slides.map((slide, idx) => (
                            <button
                                key={slide.id}
                                onClick={() => goToSlide(idx)}
                                className={`
                                    rounded-full transition-all duration-500 cursor-pointer
                                    ${currentSlide === idx
                                        ? 'w-8 h-2.5 neu-dot-active'
                                        : 'w-2.5 h-2.5 neu-dot hover:scale-110'
                                    }
                                `}
                                style={currentSlide === idx ? { backgroundColor: slide.accentColor } : undefined}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </div>

                {/* CTA Button */}
                <button
                    onClick={nextSlide}
                    onMouseDown={() => setIsPressed(true)}
                    onMouseUp={() => setIsPressed(false)}
                    onMouseLeave={() => setIsPressed(false)}
                    onTouchStart={() => setIsPressed(true)}
                    onTouchEnd={() => setIsPressed(false)}
                    className={`
                        w-full py-5 rounded-2xl flex items-center justify-center
                        transition-all duration-150 cursor-pointer
                        ${isPressed ? 'neu-btn-active' : 'neu-btn'}
                    `}
                >
                    <span
                        className="font-black uppercase tracking-[0.25em] text-sm"
                        style={{ color: 'var(--neu-text)' }}
                    >
                        {currentSlide === slides.length - 1 ? 'Get Started' : 'Continue'}
                    </span>
                </button>

                {/* Login Link */}
                <p className="text-center pb-2">
                    <span className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>
                        Already have an account?{' '}
                    </span>
                    <Link
                        href="/login"
                        className="text-brand-blue font-semibold text-sm hover:underline transition-colors"
                    >
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}
