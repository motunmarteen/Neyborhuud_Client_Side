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
        
        // Log detailed error info before handling
        console.group('🔐 Authorization Error');
        console.error('Status:', status);
        console.error('URL:', error.config?.url);
        console.error('Method:', error.config?.method);
        console.error('Error Message:', errorMessage);
        console.error('Error Data:', errorData);
        console.error('Has Token:', !!this.getToken());
        console.error('Token Preview:', this.getToken() ? `${this.getToken()?.substring(0, 20)}...` : 'None');
        console.groupEnd();

        if (status === 401) {
          // Check if it's a token validity issue (expired, invalid, malformed)
          const errorMessageLower = (errorMessage || '').toLowerCase();
          const isTokenInvalidError = errorMessageLower.includes('token') &&
                                     (errorMessageLower.includes('expired') ||
                                      errorMessageLower.includes('invalid') ||
                                      errorMessageLower.includes('malformed'));
          
          const hasToken = !!this.getToken();
          
          if (isTokenInvalidError || !hasToken) {
            // Token is actually invalid/expired OR user has no token - logout
            console.error('❌ Token invalid or expired. Logging out...');
            console.error('   - Has token:', hasToken);
            console.error('   - Is token invalid error:', isTokenInvalidError);
            console.error('   - Error message:', errorMessage);
            this.clearToken();
            
            // Delay redirect to allow error message to show
            if (typeof window !== "undefined") {
              setTimeout(() => {
                window.location.href = "/login";
              }, 2000); // 2 second delay
            }
          } else {
            // User has token but got 401 - likely a permissions/authorization issue
            // Don't logout - let the error handler show the message
            console.warn('⚠️ User has token but received 401. This might be a backend permissions issue.');
            console.warn('   - Has token:', hasToken);
            console.warn('   - Error message:', errorMessage);
            console.warn('   - NOT logging out - staying on page');
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
    const fullUrl = `${this.client.defaults.baseURL}${url}`;
    
    // Log request details for debugging
    console.group('📤 POST Request');
    console.log('URL:', fullUrl);
    console.log('Method: POST');
    console.log('Headers:', {
      ...this.client.defaults.headers.common,
      ...config?.headers,
    });
    
    // Log body (but not if it's FormData - too large)
    if (data instanceof FormData) {
      console.log('Body: FormData (multipart)');
      // Log FormData entries
      const entries: Record<string, any> = {};
      data.forEach((value, key) => {
        if (value instanceof File) {
          entries[key] = `File: ${value.name} (${value.size} bytes, ${value.type})`;
        } else {
          entries[key] = value;
        }
      });
      console.log('FormData entries:', entries);
    } else {
      console.log('Body:', data);
    }
    console.groupEnd();

    try {
      const response = await this.client.post<ApiResponse<T>>(url, data, config);
      
      console.group('✅ POST Response');
      console.log('URL:', fullUrl);
      console.log('Status:', response.status);
      console.log('Data:', response.data);
      console.groupEnd();
      
      return response.data;
    } catch (error: any) {
      // Enhanced error logging
      console.group('❌ POST Error');
      console.error('URL:', fullUrl);
      console.error('Method: POST');
      console.error('Status:', error.response?.status || 'No response');
      console.error('Status Text:', error.response?.statusText || 'N/A');
      console.error('Response Data:', error.response?.data || 'No response data');
      console.error('Request Config:', {
        url: fullUrl,
        method: 'POST',
        headers: {
          ...this.client.defaults.headers.common,
          ...config?.headers,
        },
        data: data instanceof FormData ? 'FormData (see above)' : data,
      });
      
      // Check if it's a 404
      if (error.response?.status === 404) {
        console.error('🔍 404 DIAGNOSTIC:');
        console.error('   - Endpoint not found on backend');
        console.error('   - Check if route is registered: POST /api/v1/content/posts');
        console.error('   - Check if route path matches exactly');
        console.error('   - Check backend server logs for routing errors');
        console.error('   - Verify baseURL is correct:', this.client.defaults.baseURL);
      }
      
      console.groupEnd();
      throw error;
    }
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
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append("file", file);

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

    const fullUrl = `${this.client.defaults.baseURL}${url}`;
    
    // Log upload request details
    console.group('📤 UPLOAD Request');
    console.log('URL:', fullUrl);
    console.log('Method: POST (multipart/form-data)');
    console.log('Files:', files.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
    })));
    console.log('Additional Data:', additionalData);
    
    // Log FormData entries
    const entries: Record<string, any> = {};
    formData.forEach((value, key) => {
      if (value instanceof File) {
        entries[key] = `File: ${value.name} (${value.size} bytes)`;
      } else {
        entries[key] = value;
      }
    });
    console.log('FormData entries:', entries);
    console.groupEnd();

    try {
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
      
      console.group('✅ UPLOAD Response');
      console.log('URL:', fullUrl);
      console.log('Status:', response.status);
      console.log('Data:', response.data);
      console.groupEnd();
      
      return response.data;
    } catch (error: any) {
      // Enhanced error logging for uploads
      console.group('❌ UPLOAD Error');
      console.error('URL:', fullUrl);
      console.error('Method: POST (multipart/form-data)');
      console.error('Status:', error.response?.status || 'No response');
      console.error('Status Text:', error.response?.statusText || 'N/A');
      console.error('Response Data:', error.response?.data || 'No response data');
      console.error('Files Count:', files.length);
      console.error('Files:', files.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })));
      console.error('Additional Data:', additionalData);
      
      // Check if it's a 404
      if (error.response?.status === 404) {
        console.error('🔍 404 DIAGNOSTIC:');
        console.error('   - Endpoint not found on backend');
        console.error('   - Check if route is registered: POST /api/v1/content/posts');
        console.error('   - Check if multer middleware is configured');
        console.error('   - Check if route path matches exactly');
        console.error('   - Verify baseURL is correct:', this.client.defaults.baseURL);
        console.error('   - Backend should accept multipart/form-data');
      }
      
      console.groupEnd();
      throw error;
    }
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
