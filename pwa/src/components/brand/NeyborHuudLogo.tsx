import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
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

/** Animated reverse-typing logo component. Deletes letters from 'd' to 'N', shows real logo image for 5s, then types forward back to 'NeyborHuud'. Cycles every 5 minutes when scrolled to top. */
export function AnimatedNeyborHuudLogo({
    tone = 'primary',
}: {
    tone?: LogoTone;
}) {
    const fullText = "NeyborHuud";
    const [displayText, setDisplayText] = useState(fullText);
    const [phase, setPhase] = useState<'showing_text' | 'deleting' | 'showing_logo' | 'typing' | 'waiting'>('showing_text');

    useEffect(() => {
        let timer: NodeJS.Timeout;
        let scrollListeners: Array<{ target: EventTarget; handler: EventListener }> = [];

        const cleanupScroll = () => {
            scrollListeners.forEach(({ target, handler }) => {
                target.removeEventListener('scroll', handler);
            });
            scrollListeners = [];
        };

        if (phase === 'showing_text') {
            // Keep full text for 3 seconds
            timer = setTimeout(() => {
                setPhase('deleting');
            }, 3000);
        } else if (phase === 'deleting') {
            if (displayText.length > 1) {
                timer = setTimeout(() => {
                    setDisplayText((prev) => prev.slice(0, -1));
                }, 90);
            } else {
                // Pause briefly on "N" before showing the logo
                timer = setTimeout(() => {
                    setPhase('showing_logo');
                }, 400);
            }
        } else if (phase === 'showing_logo') {
            // Show the real logo image for 5 seconds
            timer = setTimeout(() => {
                setDisplayText('N');
                setPhase('typing');
            }, 5000);
        } else if (phase === 'typing') {
            if (displayText.length < fullText.length) {
                timer = setTimeout(() => {
                    setDisplayText((prev) => fullText.substring(0, prev.length + 1));
                }, 100);
            } else {
                // Done typing forward, go to waiting state
                setPhase('waiting');
            }
        } else if (phase === 'waiting') {
            // 5 minute cooldown before triggering the next animation loop (300,000 ms)
            const COOLDOWN = 5 * 60 * 1000;

            timer = setTimeout(() => {
                const scrollContainer = document.querySelector('[data-app-scroll-root]');
                const isAtTop = (window.scrollY === 0) && (!scrollContainer || scrollContainer.scrollTop === 0);

                if (isAtTop) {
                    setPhase('showing_text');
                } else {
                    // Wait until the user scrolls back to the top to trigger the animation loop
                    const handleScroll = () => {
                        const currentContainer = document.querySelector('[data-app-scroll-root]');
                        const nowAtTop = (window.scrollY === 0) && (!currentContainer || currentContainer.scrollTop === 0);
                        if (nowAtTop) {
                            cleanupScroll();
                            setPhase('showing_text');
                        }
                    };

                    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
                    scrollListeners.push({ target: window, handler: handleScroll as EventListener });

                    if (scrollContainer) {
                        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
                        scrollListeners.push({ target: scrollContainer, handler: handleScroll as EventListener });
                    }
                }
            }, COOLDOWN);
        }

        return () => {
            clearTimeout(timer);
            cleanupScroll();
        };
    }, [phase, displayText]);

    const textColor =
        tone === 'light'
            ? 'text-white'
            : tone === 'dark'
              ? 'text-brand-black'
              : 'text-[#00D431]';

    const isLight = tone === 'light';

    if (phase === 'showing_logo') {
        return (
            <div className="flex items-center animate-in fade-in zoom-in-75 duration-500 cursor-pointer select-none">
                <img
                    src={isLight ? "/brand/neyborhuud-mark-light.png" : "/brand/new-logo.png"}
                    alt="NeyborHuud"
                    className="h-[28px] w-auto"
                    style={{ maxHeight: '28px' }}
                />
            </div>
        );
    }

    return (
        <span
            className="leading-[0.95] font-black text-[17px] tracking-[var(--app-topnav-logo-tracking,-0.03em)] font-display"
            style={{ fontSize: '17px' }}
        >
            <span className={textColor}>
                {displayText}
            </span>
        </span>
    );
}
