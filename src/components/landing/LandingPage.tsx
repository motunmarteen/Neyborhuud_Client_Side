'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { resolvePostAuthRoute, validateStoredSession } from '@/lib/authSession';
import { LandingHeaderBrand } from '@/components/landing/LandingHeaderBrand';
import { SocialProofBadge } from '@/components/landing/SocialProofBadge';
import { BRAND_NAME } from '@/lib/brand';

const LANDING_VIDEO = '/video/background-video.mp4';
/** Add `public/video/landing-poster.jpg` (first frame, ~120 KB) for instant paint. */
const LANDING_POSTER = '/video/landing-poster.jpg';

const HEADLINE_LINES = ['Safety.', 'Neybor.', 'Huud.'];

export function LandingPage() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoReady, setVideoReady] = useState(false);
    const [posterOk, setPosterOk] = useState(true);

    useEffect(() => {
        document.documentElement.setAttribute('data-landing', 'true');
        return () => document.documentElement.removeAttribute('data-landing');
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let cancelled = false;

        async function redirectIfAuthenticated() {
            if (!apiClient.isAuthenticated()) return;

            const validation = await validateStoredSession();
            if (cancelled) return;

            if (validation === 'valid') {
                router.replace(resolvePostAuthRoute());
            }
        }

        void redirectIfAuthenticated();
        return () => {
            cancelled = true;
        };
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
        <div className="landing-page">
            <div className="landing-page-media" aria-hidden>
                <div className="absolute inset-0 bg-[#060908]" />

                {posterOk ? (
                    <img
                        src={LANDING_POSTER}
                        alt=""
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
                >
                    <source src={LANDING_VIDEO} type="video/mp4" />
                </video>

                <div className="landing-glow-top absolute inset-0" />
                <div className="landing-glow-bottom absolute inset-0" />
                <div className="landing-glow-blue absolute inset-0" />

                <div className="landing-scrim absolute inset-0" />
                <div className="landing-scrim-bottom absolute inset-x-0 bottom-0 h-1/2" />

                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
                    style={{
                        backgroundImage:
                            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
                    }}
                />
            </div>

            <div className="landing-page-shell relative z-10 mx-auto flex h-full min-h-0 w-full max-w-md flex-col">
                <header className="landing-page-header">
                    <div className="landing-page-header-brand-anchor">
                        <LandingHeaderBrand />
                    </div>
                </header>

                <div className="landing-page-body flex min-h-0 flex-1 flex-col px-6 pb-[max(0.65rem,1.125rem)]">
                    <div className="landing-page-copy">
                        <div className="landing-headline-stack">
                            {HEADLINE_LINES.map((line) => (
                                <h1 key={line} className="landing-headline landing-headline--white">
                                    {line}
                                </h1>
                            ))}
                        </div>
                        <p className="landing-subcopy">
                            Know what&apos;s happening on your street. Before everyone else does.
                        </p>
                        <SocialProofBadge />
                    </div>

                    <div className="landing-page-actions mt-auto">
                        <Link
                            href="/signup"
                            className="landing-btn-primary landing-btn landing-btn--brand font-bold transition-transform"
                        >
                            Join {BRAND_NAME}
                        </Link>
                        <Link
                            href="/login"
                            className="landing-btn-secondary landing-btn font-bold transition-transform"
                        >
                            Enter your Huud
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
