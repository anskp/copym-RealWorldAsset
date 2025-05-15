import React, { useEffect, useRef, useState } from 'react'
import api from '../../utils/axios'

function SumsubVerification({ userId, onSuccess, onError }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const containerRef = useRef(null)
  const sdkInstanceRef = useRef(null)

  // Function to fetch a fresh token from your backend
  const getAccessToken = async () => {
    try {
      console.log('Requesting fresh token...');
      
      // Create a unique userId if none is provided
      const effectiveUserId = userId || `user-${Date.now()}`;
      console.log('Using userId:', effectiveUserId);
      
      const response = await api.post('/sumsub/token', { 
        userId: effectiveUserId,
        levelName: 'id-and-liveness'
      });
      
      console.log('Received token from backend:', response.data);
      if (!response.data.token) {
        throw new Error('Token not found in server response');
      }
      return response.data.token;
    } catch (err) {
      console.error('Error fetching Sumsub token:', err);
      setError(`Failed to initialize verification: ${err.response?.data?.error || err.message}`);
      return null;
    }
  };

  const initSumsubSdk = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get initial token
      const accessToken = await getAccessToken()
      if (!accessToken) {
        throw new Error('Failed to get access token')
      }

      console.log('Initializing Sumsub SDK with token:', accessToken.substring(0, 10) + '...')
      
      // Check which SDK object is available
      const sdkObject = window.snsWebSdk;
      
      if (!sdkObject) {
        throw new Error('Sumsub SDK not loaded - global object not found');
      }
      
      console.log('Found SDK object:', sdkObject ? 'YES' : 'NO');
      
      // Initialize the WebSDK to match the example provided
      sdkInstanceRef.current = sdkObject
        .init(accessToken, async () => {
          // Token refresh callback - This will be called when the token is about to expire
          console.log('Refreshing Sumsub token...')
          const newToken = await getAccessToken()
          console.log('Received refreshed token:', newToken ? 'SUCCESS' : 'FAILED')
          return newToken
        })
        .withConf({
          lang: 'en'
        })
        .withOptions({ 
          addViewportTag: false, 
          adaptIframeHeight: true
        })
        .on('onError', (error) => {
          console.error('Sumsub error:', error)
          setError(`Verification error: ${error.message || 'Unknown error'}`)
          onError && onError(error)
        })
        .onMessage((type, payload) => {
          console.log('Sumsub message:', type, payload)
          
          // Handle status changes for successful completion
          if (type === 'idCheck.applicantStatus' && 
              (payload.reviewStatus === 'completed' || payload.reviewStatus === 'approved')) {
            onSuccess && onSuccess(payload)
          }
        })
        .build()

      // Launch the SDK in the container
      console.log('Launching Sumsub SDK')
      sdkInstanceRef.current.launch('#sumsub-websdk-container')
    } catch (err) {
      console.error('Error initializing Sumsub SDK:', err)
      setError(`Failed to initialize verification: ${err.message || 'Unknown error'}`)
      setIsLoading(false)
      onError && onError(err)
    }
  }

  useEffect(() => {
    // Clear any existing script first
    const existingScript = document.getElementById('sumsub-sdk-script')
    if (existingScript && existingScript.parentNode) {
      existingScript.parentNode.removeChild(existingScript)
    }

    // Create a script element to load the Sumsub WebSDK
    const script = document.createElement('script')
    script.id = 'sumsub-sdk-script'
    script.src = 'https://static.sumsub.com/idensic/static/sns-websdk-builder.js'
    script.async = true
    script.onload = () => {
      console.log('Sumsub SDK script loaded successfully')
      initSumsubSdk()
    }
    script.onerror = (error) => {
      console.error('Failed to load Sumsub SDK script:', error)
      setError('Failed to load Sumsub SDK')
      setIsLoading(false)
    }
    
    document.body.appendChild(script)

    // Cleanup function
    return () => {
      // Safely remove the script tag on unmount
      const scriptToRemove = document.getElementById('sumsub-sdk-script')
      if (scriptToRemove && scriptToRemove.parentNode) {
        scriptToRemove.parentNode.removeChild(scriptToRemove)
      }
      
      if (sdkInstanceRef.current) {
        // Close the SDK if it's open
        try {
          sdkInstanceRef.current.close()
        } catch (err) {
          console.error('Error closing Sumsub SDK:', err)
        }
      }
    }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-full">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      <div 
        ref={containerRef} 
        id="sumsub-websdk-container" 
        className="w-full min-h-[600px] border border-gray-200 rounded-lg"
      ></div>
    </div>
  )
}

export default SumsubVerification 