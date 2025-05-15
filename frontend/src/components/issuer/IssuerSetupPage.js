import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIssuerSetup } from '../../contexts/IssuerSetupContext';
import AssetTypeSelection from './setup/AssetTypeSelection';
import BlockchainSelection from './setup/BlockchainSelection';
import TokenStandardSelection from './setup/TokenStandardSelection';
import SetupSuccess from './setup/SetupSuccess';
import api from '../../utils/axios';

const IssuerSetupPage = () => {
  const {
    isLoading,
    error,
    resetError,
    setupCompleted,
    setupStep,
    selectedAssetType,
    selectedBlockchain,
    selectedTokenStandard,
    completeSetup,
    fetchAssetTypeOptions
  } = useIssuerSetup();
  
  const navigate = useNavigate();
  const location = useLocation();
  const [processingSetup, setProcessingSetup] = useState(false);
  const [setupResult, setSetupResult] = useState(null);
  const [setupError, setSetupError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Log component mount with route information
  useEffect(() => {
    console.log('IssuerSetupPage mounted');
    console.log('Current path:', location.pathname);
    console.log('Current state:', {
      isLoading,
      error,
      setupCompleted,
      setupStep,
      selectedAssetType,
      selectedBlockchain,
      selectedTokenStandard
    });
    
    // If setup is already completed, turn on edit mode instead of redirecting
    if (setupCompleted) {
      console.log('Setup already completed, enabling edit mode');
      setIsEditMode(true);
    }
    
    // Reset any previous errors
    resetError();
    
    // Fetch asset type options if we're starting fresh
    if (setupStep === 'asset-type' && !isLoading) {
      console.log('Fetching asset type options...');
      fetchAssetTypeOptions()
        .then(result => {
          console.log('Asset type options fetched:', result);
        })
        .catch(err => {
          console.error('Failed to fetch initial options:', err);
          setSetupError('Failed to load setup options. Please try again.');
        });
    }
  }, [resetError, setupStep, setupCompleted, fetchAssetTypeOptions, location, isLoading, error, selectedAssetType, selectedBlockchain, selectedTokenStandard]);
  
  // Effect to handle redirection when setup is completed - only for new completions, not already completed setups
  useEffect(() => {
    if (setupCompleted && setupResult && !isEditMode) {
      console.log('Setup just completed, redirecting to dashboard');
      navigate('/issuer/dashboard');
    }
  }, [setupCompleted, setupResult, navigate, isEditMode]);
  
  // Function to handle final submission
  const handleCompleteSetup = async () => {
    if (!selectedAssetType || !selectedBlockchain || !selectedTokenStandard) {
      setSetupError('Please complete all selections before proceeding.');
      return;
    }
    
    setProcessingSetup(true);
    setSetupError(null);
    
    try {
      console.log('Completing setup with:', {
        assetType: selectedAssetType,
        blockchain: selectedBlockchain,
        tokenStandard: selectedTokenStandard
      });
      
      const result = await completeSetup();
      console.log('Setup completion result:', result);
      
      if (result.success) {
        setSetupResult(result.data);
      } else {
        setSetupError(result.error || 'Failed to complete setup. Please try again.');
      }
    } catch (error) {
      console.error('Error completing setup:', error);
      setSetupError('An unexpected error occurred. Please try again.');
    } finally {
      setProcessingSetup(false);
    }
  };
  
  // If setup is newly completed and there's a result, show success page
  if (setupCompleted && setupResult && !isEditMode) {
    return <SetupSuccess setupResult={setupResult} onContinue={() => navigate('/issuer/dashboard')} />;
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {isEditMode ? 'Update Tokenization Settings' : 'Issuer Tokenization Setup'}
          </h1>
          <p className="text-xl text-gray-400">
            {isEditMode 
              ? 'Review and update your tokenization configuration' 
              : 'Configure your tokenization platform in just a few steps'}
          </p>
          {isEditMode && (
            <div className="mt-4 bg-blue-800 text-white p-3 rounded-lg inline-block">
              Your setup is already completed. Changes made here will update your configuration.
            </div>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm">Asset Type</div>
            <div className="text-sm">Blockchain</div>
            <div className="text-sm">Token Standard</div>
          </div>
          <div className="h-2 bg-gray-700 rounded-full">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{
                width:
                  setupStep === 'asset-type'
                    ? '33%'
                    : setupStep === 'blockchain'
                    ? '66%'
                    : '100%'
              }}
            ></div>
          </div>
        </div>
        
        {/* Error Alert */}
        {(error || setupError) && (
          <div className="bg-red-900 text-white p-4 rounded-lg mb-6 max-w-3xl mx-auto">
            <p>{error || setupError}</p>
          </div>
        )}
        
        {/* Content Area */}
        <div className="max-w-3xl mx-auto bg-gray-800 rounded-xl p-8 shadow-xl">
          {isLoading || processingSetup ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="spinner w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mb-4"></div>
              <p className="text-lg">{processingSetup ? 'Setting up your vault...' : 'Loading...'}</p>
            </div>
          ) : (
            <>
              {setupStep === 'asset-type' && <AssetTypeSelection />}
              {setupStep === 'blockchain' && <BlockchainSelection />}
              {setupStep === 'token-standard' && (
                <TokenStandardSelection onComplete={handleCompleteSetup} />
              )}
            </>
          )}
        </div>
        
        {isEditMode && (
          <div className="text-center mt-6">
            <button 
              onClick={() => navigate('/issuer/dashboard')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssuerSetupPage; 