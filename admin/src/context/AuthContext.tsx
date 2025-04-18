'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define the key for localStorage
const AUTH_TOKEN_KEY = 'authToken';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any; // Replace 'any' with a specific User type if available
  token: string | null; // Add token state
  login: (data: { token: string; user?: any }) => void; // Update login params
  logout: () => void;
  refreshToken: () => Promise<boolean>; // Add refresh token function
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null); // Replace 'any' with a specific User type
  const [token, setToken] = useState<string | null>(null); // Add token state
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start with loading state

  // Function to validate token with the backend
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/v1/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  };
  
  // Function to validate token with the backend
  // Since FastAPI Users doesn't have a standard refresh token endpoint,
  // we'll use the /me endpoint to check if the token is still valid
  const refreshToken = async (): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      // Check if the token is still valid by making a request to the /me endpoint
      const response = await fetch(`${backendUrl}/api/v1/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Token is still valid, no need to refresh
        return true;
      }
      
      // If token is invalid, we need to redirect to login
      // We can't refresh the token automatically with the current setup
      return false;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  };

  // Check localStorage for token on initial load
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
        if (storedToken) {
          // Validate token with backend
          const isValid = await validateToken(storedToken);
          if (isValid) {
            setToken(storedToken);
            setIsAuthenticated(true);
            // You could fetch user details here if needed
          } else {
            // Token is invalid or expired
            localStorage.removeItem(AUTH_TOKEN_KEY);
            setIsAuthenticated(false);
            setUser(null);
            setToken(null);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        // Handle potential localStorage errors
        console.error("Error reading auth token from localStorage:", error);
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = (data: { token: string; user?: any }) => {
    try {
        localStorage.setItem(AUTH_TOKEN_KEY, data.token); // Save token to localStorage
        setIsAuthenticated(true);
        setToken(data.token);
        setUser(data.user || null);
    } catch (error) {
        console.error("Error saving auth token to localStorage:", error);
        // Handle potential storage errors (e.g., quota exceeded)
    }
  };

  const logout = () => {
    try {
        localStorage.removeItem(AUTH_TOKEN_KEY); // Remove token from localStorage
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
    } catch (error) {
        console.error("Error removing auth token from localStorage:", error);
    }
  };

  const value = {
    isAuthenticated,
    user,
    token, // Provide token in context value
    login,
    logout,
    refreshToken,
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
