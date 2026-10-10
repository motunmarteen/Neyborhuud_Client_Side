import type { ReactNode } from 'react';
import { BRAND_NAME } from '@/lib/brand';

export type LogoTone = 'light' | 'dark' | 'primary' | 'hero';
export type LogoSize = 'hero' | 'lg' | 'md' | 'sm' | 'chrome';
export type LogoPresentation = 'lockup' | 'name';

export type NeyborHuudLogoProps = {
    /** All layouts render the text wordmark only. */
    layout?: 'inline' | 'stacked' | 'mark' | 'wordmark';
    shell?: 'glass' | 'solid' | 'none';
    size?: LogoSize;
    className?: string;
    /** @deprecated Ignored — text-only logo */
    markSize?: number;
    textSize?: number;
    tone?: LogoTone;
    priority?: boolean;
    presentation?: LogoPresentation;
    /** Optional dot accent after wordmark */
    showAccentDot?: boolean;
};

const TEXT_SIZE_PRESETS: Record<LogoSize, number | null> = {
    hero: 28,
    lg: 22,
    md: 18,
    sm: 15,
    chrome: null,
};

/**
 * World-class typography styling inspired by top social networks (Instagram, LinkedIn, Facebook):
 * - Confident geometric sans with tailored negative tracking (-0.035em)
 * - Distinctive two-tone identity: "Neybor" (obsidian slate / clean contrast) + "Huud" (signature electric green)
 * - Rock-solid, non-animating presentation with zero jitter or layout shift
 */
export function NeyborHuudLogo({
    shell = 'none',
    size = 'lg',
    className = '',
    textSize: textSizeProp,
    tone = 'primary',
    presentation = 'name',
    showAccentDot = false,
}: NeyborHuudLogoProps) {
    const typeSize = textSizeProp ?? TEXT_SIZE_PRESETS[size];
    const isChrome = size === 'chrome' && textSizeProp == null;

    const shellClass =
        shell === 'glass'
            ? 'rounded-full border border-white/10 bg-black/35 px-3 py-1.5 backdrop-blur-sm'
            : shell === 'solid'
              ? 'rounded-xl bg-brand-black px-3 py-1.5'
              : '';

    // Tone mappings for the two parts
    const neyborColor =
        tone === 'light'
            ? 'text-white'
            : tone === 'dark'
              ? 'text-slate-900'
              : tone === 'hero'
                ? 'text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]'
                : 'text-slate-900 ';

    const huudColor =
        tone === 'light'
            ? 'text-[#00E536]'
            : tone === 'dark'
              ? 'text-[#00B528]'
              : tone === 'hero'
                ? 'text-[#00E536] drop-shadow-[0_0_24px_rgba(0,229,54,0.6)]'
                : 'text-[#00B82E] ';

    const isLockup = presentation === 'lockup';
    const firstPart = isLockup ? 'neybor' : 'Neybor';
    const secondPart = isLockup ? 'huud' : 'Huud';

    const wordmark = (
        <span
            className={`inline-flex items-baseline select-none font-display font-extrabold tracking-[-0.035em] transition-opacity duration-150 ${
                isChrome ? 'app-topnav__headline' : 'leading-[0.95]'
            }`.trim()}
            style={{
                fontFamily: "var(--font-head)",
                ...(typeSize != null ? { fontSize: `${typeSize}px` } : {}),
                letterSpacing: '-0.01em',
            }}
            aria-label={BRAND_NAME}
        >
            <span className={neyborColor}>
                {firstPart}
            </span>
            <span className={`${huudColor} font-black ml-[0.5px]`}>
                {secondPart}
            </span>
            {showAccentDot && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#00B82E] ml-1 self-center inline-block" />
            )}
        </span>
    );

    const wrap = (children: ReactNode, extra = '') => (
        <div className={`inline-flex items-center ${shellClass} ${extra} ${className}`.trim()}>{children}</div>
    );

    return wrap(wordmark);
}

/**
 * Stable, high-clarity NeyborHuud text logo for app navigation and headers.
 * Replaced the cycling animation with a steady, iconic text presentation.
 */
export function AnimatedNeyborHuudLogo({
    tone = 'primary',
    size = 'md',
    showAccentDot = false,
}: {
    tone?: LogoTone;
    size?: LogoSize;
    showAccentDot?: boolean;
}) {
    return (
        <NeyborHuudLogo
            tone={tone}
            size={size}
            textSize={18}
            presentation="name"
            showAccentDot={showAccentDot}
        />
    );
}

