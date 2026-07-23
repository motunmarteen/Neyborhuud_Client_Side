'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const LANDING_VIDEO = '/video/background-video.mp4';
const LANDING_POSTER = '/video/landing-poster.jpg';

/**
 * Landing-aligned media layer for auth flows (login, post-auth gates, etc.).
 * Reuses the same video, glows, and scrims as `/`.
 */
export function AuthFlowBackdrop({ sheetCollapsed = false }: { sheetCollapsed?: boolean }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoReady, setVideoReady] = useState(false);
    const [posterOk, setPosterOk] = useState(true);

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
                /* Autoplay blocked — poster / gradient base remains visible */
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
        <>
            <div className="absolute inset-0 bg-[#060908]" aria-hidden />

            {posterOk ? (
                <Image
                    src={LANDING_POSTER}
                    alt=""
                    fill
                    priority
                    sizes="100vw"
                    className="landing-video object-cover"
                    onError={() => setPosterOk(false)}
                />
            ) : null}

            <video
                ref={videoRef}
                className={`landing-video absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
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
                className={[
                    'auth-signup-map-scrim auth-signup-map-scrim--preview',
                    sheetCollapsed ? 'auth-signup-map-scrim--sheet-collapsed' : '',
                ]
                    .filter(Boolean)
                    .join(' ')}
                aria-hidden
            />
        </>
    );
}
