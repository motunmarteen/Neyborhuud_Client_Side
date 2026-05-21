import Image from 'next/image';

type NeyborHuudLogoProps = {
    /**
     * `on-dark` — mark + wordmark over photo/dark UI (black in assets blends away).
     * `on-light` — compact lockup on neu/light screens (dark brand chip).
     */
    variant?: 'on-dark' | 'on-light';
    /** Stacked mark over wordmark (Bamboo-style), or mark / wordmark only */
    layout?: 'stacked' | 'mark' | 'wordmark';
    className?: string;
    markSize?: number;
    wordmarkWidth?: number;
    priority?: boolean;
};

const MARK = '/brand/neyborhuud-mark-light.png';
const WORDMARK = '/brand/neyborhuud-wordmark-light.png';

/**
 * Official neyborhuud brand lockup — mark (pin + H) + lowercase wordmark asset.
 * Never render camelCase "NeyborHuud" as UI type.
 */
export function NeyborHuudLogo({
    variant = 'on-dark',
    layout = 'stacked',
    className = '',
    markSize = 56,
    wordmarkWidth = 168,
    priority = false,
}: NeyborHuudLogoProps) {
    const wordmarkHeight = Math.round(wordmarkWidth * 0.2);
    const onDark = variant === 'on-dark';
    const blend = onDark ? 'mix-blend-screen' : '';

    const mark = (
        <Image
            src={MARK}
            alt=""
            width={markSize}
            height={markSize}
            priority={priority}
            aria-hidden
            className={`h-auto object-contain ${blend}`}
            style={{ width: markSize, height: markSize }}
        />
    );

    const wordmark = (
        <Image
            src={WORDMARK}
            alt="neyborhuud"
            width={wordmarkWidth}
            height={wordmarkHeight}
            priority={priority}
            className={`h-auto object-contain ${blend}`}
            style={{ width: wordmarkWidth, maxWidth: '100%' }}
        />
    );

    if (layout === 'mark') {
        return (
            <div className={`inline-flex ${onDark ? '' : 'rounded-2xl bg-brand-black px-3 py-2'} ${className}`}>
                {mark}
            </div>
        );
    }

    if (layout === 'wordmark') {
        return (
            <div className={`inline-flex ${onDark ? '' : 'rounded-2xl bg-brand-black px-4 py-2'} ${className}`}>
                {wordmark}
            </div>
        );
    }

    return (
        <div
            className={`inline-flex flex-col items-center gap-2 ${
                onDark ? '' : 'rounded-[1.25rem] bg-brand-black px-5 py-3 shadow-[0_12px_32px_rgba(26,26,46,0.12)]'
            } ${className}`}
        >
            {mark}
            {wordmark}
        </div>
    );
}
