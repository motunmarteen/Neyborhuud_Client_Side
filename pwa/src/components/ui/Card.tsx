import type { HTMLAttributes, ReactNode } from 'react';

/**
 * Design foundation F-04: cards.
 *
 *   plain    — white, 22px corners, soft shadow (lists, feed items, panels)
 *   accent   — plain + a 4px coloured top edge (e.g. Sentinel, events, HuudCredit)
 *   floating — stronger shadow for cards that sit on the map or over other content
 *
 * Make a card pressable by putting it inside a <button> or <Link>, or pass `pressable`
 * to get the press feedback when the card itself handles clicks.
 */

export type CardVariant = 'plain' | 'accent' | 'floating';
export type CardPadding = 'none' | 'sm' | 'md';

const PADDING: Record<CardPadding, string> = { none: '', sm: 'p-3', md: 'p-4' };

const VARIANT: Record<CardVariant, string> = {
  plain: 'shadow-[0_2px_10px_rgba(29,36,51,0.06)]',
  accent: 'shadow-[0_2px_10px_rgba(29,36,51,0.06)] border-t-4',
  floating: 'shadow-[0_14px_34px_rgba(29,36,51,0.25)]',
};

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  padding?: CardPadding;
  /** Top edge colour for the accent variant (any CSS colour). */
  accentColor?: string;
  pressable?: boolean;
  children: ReactNode;
};

export function Card({
  variant = 'plain',
  padding = 'md',
  accentColor = '#00B82E',
  pressable = false,
  className = '',
  style,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={[
        'rounded-[22px] bg-white text-navy',
        VARIANT[variant],
        PADDING[padding],
        pressable ? 'cursor-pointer transition-transform duration-150 motion-safe:active:scale-[0.98]' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={variant === 'accent' ? { borderTopColor: accentColor, ...style } : style}
      {...rest}
    >
      {children}
    </div>
  );
}
