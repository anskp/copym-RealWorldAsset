import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import AdminDashboard from './components/dashboard/AdminDashboard';
import IssuerDashboard from './components/dashboard/IssuerDashboard';
import InvestorDashboard from './components/dashboard/InvestorDashboard';
import InvestorLogin from './components/auth/InvestorLogin';
import IssuerLogin from './components/auth/IssuerLogin';
import AdminLogin from './components/auth/AdminLogin';
import InvestorRegister from './components/auth/InvestorRegister';
import IssuerRegister from './components/auth/IssuerRegister';
import Home from './components/Home';
import { AuthProvider, useAuth } from './context/AuthContext';
import { IssuerSetupProvider } from './contexts/IssuerSetupContext';
import IssuerSetupPage from './components/issuer/IssuerSetupPage';
import GoogleLoginCallback from './utils/GoogleLoginCallback';
import KYCVerificationPage from './pages/KYCVerificationPage';

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

function App() {
  return (
    <AuthProvider>
      <IssuerSetupProvider>
        <Router>
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
              <Route path="/admin/login" element={<AdminLogin />} />
              
              {/* Google OAuth callback routes */}
              <Route path="/auth/google/callback" element={<GoogleLoginCallback />} />
              <Route path="/investor/auth/google/callback" element={<GoogleLoginCallback />} />
              <Route path="/issuer/auth/google/callback" element={<GoogleLoginCallback />} />
              <Route path="/admin/auth/google/callback" element={<GoogleLoginCallback />} />
              
              {/* Twitter OAuth callback routes */}
              <Route path="/auth/twitter/callback" element={<GoogleLoginCallback />} />
              <Route path="/investor/auth/twitter/callback" element={<GoogleLoginCallback />} />
              <Route path="/issuer/auth/twitter/callback" element={<GoogleLoginCallback />} />
              <Route path="/admin/auth/twitter/callback" element={<GoogleLoginCallback />} />

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
              
              {/* KYC Verification Page - accessible to both INVESTOR and ISSUER */}
              <Route
                path="/kyc-verification"
                element={
                  <PrivateRoute
                    element={<KYCVerificationPage />}
                    allowedRoles={['INVESTOR', 'ISSUER']}
                  />
                }
              />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </IssuerSetupProvider>
    </AuthProvider>
  );
}

export default App;
