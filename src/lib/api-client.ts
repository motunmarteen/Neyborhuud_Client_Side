/**
 * API Client with Axios
 * Handles HTTP requests with token management and interceptors
 */

import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { ApiResponse } from "@/types/api";

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        // Always try to get token from localStorage if not in memory
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        // Don't warn if no token - some endpoints might be public
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error.response?.status;
        const errorData = error.response?.data;
        const errorMessage = errorData?.message || errorData?.error || '';
        


        if (status === 401) {
          const errorMessageLower = (errorMessage || '').toLowerCase();

          const isTokenExpiredError =
            errorMessageLower.includes('token') &&
            (errorMessageLower.includes('expired') ||
              errorMessageLower.includes('malformed'));

          const isTokenInvalidError =
            errorMessageLower.includes('token') &&
            errorMessageLower.includes('invalid') &&
            !errorMessageLower.includes('user not active') &&
            !errorMessageLower.includes('credential') &&
            !errorMessageLower.includes('password');

          const sessionDead =
            /\bsession\b[^\n]{0,80}\b(invalid|expired|revoked)\b/i.test(
              String(errorMessage),
            ) ||
            /\b(invalid|expired)\b[^\n]{0,80}\bsession\b/i.test(
              String(errorMessage),
            );

          const hasToken = !!this.getToken();

          const genericAuthFailure =
            hasToken &&
            errorMessageLower.includes('authentication required') &&
            (errorMessageLower.includes('logged in') ||
              errorMessageLower.includes('session is valid') ||
              errorMessageLower.includes('session is invalid'));

          // Only redirect to login when we had a session and the server rejected it.
          // A 401 with no token is normal for guests (e.g. optional calls on `/`); never hijack that to /login.
          const shouldForceLogout =
            hasToken &&
            (isTokenExpiredError ||
              isTokenInvalidError ||
              sessionDead ||
              genericAuthFailure);

          if (shouldForceLogout) {
            this.clearToken();
            
            // Delay redirect to allow error message to show
            if (typeof window !== "undefined") {
              setTimeout(() => {
                window.location.href = "/login";
              }, 2000); // 2 second delay
            }
          } else {
            return Promise.reject(error);
          }
        }
        
        // 403 = Forbidden (authorized but not allowed) - don't logout, just reject
        // This handles cases like "not verified" where user is logged in but can't perform action
        return Promise.reject(error);
      },
    );
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.token = token;
    // Store in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("neyborhuud_access_token", token);
    }
  }

  /**
   * Get current authentication token
   */
  getToken(): string | null {
    if (!this.token && typeof window !== "undefined") {
      this.token = localStorage.getItem("neyborhuud_access_token");
    }
    return this.token;
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("neyborhuud_access_token");
      localStorage.removeItem("neyborhuud_user");
      localStorage.removeItem("neyborhuud_community");
      localStorage.removeItem("neyborhuud_needs_community");
      localStorage.removeItem("neyborhuud_picker_context");
      localStorage.removeItem("neyborhuud_needs_gps_verify");
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * GET request
   */
  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  /**
   * POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  /**
   * Upload a single file
   */
  async uploadFile<T = any>(
    url: string,
    file: File,
    additionalData?: Record<string, any>,
    onProgress?: (progress: number) => void,
    fieldName: string = "file",
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (additionalData) {
      Object.keys(additionalData).forEach((key) => {
        this.appendFormValue(formData, key, additionalData[key]);
      });
    }

    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(Math.round(progress));
        }
      },
    });
    return response.data;
  }

  /**
   * Append a value to FormData in a backend-friendly way so arrays and objects
   * are sent in a format that multipart parsers can turn into real arrays/objects.
   */
  private appendFormValue(
    formData: FormData,
    key: string,
    value: unknown,
  ): void {
    if (value === undefined || value === null) return;
    if (value instanceof File || value instanceof Blob) {
      formData.append(key, value);
      return;
    }
    if (Array.isArray(value)) {
      // Send array as repeated keys (tags=safety, tags=event) so backends get real arrays
      value.forEach((item) => {
        if (typeof item === "object" && item !== null && !(item instanceof File) && !(item instanceof Blob)) {
          formData.append(key, JSON.stringify(item));
        } else {
          formData.append(key, String(item));
        }
      });
      return;
    }
    if (
      typeof value === "object" &&
      value !== null &&
      !(value instanceof File) &&
      !(value instanceof Blob)
    ) {
      const obj = value as Record<string, unknown>;
      Object.keys(obj).forEach((k) => {
        const v = obj[k];
        if (v === undefined || v === null) return;
        const subKey = `${key}[${k}]`;
        if (typeof v === "object" && v !== null && !(v instanceof File) && !(v instanceof Blob) && !Array.isArray(v)) {
          this.appendFormValue(formData, subKey, v);
        } else if (Array.isArray(v)) {
          this.appendFormValue(formData, subKey, v);
        } else {
          formData.append(subKey, String(v));
        }
      });
      return;
    }
    formData.append(key, String(value));
  }

  /**
   * Upload multiple files
   */
  async uploadFiles<T = any>(
    url: string,
    files: File[],
    additionalData?: Record<string, any>,
    onProgress?: (progress: number) => void,
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    if (additionalData) {
      Object.keys(additionalData).forEach((key) => {
        const value = additionalData[key];
        this.appendFormValue(formData, key, value);
      });
    }

    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(Math.round(progress));
        }
      },
    });
    return response.data;
  }
}

// Get API base URL from environment
const getApiBaseUrl = (): string => {
  const envUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl !== "undefined") {
    return envUrl;
  }
  // Default to production URL
  return "https://neyborhuud-serverside.onrender.com/api/v1";
};

// Export singleton instance
const apiClient = new ApiClient(getApiBaseUrl());

// Initialize token from localStorage on client side
if (typeof window !== "undefined") {
  const token = localStorage.getItem("neyborhuud_access_token");
  if (token) {
    apiClient.setToken(token);
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Token loaded from localStorage');
    }
  }
  // Don't warn if no token - user might not be logged in yet
}

export default apiClient;
