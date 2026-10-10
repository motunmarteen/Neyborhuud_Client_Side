'use client';

import { forwardRef } from 'react';
import { Loader } from 'lucide-react';

/**
 * Design foundation F-03: pill buttons.
 *
 *   primary   — green, the one main action on a screen
 *   secondary — white with a line border (the "white outline" button)
 *   soft      — green tint, for a second positive action
 *   ghost     — no background, for low-emphasis actions
 *   danger    — safety red, for SOS and destructive actions
 *
 * Heights: sm 40px (tap area still 48px), md 48px, lg 56px.
 * `outline` and `success` are kept as aliases for older call sites.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger' | 'outline' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white shadow-[0_6px_16px_rgba(0,184,46,0.28)] hover:bg-brand-green-dark ' +
    'disabled:bg-primary/40 disabled:shadow-none',
  secondary:
    'bg-white text-navy border border-line shadow-xs hover:bg-[#F6F8FB] hover:border-[#C9CFD8] ' +
    'disabled:text-faint',
  soft:
    'bg-green-soft text-brand-green-dark hover:bg-[#D6F1DE] disabled:text-brand-green-dark/40',
  ghost:
    'bg-transparent text-navy hover:bg-navy/5 disabled:text-faint',
  danger:
    'bg-brand-red text-white shadow-[0_6px_16px_rgba(229,72,77,0.28)] hover:bg-[#D23A40] ' +
    'disabled:bg-brand-red/40 disabled:shadow-none',
  outline: '',
  success: '',
};
VARIANT_CLASSES.outline = VARIANT_CLASSES.secondary;
VARIANT_CLASSES.success = VARIANT_CLASSES.primary;

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-4 text-[13px] gap-1.5 tap-target',
  md: 'min-h-12 px-5 text-[15px] gap-2',
  lg: 'min-h-14 px-6 text-base gap-2',
};

const BASE =
  'relative inline-flex items-center justify-center rounded-full font-bold leading-none select-none ' +
  'transition-[background-color,border-color,box-shadow,transform] duration-150 ' +
  'motion-safe:active:scale-[0.97] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white ' +
  'disabled:cursor-not-allowed disabled:pointer-events-none';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className = '',
      type = 'button',
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading}
        className={[
          BASE,
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          fullWidth ? 'w-full' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {loading ? (
          <Loader className="h-4 w-4 animate-spin shrink-0" aria-hidden />
        ) : leftIcon ? (
          <span className="shrink-0" aria-hidden>{leftIcon}</span>
        ) : null}
        {children}
        {!loading && rightIcon ? (
          <span className="shrink-0" aria-hidden>{rightIcon}</span>
        ) : null}
      </button>
    );
  },
);

Button.displayName = 'Button';
