'use client';

import React, { useState, useId, type ComponentType } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Fingerprint,
  User,
  MapPin,
  Phone,
  Search,
  BadgeCheck,
  Building,
  KeyRound,
  Shield,
  HelpCircle,
} from 'lucide-react';

export type ValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid' | 'taken' | 'error';

const ICON_MAP: Record<string, ComponentType<{ size?: number; className?: string; strokeWidth?: number }>> = {
  mail: Mail,
  email: Mail,
  lock: Lock,
  password: Lock,
  fingerprint: Fingerprint,
  user: User,
  person: User,
  map_pin: MapPin,
  my_location: MapPin,
  location: MapPin,
  phone: Phone,
  search: Search,
  badge: BadgeCheck,
  building: Building,
  key: KeyRound,
  shield: Shield,
};

interface PremiumInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: string | ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  /** Fixed prefix shown inside the field (e.g. @ for usernames) */
  prefix?: string;
  error?: string;
  success?: boolean;
  /** Validation status for real-time feedback */
  validationStatus?: ValidationStatus;
  /** Helper text shown below input */
  helperText?: string;
  /** Success message shown below input */
  successText?: string;
  /** Override default taken-state copy */
  takenText?: string;
  /** Override default invalid-state copy */
  invalidText?: string;
  /** Override default checking-state copy */
  checkingText?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}

export const PremiumInput: React.FC<PremiumInputProps> = ({
  label,
  icon,
  prefix,
  error,
  success,
  validationStatus = 'idle',
  helperText,
  successText,
  takenText,
  invalidText,
  checkingText,
  inputRef,
  className = '',
  type,
  id,
  value,
  defaultValue,
  onFocus,
  onBlur,
  onChange,
  placeholder,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id ?? (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : generatedId);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(
    !!(value ?? defaultValue ?? props['aria-label']) ? !!(value ?? defaultValue) : false
  );

  const isPasswordField = type === 'password';
  const inputType = isPasswordField && showPassword ? 'text' : type;
  const isFloating = isFocused || hasValue || !!value;

  const getRingClass = () => {
    if (error || validationStatus === 'invalid' || validationStatus === 'taken') {
      return 'border-rose-500 ring-1 ring-rose-500/20';
    }
    if (success || validationStatus === 'valid') {
      return 'border-[#008A20] ring-1 ring-[#008A20]/20';
    }
    if (validationStatus === 'checking') {
      return 'border-[#008A20] ring-1 ring-[#008A20]/20';
    }
    if (isFocused) {
      return 'border-[#008A20] ring-1 ring-[#008A20]/20';
    }
    return 'border-black/[0.08] hover:border-black/[0.15]';
  };

  const getStatusIcon = () => {
    if (isPasswordField) return null;

    if (validationStatus === 'checking') {
      return (
        <div className="ml-2 w-4 h-4 border-2 border-[#00D431]/30 border-t-[#00D431] rounded-full animate-spin shrink-0" />
      );
    }
    if (error || validationStatus === 'invalid' || validationStatus === 'taken') {
      return <AlertCircle size={17} strokeWidth={2} className="ml-2 text-red-500 shrink-0" />;
    }
    if (success || validationStatus === 'valid') {
      return <CheckCircle2 size={17} strokeWidth={2} className="ml-2 text-[#00D431] shrink-0" />;
    }
    return null;
  };

  const getMessage = () => {
    if (error) {
      return { text: error, color: 'text-red-500' };
    }
    if (validationStatus === 'taken') {
      return { text: takenText ?? 'Already taken — try another', color: 'text-red-500' };
    }
    if (validationStatus === 'invalid') {
      return { text: invalidText ?? 'Please check this field', color: 'text-red-500' };
    }
    if (validationStatus === 'checking') {
      return { text: checkingText ?? 'Checking availability…', color: 'text-[#00D431]' };
    }
    if (successText && (success || validationStatus === 'valid')) {
      return { text: successText, color: 'text-[#00D431]' };
    }
    if (helperText) {
      return { text: helperText, color: 'text-[#4B5E52]' };
    }
    return null;
  };

  const message = getMessage();

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setHasValue(e.currentTarget.value.length > 0);
    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(e.currentTarget.value.length > 0);
    onChange?.(e);
  };

  const IconComp = typeof icon === 'string' ? (ICON_MAP[icon] || HelpCircle) : icon;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div
        className={`
          relative flex items-center transition-all duration-200
          rounded-xl px-3.5 border
          bg-white
          ${label ? 'pt-4 pb-2' : 'py-2.5'}
          ${getRingClass()}
          ${className}
        `}
      >
        {IconComp && (
          <span
            className={`mr-2.5 transition-colors shrink-0 ${
              isFocused ? 'text-[#008A20]' : 'text-[#6B7280]'
            }`}
            aria-hidden="true"
          >
            <IconComp size={18} strokeWidth={2} />
          </span>
        )}

        {prefix && (
          <span
            className={`mr-0.5 shrink-0 text-sm font-bold tracking-tight transition-colors ${
              isFocused ? 'text-[#008A20]' : 'text-[#6B7280]'
            }`}
            aria-hidden
          >
            {prefix}
          </span>
        )}

        {/* Floating label */}
        {label && (
          <label
            htmlFor={inputId}
            className={`
              absolute left-0 pointer-events-none select-none
              transition-all duration-200 ease-out
              ${IconComp ? 'ml-[2.75rem]' : prefix ? 'ml-[3rem]' : 'ml-3.5'}
              ${
                isFloating
                  ? 'top-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#9CA3AF]'
                  : 'top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6B7280]'
              }
              ${isFocused && isFloating ? 'text-[#008A20]' : ''}
            `}
          >
            {label}
          </label>
        )}

        <input
          ref={inputRef}
          id={inputId}
          type={inputType}
          value={value}
          defaultValue={defaultValue}
          className="bg-transparent w-full py-0.5 border-none outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 text-xs font-semibold text-[#111827] placeholder:text-[#9CA3AF]"
          placeholder={isFloating ? placeholder : undefined}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />

        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="ml-2 flex items-center justify-center rounded-lg p-1 text-black/40 hover:text-[#00D431] transition-colors focus:outline-none active:scale-95"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={17} strokeWidth={1.8} /> : <Eye size={17} strokeWidth={1.8} />}
          </button>
        )}

        {getStatusIcon()}
      </div>

      {message && (
        <span className={`text-[11px] ml-3 font-semibold ${message.color}`}>
          {message.text}
        </span>
      )}
    </div>
  );
};
