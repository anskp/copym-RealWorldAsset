import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axios';

// Create context
const IssuerSetupContext = createContext();

export const IssuerSetupProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [setupStep, setSetupStep] = useState('asset-type'); // 'asset-type', 'blockchain', 'token-standard'
  const [assetTypeOptions, setAssetTypeOptions] = useState([]);
  const [blockchainOptions, setBlockchainOptions] = useState([]);
  const [tokenStandardOptions, setTokenStandardOptions] = useState([]);
  const [selectedAssetType, setSelectedAssetType] = useState(null);
  const [selectedBlockchain, setSelectedBlockchain] = useState(null);
  const [selectedTokenStandard, setSelectedTokenStandard] = useState(null);
  
  // Check if issuer has completed setup
  useEffect(() => {
    const checkSetupStatus = async () => {
      if (!isAuthenticated || !user) {
        setIsLoading(false);
        return;
      }
      
      if (user.role !== 'ISSUER') {
        console.error('User is not an issuer');
        setError('Access denied. Only issuers can access this page.');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Ensure we have a token
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          setError('Authentication required. Please log in again.');
          setIsLoading(false);
          return;
        }
        
        const response = await api.get('/issuer/setup/status', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('Setup status response:', response.data);
        
        // Check if there's a specific message about schema issues
        if (response.data.message && response.data.message.includes('schema')) {
          console.warn('Database schema issue detected:', response.data.message);
          setError('Setup requires database update. Please contact support.');
          setIsLoading(false);
          return;
        }

        // Check if setup is completed - handle both boolean and string "true" values
        const isCompleted = 
          typeof response.data.setup_completed === 'boolean' 
            ? response.data.setup_completed 
            : response.data.setup_completed === 'true';
            
        if (isCompleted) {
          console.log('Setup is completed:', response.data);
          setSetupCompleted(true);
          // If setup is completed, store the selections
          if (response.data.selections) {
            setSelectedAssetType(response.data.selections.asset_type || null);
            setSelectedBlockchain(response.data.selections.blockchain || null);
            setSelectedTokenStandard(response.data.selections.token_standard || null);
          }
        } else {
          console.log('Setup is not completed, fetching options');
          // If setup is not completed, fetch initial options
          await fetchAssetTypeOptions();
        }
      } catch (error) {
        console.error('Error checking setup status:', error);
        let errorMessage = 'Failed to check setup status. Please try again.';
        
        if (error.response) {
          if (error.response.status === 401) {
            errorMessage = 'Authentication expired. Please log in again.';
            // Clear token to force re-authentication
            localStorage.removeItem('token');
          } else if (error.response.status === 403) {
            errorMessage = 'You do not have permission to access this page.';
          } else if (error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
          }
        } else if (error.request) {
          errorMessage = 'Server not responding. Please try again later.';
        }
        
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSetupStatus();
  }, [isAuthenticated, user]);
  
  // Function to fetch asset type options
  const fetchAssetTypeOptions = async () => {
    try {
      console.log('Fetching asset type options from API...');
      const response = await api.get('/issuer/setup/options');
      console.log('Asset type options response:', response.data);
      
      // Check if setup is already completed
      if (response.data.success && response.data.setup_completed) {
        // If setup is completed, we need to extract the existing selections from the response
        setSetupCompleted(true);
        
        // Get selections if available
        if (response.data.setupData && response.data.setupData.selections) {
          const selections = response.data.setupData.selections;
          setSelectedAssetType(selections.asset_type || null);
          setSelectedBlockchain(selections.blockchain || null);
          setSelectedTokenStandard(selections.token_standard || null);
        }
        
        // For asset type options, use default options from the utilities
        const defaultAssetTypes = [
          { id: 'GOLD', name: 'Gold' },
          { id: 'EQUITY', name: 'Company Equity' },
          { id: 'REAL_ESTATE', name: 'Real Estate' },
          { id: 'ART', name: 'Art' },
          { id: 'CARBON_CREDITS', name: 'Carbon Credits' },
          { id: 'COMMODITIES', name: 'Commodities' }
        ];
        
        setAssetTypeOptions(defaultAssetTypes);
        return defaultAssetTypes;
      }
      
      // Normal case - setup not completed
      setAssetTypeOptions(response.data.options.assetTypes || []);
      return response.data.options.assetTypes || [];
    } catch (error) {
      console.error('Error fetching asset type options:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      setError('Failed to fetch asset type options. Please try again.');
      
      // Return default asset types as fallback
      const fallbackAssetTypes = [
        { id: 'GOLD', name: 'Gold' },
        { id: 'EQUITY', name: 'Company Equity' },
        { id: 'REAL_ESTATE', name: 'Real Estate' },
        { id: 'ART', name: 'Art' },
        { id: 'CARBON_CREDITS', name: 'Carbon Credits' },
        { id: 'COMMODITIES', name: 'Commodities' }
      ];
      
      setAssetTypeOptions(fallbackAssetTypes);
      return fallbackAssetTypes;
    }
  };
  
  // Function to fetch blockchain options based on selected asset type
  const fetchBlockchainOptions = async (assetType) => {
    try {
      console.log(`Fetching blockchain options for asset type: ${assetType}`);
      const response = await api.get(`/issuer/setup/options?assetType=${assetType}`);
      console.log('Blockchain options response:', response.data);
      
      // Check if setup is already completed
      if (response.data.success && response.data.setup_completed) {
        // Default blockchain options
        const defaultBlockchains = [
          { id: 'ethereum', name: 'Ethereum' },
          { id: 'polygon', name: 'Polygon' }
        ];
        
        if (assetType === 'REAL_ESTATE' || assetType === 'ART') {
          defaultBlockchains.push({ id: 'solana', name: 'Solana' });
        }
        
        setBlockchainOptions(defaultBlockchains);
        return defaultBlockchains;
      }
      
      // Normal case - setup not completed
      setBlockchainOptions(response.data.options.blockchains || []);
      return response.data.options.blockchains || [];
    } catch (error) {
      console.error('Error fetching blockchain options:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      setError('Failed to fetch blockchain options. Please try again.');
      
      // Return default blockchain options as fallback
      const defaultBlockchains = [
        { id: 'ethereum', name: 'Ethereum' },
        { id: 'polygon', name: 'Polygon' }
      ];
      
      if (assetType === 'REAL_ESTATE' || assetType === 'ART') {
        defaultBlockchains.push({ id: 'solana', name: 'Solana' });
      }
      
      setBlockchainOptions(defaultBlockchains);
      return defaultBlockchains;
    }
  };
  
  // Function to fetch token standard options based on selected asset type and blockchain
  const fetchTokenStandardOptions = async (assetType, blockchain) => {
    try {
      console.log(`Fetching token standards for asset type: ${assetType}, blockchain: ${blockchain}`);
      const response = await api.get(`/issuer/setup/options?assetType=${assetType}&blockchain=${blockchain}`);
      console.log('Token standard options response:', response.data);
      
      // Check if setup is already completed
      if (response.data.success && response.data.setup_completed) {
        // Default token standards based on asset type and blockchain
        let defaultTokenStandards = ['ERC-20'];
        
        if (blockchain === 'ethereum') {
          if (assetType === 'REAL_ESTATE' || assetType === 'ART') {
            defaultTokenStandards = ['ERC-721', 'ERC-1155'];
          } else {
            defaultTokenStandards = ['ERC-20', 'ERC-1400'];
          }
        } else if (blockchain === 'polygon') {
          if (assetType === 'REAL_ESTATE' || assetType === 'ART') {
            defaultTokenStandards = ['ERC-721', 'ERC-1155'];
          } else {
            defaultTokenStandards = ['ERC-20'];
          }
        } else if (blockchain === 'solana') {
          defaultTokenStandards = ['SPL'];
        }
        
        setTokenStandardOptions(defaultTokenStandards);
        return defaultTokenStandards;
      }
      
      // Normal case - setup not completed
      setTokenStandardOptions(response.data.options.tokenStandards || []);
      return response.data.options.tokenStandards || [];
    } catch (error) {
      console.error('Error fetching token standard options:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      setError('Failed to fetch token standard options. Please try again.');
      
      // Return default token standards as fallback
      let defaultTokenStandards = ['ERC-20'];
      
      if (blockchain === 'ethereum') {
        if (assetType === 'REAL_ESTATE' || assetType === 'ART') {
          defaultTokenStandards = ['ERC-721', 'ERC-1155'];
        } else {
          defaultTokenStandards = ['ERC-20', 'ERC-1400'];
        }
      } else if (blockchain === 'polygon') {
        if (assetType === 'REAL_ESTATE' || assetType === 'ART') {
          defaultTokenStandards = ['ERC-721', 'ERC-1155'];
        } else {
          defaultTokenStandards = ['ERC-20'];
        }
      } else if (blockchain === 'solana') {
        defaultTokenStandards = ['SPL'];
      }
      
      setTokenStandardOptions(defaultTokenStandards);
      return defaultTokenStandards;
    }
  };
  
  // Function to select asset type
  const selectAssetType = async (assetType) => {
    setSelectedAssetType(assetType);
    setSelectedBlockchain(null);
    setSelectedTokenStandard(null);
    setSetupStep('blockchain');
    await fetchBlockchainOptions(assetType);
  };
  
  // Function to select blockchain
  const selectBlockchain = async (blockchain) => {
    setSelectedBlockchain(blockchain);
    setSelectedTokenStandard(null);
    setSetupStep('token-standard');
    await fetchTokenStandardOptions(selectedAssetType, blockchain);
  };
  
  // Function to select token standard
  const selectTokenStandard = (tokenStandard) => {
    setSelectedTokenStandard(tokenStandard);
  };
  
  // Function to go back to previous step
  const goBack = () => {
    if (setupStep === 'token-standard') {
      setSetupStep('blockchain');
      setSelectedTokenStandard(null);
    } else if (setupStep === 'blockchain') {
      setSetupStep('asset-type');
      setSelectedBlockchain(null);
    }
  };
  
  // Function to complete setup
  const completeSetup = async () => {
    if (!selectedAssetType || !selectedBlockchain || !selectedTokenStandard) {
      setError('Please complete all selections before proceeding.');
      return { success: false, error: 'Incomplete selections' };
    }
    
    try {
      setIsLoading(true);
      const response = await api.post('/issuer/setup/complete', {
        selected_asset_type: selectedAssetType,
        selected_blockchain: selectedBlockchain,
        selected_token_standard: selectedTokenStandard
      });
      
      if (response.data.success) {
        setSetupCompleted(true);
        return { success: true, data: response.data.data };
      } else {
        setError(response.data.message || 'Failed to complete setup.');
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      console.error('Error completing setup:', error);
      const errorMessage = error.response?.data?.message || 'Failed to complete setup. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset state and errors
  const resetError = () => {
    setError(null);
  };
  
  // Context value
  const value = {
    isLoading,
    error,
    resetError,
    setupCompleted,
    setupStep,
    assetTypeOptions,
    blockchainOptions,
    tokenStandardOptions,
    selectedAssetType,
    selectedBlockchain,
    selectedTokenStandard,
    selectAssetType,
    selectBlockchain,
    selectTokenStandard,
    goBack,
    completeSetup,
    fetchAssetTypeOptions
  };
  
  return (
    <IssuerSetupContext.Provider value={value}>
      {children}
    </IssuerSetupContext.Provider>
  );
};

// Custom hook for using the context
export const useIssuerSetup = () => {
  const context = useContext(IssuerSetupContext);
  if (!context) {
    throw new Error('useIssuerSetup must be used within an IssuerSetupProvider');
  }
  return context;
};

export default IssuerSetupContext; 