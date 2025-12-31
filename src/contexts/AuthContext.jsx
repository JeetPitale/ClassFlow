import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authAPI } from '@/services/api';

const AuthContext = createContext(undefined);

const USER_STORAGE_KEY = 'classflow_user';
const TOKEN_STORAGE_KEY = 'classflow_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Initialize state from localStorage
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Persist user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, [user]);

  const login = useCallback(async (email, password, role) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(email, password, role);

      if (response.data.success) {
        const { token, user: userData } = response.data.data;

        // Store token and user data
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        setUser(userData);
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, []);

  const switchRole = useCallback((role) => {
    // This function is deprecated with real backend
    // Users must logout and login as different role
    console.warn('switchRole is not supported with backend API');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchRole,
        updateUser: setUser, // Directly expose setUser or wrapper
        token: localStorage.getItem(TOKEN_STORAGE_KEY)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export AuthContext for direct use
export { AuthContext };