/**
 * Global Error Handler
 * Handles API errors with user-friendly messages
 */

import { AxiosError } from "axios";
import { toast } from "sonner";

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  errors?: Record<string, string[]>; // Validation errors
  statusCode?: number;
}

/**
 * Handle API errors and show appropriate toast messages
 */
export function handleApiError(error: unknown): ErrorResponse | null {
  if (error instanceof AxiosError) {
    const response = error.response?.data as ErrorResponse;

    if (response?.errors) {
      // Validation errors - show each field error
      const errorMessages = Object.entries(response.errors)
        .map(([field, messages]) => {
          const fieldName =
            field.charAt(0).toUpperCase() +
            field.slice(1).replace(/([A-Z])/g, " $1");
          return `${fieldName}: ${messages.join(", ")}`;
        })
        .join("\n");
      toast.error("Validation Error", {
        description: errorMessages,
      });
    } else if (response?.message) {
      toast.error(response.message);
    } else if (error.response?.status) {
      // Handle specific HTTP status codes
      switch (error.response.status) {
        case 401:
          const errorMessage401 = response?.message || error.response?.data?.message || '';
          const isTokenInvalidError = errorMessage401.toLowerCase().includes('token') &&
                                     (errorMessage401.toLowerCase().includes('expired') ||
                                      errorMessage401.toLowerCase().includes('invalid') ||
                                      errorMessage401.toLowerCase().includes('malformed'));
          
          if (isTokenInvalidError) {
            // Token is invalid/expired
            toast.error("Authentication required", {
              description: "Your session has expired. Please log in again.",
              duration: 3000,
            });
          } else {
            // User is logged in but not authorized for this action (permissions issue)
            toast.error("Access Denied", {
              description: errorMessage401 || "You don't have permission to access this resource. This might be a backend configuration issue.",
              duration: 6000,
            });
            console.error('🔍 Backend Authorization Issue:');
            console.error('   - User has valid token but backend rejected request with 401');
            console.error('   - This should typically be a 403 (Forbidden), not 401 (Unauthorized)');
            console.error('   - Check backend route permissions/middleware');
            console.error('   - Error:', errorMessage401);
          }
          break;
        case 403:
          const errorMessage = response?.message || error.response?.data?.message || "Access denied";
          const isVerificationError = errorMessage.toLowerCase().includes("verif") || 
                                     errorMessage.toLowerCase().includes("not authorized");
          
          if (isVerificationError) {
            toast.error("Verification Required", {
              description: "Please verify your account to create posts. Check your email for verification link.",
              duration: 6000,
            });
          } else {
            toast.error("Access Denied", {
              description: errorMessage || "You do not have permission to perform this action",
              duration: 5000,
            });
          }
          break;
        case 404:
          const requestUrl = error.config?.url || 'unknown';
          const requestMethod = error.config?.method?.toUpperCase() || 'GET';
          console.error('🔍 404 Error Details for Backend:');
          console.error('   Request URL:', error.config?.baseURL + requestUrl);
          console.error('   Request Method:', requestMethod);
          console.error('   Expected Endpoint:', requestUrl);
          console.error('   Full Request Config:', {
            url: error.config?.url,
            method: error.config?.method,
            baseURL: error.config?.baseURL,
            headers: error.config?.headers,
          });
          
          toast.error("Endpoint Not Found (404)", {
            description: `${requestMethod} ${requestUrl} - Check backend route registration`,
            duration: 5000,
          });
          break;
        case 429:
          toast.error("Too many requests", {
            description: "Please slow down and try again later",
          });
          break;
        case 500:
          toast.error("Server error", {
            description:
              "Something went wrong on our end. Please try again later",
          });
          break;
        default:
          toast.error("An error occurred", {
            description: "Please try again",
          });
      }
    } else {
      toast.error("Network error", {
        description: "Please check your internet connection",
      });
    }

    return response || null;
  }

  // Unknown error
  console.error("Unhandled error:", error);
  toast.error("An unexpected error occurred");
  return null;
}

/**
 * Extract error message from error object
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const response = error.response?.data as ErrorResponse;
    if (response?.message) {
      return response.message;
    }
    if (response?.error) {
      return response.error;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    const response = error.response?.data as ErrorResponse;
    return !!response?.errors;
  }
  return false;
}

/**
 * Get validation errors as an object
 */
export function getValidationErrors(
  error: unknown,
): Record<string, string[]> | null {
  if (error instanceof AxiosError) {
    const response = error.response?.data as ErrorResponse;
    return response?.errors || null;
  }
  return null;
}
