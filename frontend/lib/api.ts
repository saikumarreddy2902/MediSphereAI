import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

function getResolvedApiBaseUrl(): string {
  let url = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').trim();
  url = url.replace(/\/+$/, '');
  if (!url.includes('/api/v1')) {
    url = `${url}/api/v1`;
  }
  return url;
}

/**
 * MediSphere AI — Centralized Axios HTTP Client
 * 
 * Configured with base backend API routing, request authentication interceptors,
 * and global 401 Unauthorized handling for dynamic session eviction.
 */
export const api: AxiosInstance = axios.create({
  baseURL: getResolvedApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15-second request timeout safeguard
});

/**
 * Request Interceptor
 * Automatically extracts the active JWT token from Zustand's persistent auth state
 * and attaches it as a Bearer token in the HTTP Authorization header.
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Zustand stores the state synchronously in localStorage via persist middleware
    const token = useAuthStore.getState().token;
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Intercepts responses to catch HTTP 401 Unauthorized errors globally.
 * Triggers an immediate client-side store purge and redirects unauthenticated users to /login.
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid signature — purge persistent state
      useAuthStore.getState().logout();
      
      // Client-side window check to prevent SSR hydration errors
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

