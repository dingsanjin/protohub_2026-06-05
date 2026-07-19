import { useState, useEffect, useCallback } from 'react';
import { login, logout as apiLogout } from '@/api/auth';
import { STORAGE_KEYS } from '@/utils/constants';
import type { LoginData } from '@/types';

interface UserInfo {
  id: number;
  username: string;
  role: 'super_admin' | 'admin';
}

export function useAuth() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_INFO);
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = useCallback(async (data: LoginData) => {
    const response = await login(data);
    if (response.success && response.data) {
      const { id, username, role, token: newToken } = response.data;
      const userInfo: UserInfo = { id, username, role };
      
      localStorage.setItem(STORAGE_KEYS.TOKEN, newToken);
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
      
      setToken(newToken);
      setUser(userInfo);
      
      return true;
    }
    return false;
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // 注销失败时仍然清理本地状态
    } finally {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_INFO);
      setToken(null);
      setUser(null);
    }
  }, []);

  const isSuperAdmin = useCallback(() => {
    return user?.role === 'super_admin';
  }, [user]);

  const isAdmin = useCallback(() => {
    return user?.role === 'admin';
  }, [user]);

  return {
    user,
    token,
    loading,
    login: handleLogin,
    logout: handleLogout,
    isSuperAdmin,
    isAdmin,
    isAuthenticated: !!user && !!token,
  };
}
