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

const AXIOS_STATUS_RE = /request failed with status code (\d+)/i;

function isTechnicalMessage(message: string): boolean {
  const m = message.toLowerCase().trim();
  return (
    AXIOS_STATUS_RE.test(m) ||
    m.startsWith("network error") ||
    m === "network error" ||
    m.includes("failed to fetch") ||
    m.includes("load failed") ||
    m.includes("econnrefused") ||
    m.includes("timeout of") ||
    m.includes("exceeded")
  );
}

function messageForHttpStatus(
  status: number,
  context: "auth" | "general" = "general",
): string {
  switch (status) {
    case 400:
      return "Something in your request wasn't valid. Please check and try again.";
    case 401:
      return context === "auth"
        ? "The email or password you entered is incorrect. Check your details or use Forgot password."
        : "Your session has expired. Please sign in again.";
    case 403:
      return "You don't have permission to do that yet. You may need to verify your account.";
    case 404:
      return "We couldn't find what you were looking for.";
    case 409:
      return "That action conflicts with something that already exists. Try a different option.";
    case 422:
      return "Some of the information you entered isn't valid. Please review and try again.";
    case 429:
      return "Too many attempts. Please wait a moment and try again.";
    case 500:
    case 502:
    case 503:
      return "Something went wrong on our side. Please try again in a moment.";
    default:
      if (status >= 500) {
        return "Something went wrong on our side. Please try again in a moment.";
      }
      if (status >= 400) {
        return "We couldn't complete that request. Please try again.";
      }
      return "Something went wrong. Please try again.";
  }
}

function extractApiMessage(error: AxiosError): string | undefined {
  const data = error.response?.data;
  if (!data || typeof data !== "object") return undefined;

  const body = data as ErrorResponse & { error?: string };
  const candidate = body.message || body.error;
  if (typeof candidate === "string" && candidate.trim() && !isTechnicalMessage(candidate)) {
    return candidate.trim();
  }
  return undefined;
}

function humanizeRawMessage(raw: string, status?: number, context: "auth" | "general" = "general"): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return status ? messageForHttpStatus(status, context) : "Something went wrong. Please try again.";
  }

  if (isTechnicalMessage(trimmed)) {
    const match = trimmed.match(AXIOS_STATUS_RE);
    const code = match ? Number(match[1]) : status;
    if (code) return messageForHttpStatus(code, context);
    if (trimmed.toLowerCase().includes("network") || trimmed.toLowerCase().includes("fetch")) {
      return "We couldn't reach the server. Check your internet connection and try again.";
    }
    return "Something went wrong. Please try again.";
  }

  return trimmed;
}

/**
 * Turn any thrown API error into copy people can act on.
 */
export function humanizeErrorMessage(
  error: unknown,
  options?: { context?: "auth" | "general" },
): string {
  const context = options?.context ?? "general";

  if (error instanceof AxiosError) {
    const apiMessage = extractApiMessage(error);
    if (apiMessage) {
      return humanizeRawMessage(apiMessage, error.response?.status, context);
    }

    const status = error.response?.status;
    if (status) {
      return messageForHttpStatus(status, context);
    }

    if (!error.response) {
      return "We couldn't reach the server. Check your internet connection and try again.";
    }

    return humanizeRawMessage(error.message, status, context);
  }

  if (error instanceof Error) {
    return humanizeRawMessage(error.message, undefined, context);
  }

  if (typeof error === "string") {
    return humanizeRawMessage(error, undefined, context);
  }

  return "Something went wrong. Please try again.";
}

/** Login / signup / password flows */
export function getAuthErrorMessage(error: unknown): string {
  return humanizeErrorMessage(error, { context: "auth" });
}

/**
 * Handle API errors and show appropriate toast messages
 */
export function handleApiError(error: unknown): ErrorResponse | null {
  if (error instanceof AxiosError) {
    const response = error.response?.data as ErrorResponse;

    if (response?.errors) {
      const errorMessages = Object.entries(response.errors)
        .map(([field, messages]) => {
          const fieldName =
            field.charAt(0).toUpperCase() +
            field.slice(1).replace(/([A-Z])/g, " $1");
          return `${fieldName}: ${messages.join(", ")}`;
        })
        .join("\n");
      toast.error("Please fix the following", {
        description: errorMessages,
      });
    } else {
      const friendly = humanizeErrorMessage(error);
      toast.error(friendly, { duration: 5000 });
    }

    return response || null;
  }

  toast.error(humanizeErrorMessage(error));
  return null;
}

/**
 * Extract error message from error object
 */
export function getErrorMessage(error: unknown): string {
  return humanizeErrorMessage(error);
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
