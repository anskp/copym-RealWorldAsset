import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../utils/axios';

const ProtectedRoute = ({ children, role }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/check');
        
        if (response.data.authenticated && response.data.roles.includes(role)) {
          setIsAuthenticated(true);
          setUserRole(response.data.roles[0]);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
      setLoading(false);
    };

    checkAuth();
  }, [role]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={`/${role.toLowerCase()}/login`} />;
  }

  return children;
};

export default ProtectedRoute; 