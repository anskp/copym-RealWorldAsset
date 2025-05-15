import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Create the context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Set token in axios headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
    }
    
    setLoading(false);
  }, [token]);

  // Login function
  const login = (token, user) => {
    localStorage.setItem('token', token);
    setToken(token);
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Verify token on app load
  useEffect(() => {
    const verifyToken = async () => {
      setLoading(true);
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await axios.get('/api/auth/verify');
        
        if (response.data.success) {
          setCurrentUser(response.data.user);
          setIsAuthenticated(true);
        } else {
          // Token invalid, clear it
          logout();
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };
    
    verifyToken();
  }, []);

  // Context value
  const value = {
    currentUser,
    isAuthenticated,
    loading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 