import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

// Import Sumsub WebSDK
const snsWebSdk = window.snsWebSdk;

const KYCVerificationPage = () => {
  const { user, isAuthenticated, getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sdkInstance, setSdkInstance] = useState(null);
  const [ready, setReady] = useState(false);
  const containerRef = useRef(null);

  // Function to get a new access token from the backend
  const getAccessToken = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated
      if (!user?.id) {
        throw new Error('You must be logged in to access verification');
      }
      
      const userId = user.id;
      console.log('Getting access token for user:', userId);
      
      // Include authentication token in the request
      const authToken = getToken ? await getToken() : localStorage.getItem('authToken');
      
      // Direct API call to backend with auth headers
      const response = await axios.get(`/api/sumsub/token?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      console.log('Token response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get access token');
      }
      
      console.log('Access token received successfully');
      return response.data.token;
    } catch (error) {
      console.error('Error getting access token:', error);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError(`Failed to get access token: ${error.message || 'Unknown error'}`);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize the Sumsub WebSDK
  const initSumsubSdk = async () => {
    try {
      console.log('Initializing Sumsub SDK...');
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated
      if (!user?.id) {
        throw new Error('You must be logged in to access verification');
      }
      
      // Make sure the SDK is loaded
      if (!window.snsWebSdk) {
        console.error('Sumsub WebSDK not found in window object');
        throw new Error('Sumsub WebSDK not loaded. Please refresh the page.');
      }

      // Make sure the container element exists - check if it's in the DOM
      const containerElement = document.getElementById('sumsub-websdk-container');
      if (!containerElement) {
        console.error('Container element not found in DOM');
        throw new Error('Container element not found. Please refresh the page.');
      }
      
      console.log('Container found, getting access token...');
      const accessToken = await getAccessToken();
      
      if (!accessToken) {
        throw new Error('Failed to obtain access token');
      }

      console.log('Initializing Sumsub SDK with token');
      
      // Initialize the WebSDK
      const webSdkInstance = window.snsWebSdk
        .init(accessToken, async () => {
          // Token refresh callback - will be called when token expires
          console.log('Token expired, getting a new one...');
          return await getAccessToken();
        })
        .withConf({
          lang: 'en',
          uiConf: {
            // Optional UI customization
            customCssStr: ':root { --primary-color: #2563EB; }',
          }
        })
        .withOptions({ 
          addViewportTag: false, 
          adaptIframeHeight: true
        })
        .on('idCheck.stepCompleted', (payload) => {
          console.log('Step completed:', payload);
        })
        .on('idCheck.onError', (error) => {
          console.error('Sumsub error:', error);
          setError(`Verification error: ${error.message || 'Unknown error'}`);
        })
        .on('idCheck.applicantStatusChanged', (payload) => {
          console.log('Applicant status changed:', payload);
        })
        .onMessage((type, payload) => {
          console.log('Message from Sumsub:', type, payload);
          
          // Check for ready message
          if (type === 'idCheck.onReady') {
            setReady(true);
          }
        })
        .build();

      console.log('SDK built, launching...');
      
      // Launch the WebSDK with the actual DOM element - try direct approach
      webSdkInstance.launch('#sumsub-websdk-container');
      setSdkInstance(webSdkInstance);
      console.log('SDK launched');
      
    } catch (error) {
      console.error('Error initializing Sumsub WebSDK:', error);
      setError(`Failed to initialize verification: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Make sure DOM is fully loaded before initializing
  useEffect(() => {
    if (document.readyState === 'complete') {
      console.log('Document already complete');
      initSumsubSdk();
    } else {
      console.log('Waiting for document to be ready...');
      const handleReady = () => {
        console.log('Document now ready');
      initSumsubSdk();
    };
      window.addEventListener('load', handleReady);
      return () => window.removeEventListener('load', handleReady);
    }
    
    return () => {
      if (sdkInstance) {
        try {
          sdkInstance.destroy();
        } catch (error) {
          console.error('Error destroying Sumsub SDK:', error);
        }
      }
    };
  }, [user]); // Add user as a dependency to reinitialize when user changes

  // If not authenticated, show login prompt
  if (!user?.id) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <h2 className="text-xl font-bold text-yellow-600 mb-4">Authentication Required</h2>
          <p className="text-gray-700">You must be logged in to access verification.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">ID Verification</h1>
      
      {isLoading && <LoadingSpinner message="Loading verification..." />}
      
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <h2 className="text-xl font-bold text-red-600 mb-4">Verification Error</h2>
          <p className="text-gray-700">{error}</p>
                  <button
            onClick={initSumsubSdk}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Try Again
                  </button>
              </div>
            )}
            
      <div className="bg-white rounded-xl shadow-md p-4">
        {/* Note the ID here must match what you use in launch() */}
            <div 
              id="sumsub-websdk-container" 
          ref={containerRef}
          className="border border-gray-200 rounded"
          style={{ minHeight: '600px', display: 'block', width: '100%' }}
            ></div>
      </div>
    </div>
  );
};

export default KYCVerificationPage; 