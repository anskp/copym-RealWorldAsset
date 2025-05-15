import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-indigo-600">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
            <span className="block">COPYM.</span>
            <span className="block">RWA Tokenization Platform</span>
              <span className="block text-indigo-200 mt-3">Transforming Real-World Assets into Digital Tokens</span>
            </h1>
            <p className="mt-6 max-w-lg mx-auto text-xl text-indigo-200 sm:max-w-3xl">
              Securely invest in and manage real-world assets through blockchain technology.
              Connect with verified issuers and explore tokenized investment opportunities.
            </p>
          </div>
        </div>
      </div>

      {/* Sign In Options */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Investor Option */}
          <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
            <div className="px-6 py-8">
              <h3 className="text-2xl font-bold text-gray-900">Investor Portal</h3>
              <p className="mt-4 text-gray-600">
                Access a diverse portfolio of tokenized real-world assets. 
                Track your investments and discover new opportunities.
              </p>
              <div className="mt-8 space-y-3">
                <button
                  onClick={() => navigate('/investor/login')}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Sign in as Investor
                </button>
                <button
                  onClick={() => navigate('/investor/register')}
                  className="w-full bg-white text-indigo-600 py-3 px-4 rounded-md border border-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Register as Investor
                </button>
              </div>
            </div>
          </div>

          {/* Issuer Option */}
          <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
            <div className="px-6 py-8">
              <h3 className="text-2xl font-bold text-gray-900">Issuer Portal</h3>
              <p className="mt-4 text-gray-600">
                Tokenize your real-world assets and connect with potential investors.
                Manage your offerings and track investment progress.
              </p>
              <div className="mt-8 space-y-3">
                <button
                  onClick={() => navigate('/issuer/login')}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Sign in as Issuer
                </button>
                <button
                  onClick={() => navigate('/issuer/register')}
                  className="w-full bg-white text-indigo-600 py-3 px-4 rounded-md border border-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Register as Issuer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              How RWA Tokenization Works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Transform your real-world assets into tradable digital tokens
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="text-center">
                <div className="h-12 w-12 mx-auto bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-white">1</span>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Asset Verification</h3>
                <p className="mt-2 text-gray-600">
                  Real-world assets are thoroughly verified and valued by our expert team
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="text-center">
                <div className="h-12 w-12 mx-auto bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-white">2</span>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Tokenization</h3>
                <p className="mt-2 text-gray-600">
                  Assets are digitized into tokens representing fractional ownership
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="text-center">
                <div className="h-12 w-12 mx-auto bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-white">3</span>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Investment</h3>
                <p className="mt-2 text-gray-600">
                  Investors can purchase tokens and manage their portfolio through our platform
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-base text-gray-400">
              &copy; 2024 RWA Tokenization Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 