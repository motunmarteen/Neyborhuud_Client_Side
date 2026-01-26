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
          toast.error("Authentication required", {
            description: "Please log in to continue",
          });
          break;
        case 403:
          toast.error("Access denied", {
            description: "You do not have permission to perform this action",
          });
          break;
        case 404:
          toast.error("Not found", {
            description: "The requested resource was not found",
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
