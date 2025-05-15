import React, { useState, useEffect } from 'react'
import api from '../../utils/axios'

function AdminKYCVerifications({ userId = null }) {
  const [verifications, setVerifications] = useState([])
  const [personalInfo, setPersonalInfo] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedVerification, setSelectedVerification] = useState(null)
  const [detailedView, setDetailedView] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(userId || '')
  const [users, setUsers] = useState([])
  const [dataSource, setDataSource] = useState('local') // Changed default to 'local' instead of 'sumsub'
  const [isLoadingPersonalInfo, setIsLoadingPersonalInfo] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')
  const [token, setToken] = useState('')

  useEffect(() => {
    // Update selectedUserId if the prop changes
    if (userId !== null) {
      setSelectedUserId(userId.toString());
    }
    
    if (dataSource === 'local') {
      fetchLocalVerifications()
    } else {
      fetchSumsubVerifications()
    }
    fetchUsers()
  }, [userId, selectedUserId, dataSource])

  const fetchLocalVerifications = async () => {
    try {
      setLoading(true)
      const url = selectedUserId 
        ? `/admin/kyc-verifications?userId=${selectedUserId}`
        : '/admin/kyc-verifications'
      
      const response = await api.get(url)
      
      // If we have verification data, fetch personal info for each applicant
      if (response.data && response.data.length > 0) {
        const personalInfoMap = {}
        
        // Create an array of promises for fetching personal info
        const promises = response.data.map(async (verification) => {
          if (verification.applicant_id) {
            try {
              const infoResponse = await api.get(`/admin/kyc-personal-info/${verification.applicant_id}`)
              if (infoResponse.data) {
                personalInfoMap[verification.applicant_id] = infoResponse.data
              }
            } catch (err) {
              console.error(`Error fetching personal info for ${verification.applicant_id}:`, err)
            }
          }
          return verification
        })
        
        await Promise.all(promises)
        setPersonalInfo(personalInfoMap)
      }
      
      setVerifications(response.data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching local KYC verifications:', err)
      setError('Failed to load local KYC verifications. Please try again later.')
      setLoading(false)
    }
  }
  
  const fetchSumsubVerifications = async () => {
    try {
      setLoading(true)
      // Get applicants directly from Sumsub API through our backend endpoint
      const response = await api.get('/admin/sumsub/applicants')
      setVerifications(response.data.items || [])
      setLoading(false)
    } catch (err) {
      console.error('Error fetching Sumsub verifications:', err)
      setError('Failed to load Sumsub verification data. Please try again later.')
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users')
      // Filter to only include users with issuer role
      const issuerUsers = response.data.filter(user => 
        user.roles.some(role => role.role === 'ISSUER')
      )
      setUsers(issuerUsers)
    } catch (err) {
      console.error('Error fetching users:', err)
    }
  }

  const handleViewDetails = async (verification) => {
    try {
      setLoading(true)
      
      if (dataSource === 'local') {
        const response = await api.get(`/admin/kyc-verifications/${verification.id}`)
        
        // Try to fetch personal info if not already loaded
        if (verification.applicant_id && !personalInfo[verification.applicant_id]) {
          try {
            const infoResponse = await api.get(`/admin/kyc-personal-info/${verification.applicant_id}`)
            if (infoResponse.data) {
              setPersonalInfo(prev => ({
                ...prev,
                [verification.applicant_id]: infoResponse.data
              }))
            }
          } catch (err) {
            console.error(`Error fetching personal info for ${verification.applicant_id}:`, err)
          }
        }
        
        setSelectedVerification(response.data)
      } else {
        // Fetch the detailed applicant data from Sumsub
        const response = await api.get(`/admin/sumsub/applicant/${verification.id}`)
        setSelectedVerification(response.data)
      }
      
      setDetailedView(true)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching verification details:', err)
      setError('Failed to load verification details. Please try again later.')
      setLoading(false)
    }
  }

  const handleBackToList = () => {
    setDetailedView(false)
    setSelectedVerification(null)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'pending':
      case 'PENDING':
      case 'QUEUED':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
      case 'RED':
      case 'DECLINED':
        return 'bg-red-100 text-red-800'
      case 'GREEN':
      case 'VERIFIED':
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'init':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const fetchPersonalInfo = async (applicantId) => {
    try {
      setIsLoadingPersonalInfo(true);
      const response = await api.get(`/admin/kyc-personal-info/${applicantId}`);
      
      if (response.data) {
        setPersonalInfo(prev => ({
          ...prev,
          [applicantId]: response.data
        }));
      }
    } catch (error) {
      console.error('Error fetching personal info:', error);
      setError('Failed to fetch personal info. ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoadingPersonalInfo(false);
    }
  };

  const handleGenerateDID = async (issuerId) => {
    try {
      const response = await api.post(`/admin/issuers/${issuerId}/generate-did`);
      if (response.data && response.data.success) {
        // Refresh the verification data to get the updated DID
        handleViewDetails(selectedVerification);
        console.log('DID generated successfully:', response.data.did);
      } else {
        setError(response.data?.message || 'Failed to generate DID');
      }
    } catch (error) {
      console.error('Error generating DID:', error);
      setError('Failed to generate DID: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return <div className="text-center mt-8">Loading...</div>
  if (error) return <div className="text-red-500 text-center mt-8">{error}</div>

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {!detailedView ? (
        <>
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold">KYC Verifications</h2>
            <div className="flex items-center">
              <select
                className="block w-48 mr-2 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value)}
              >
                <option value="local">Local Database</option>
                <option value="sumsub">Sumsub API</option>
              </select>
              <select
                className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">All Users</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.email}
                  </option>
                ))}
              </select>
              <button
                onClick={dataSource === 'local' ? fetchLocalVerifications : fetchSumsubVerifications}
                className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Refresh
              </button>
            </div>
          </div>
          
            {verifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">No KYC verification records found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedUserId ? 
                  "This user has not completed KYC verification yet." :
                  "There are no KYC verification records in the system."}
              </p>
              <div className="mt-6">
                <button
                  onClick={dataSource === 'local' ? fetchLocalVerifications : fetchSumsubVerifications}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Data
                </button>
              </div>
            </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Personal Info
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {verifications.map((verification) => {
                    // Extract common properties based on data source
                    let applicantId, type, status, createdAt, userData
                    
                    if (dataSource === 'local') {
                      applicantId = verification.applicant_id
                      type = verification.type || 'KYC'
                      status = verification.processing_status || verification.review_status || 'pending'
                      createdAt = verification.created_at
                      userData = verification.users
                    } else {
                      applicantId = verification.id
                      type = verification.levelName || 'KYC'
                      status = verification.reviewStatus || 'pending'
                      createdAt = verification.createdAt || verification.created
                      userData = null
                    }
                    
                    // Get personal info for local database records
                    const personInfo = personalInfo[applicantId] || {}
                      
                    return (
                      <tr key={applicantId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {userData?.email || verification.externalUserId || personInfo?.email || 'Unknown User'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {userData?.first_name} {userData?.last_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{applicantId}</div>
                          <div className="text-xs text-gray-500">
                            External ID: {verification.external_user_id || verification.externalUserId || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {dataSource === 'local' && personInfo ? (
                            <div>
                              <div className="text-sm text-gray-900">
                                {personInfo.full_name || `${personInfo.first_name || ''} ${personInfo.last_name || ''}`.trim() || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {personInfo.nationality || personInfo.country || 'N/A'}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-900">{type}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(status)}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(createdAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleViewDetails(verification)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            )}
        </>
      ) : (
        <div className="p-6">
          <button
            onClick={handleBackToList}
            className="mb-6 flex items-center text-blue-600 hover:text-blue-900"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back to List
          </button>
          
          {selectedVerification && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Verification Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Applicant Information</h3>
                  <div className="space-y-2">
                    {dataSource === 'local' ? (
                      <>
                        <p><span className="font-medium">Applicant ID:</span> {selectedVerification.applicant_id}</p>
                        <p><span className="font-medium">External User ID:</span> {selectedVerification.external_user_id}</p>
                        <p><span className="font-medium">User Email:</span> {selectedVerification.users?.email || 'N/A'}</p>
                        <p><span className="font-medium">User Name:</span> {selectedVerification.users?.first_name} {selectedVerification.users?.last_name}</p>
                        
                        {/* Display personal info if available */}
                        {personalInfo[selectedVerification.applicant_id] && (
                          <>
                            <h4 className="text-md font-semibold mt-4 mb-2">Personal Information</h4>
                            <p><span className="font-medium">Full Name:</span> {personalInfo[selectedVerification.applicant_id].full_name || 'N/A'}</p>
                            <p><span className="font-medium">Date of Birth:</span> {formatDate(personalInfo[selectedVerification.applicant_id].date_of_birth)}</p>
                            <p><span className="font-medium">Nationality:</span> {personalInfo[selectedVerification.applicant_id].nationality || 'N/A'}</p>
                            <p><span className="font-medium">ID Number:</span> {personalInfo[selectedVerification.applicant_id].id_number || 'N/A'}</p>
                            <p><span className="font-medium">Email:</span> {personalInfo[selectedVerification.applicant_id].email || 'N/A'}</p>
                            <p><span className="font-medium">Phone:</span> {personalInfo[selectedVerification.applicant_id].phone || 'N/A'}</p>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <p><span className="font-medium">Applicant ID:</span> {selectedVerification.id}</p>
                        <p><span className="font-medium">External User ID:</span> {selectedVerification.externalUserId}</p>
                        <p><span className="font-medium">Email:</span> {selectedVerification.info?.email || selectedVerification.user?.email || 'N/A'}</p>
                        <p><span className="font-medium">Name:</span> {selectedVerification.info?.firstName} {selectedVerification.info?.lastName}</p>
                        <p><span className="font-medium">Country:</span> {selectedVerification.info?.country || 'N/A'}</p>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">Verification Status</h3>
                  <div className="space-y-2">
                    {dataSource === 'local' ? (
                      <>
                        <p>
                          <span className="font-medium">Status:</span>{' '}
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(selectedVerification.processing_status || selectedVerification.review_status)}`}>
                            {selectedVerification.processing_status || selectedVerification.review_status || 'pending'}
                          </span>
                        </p>
                        <p>
                          <span className="font-medium">Result:</span>{' '}
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(selectedVerification.review_result)}`}>
                            {selectedVerification.review_result || 'N/A'}
                          </span>
                        </p>
                        <p><span className="font-medium">Created At:</span> {formatDate(selectedVerification.created_at)}</p>
                        <p><span className="font-medium">Updated At:</span> {formatDate(selectedVerification.updated_at)}</p>
                        
                        {selectedVerification.inspection_id && (
                          <p><span className="font-medium">Inspection ID:</span> {selectedVerification.inspection_id}</p>
                        )}
                        
                        {selectedVerification.error_message && (
                          <div className="mt-4 bg-red-50 border border-red-200 p-3 rounded-md">
                            <p className="text-sm text-red-700 font-medium">Error Message:</p>
                            <p className="text-sm text-red-600">{selectedVerification.error_message}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p>
                          <span className="font-medium">Status:</span>{' '}
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(selectedVerification.reviewStatus)}`}>
                            {selectedVerification.reviewStatus || 'pending'}
                          </span>
                        </p>
                        <p>
                          <span className="font-medium">Review Answer:</span>{' '}
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(selectedVerification.reviewResult?.reviewAnswer)}`}>
                            {selectedVerification.reviewResult?.reviewAnswer || 'N/A'}
                          </span>
                        </p>
                        <p><span className="font-medium">Created At:</span> {formatDate(selectedVerification.createdAt)}</p>
                        <p><span className="font-medium">Level:</span> {selectedVerification.levelName || 'default'}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Additional verification details for both data sources */}
              {dataSource === 'local' && selectedVerification.raw_data && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Raw Verification Data</h3>
                  <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {typeof selectedVerification.raw_data === 'string' 
                        ? selectedVerification.raw_data 
                        : JSON.stringify(selectedVerification.raw_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              {dataSource === 'sumsub' && selectedVerification.info && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Additional Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(selectedVerification.info, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedVerification && selectedVerification.applicant_id && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">Issuer Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {/* Display issuer information including DID if available */}
                    {selectedVerification.issuer ? (
                      <>
                        <p>
                          <span className="font-medium">Verification Status:</span> 
                          <span className={`ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            selectedVerification.issuer.verification_status 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedVerification.issuer.verification_status ? 'Verified' : 'Pending'}
                          </span>
                        </p>
                        {selectedVerification.issuer.verification_date && (
                          <p><span className="font-medium">Verification Date:</span> {formatDate(selectedVerification.issuer.verification_date)}</p>
                        )}
                        
                        {/* Display DID information */}
                        <div className="mt-4">
                          <p className="font-medium">Decentralized Identifier (DID):</p>
                          {selectedVerification.issuer.did ? (
                            <div className="mt-1">
                              <div className="bg-blue-50 p-2 rounded border border-blue-200 break-all">
                                <code className="text-sm text-blue-800">{selectedVerification.issuer.did}</code>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                This DID is linked to the issuer's custodial ETH wallet and can be used for issuing verifiable credentials.
                              </p>
                            </div>
                          ) : (
                            <div className="mt-1">
                              <p className="text-sm text-gray-500">No DID generated yet</p>
                              {selectedVerification.issuer.verification_status && (
                                <button 
                                  className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                  onClick={() => handleGenerateDID(selectedVerification.issuer.id)}
                                >
                                  Generate DID
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-500">No issuer information available</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminKYCVerifications 