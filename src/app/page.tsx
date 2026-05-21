'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { NeyborHuudLogo } from '@/components/brand/NeyborHuudLogo';

/** Poster v1 — swap for `<video>` background in a later pass (Bamboo-style). */
const LANDING_POSTER = '/onboarding/hero-your-huud.png';

const HEADLINE_LINES = ['Your Huud.', 'Your People.', 'Your Safety.'];

export default function LandingPage() {
    const router = useRouter();

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (apiClient.isAuthenticated()) {
            router.replace('/feed');
        }
    }, [router]);

    return (
        <div className="relative min-h-[100dvh] overflow-hidden bg-brand-black">
            <Image
                src={LANDING_POSTER}
                alt=""
                fill
                priority
                className="object-cover object-center"
                sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/50 to-black/75" aria-hidden />

            <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-6 pb-10 pt-12">
                <header className="flex flex-col items-center pt-2">
                    <NeyborHuudLogo variant="light" width={200} priority />
                </header>

                <div className="flex-1" />

                <div className="mb-10 flex flex-col gap-1">
                    {HEADLINE_LINES.map((line) => (
                        <h1
                            key={line}
                            className="text-[2.65rem] font-black leading-[0.95] tracking-tight text-primary"
                        >
                            {line}
                        </h1>
                    ))}
                </div>

                <div className="flex gap-3">
                    <Link
                        href="/signup"
                        className="btn-glass-primary flex h-[52px] flex-1 items-center justify-center rounded-2xl text-sm font-bold !normal-case !tracking-normal"
                    >
                        Create account
                    </Link>
                    <Link
                        href="/login"
                        className="flex h-[52px] flex-1 items-center justify-center rounded-2xl border border-white/15 bg-primary/90 text-sm font-bold text-white shadow-[0_12px_32px_rgba(0,111,53,0.35)] transition-transform active:scale-[0.98]"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
