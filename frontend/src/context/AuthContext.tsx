import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { tokenStore } from '../services/tokenStore';
import { authApi } from '../services/authApi';

interface User {
  userId: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: any) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => tokenStore.getUser());

  const updateAllUsersCache = (res: any) => {
    try {
      const saved = localStorage.getItem('eco_all_users');
      const users = saved ? JSON.parse(saved) : [];
      if (!users.find((u: any) => u.userId === res.userId)) {
        users.push({ userId: res.userId, username: res.username, role: res.role, coords: [10.824 + Math.random()*0.02, 106.63 + Math.random()*0.02] });
        localStorage.setItem('eco_all_users', JSON.stringify(users));
      }
    } catch (e) {}
  };

  const login = useCallback(async (credentials: any) => {
    const res = await authApi.login(credentials);
    tokenStore.setTokens(res.accessToken, res.refreshToken, {
      userId: res.userId, username: res.username, role: res.role,
    });
    updateAllUsersCache(res);
    setUser({ userId: res.userId, username: res.username, role: res.role });
    return res;
  }, []);

  const register = useCallback(async (data: any) => {
    const res = await authApi.register(data);
    tokenStore.setTokens(res.accessToken, res.refreshToken, {
      userId: res.userId, username: res.username, role: res.role,
    });
    updateAllUsersCache(res);
    setUser({ userId: res.userId, username: res.username, role: res.role });
    return res;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    tokenStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
