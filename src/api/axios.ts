import axios from 'axios';
import { STORAGE_KEYS } from '@/utils/constants';
import { redirectTo } from '@/utils/navigate';
import type { ApiResponse } from '@/types';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:3000/api',
  timeout: 60000,
  withCredentials: true,
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_INFO);
      redirectTo('/login');
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export async function get<T = unknown>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await instance.get<ApiResponse<T>>(url, { params });
  return response as unknown as T;
}

export async function post<T = unknown>(url: string, data?: unknown): Promise<T> {
  const response = await instance.post<ApiResponse<T>>(url, data);
  return response as unknown as T;
}

export async function put<T = unknown>(url: string, data?: unknown): Promise<T> {
  const response = await instance.put<ApiResponse<T>>(url, data);
  return response as unknown as T;
}

export async function del<T = unknown>(url: string): Promise<T> {
  const response = await instance.delete<ApiResponse<T>>(url);
  return response as unknown as T;
}

export async function upload<T = unknown>(url: string, formData: FormData): Promise<T> {
  const response = await instance.post<ApiResponse<T>>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response as unknown as T;
}

export function getAuthToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

export default instance;
