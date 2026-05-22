import Image from 'next/image';
import type { ReactNode } from 'react';
import { BRAND_MARK_SRC } from '@/lib/brand-assets';

const MARK = BRAND_MARK_SRC;
const MARK_ASPECT = 409 / 503;

type LogoTone = 'light' | 'dark' | 'primary' | 'hero';
type LogoSize = 'hero' | 'lg' | 'md' | 'sm';

type NeyborHuudLogoProps = {
    layout?: 'inline' | 'stacked' | 'mark' | 'wordmark';
    shell?: 'glass' | 'solid' | 'none';
    /** Tuned lockups — hero for landing header */
    size?: LogoSize;
    className?: string;
    markSize?: number;
    textSize?: number;
    tone?: LogoTone;
    priority?: boolean;
};

const toneClass: Record<LogoTone, string> = {
    light: 'text-white',
    dark: 'text-brand-black',
    primary: 'text-[#00D431]',
    hero: 'brand-wordmark-hero text-[#00D431]',
};

const markClass: Record<LogoTone, string> = {
    light: 'drop-shadow-[0_6px_28px_rgba(0,0,0,0.65)] brightness-110 contrast-105',
    dark: 'drop-shadow-[0_4px_16px_rgba(26,26,46,0.2)]',
    primary: 'drop-shadow-[0_4px_16px_rgba(0,111,53,0.35)]',
    hero: 'brand-mark-hero',
};

/** Pin at ~2× original hero size; text scaled to match. */
const SIZE_PRESETS: Record<LogoSize, { markSize: number; textSize: number }> = {
    hero: { markSize: 116, textSize: 28 },
    lg: { markSize: 56, textSize: 22 },
    md: { markSize: 44, textSize: 17 },
    sm: { markSize: 36, textSize: 15 },
};

/** home-pi pin + Plus Jakarta Sans `neyborhuud` (always lowercase). */
export function NeyborHuudLogo({
    layout = 'inline',
    shell = 'none',
    size = 'lg',
    className = '',
    markSize: markSizeProp,
    textSize: textSizeProp,
    tone = 'light',
    priority = false,
}: NeyborHuudLogoProps) {
    const preset = SIZE_PRESETS[size];
    const markSize = markSizeProp ?? preset.markSize;
    const typeSize = textSizeProp ?? preset.textSize;
    const markWidth = Math.round(markSize * MARK_ASPECT);

    const shellClass =
        shell === 'glass'
            ? 'rounded-full border border-white/10 bg-black/35 px-3 py-1.5 backdrop-blur-sm'
            : shell === 'solid'
              ? 'rounded-xl bg-brand-black px-3 py-1.5'
              : '';

    const mark = (
        <Image
            src={MARK}
            alt=""
            width={markWidth}
            height={markSize}
            priority={priority}
            aria-hidden
            className={`block shrink-0 object-contain ${markClass[tone]}`}
            style={{ height: markSize, width: 'auto', minHeight: markSize, maxWidth: 'none' }}
        />
    );

    const wordmark = (
        <span
            className={`brand-wordmark leading-[0.95] ${toneClass[tone]}`}
            style={{ fontSize: typeSize }}
            aria-label="neyborhuud"
        >
            neyborhuud
        </span>
    );

    const wrap = (children: ReactNode, extra = '') => (
        <div className={`inline-flex ${shellClass} ${extra} ${className}`.trim()}>{children}</div>
    );

    if (layout === 'mark') {
        return wrap(mark, 'items-center');
    }

    if (layout === 'wordmark') {
        return wrap(wordmark, 'items-center');
    }

    if (layout === 'stacked') {
        return wrap(
            <>
                <span className="inline-flex shrink-0 items-center">{mark}</span>
                {wordmark}
            </>,
            'flex-col items-center gap-1.5',
        );
    }

    /* Pin cap aligns with text cap-height; extra pin point hangs below baseline */
    return wrap(
        <>
            <span className="inline-flex shrink-0 items-end pb-[0.06em]">{mark}</span>
            <span className="inline-flex items-center pb-[0.12em]">{wordmark}</span>
        </>,
        'items-end gap-2 sm:gap-2.5',
    );
}
