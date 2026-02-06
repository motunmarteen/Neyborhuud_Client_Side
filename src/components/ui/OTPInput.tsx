'use client';

import React, { useRef, useEffect, useMemo, KeyboardEvent, ClipboardEvent } from 'react';

interface OTPInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    onComplete?: (value: string) => void;
    disabled?: boolean;
    error?: boolean;
    autoFocus?: boolean;
}

/**
 * OTP/Verification Code Input Component
 * 6-digit code entry with auto-focus, paste support, and backspace handling
 */
export const OTPInput: React.FC<OTPInputProps> = ({
    length = 6,
    value,
    onChange,
    onComplete,
    disabled = false,
    error = false,
    autoFocus = true,
}) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    
    // Derive display values from prop value
    const localValues = useMemo(() => {
        return value.split('').concat(Array(length - value.length).fill('')).slice(0, length);
    }, [value, length]);

    // Auto-focus first input on mount
    useEffect(() => {
        if (autoFocus && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [autoFocus]);

    const focusInput = (index: number) => {
        if (index >= 0 && index < length && inputRefs.current[index]) {
            inputRefs.current[index]?.focus();
        }
    };

    const handleChange = (index: number, inputValue: string) => {
        if (disabled) return;

        // Only allow digits
        const digit = inputValue.replace(/\D/g, '').slice(-1);
        
        const newValues = [...localValues];
        newValues[index] = digit;

        const newCode = newValues.join('');
        onChange(newCode);

        // Auto-advance to next input
        if (digit && index < length - 1) {
            focusInput(index + 1);
        }

        // Check if complete - all fields must be filled
        const isComplete = newCode.length === length && newValues.every(v => v !== '' && v !== undefined);
        console.log('🔍 OTPInput completion check:', { 
            newCode, 
            length: newCode.length, 
            expectedLength: length,
            allFilled: newValues.every(v => v !== '' && v !== undefined),
            isComplete,
            hasOnComplete: !!onComplete
        });
        
        if (isComplete && onComplete) {
            // Small delay to ensure UI updates before calling onComplete
            console.log('✅ Calling onComplete with code:', newCode);
            setTimeout(() => {
                onComplete(newCode);
            }, 100);
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return;

        if (e.key === 'Backspace') {
            e.preventDefault();
            const newValues = [...localValues];
            
            if (localValues[index]) {
                // Clear current input
                newValues[index] = '';
                onChange(newValues.join(''));
            } else if (index > 0) {
                // Move to previous input and clear it
                newValues[index - 1] = '';
                onChange(newValues.join(''));
                focusInput(index - 1);
            }
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            focusInput(index - 1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            focusInput(index + 1);
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        if (disabled) return;

        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
        
        if (pastedData) {
            const newValues = pastedData.split('').concat(Array(length - pastedData.length).fill(''));
            const newCode = newValues.slice(0, length).join('');
            
            onChange(newCode);

            // Focus the next empty input or the last one
            const nextEmptyIndex = newValues.findIndex(v => !v);
            focusInput(nextEmptyIndex >= 0 ? nextEmptyIndex : length - 1);

            // Check if complete - all fields must be filled
            const finalValues = newValues.slice(0, length);
            if (newCode.length === length && finalValues.every(v => v !== '' && v !== undefined)) {
                // Small delay to ensure UI updates before calling onComplete
                setTimeout(() => {
                    onComplete?.(newCode);
                }, 100);
            }
        }
    };

    const handleFocus = (index: number) => {
        // Select input content on focus
        inputRefs.current[index]?.select();
    };

    return (
        <div className="flex gap-2 sm:gap-3 justify-center">
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={el => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={localValues[index] || ''}
                    onChange={e => handleChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    onFocus={() => handleFocus(index)}
                    disabled={disabled}
                    aria-label={`Digit ${index + 1} of ${length}`}
                    className={`
                        w-11 h-14 sm:w-12 sm:h-16
                        text-center text-2xl font-bold
                        rounded-xl transition-all duration-200
                        focus:outline-none focus:ring-2
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        ${error 
                            ? 'neumorphic-inset ring-2 ring-brand-red/50 text-brand-red' 
                            : localValues[index]
                                ? 'neumorphic-inset ring-2 ring-neon-green/50 text-charcoal'
                                : 'neumorphic-socket text-charcoal focus:ring-brand-blue/50'
                        }
                    `}
                />
            ))}
        </div>
    );
};

export default OTPInput;
