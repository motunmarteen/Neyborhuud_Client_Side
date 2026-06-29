'use client';

import React, { useState, useId } from 'react';
import type { ValidationStatus } from './PremiumInput';

interface PremiumTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    icon?: string;
    error?: string;
    success?: boolean;
    validationStatus?: ValidationStatus;
    helperText?: string;
    successText?: string;
    textareaRef?: React.Ref<HTMLTextAreaElement>;
    /** Number of visible rows (default 3) */
    rows?: number;
}

export const PremiumTextArea: React.FC<PremiumTextAreaProps> = ({
    label,
    icon,
    error,
    success,
    validationStatus = 'idle',
    helperText,
    successText,
    textareaRef,
    className = '',
    id,
    value,
    defaultValue,
    onFocus,
    onBlur,
    onChange,
    placeholder,
    rows = 3,
    ...props
}) => {
    const generatedId = useId();
    const inputId = id ?? (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : generatedId);
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!(value ?? defaultValue));

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
        if (validationStatus === 'checking') {
            return (
                <div className="mt-1 w-4 h-4 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin shrink-0" />
            );
        }
        if (error || validationStatus === 'invalid' || validationStatus === 'taken') {
            return (
                <span className="material-symbols-outlined text-brand-red text-[1.125rem] mt-0.5 shrink-0" aria-hidden="true">
                    error
                </span>
            );
        }
        if (success || validationStatus === 'valid') {
            return (
                <span className="material-symbols-outlined text-primary text-[1.125rem] mt-0.5 shrink-0" aria-hidden="true">
                    check_circle
                </span>
            );
        }
        return null;
    };

    const getMessage = () => {
        if (error) return { text: error, color: 'text-brand-red' };
        if (validationStatus === 'taken') return { text: 'Already taken — try another', color: 'text-brand-red' };
        if (validationStatus === 'invalid') return { text: 'Please check this field', color: 'text-brand-red' };
        if (validationStatus === 'checking') return { text: 'Checking…', color: 'text-brand-blue' };
        if (successText && (success || validationStatus === 'valid')) return { text: successText, color: 'text-primary' };
        if (helperText) return { text: helperText, color: 'text-charcoal/40' };
        return null;
    };

    const message = getMessage();

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        setIsFocused(false);
        setHasValue(e.currentTarget.value.length > 0);
        onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setHasValue(e.currentTarget.value.length > 0);
        onChange?.(e);
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            <div className={`
                relative flex items-start gap-3 transition-all duration-300
                neu-input rounded-2xl px-4
                ${label ? 'pt-6 pb-3' : 'py-3'}
                ${getRingClass()}
                ${className}
            `}>
                {icon && (
                    <span
                        className={`material-symbols-outlined text-[1.125rem] mt-0.5 transition-colors ${isFocused ? 'text-brand-blue' : 'neu-text-muted'}`}
                        aria-hidden="true"
                    >
                        {icon}
                    </span>
                )}

                {/* Floating label */}
                {label && (
                    <label
                        htmlFor={inputId}
                        className={`
                            absolute left-0 pointer-events-none select-none
                            transition-all duration-200 ease-out
                            ${icon ? 'ml-[2.875rem]' : 'ml-4'}
                            ${isFloating
                                ? 'top-[0.45rem] text-[0.625rem] font-bold uppercase tracking-widest neu-text-muted'
                                : 'top-[0.875rem] text-sm font-light neu-text-muted opacity-60'
                            }
                            ${isFocused && isFloating ? 'text-brand-blue' : ''}
                        `}
                    >
                        {label}
                    </label>
                )}

                <textarea
                    ref={textareaRef}
                    id={inputId}
                    value={value}
                    defaultValue={defaultValue}
                    rows={rows}
                    className="bg-transparent w-full focus:outline-none font-light resize-none leading-relaxed"
                    placeholder={isFloating ? placeholder : undefined}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    {...props}
                />

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
