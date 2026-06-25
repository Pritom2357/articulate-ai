import { createContext, useEffect, useState } from 'react';
import { login as loginApi, logout as logoutApi } from '../api/auth.js';
import { getCurrentUser } from '../api/user.js';
import { clearTokens, getAccessToken } from '../utils/tokenStorage.js';

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
      clearTokens();
    } finally {
      setLoading(false);
    }
  }

  async function login(credentials) {
    const response = await loginApi(credentials);
    await refreshUser();
    return response;
  }

  async function logout() {
    if (user?.id) {
      await logoutApi(user.id);
    }
    clearTokens();
    setUser(null);
  }

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext, AuthProvider };
