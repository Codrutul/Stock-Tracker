import React, { createContext, useState, useContext, useEffect } from 'react';

// Define user type
interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  isTwoFactorEnabled?: boolean; // Added for 2FA status
}

// Define auth context interface
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string, twoFactorToken?: string) => Promise<void>; // Modified login signature
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  updateUserContext: () => Promise<void>; // Added to refresh user data
}

// TODO: Use environment variables for API_URL
const VITE_API_URL_CLEAN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_URL = `${VITE_API_URL_CLEAN}/api`;

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async (currentToken: string) => {
    if (!currentToken) return null;
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      const data = await response.json();
      // Assuming the profile endpoint now returns isTwoFactorEnabled
      // We might need to update the backend profile endpoint if it doesn't
      return data.user as User;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  };

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      // const storedUser = localStorage.getItem('user'); // Less reliable, fetch fresh profile
      
      if (storedToken) {
        const fetchedUser = await fetchUserProfile(storedToken);
        if (fetchedUser) {
            setToken(storedToken);
            setUser(fetchedUser);
            localStorage.setItem('user', JSON.stringify(fetchedUser)); // Update local storage with fresh data
        } else {
            // Token might be invalid or profile fetch failed
            logout(); // Clear invalid state
        }
      }
      setIsLoading(false);
    };
    
    initializeAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string, twoFactorToken?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, twoFactorToken }) // Pass 2FA token if provided
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle 2FA required response
        if (response.status === 403 && data.twoFactorEnabled) {
            setError('2FA_REQUIRED'); // Special error code for UI to handle
            // We don't set user/token yet, UI should prompt for 2FA code
            // Store username/password temporarily if needed for resubmission, or handle in component state
            return; 
        }
        throw new Error(data.message || 'Failed to login');
      }
      
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

  const updateUserContext = async () => {
    setIsLoading(true);
    const currentToken = localStorage.getItem('token');
    if (currentToken) {
        const fetchedUser = await fetchUserProfile(currentToken);
        if (fetchedUser) {
            setUser(fetchedUser);
            localStorage.setItem('user', JSON.stringify(fetchedUser));
        } else {
            logout(); // If profile fetch fails, token might be bad, so logout
        }
    }
    setIsLoading(false);
  };

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
    isAdmin,
    updateUserContext // Add to context value
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