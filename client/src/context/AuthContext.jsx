import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('acdc_auth_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('acdc_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('acdc_auth_token', token);
      // Verify token
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Sessão expirada');
        })
        .then(userData => {
          setUser(userData);
          localStorage.setItem('acdc_auth_user', JSON.stringify(userData));
        })
        .catch(() => {
          logout();
        });
    } else {
      localStorage.removeItem('acdc_auth_token');
      localStorage.removeItem('acdc_auth_user');
    }
  }, [token]);

  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('acdc_auth_token', newToken);
    localStorage.setItem('acdc_auth_user', JSON.stringify(newUser));
    setShowLoginModal(false);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('acdc_auth_token');
    localStorage.removeItem('acdc_auth_user');
  };

  const canAccessTab = (tabId) => {
    if (!user) return tabId === 'overview'; // Unauthenticated can only see overview
    if (user.role === 'ADMIN') return true;
    return user.permissions?.allowedTabs?.includes(tabId) ?? false;
  };

  const canEditScreen = (screenId) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return user.permissions?.canEdit?.[screenId] ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        canAccessTab,
        canEditScreen,
        showLoginModal,
        setShowLoginModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
