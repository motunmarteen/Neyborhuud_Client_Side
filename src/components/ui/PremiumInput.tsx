'use client';

import React, { useState } from 'react';

export type ValidationStatus = 'idle' | 'checking' | 'valid' | 'invalid' | 'taken' | 'error';

interface PremiumInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: string;
    error?: string;
    success?: boolean;
    /** Validation status for real-time feedback */
    validationStatus?: ValidationStatus;
    /** Helper text shown below input */
    helperText?: string;
    /** Success message shown below input */
    successText?: string;
}

export const PremiumInput: React.FC<PremiumInputProps> = ({
    label,
    icon,
    error,
    success,
    validationStatus = 'idle',
    helperText,
    successText,
    className = '',
    type,
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordField = type === 'password';
    const inputType = isPasswordField && showPassword ? 'text' : type;

    // Determine ring color based on validation status
    const getRingClass = () => {
        if (error || validationStatus === 'invalid' || validationStatus === 'taken') {
            return 'ring-1 ring-brand-red/30';
        }
        if (success || validationStatus === 'valid') {
            return 'ring-1 ring-neon-green/30';
        }
        if (validationStatus === 'checking') {
            return 'ring-1 ring-brand-blue/30';
        }
        return '';
    };

    // Get status icon based on validation
    const getStatusIcon = () => {
        if (isPasswordField) return null; // Password field has its own toggle
        
        if (validationStatus === 'checking') {
            return (
                <div className="ml-2 w-4 h-4 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin" />
            );
        }
        if (error || validationStatus === 'invalid' || validationStatus === 'taken') {
            return <i className="bi bi-exclamation-circle text-brand-red ml-2" title={error}></i>;
        }
        if (success || validationStatus === 'valid') {
            return <i className="bi bi-check-circle text-neon-green ml-2"></i>;
        }
        return null;
    };

    // Get message to display below input
    const getMessage = () => {
        if (error) {
            return { text: error, color: 'text-brand-red' };
        }
        if (validationStatus === 'taken') {
            return { text: 'This email is already registered', color: 'text-brand-red' };
        }
        if (validationStatus === 'invalid') {
            return { text: 'Please enter a valid email address', color: 'text-brand-red' };
        }
        if (validationStatus === 'checking') {
            return { text: 'Checking availability...', color: 'text-brand-blue' };
        }
        if (successText && (success || validationStatus === 'valid')) {
            return { text: successText, color: 'text-neon-green' };
        }
        if (helperText) {
            return { text: helperText, color: 'text-charcoal/40' };
        }
        return null;
    };

    const message = getMessage();

    return (
        <div className="flex flex-col gap-2 w-full group">
            {label && (
                <label className="text-xs font-bold uppercase tracking-widest text-charcoal/40 ml-4">
                    {label}
                </label>
            )}
            <div className={`
                relative flex items-center transition-all duration-300
                neumorphic-socket rounded-2xl px-4 py-1
                ${getRingClass()}
                ${className}
            `}>
                {icon && (
                    <i className={`bi ${icon} text-lg mr-3 text-charcoal/30 group-focus-within:text-brand-blue transition-colors`}></i>
                )}
                <input
                    type={inputType}
                    className="bg-transparent w-full py-3 text-charcoal placeholder:text-charcoal/20 focus:outline-none font-light"
                    {...props}
                />
                {isPasswordField && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="ml-2 text-charcoal/40 hover:text-brand-blue transition-colors focus:outline-none"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        title={showPassword ? 'Hide password' : 'Show password'}
                    >
                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} text-lg`}></i>
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
