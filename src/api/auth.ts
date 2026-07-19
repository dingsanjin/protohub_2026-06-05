import { post } from './axios';
import { STORAGE_KEYS } from '@/utils/constants';
import type { LoginData, LoginResponse } from '@/types';

export async function login(data: LoginData): Promise<LoginResponse> {
  return post('/auth/login', data);
}

export async function logout(): Promise<void> {
  await post('/auth/logout');
}

export async function refreshToken(): Promise<LoginResponse> {
  return post('/auth/refresh');
}

export function getCurrentUser(): { id: number; username: string; role: 'super_admin' | 'admin' } | null {
  try {
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (savedUser) {
      return JSON.parse(savedUser);
    }
  } catch {
    /* ignore */
  }
  return null;
}
