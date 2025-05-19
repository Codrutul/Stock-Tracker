import React, { createContext, useState, useContext, useEffect } from 'react';

// Define user type
interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

// Define auth context interface
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

// TODO: Use environment variables for API_URL
const API_URL = `${import.meta.env.VITE_API_URL}/api`;

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verify token is still valid by fetching user profile
        try {
          const response = await fetch(`${API_URL}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          
          if (!response.ok) {
            // Token is invalid, clear stored data
            logout();
          }
        } catch (error) {
          console.error('Error verifying token:', error);
        }
      }
      
      setIsLoading(false);
    };
    
    initializeAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to login');
      }
      
      // Save user and token to state and localStorage
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to register');
      }
      
      // Save user and token to state and localStorage
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Computed properties
  const isAuthenticated = !!user && !!token;
  const isAdmin = isAuthenticated && user?.role === 'admin';

  // Context value
  const value = {
    user,
    token,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    isAuthenticated,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 