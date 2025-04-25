'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import apiClient, { authApi } from '@/utils/apiClient';

// Import storage keys from apiClient to avoid duplication
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/utils/apiClient';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any; // Replace 'any' with a specific User type if available
  token: string | null; // Access token
  refreshToken: string | null; // Refresh token
  login: (data: { token: string; refreshToken: string; user?: any }) => void; // Updated login params
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>; // Function to refresh the access token
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null); // Replace 'any' with a specific User type
  const [token, setToken] = useState<string | null>(null); // Access token
  const [refreshToken, setRefreshToken] = useState<string | null>(null); // Refresh token
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start with loading state

  // Use the authApi.validateToken directly since it already has error handling
  
  // Function to refresh the access token using the refresh token
  const refreshAccessToken = async (): Promise<boolean> => {
    if (!refreshToken) return false;
    
    try {
      // Use the API client's refresh token function
      const newToken = await authApi.refreshAccessToken();
      
      // Update the access token
      setToken(newToken);
      return true;
    } catch (error) {

      // Don't call logout() here to avoid circular dependencies
      // Just clear the state
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      return false;
    }
  };

  // Check localStorage for tokens on initial load
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
        const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        
        if (storedToken) {
          // Validate token with backend
          const isValid = await authApi.validateToken(storedToken);
          if (isValid) {
            setToken(storedToken);
            if (storedRefreshToken) {
              setRefreshToken(storedRefreshToken);
            }
            setIsAuthenticated(true);
            // You could fetch user details here if needed
          } else if (storedRefreshToken) {
            // Token is invalid but we have a refresh token, try to refresh
            setRefreshToken(storedRefreshToken);
            const refreshed = await refreshAccessToken();
            if (!refreshed) {
              // Refresh failed, clear everything
              localStorage.removeItem(AUTH_TOKEN_KEY);
              localStorage.removeItem(REFRESH_TOKEN_KEY);
              setIsAuthenticated(false);
              setUser(null);
              setToken(null);
              setRefreshToken(null);
            } else {
              setIsAuthenticated(true);
            }
          } else {
            // Token is invalid and no refresh token
            localStorage.removeItem(AUTH_TOKEN_KEY);
            setIsAuthenticated(false);
            setUser(null);
            setToken(null);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setToken(null);
          setRefreshToken(null);
        }
      } catch (error) {
        // Handle potential localStorage errors

        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
        setRefreshToken(null);
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = (data: { token: string; refreshToken: string; user?: any }) => {
    try {

        localStorage.setItem(AUTH_TOKEN_KEY, data.token); // Save access token to localStorage
        
        // Make sure we have a refresh token
        if (data.refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken); // Save refresh token to localStorage

        } else {

        }
        
        setIsAuthenticated(true);
        setToken(data.token);
        setRefreshToken(data.refreshToken);
        setUser(data.user || null);
    } catch (error) {

        // Handle potential storage errors (e.g., quota exceeded)
    }
  };

  const logout = async () => {
    try {
        // Call the logout endpoint using the API client
        // This also handles clearing localStorage
        await authApi.logout();
        
        // Reset state
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
        setRefreshToken(null);
    } catch (error) {

        // Even if API call fails, clear local state
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
        setRefreshToken(null);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  };

  const value = {
    isAuthenticated,
    user,
    token, // Access token
    refreshToken, // Refresh token
    login,
    logout,
    refreshAccessToken, // Renamed from refreshToken to refreshAccessToken
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
