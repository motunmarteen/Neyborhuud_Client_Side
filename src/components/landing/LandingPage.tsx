'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { NeyborHuudLogo } from '@/components/brand/NeyborHuudLogo';

const LANDING_VIDEO = '/video/background-video.mp4';
/** Add `public/video/landing-poster.jpg` (first frame, ~120 KB) for instant paint. */
const LANDING_POSTER = '/video/landing-poster.jpg';

const HEADLINE_LINES = ['Safety.', 'People.', 'Huud.'];

export function LandingPage() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoReady, setVideoReady] = useState(false);
    const [posterOk, setPosterOk] = useState(true);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (apiClient.isAuthenticated()) {
            router.replace('/feed');
        }
    }, [router]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onReady = () => setVideoReady(true);

        const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const syncPlayback = () => {
            if (motion.matches) {
                video.pause();
                return;
            }
            void video.play().catch(() => {
                /* Autoplay blocked — poster / dark base remains visible */
            });
        };

        video.addEventListener('canplay', onReady);
        if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
            onReady();
        }

        syncPlayback();
        motion.addEventListener('change', syncPlayback);
        return () => {
            video.removeEventListener('canplay', onReady);
            motion.removeEventListener('change', syncPlayback);
        };
    }, []);

    return (
        <div className="landing-page relative min-h-[100dvh] overflow-hidden">
            <div className="absolute inset-0 bg-[#060908]" aria-hidden />

            {posterOk ? (
                <img
                    src={LANDING_POSTER}
                    alt=""
                    aria-hidden
                    className="landing-video absolute inset-0 h-full w-full"
                    onError={() => setPosterOk(false)}
                />
            ) : null}

            <video
                ref={videoRef}
                className={`landing-video absolute inset-0 h-full w-full transition-opacity duration-700 ${
                    videoReady ? 'opacity-100' : 'opacity-0'
                }`}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-hidden
            >
                <source src={LANDING_VIDEO} type="video/mp4" />
            </video>

            <div className="landing-glow-top absolute inset-0" aria-hidden />
            <div className="landing-glow-bottom absolute inset-0" aria-hidden />
            <div className="landing-glow-blue absolute inset-0" aria-hidden />

            <div className="landing-scrim absolute inset-0" aria-hidden />
            <div className="landing-scrim-bottom absolute inset-x-0 bottom-0 h-1/2" aria-hidden />

            <div
                className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
                style={{
                    backgroundImage:
                        'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
                }}
                aria-hidden
            />

            <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col">
                <header className="relative flex h-[50dvh] shrink-0 flex-col items-center justify-start px-6 pt-[max(2.75rem,env(safe-area-inset-top))]">
                    <div
                        className="landing-logo-halo pointer-events-none absolute left-1/2 top-8 h-40 w-[min(100%,20rem)] -translate-x-1/2"
                        aria-hidden
                    />
                    <NeyborHuudLogo layout="stacked" size="hero" tone="hero" priority />
                </header>

                <div className="flex min-h-[50dvh] flex-1 flex-col px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
                    <div>
                        <div className="landing-headline-stack">
                            {HEADLINE_LINES.map((line) => (
                                <h1 key={line} className="landing-headline landing-headline--white">
                                    {line}
                                </h1>
                            ))}
                        </div>
                        <p className="landing-subcopy">
                            Hyperlocal safety, community, and commerce — built for your street.
                        </p>
                    </div>

                    <div className="mt-auto flex gap-3 pt-6">
                        <Link
                            href="/signup"
                            className="landing-btn-primary flex h-[54px] flex-[1.55] items-center justify-center text-sm font-bold transition-transform"
                        >
                            Create account
                        </Link>
                        <Link
                            href="/login"
                            className="landing-btn-secondary flex h-[54px] flex-1 items-center justify-center text-sm font-bold transition-transform"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
