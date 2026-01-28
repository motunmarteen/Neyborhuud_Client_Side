/**
 * Email Validation Hook
 * Provides real-time email format validation and availability checking
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '@/lib/api';
import { ValidationStatus } from '@/components/ui/PremiumInput';

interface UseEmailValidationOptions {
    /** Debounce delay in milliseconds (default: 500) */
    debounceMs?: number;
    /** Whether to check availability with backend (default: true) */
    checkAvailability?: boolean;
    /** Minimum length before validating (default: 5) */
    minLength?: number;
}

interface UseEmailValidationReturn {
    /** Current validation status */
    status: ValidationStatus;
    /** Whether the email is valid (format + available) */
    isValid: boolean;
    /** Whether the email format is correct */
    isFormatValid: boolean;
    /** Whether the email is available (not taken) */
    isAvailable: boolean | null;
    /** Error message if any */
    errorMessage: string | null;
    /** Validate an email address */
    validate: (email: string) => void;
    /** Reset validation state */
    reset: () => void;
}

// RFC 5322 compliant email regex (simplified)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function useEmailValidation(options: UseEmailValidationOptions = {}): UseEmailValidationReturn {
    const {
        debounceMs = 500,
        checkAvailability = true,
        minLength = 5,
    } = options;

    const [status, setStatus] = useState<ValidationStatus>('idle');
    const [isFormatValid, setIsFormatValid] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [currentEmail, setCurrentEmail] = useState('');

    // Check email availability with backend
    const checkEmailAvailability = useCallback(async (email: string) => {
        try {
            const response = await fetchAPI(`/auth/check-email?email=${encodeURIComponent(email)}`, {
                method: 'GET',
            });
            
            // Handle various response formats
            if (response.success !== undefined) {
                return response.data?.available ?? response.available ?? true;
            }
            return true; // Assume available if response format is unexpected
        } catch (error: any) {
            console.warn('Email availability check failed:', error.message);
            // If the endpoint doesn't exist or fails, assume email is available
            // This prevents blocking signup if the check endpoint isn't implemented
            return true;
        }
    }, []);

    // Validate email format
    const validateFormat = useCallback((email: string): boolean => {
        if (!email || email.length < minLength) {
            return false;
        }
        return EMAIL_REGEX.test(email);
    }, [minLength]);

    // Main validation function
    const validate = useCallback((email: string) => {
        setCurrentEmail(email);
        
        // Reset state for empty input
        if (!email || email.trim() === '') {
            setStatus('idle');
            setIsFormatValid(false);
            setIsAvailable(null);
            setErrorMessage(null);
            return;
        }

        // Check format first
        const formatValid = validateFormat(email);
        setIsFormatValid(formatValid);

        if (!formatValid) {
            if (email.length >= minLength) {
                setStatus('invalid');
                setErrorMessage('Please enter a valid email address');
            } else {
                setStatus('idle');
                setErrorMessage(null);
            }
            setIsAvailable(null);
            return;
        }

        // Format is valid, now check availability if enabled
        if (checkAvailability) {
            setStatus('checking');
            setErrorMessage(null);
        } else {
            setStatus('valid');
            setIsAvailable(true);
        }
    }, [validateFormat, checkAvailability, minLength]);

    // Debounced availability check
    useEffect(() => {
        if (status !== 'checking' || !currentEmail || !checkAvailability) {
            return;
        }

        const timer = setTimeout(async () => {
            const available = await checkEmailAvailability(currentEmail);
            
            // Only update if email hasn't changed
            setIsAvailable(available);
            if (available) {
                setStatus('valid');
                setErrorMessage(null);
            } else {
                setStatus('taken');
                setErrorMessage('This email is already registered');
            }
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [status, currentEmail, checkAvailability, debounceMs, checkEmailAvailability]);

    // Reset function
    const reset = useCallback(() => {
        setStatus('idle');
        setIsFormatValid(false);
        setIsAvailable(null);
        setErrorMessage(null);
        setCurrentEmail('');
    }, []);

    return {
        status,
        isValid: isFormatValid && (isAvailable === true || isAvailable === null),
        isFormatValid,
        isAvailable,
        errorMessage,
        validate,
        reset,
    };
}

/**
 * Hook for username validation with availability check
 */
export function useUsernameValidation(options: UseEmailValidationOptions = {}) {
    const {
        debounceMs = 500,
        checkAvailability = true,
        minLength = 3,
    } = options;

    const [status, setStatus] = useState<ValidationStatus>('idle');
    const [isFormatValid, setIsFormatValid] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [currentUsername, setCurrentUsername] = useState('');

    // Username regex: alphanumeric, underscores, 3-30 chars
    const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

    const checkUsernameAvailability = useCallback(async (username: string) => {
        try {
            const response = await fetchAPI(`/auth/check-username?username=${encodeURIComponent(username)}`, {
                method: 'GET',
            });
            return response.data?.available ?? response.available ?? true;
        } catch (error) {
            return true; // Assume available if check fails
        }
    }, []);

    const validate = useCallback((username: string) => {
        setCurrentUsername(username);

        if (!username || username.trim() === '') {
            setStatus('idle');
            setIsFormatValid(false);
            setIsAvailable(null);
            setErrorMessage(null);
            return;
        }

        const formatValid = USERNAME_REGEX.test(username);
        setIsFormatValid(formatValid);

        if (!formatValid) {
            if (username.length >= minLength) {
                setStatus('invalid');
                if (username.length < 3) {
                    setErrorMessage('Username must be at least 3 characters');
                } else if (username.length > 30) {
                    setErrorMessage('Username must be less than 30 characters');
                } else {
                    setErrorMessage('Only letters, numbers, and underscores allowed');
                }
            } else {
                setStatus('idle');
                setErrorMessage(null);
            }
            setIsAvailable(null);
            return;
        }

        if (checkAvailability) {
            setStatus('checking');
            setErrorMessage(null);
        } else {
            setStatus('valid');
            setIsAvailable(true);
        }
    }, [checkAvailability, minLength]);

    useEffect(() => {
        if (status !== 'checking' || !currentUsername || !checkAvailability) {
            return;
        }

        const timer = setTimeout(async () => {
            const available = await checkUsernameAvailability(currentUsername);
            setIsAvailable(available);
            if (available) {
                setStatus('valid');
                setErrorMessage(null);
            } else {
                setStatus('taken');
                setErrorMessage('This username is already taken');
            }
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [status, currentUsername, checkAvailability, debounceMs, checkUsernameAvailability]);

    const reset = useCallback(() => {
        setStatus('idle');
        setIsFormatValid(false);
        setIsAvailable(null);
        setErrorMessage(null);
        setCurrentUsername('');
    }, []);

    return {
        status,
        isValid: isFormatValid && (isAvailable === true || isAvailable === null),
        isFormatValid,
        isAvailable,
        errorMessage,
        validate,
        reset,
    };
}
