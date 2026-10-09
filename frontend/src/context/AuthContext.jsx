import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../api/axios';

const AuthContext = createContext(null);

const normalizeUser = (u) => {
  if (!u) return null;
  return { ...u, _id: u._id || u.id };
};

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
        setUser(normalizeUser(response.data.data));
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
      setUser(normalizeUser(loggedInUser));

      return { success: true, user: normalizeUser(loggedInUser) };
    } catch (err) {
      const errorMessage = err.message || 'Authentication failed. Please check your credentials.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Log in user with Google Firebase Authentication
   */
  const loginWithGoogle = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      // Force account selection to avoid auto-login loops in some cases
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const response = await api.post('/auth/google', { idToken });
      const { token: receivedToken, user: loggedInUser } = response.data.data;

      localStorage.setItem('hrms_token', receivedToken);
      setToken(receivedToken);
      setUser(normalizeUser(loggedInUser));

      return { success: true, user: normalizeUser(loggedInUser) };
    } catch (err) {
      let errorMessage = 'Google sign-in failed. Please try again.';
      
      // Handle Firebase specific errors gracefully
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Google sign-in was cancelled.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error during Google sign-in. Please check your connection.';
      } else if (err.response && err.response.data && err.response.data.message) {
        // Handle backend custom error messages
        errorMessage = err.response.data.message;
      } else if (err.message) {
        // Fallback for other backend errors caught by Axios interceptor
        errorMessage = err.message;
      }
      
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

  /**
   * Upload user profile picture
   */
  const uploadProfilePicture = async (base64Image) => {
    try {
      const response = await api.post('/auth/profile-picture', {
        image: base64Image,
      });
      
      // Update local user state with new profile picture
      if (response.data.success && user && user.employee) {
        setUser({
          ...user,
          employee: {
            ...user.employee,
            profilePicture: response.data.profilePicture
          }
        });
      }
      
      return { success: true, message: response.data.message };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Failed to upload profile picture',
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
    loginWithGoogle,
    logout,
    changePassword,
    uploadProfilePicture,
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
