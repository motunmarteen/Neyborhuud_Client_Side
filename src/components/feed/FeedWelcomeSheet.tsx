'use client';

import { useEffect, useMemo, useState } from 'react';
import { AuthOverlaySheet } from '@/components/auth/AuthOverlaySheet';
import { getStoredCommunity } from '@/lib/communityContext';
import { hasCompletedProductTour, markProductTourComplete } from '@/lib/onboarding';

const FEED_TIPS = [
    {
        id: 'sos',
        icon: 'warning',
        label: 'SOS',
        description: 'Tap the red button anytime — guardians get your location instantly.',
        iconClass: 'bg-brand-red text-white',
    },
    {
        id: 'feed',
        icon: 'newspaper',
        label: 'Your feed',
        description: 'Posts, FYI alerts, jobs, and events from your street — live.',
        iconClass: 'bg-primary text-white',
    },
    {
        id: 'coins',
        icon: 'toll',
        label: 'HuudCoins',
        description: 'Check in daily and participate to earn — already started from signup.',
        iconClass: 'bg-status-warning text-[#0a1a0f]',
    },
] as const;

type StoredUser = {
    username?: string;
};

function WelcomePeek({ huudName, handle }: { huudName: string; handle: string }) {
    return (
        <div className="auth-signup-location-peek">
            <span className="auth-signup-location-peek__icon" aria-hidden>
                <span className="material-symbols-outlined"  aria-hidden="true">auto_awesome</span>
            </span>
            <div className="min-w-0 flex-1 text-left">
                <p className="auth-signup-location-peek__label">Welcome to the Huud</p>
                <p className="auth-signup-location-peek__name truncate">{huudName}</p>
                <p className="mt-0.5 truncate text-[10px] font-semibold text-[var(--neu-text-muted)]">
                    {handle} · Drag up for tips
                </p>
            </div>
            <span className="auth-signup-location-peek__chevron" aria-hidden>
                <span className="material-symbols-outlined"  aria-hidden="true">expand_less</span>
            </span>
        </div>
    );
}

export function FeedWelcomeSheet() {
    const [open, setOpen] = useState(false);

    const user = useMemo(() => {
        if (typeof window === 'undefined') return null;
        try {
            const raw = localStorage.getItem('neyborhuud_user');
            return raw ? (JSON.parse(raw) as StoredUser) : null;
        } catch {
            return null;
        }
    }, []);

    const community = useMemo(() => getStoredCommunity(), []);
    const huudName = community?.name || community?.communityName || 'your Huud';
    const handle = user?.username ? `@${user.username}` : 'Neybor';

    useEffect(() => {
        if (hasCompletedProductTour()) return;
        const timer = window.setTimeout(() => setOpen(true), 700);
        return () => window.clearTimeout(timer);
    }, []);

    const dismiss = () => {
        markProductTourComplete();
        setOpen(false);
    };

    return (
        <AuthOverlaySheet
            open={open}
            ariaLabel="Welcome to your Huud"
            stageKey="feed-welcome"
            onDismiss={dismiss}
            peek={<WelcomePeek huudName={huudName} handle={handle} />}
            footer={
                <div className="auth-signup-actions pb-[max(0.25rem,env(safe-area-inset-bottom))]">
                    <button type="button" onClick={dismiss} className="auth-btn auth-btn-primary">
                        <span>Explore my Huud</span>
                        <span className="material-symbols-outlined shrink-0" aria-hidden="true">arrow_forward</span>
                    </button>
                </div>
            }
        >
            <div className="auth-flow-hero-card mb-4">
                <span className="auth-flow-hero-card__icon" aria-hidden>
                    <span className="material-symbols-outlined"  aria-hidden="true">auto_awesome</span>
                </span>
                <div className="min-w-0 flex-1">
                    <p className="auth-flow-hero-card__eyebrow">Welcome to the Huud</p>
                    <p className="auth-flow-hero-card__title truncate">{huudName}</p>
                    <p className="auth-flow-hero-card__meta truncate">{handle} · You made it</p>
                </div>
            </div>

            <p className="auth-signup-sheet-subcopy mb-3 text-center text-[11px] font-medium leading-relaxed text-[var(--neu-text-muted)]">
                Your street feed is live behind this sheet. Drag down to peek at it — or explore when
                you are ready.
            </p>

            <ul className="mb-2 grid gap-2">
                {FEED_TIPS.map((tip) => (
                    <li
                        key={tip.id}
                        className="flex items-start gap-3 rounded-2xl border border-charcoal/8 bg-[var(--neu-bg)] px-3.5 py-3 shadow-[0_4px_16px_rgba(26,26,46,0.06)]"
                    >
                        <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tip.iconClass}`}
                            aria-hidden
                        >
                            <i className={`bi ${tip.icon} text-sm`} />
                        </span>
                        <div className="min-w-0 text-left">
                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--neu-text)]">
                                {tip.label}
                            </p>
                            <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-[var(--neu-text-muted)]">
                                {tip.description}
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
        </AuthOverlaySheet>
    );
}
