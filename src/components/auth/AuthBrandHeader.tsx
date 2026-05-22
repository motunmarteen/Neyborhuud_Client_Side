'use client';

import { useEffect } from 'react';
import { NeyborHuudLogo } from '@/components/brand/NeyborHuudLogo';

type AuthBrandHeaderProps = {
    subtitle?: string;
    /** Slightly smaller wordmark for verify / success screens */
    compact?: boolean;
    /** Map-backed signup — light wordmark over full-bleed map */
    mode?: 'light' | 'map';
};

/** Wordmark-only auth header — no pin; pairs with clean auth page chrome (no doodles). */
export function AuthBrandHeader({ subtitle, compact = false, mode = 'light' }: AuthBrandHeaderProps) {
    useEffect(() => {
        document.documentElement.setAttribute('data-auth', mode === 'map' ? 'signup-map' : 'true');
        return () => document.documentElement.removeAttribute('data-auth');
    }, [mode]);

    return (
        <header
            className={`auth-brand-header${compact ? ' auth-brand-header--compact' : ''}${mode === 'map' ? ' auth-brand-header--map' : ''}`}
        >
            <NeyborHuudLogo
                layout="wordmark"
                size={compact ? 'md' : 'lg'}
                textSize={compact ? 22 : 28}
                tone={mode === 'map' ? 'light' : 'primary'}
                priority={!compact}
            />
            {subtitle ? <p className="auth-brand-header__subtitle">{subtitle}</p> : null}
        </header>
    );
}
