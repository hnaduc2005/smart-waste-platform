import { createContext, useContext, useState, useCallback } from 'react';
import { tokenStore } from '../services/tokenStore';
import { authApi } from '../services/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStore.getUser());

  const login = useCallback(async (credentials) => {
    const res = await authApi.login(credentials);
    tokenStore.setTokens(res.accessToken, res.refreshToken, {
      userId: res.userId, username: res.username, role: res.role,
    });
    setUser({ userId: res.userId, username: res.username, role: res.role });
    return res;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authApi.register(data);
    tokenStore.setTokens(res.accessToken, res.refreshToken, {
      userId: res.userId, username: res.username, role: res.role,
    });
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
