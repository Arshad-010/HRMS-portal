import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('hrms_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hydrate user session on application mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('hrms_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setUser(response.data.data);
        setToken(storedToken);
      } catch (err) {
        console.warn('Session hydration failed:', err.message);
        localStorage.removeItem('hrms_token');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Log in user with credentials and persist token
   */
  const login = async (email, password) => {
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: receivedToken, user: loggedInUser } = response.data.data;

      localStorage.setItem('hrms_token', receivedToken);
      setToken(receivedToken);
      setUser(loggedInUser);

      return { success: true, user: loggedInUser };
    } catch (err) {
      const errorMessage = err.message || 'Authentication failed. Please check your credentials.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Terminate user session and remove persisted token
   */
  const logout = () => {
    localStorage.removeItem('hrms_token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  /**
   * Change user password
   */
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return { success: true, message: response.data.message };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Failed to update password',
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: Boolean(token && user),
    login,
    logout,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
