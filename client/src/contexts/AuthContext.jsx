import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

function getStoredToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function getStoredUser() {
  const u = localStorage.getItem('user') || sessionStorage.getItem('user');
  return u ? JSON.parse(u) : null;
}

function storeAuth(token, user, rememberMe) {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem('token', token);
  storage.setItem('user', JSON.stringify(user));
  if (!rememberMe) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(getStoredToken);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const verifyToken = useCallback(async () => {
    const t = getStoredToken();
    if (!t) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${t}` },
      });
      const json = await res.json();
      if (json.success) {
        setUser(json.data);
        setToken(t);
      } else {
        clearAuth();
        setUser(null);
        setToken(null);
      }
    } catch {
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  const login = async (username, password, rememberMe = false) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, rememberMe }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    storeAuth(json.data.token, json.data.user, rememberMe);
    setUser(json.data.user);
    setToken(json.data.token);
    return json.data;
  };

  const register = async (username, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    storeAuth(json.data.token, json.data.user, false);
    setUser(json.data.user);
    setToken(json.data.token);
    return json.data;
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    setToken(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
