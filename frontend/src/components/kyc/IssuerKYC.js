import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../../context/AuthContext'
import KYCVerificationButton from './KYCVerificationButton'

// Custom CheckCircleIcon component instead of importing from heroicons
const CheckCircleIcon = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={props.className || "w-5 h-5"}
  >
    <path 
      fillRule="evenodd" 
      d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm3.293-11.707L11 12.586l-1.293-1.293a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l5-5a1 1 0 00-1.414-1.414z" 
      clipRule="evenodd" 
    />
  </svg>
)

function IssuerKYC() {
  const { user } = useAuth()
  const location = useLocation()
  const [kycStatus, setKycStatus] = useState('pending') // pending, in_progress, completed, failed
  const [statusMessage, setStatusMessage] = useState('')
  const [issuer, setIssuer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [verificationRecord, setVerificationRecord] = useState(null)
  const [personalInfo, setPersonalInfo] = useState(null)
  const [hasDID, setHasDID] = useState(false)
  const [didStatus, setDidStatus] = useState('') 
  const [kycMessage, setKycMessage] = useState('')

  // Check if returning from KYC verification page
  useEffect(() => {
    if (location.state?.kycCompleted) {
      setKycStatus('completed')
      setKycMessage('KYC verification completed successfully!')
      // Show the success message for 5 seconds
      setTimeout(() => {
        setKycMessage('')
      }, 5000)
    }
  }, [location.state])

  // Function to fetch issuer data
  const fetchIssuerData = async () => {
    try {
      setLoading(true)
      
      // Get issuer profile
      const issuerResponse = await axios.get('/api/issuer/me')
      setIssuer(issuerResponse.data)
      
      // Check for DID
      if (issuerResponse.data.did) {
        setHasDID(true)
        setDidStatus(issuerResponse.data.did)
      }
      
      // If the issuer is already verified, update the component state
      if (issuerResponse.data.verification_status === true) {
        setKycStatus('completed')
        setStatusMessage('Your profile has been verified')
        
        // Fetch personal info if verified
        try {
          const personalInfoResponse = await axios.get('/api/issuer/personal-info')
          if (personalInfoResponse.data && personalInfoResponse.data.success) {
            setPersonalInfo(personalInfoResponse.data.personalInfo)
          }
        } catch (personalInfoError) {
          console.error('Error fetching personal info:', personalInfoError)
        }
        
        setLoading(false)
        return // Exit early since we know verification is complete
      }
      
      // If not directly verified via issuer record, check KYC verification records
      try {
        const kycResponse = await axios.get('/api/issuer/kyc-status')
        const latestVerification = kycResponse.data
        
        if (latestVerification) {
          setVerificationRecord(latestVerification)
          
          // Check if the latest verification indicates completion
          if (
            (latestVerification.review_status === 'completed' || 
             latestVerification.review_status === 'approved') &&
            (latestVerification.review_result === 'GREEN')
          ) {
            console.log('KYC verification completed successfully:', latestVerification)
            setKycStatus('completed')
            setStatusMessage('Your profile has been verified')
            
            // Fetch personal info if verified
            try {
              const personalInfoResponse = await axios.get('/api/issuer/personal-info')
              if (personalInfoResponse.data && personalInfoResponse.data.success) {
                setPersonalInfo(personalInfoResponse.data.personalInfo)
              }
            } catch (personalInfoError) {
              console.error('Error fetching personal info:', personalInfoError)
            }
          } else if (latestVerification.review_status === 'init' || 
                    latestVerification.review_status === 'pending' ||
                    latestVerification.review_status === 'queued') {
            console.log('KYC verification in progress:', latestVerification)
            setKycStatus('in_progress')
            setStatusMessage('KYC verification in progress')
          } else if (latestVerification.review_result === 'RED') {
            console.log('KYC verification failed:', latestVerification)
            setKycStatus('failed')
            setStatusMessage('KYC verification failed. Please try again.')
          }
        }
      } catch (kycError) {
        console.error('Error fetching KYC status:', kycError)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching issuer data:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIssuerData()
    
    // Set up polling interval
    let intervalId
    
    // Poll more frequently when verification is in progress
    if (kycStatus === 'in_progress') {
      intervalId = setInterval(fetchIssuerData, 5000) // Poll every 5 seconds during verification
    } else {
      // Less frequent polling for other states
      intervalId = setInterval(fetchIssuerData, 15000) // Poll every 15 seconds otherwise
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [kycStatus])

  // Render the verification status based on state
  const renderVerificationStatus = () => {
    if (loading) {
      return (
        <div className="p-4 mb-4 bg-gray-50 text-gray-700 rounded-lg flex items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span>Loading verification status...</span>
        </div>
      )
    }

    if (issuer?.verification_status === true || kycStatus === 'completed' || 
        (verificationRecord?.review_status === 'completed' && verificationRecord?.review_result === 'GREEN')) {
      return (
        <div className="p-4 mb-4 bg-green-100 text-green-800 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <span className="font-medium">KYC Verified</span>
          </div>
          
          {hasDID ? (
            <div className="mt-2 text-sm border-t border-green-200 pt-2">
              <p className="font-semibold">Your Decentralized Identifier (DID):</p>
              <p className="font-mono text-xs break-all mt-1 bg-green-50 p-2 rounded">{didStatus}</p>
            </div>
          ) : (
            <div className="mt-2 text-sm border-t border-green-200 pt-2">
              <p>DID generation in progress. This may take a few minutes.</p>
            </div>
          )}
          
          {personalInfo && (
            <div className="mt-3 text-sm">
              <p className="font-semibold">Verified Information:</p>
              <div className="grid grid-cols-2 gap-2 mt-1 bg-green-50 p-2 rounded text-xs">
                {personalInfo.full_name && (
                  <div>
                    <span className="font-medium">Name:</span> {personalInfo.full_name}
                  </div>
                )}
                {personalInfo.date_of_birth && (
                  <div>
                    <span className="font-medium">DOB:</span> {new Date(personalInfo.date_of_birth).toLocaleDateString()}
                  </div>
                )}
                {personalInfo.country && (
                  <div>
                    <span className="font-medium">Country:</span> {personalInfo.country}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )
    }

    if (kycStatus === 'in_progress') {
      return (
        <div className="p-4 mb-4 bg-blue-100 text-blue-800 rounded-lg flex items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span>KYC verification in progress</span>
        </div>
      )
    }

    if (kycStatus === 'failed') {
      return (
        <div className="p-4 mb-4 bg-red-100 text-red-800 rounded-lg">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{statusMessage}</span>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {kycMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative">
          <span className="block sm:inline">{kycMessage}</span>
          <button 
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setKycMessage('')}
          >
            <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </button>
        </div>
      )}

      <h2 className="text-xl font-bold mb-4">KYC Verification</h2>
      
      {renderVerificationStatus()}
      
      {!issuer?.verification_status && !(verificationRecord?.review_status === 'completed' && verificationRecord?.review_result === 'GREEN') ? (
        <div className="mt-4">
          <p className="mb-4 text-gray-700">
            Please complete the KYC process to continue using all features of the platform.
          </p>
          
          <KYCVerificationButton 
            kycStatus={kycStatus}
            returnUrl="/issuer/dashboard?tab=kyc" 
            buttonText={kycStatus === 'failed' ? 'Try Again' : 'Start KYC Process'}
            className="mt-4" 
          />
        </div>
      ) : null}
    </div>
  )
}

export default IssuerKYC 