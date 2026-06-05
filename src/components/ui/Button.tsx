'use client';

import { forwardRef } from 'react';
import { Loader } from 'lucide-react';

export type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'outline' | 'success';
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
  primary: [
    'bg-brand-blue text-white',
    'hover:bg-brand-blue/90 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(26,86,255,0.35)]',
    'active:translate-y-0 active:shadow-none',
    'focus-visible:ring-brand-blue focus-visible:ring-offset-brand-black',
    'disabled:bg-brand-blue/40 disabled:text-white/50',
  ].join(' '),

  ghost: [
    'bg-white/8 text-white border border-white/10',
    'hover:bg-white/12 hover:border-white/20',
    'active:bg-white/6',
    'focus-visible:ring-white/40 focus-visible:ring-offset-brand-black',
    'disabled:bg-white/4 disabled:text-white/30 disabled:border-white/5',
  ].join(' '),

  outline: [
    'bg-transparent text-brand-blue border border-brand-blue/50',
    'hover:bg-brand-blue/8 hover:border-brand-blue hover:-translate-y-px',
    'active:translate-y-0',
    'focus-visible:ring-brand-blue focus-visible:ring-offset-brand-black',
    'disabled:opacity-40',
  ].join(' '),

  danger: [
    'bg-status-danger text-white',
    'hover:bg-status-danger/85 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(232,39,26,0.35)]',
    'active:translate-y-0 active:shadow-none',
    'focus-visible:ring-status-danger focus-visible:ring-offset-brand-black',
    'disabled:bg-status-danger/40 disabled:text-white/50',
  ].join(' '),

  success: [
    'bg-status-success text-brand-black font-bold',
    'hover:bg-status-success/85 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,212,49,0.30)]',
    'active:translate-y-0 active:shadow-none',
    'focus-visible:ring-status-success focus-visible:ring-offset-brand-black',
    'disabled:bg-status-success/40 disabled:text-brand-black/50',
  ].join(' '),
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-2 text-xs rounded-xl gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3.5 text-sm rounded-2xl gap-2',
};

const BASE =
  'inline-flex items-center justify-center font-semibold transition-all duration-150 select-none ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
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
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type="button"
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
