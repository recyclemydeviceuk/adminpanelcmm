import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const resolveApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();
  if (typeof window !== 'undefined') {
    const isLocalAdmin = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (isLocalAdmin && (!configuredUrl || configuredUrl.includes('localhost:8000'))) {
      return '/api';
    }
  }
  if (configuredUrl) return configuredUrl;
  return '/api';
};

const API_BASE_URL = resolveApiBaseUrl();

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
    });
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('adminAuthToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => response,
      (error: AxiosError<ApiResponse>) => {
        if (error.response?.status === 401) {
          const url = error.config?.url || '';
          // 401 from the login endpoints means a wrong OTP or unauthorized
          // email — let the login form show that error instead of redirecting.
          const isLoginEndpoint = url.includes('/auth/request-otp') || url.includes('/auth/verify-otp');
          if (!isLoginEndpoint) {
            localStorage.removeItem('adminAuthToken');
            localStorage.removeItem('adminUser');
            const loginPath = '/admin-cashmymobile/login';
            if (!window.location.pathname.startsWith(loginPath)) {
              window.location.replace(loginPath);
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  /** GET a file (CSV/ZIP) with the auth header attached; returns a Blob. */
  async download(url: string, config?: AxiosRequestConfig): Promise<Blob> {
    const response = await this.axiosInstance.get(url, { ...config, responseType: 'blob' });
    return response.data as Blob;
  }
}

export const api = new ApiClient();
export default api;
