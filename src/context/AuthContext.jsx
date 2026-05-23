import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getMe, loginUser } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lm_user'));
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const persist = (u, token) => {
    if (u && token) {
      localStorage.setItem('lm_user', JSON.stringify(u));
      localStorage.setItem('lm_token', token);
    } else {
      localStorage.removeItem('lm_user');
      localStorage.removeItem('lm_token');
    }
    setUser(u);
  };

  useEffect(() => {
    const token = localStorage.getItem('lm_token');
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then(({ user }) => persist(user, token))
      .catch(() => persist(null, null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username, password) => {
    const { user, token } = await loginUser(username, password);
    persist(user, token);
    return user;
  }, []);

  const adminLogin = useCallback(async (username, password) => {
    const { user, token } = await loginUser(username, password);
    persist(user, token);
    return user;
  }, []);

  const logout = useCallback(() => persist(null, null), []);

  const updateUser = useCallback((patch) => {
    setUser((u) => {
      const next = { ...u, ...patch };
      localStorage.setItem('lm_user', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, adminLogin, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
