import type { ReactNode } from 'react';
import { BRAND_LOGO_WORDMARK, BRAND_NAME } from '@/lib/brand';

type LogoTone = 'light' | 'dark' | 'primary' | 'hero';
type LogoSize = 'hero' | 'lg' | 'md' | 'sm' | 'chrome';
/** `lockup` = lowercase logotype (landing hero only); `name` = official product name everywhere else. */
type LogoPresentation = 'lockup' | 'name';

type NeyborHuudLogoProps = {
    /** All layouts render the text wordmark only (pin mark removed). */
    layout?: 'inline' | 'stacked' | 'mark' | 'wordmark';
    shell?: 'glass' | 'solid' | 'none';
    size?: LogoSize;
    className?: string;
    /** @deprecated Ignored — text-only logo */
    markSize?: number;
    textSize?: number;
    tone?: LogoTone;
    priority?: boolean;
    /** Default `name` (NeyborHuud). Use `lockup` only on `/` hero. */
    presentation?: LogoPresentation;
};

const toneClass: Record<LogoTone, string> = {
    light: 'text-white',
    dark: 'text-brand-black',
    primary: 'text-[#00D431]',
    hero: 'brand-wordmark-hero text-[#00D431]',
};

const nameToneClass: Record<LogoTone, string> = {
    light: 'text-white',
    dark: 'text-brand-black',
    primary: 'text-[#00D431]',
    hero: 'brand-name-hero text-[#00D431]',
};

const TEXT_SIZE_PRESETS: Record<LogoSize, number | null> = {
    hero: 28,
    lg: 22,
    md: 17,
    sm: 15,
    chrome: null,
};

/** Brand text — lockup (lowercase) on landing; official name (NeyborHuud) in app chrome. */
export function NeyborHuudLogo({
    shell = 'none',
    size = 'lg',
    className = '',
    textSize: textSizeProp,
    tone = 'light',
    presentation = 'name',
}: NeyborHuudLogoProps) {
    const typeSize = textSizeProp ?? TEXT_SIZE_PRESETS[size];
    const isLockup = presentation === 'lockup';
    const isChrome = size === 'chrome' && textSizeProp == null;

    const shellClass =
        shell === 'glass'
            ? 'rounded-full border border-white/10 bg-black/35 px-3 py-1.5 backdrop-blur-sm'
            : shell === 'solid'
              ? 'rounded-xl bg-brand-black px-3 py-1.5'
              : '';

    const wordmark = (
        <span
            className={`${isChrome ? 'app-topnav__headline' : 'leading-[0.95]'} ${
                isLockup
                    ? `brand-wordmark ${toneClass[tone]}`
                    : `brand-name ${nameToneClass[tone]}`
            }`.trim()}
            style={
                typeSize != null || isChrome
                    ? {
                          ...(typeSize != null ? { fontSize: typeSize } : {}),
                          ...(isChrome ? { letterSpacing: 'var(--app-topnav-logo-tracking)' } : {}),
                      }
                    : undefined
            }
            aria-label={BRAND_NAME}
        >
            {isLockup ? BRAND_LOGO_WORDMARK : BRAND_NAME}
        </span>
    );

    const wrap = (children: ReactNode, extra = '') => (
        <div className={`inline-flex items-center ${shellClass} ${extra} ${className}`.trim()}>{children}</div>
    );

    return wrap(wordmark);
}
