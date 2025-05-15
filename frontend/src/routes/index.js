import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Components
import AdminDashboard from '../components/dashboard/AdminDashboard';
import IssuerDashboard from '../components/dashboard/IssuerDashboard';
import InvestorDashboard from '../components/dashboard/InvestorDashboard';
import InvestorLogin from '../components/auth/InvestorLogin';
import IssuerLogin from '../components/auth/IssuerLogin';
import AdminLogin from '../components/auth/AdminLogin';
import InvestorRegister from '../components/auth/InvestorRegister';
import IssuerRegister from '../components/auth/IssuerRegister';
import IssuerSetupPage from '../components/issuer/IssuerSetupPage';
import Home from '../components/Home';

const PrivateRoute = ({ element: Element, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user's role
    if (user.role === 'INVESTOR') {
      return <Navigate to="/investor/dashboard" replace />;
    } else if (user.role === 'ISSUER') {
      return <Navigate to="/issuer/dashboard" replace />;
    } else if (user.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return Element;
};

const AppRoutes = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        
        {/* Auth Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/investor/login" element={<InvestorLogin />} />
        <Route path="/investor/register" element={<InvestorRegister />} />
        <Route path="/issuer/login" element={<IssuerLogin />} />
        <Route path="/issuer/register" element={<IssuerRegister />} />

        {/* Protected Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute
              element={<AdminDashboard />}
              allowedRoles={['ADMIN']}
            />
          }
        />
        <Route
          path="/issuer/dashboard"
          element={
            <PrivateRoute
              element={<IssuerDashboard />}
              allowedRoles={['ISSUER']}
            />
          }
        />
        <Route
          path="/issuer/setup"
          element={
            <PrivateRoute
              element={<IssuerSetupPage />}
              allowedRoles={['ISSUER']}
            />
          }
        />
        <Route
          path="/investor/dashboard"
          element={
            <PrivateRoute
              element={<InvestorDashboard />}
              allowedRoles={['INVESTOR']}
            />
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default AppRoutes; 