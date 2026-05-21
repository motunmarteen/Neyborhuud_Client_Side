import Image from 'next/image';

type NeyborHuudLogoProps = {
    /** `light` = white wordmark for dark backgrounds; `dark` = wordmark for light backgrounds */
    variant?: 'light' | 'dark';
    className?: string;
    /** Render width in px — height scales with aspect ratio */
    width?: number;
    priority?: boolean;
};

const WORDMARK = {
    light: '/brand/neyborhuud-wordmark-light.png',
    dark: '/brand/neyborhuud-wordmark-dark.png',
} as const;

/** Official lowercase wordmark — always use assets, never camelCase "NeyborHuud" in UI type. */
export function NeyborHuudLogo({
    variant = 'light',
    className = '',
    width = 180,
    priority = false,
}: NeyborHuudLogoProps) {
    const height = Math.round(width * 0.22);

    return (
        <Image
            src={WORDMARK[variant]}
            alt="neyborhuud"
            width={width}
            height={height}
            priority={priority}
            className={`h-auto w-auto object-contain object-left ${className}`}
            style={{ width, maxWidth: '100%' }}
        />
    );
}
