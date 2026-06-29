'use client';

import React, { useState, useId } from 'react';

export type ValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid' | 'taken' | 'error';

interface PremiumInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: string;
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
        !!(value ?? defaultValue ?? props['aria-label'])
            ? !!(value ?? defaultValue)
            : false
    );

    const isPasswordField = type === 'password';
    const inputType = isPasswordField && showPassword ? 'text' : type;

    // Label floats when focused or has content
    const isFloating = isFocused || hasValue || !!(value);

    const getRingClass = () => {
        if (error || validationStatus === 'invalid' || validationStatus === 'taken') {
            return 'ring-1 ring-brand-red/30';
        }
        if (success || validationStatus === 'valid') {
            return 'ring-1 ring-primary/30';
        }
        if (validationStatus === 'checking') {
            return 'ring-1 ring-brand-blue/30';
        }
        if (isFocused) {
            return 'ring-1 ring-brand-blue/20';
        }
        return '';
    };

    const getStatusIcon = () => {
        if (isPasswordField) return null;

        if (validationStatus === 'checking') {
            return (
                <div className="ml-2 w-4 h-4 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
            );
        }
        if (error || validationStatus === 'invalid' || validationStatus === 'taken') {
            return (
                <span className="material-symbols-outlined ml-2 text-brand-red text-[1.125rem]" aria-hidden="true">
                    error
                </span>
            );
        }
        if (success || validationStatus === 'valid') {
            return (
                <span className="material-symbols-outlined ml-2 text-primary text-[1.125rem]" aria-hidden="true">
                    check_circle
                </span>
            );
        }
        return null;
    };

    const getMessage = () => {
        if (error) {
            return { text: error, color: 'text-brand-red' };
        }
        if (validationStatus === 'taken') {
            return {
                text: takenText ?? 'Already taken — try another',
                color: 'text-brand-red',
            };
        }
        if (validationStatus === 'invalid') {
            return {
                text: invalidText ?? 'Please check this field',
                color: 'text-brand-red',
            };
        }
        if (validationStatus === 'checking') {
            return {
                text: checkingText ?? 'Checking availability…',
                color: 'text-brand-blue',
            };
        }
        if (successText && (success || validationStatus === 'valid')) {
            return { text: successText, color: 'text-primary' };
        }
        if (helperText) {
            return { text: helperText, color: 'text-charcoal/40' };
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

    return (
        <div className="flex flex-col gap-2 w-full">
            <div className={`
                relative flex items-center transition-all duration-300
                neu-input rounded-2xl px-4
                ${label ? 'pt-5 pb-2' : 'py-1'}
                ${getRingClass()}
                ${className}
            `}>
                {icon && (
                    <span
                        className={`material-symbols-outlined text-[1.125rem] mr-3 transition-colors ${isFocused ? 'text-brand-blue' : 'neu-text-muted'}`}
                        aria-hidden="true"
                    >
                        {icon}
                    </span>
                )}
                {prefix ? (
                    <span
                        className={`mr-0.5 shrink-0 text-lg font-bold tracking-tight transition-colors ${isFocused ? 'text-primary' : 'neu-text-muted'}`}
                        aria-hidden
                    >
                        {prefix}
                    </span>
                ) : null}

                {/* Floating label — positioned inside the field */}
                {label && (
                    <label
                        htmlFor={inputId}
                        className={`
                            absolute left-0 pointer-events-none select-none
                            transition-all duration-200 ease-out
                            ${icon ? 'ml-[2.875rem]' : prefix ? 'ml-[3.25rem]' : 'ml-4'}
                            ${isFloating
                                ? 'top-[0.45rem] text-[0.625rem] font-bold uppercase tracking-widest neu-text-muted'
                                : 'top-1/2 -translate-y-1/2 text-sm font-light neu-text-muted opacity-60'
                            }
                            ${isFocused && isFloating ? 'text-brand-blue' : ''}
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
                    className="bg-transparent w-full py-1 focus:outline-none font-light"
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
                        className="ml-2 flex items-center justify-center rounded-md p-0.5 neu-text-muted hover:text-brand-blue transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        <span className="material-symbols-outlined text-[1.125rem]" aria-hidden="true">
                            {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                    </button>
                )}
                {getStatusIcon()}
            </div>
            {message && (
                <span className={`text-[10px] ml-4 font-bold uppercase tracking-tighter ${message.color}`}>
                    {message.text}
                </span>
            )}
        </div>
    );
};
