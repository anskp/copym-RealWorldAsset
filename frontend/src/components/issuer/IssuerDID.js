import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';

function IssuerDID() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [didInfo, setDidInfo] = useState(null);

  useEffect(() => {
    fetchDIDInfo();
  }, []);

  const fetchDIDInfo = async () => {
    try {
      setLoading(true);
      const response = await api.get('/issuer/did');
      setDidInfo(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching DID information:', error);
      setError(error.response?.data?.message || 'Failed to fetch DID information');
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-6">Loading DID information...</div>;
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!didInfo) {
    return <div className="text-center py-6">No DID information available.</div>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold">Decentralized Identifier (DID)</h2>
      </div>
      
      <div className="p-6">
        {!didInfo.verificationStatus && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Your account needs to be verified before you can get a DID. Please complete the verification process.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {didInfo.verificationStatus && !didInfo.did && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1v-3a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Your account is verified, but your DID has not been generated yet. It will be generated automatically. Please check back later.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {didInfo.did && (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Your DID</h3>
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200 break-all">
                <code className="text-sm font-mono">{didInfo.did}</code>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                This is your decentralized identifier linked to your ETH wallet. You can use this for issuing verifiable credentials and other blockchain operations.
              </p>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Linked Wallet</h3>
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="text-sm font-mono break-all">{didInfo.wallet.address}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Type</p>
                    <p className="text-sm">{didInfo.wallet.type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Chain</p>
                    <p className="text-sm">{didInfo.wallet.chain}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">What you can do with your DID</h3>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                <li>Issue verifiable credentials to your customers or partners</li>
                <li>Prove your identity to third parties without revealing personal information</li>
                <li>Create self-sovereign identity solutions</li>
                <li>Participate in decentralized governance</li>
              </ul>
            </div>
          </>
        )}
        
        <div className="mt-6 text-sm text-gray-500">
          <p>
            <strong>What is a DID?</strong> A Decentralized Identifier (DID) is a new type of identifier that enables verifiable, decentralized digital identity. DIDs are designed to work without a central registration authority, allowing individuals and organizations to create and control their own identities.
          </p>
        </div>
      </div>
    </div>
  );
}

export default IssuerDID; 