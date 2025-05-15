import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Component to handle Google OAuth callback
 * Extracts token from URL and stores it in localStorage, then redirects
 */
const GoogleLoginCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setIsAuthenticated } = useAuth();

  useEffect(() => {
    // Get token from URL query params
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      console.log('Google login successful, token received');
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Extract path to know where to redirect
      const path = location.pathname;
      
      if (path.includes('admin')) {
        navigate('/admin/dashboard');
      } else if (path.includes('issuer')) {
        navigate('/issuer/dashboard');
      } else if (path.includes('investor')) {
        navigate('/investor/dashboard');
      } else {
        // Default route if path doesn't contain role information
        navigate('/');
      }
    } else {
      console.error('No token received from Google authentication');
      navigate('/login');
    }
  }, [location, navigate, setUser, setIsAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Completing login...</h2>
        <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">Please wait while we finalize your authentication</p>
      </div>
    </div>
  );
};

export default GoogleLoginCallback; 