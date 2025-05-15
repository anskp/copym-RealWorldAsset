import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { useNavigate } from 'react-router-dom';
import { useIssuerSetup } from '../../contexts/IssuerSetupContext';

const IssuerWallet = () => {
  const navigate = useNavigate();
  const { setupCompleted } = useIssuerSetup();
  const [walletData, setWalletData] = useState(null);
  const [balanceData, setBalanceData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [nfts, setNfts] = useState({ dbNfts: [], fireblocksNfts: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Form state for sending tokens
  const [sendForm, setSendForm] = useState({
    to: '',
    amount: '',
    token: 'eth',
    chain: 'polygon-mumbai'
  });
  const [sendStatus, setSendStatus] = useState(null);

  const fetchWalletData = async (retry = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching wallet data (attempt ${retry + 1} of ${MAX_RETRIES + 1})...`);
      
      // Get wallet data using the API instance
      const response = await api.get('/wallet');
      console.log('Wallet data response:', response.data);
      
      // Handle the response based on its structure
      if (response.data && response.data.wallet) {
        setWalletData(response.data.wallet);
        
        // If balance is included in the response
        if (response.data.balance) {
          setBalanceData(response.data.balance);
        }
        
        // Fetch additional data if we have a wallet address
        if (response.data.wallet.address) {
          try {
            // Only fetch transactions and NFTs if they weren't included in the main response
            await Promise.all([
              !response.data.balance && fetchBalanceData(response.data.wallet.address),
              fetchTransactions(response.data.wallet.address),
              fetchNFTs(response.data.wallet.address)
            ]);
          } catch (subError) {
            console.warn('Some wallet data could not be fetched:', subError);
            // Continue even if these fail - we at least have the main wallet data
          }
        }
      } else {
        // Handle case where response doesn't have expected structure
        console.warn('Unexpected wallet data format:', response.data);
        setWalletData(response.data); // Fallback to using the raw response
      }
      
      setLoading(false);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      
      // Retry logic for network errors or timeouts
      if ((error.code === 'ECONNABORTED' || !error.response) && retry < MAX_RETRIES) {
        console.log(`Retrying wallet data fetch in ${(retry + 1) * 2} seconds...`);
        setError(`Connection issue. Retrying... (${retry + 1}/${MAX_RETRIES})`);
        
        // Exponential backoff for retries
        setTimeout(() => {
          fetchWalletData(retry + 1);
        }, (retry + 1) * 2000);
        
        setRetryCount(retry + 1);
        return;
      }
      
      if (error.response) {
        if (error.response.status === 401) {
          setError('Authentication error. Please sign in again.');
        } else if (error.response.status === 403) {
          setError('You do not have permission to access this wallet. Issuer role required.');
        } else {
          setError(`Error: ${error.response.data?.message || 'Unknown error'}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        setError('Request timed out. The server is taking too long to respond. Please try again later.');
      } else {
        setError('Failed to connect to server. Please check your connection and try again.');
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  // Add a refresh button handler
  const handleRefresh = () => {
    fetchWalletData();
  };

  const fetchBalanceData = async (address) => {
    try {
      const balanceResponse = await api.get('/wallet/balance');
      setBalanceData(balanceResponse.data);
    } catch (error) {
      console.error('Error fetching balance data:', error);
      // Don't set error state, just log it
    }
  };

  const fetchTransactions = async (address) => {
    try {
      const txResponse = await api.get('/wallet/transactions');
      setTransactions(txResponse.data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Don't set error state, just log it
    }
  };

  const fetchNFTs = async (address) => {
    try {
      const nftResponse = await api.get('/wallet/nfts');
      
      // Properly set NFTs based on the new response structure
      setNfts(nftResponse.data || { dbNfts: [], crossmintNfts: [], total: 0 });
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      // Don't set error state, just log it
    }
  };

  const handleSendFormChange = (e) => {
    const { name, value } = e.target;
    setSendForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendTokens = async (e) => {
    e.preventDefault();
    try {
      setSendStatus({ status: 'loading', message: 'Sending transaction...' });
      await api.post('/wallet/send', sendForm);
      setSendStatus({ status: 'success', message: 'Transaction submitted successfully!' });
      // Reset form
      setSendForm({
        to: '',
        amount: '',
        token: 'eth',
        chain: 'polygon-mumbai'
      });
      // Refresh transactions after a short delay
      if (walletData?.address) {
        setTimeout(() => {
          fetchTransactions(walletData.address);
        }, 3000);
      }
    } catch (error) {
      console.error('Error sending tokens:', error);
      setSendStatus({ 
        status: 'error', 
        message: error.response?.data?.message || 'Failed to send transaction' 
      });
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Helper function for placeholder images
  const getPlaceholderImage = (id) => {
    // Generate a colorful placeholder based on the ID
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-pink-500',
      'bg-indigo-500'
    ];
    
    // Make sure id is a string and not undefined/null
    const stringId = String(id || '');
    
    // Get a consistent color even if the id is an empty string
    const colorIndex = stringId.length > 0 
      ? stringId.charCodeAt(0) % colors.length 
      : Math.floor(Math.random() * colors.length);
      
    return colors[colorIndex];
  };

  // Helper function to format status badges
  const renderStatusBadge = (status) => {
    const statusColors = {
      'ACTIVE': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'PENDING': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'EXPIRED': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'REVOKED': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  // NFTs tab content
  const renderNFTsTab = () => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading NFTs and credentials...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error loading NFTs: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      );
    }

    const totalNfts = (nfts.dbNfts?.length || 0) + (nfts.fireblocksNfts?.length || 0);

    if (totalNfts === 0) {
      return (
        <div className="text-center py-16">
          <div className="mx-auto h-24 w-24 text-yellow-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No NFTs or Credentials Found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Once you issue or receive credentials, they will appear here.
          </p>
        </div>
      );
    }

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nfts.dbNfts && nfts.dbNfts.map(nft => (
            <div key={nft.id} className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300`}>
              {nft.metadata?.image || nft.image_url ? (
                <img 
                  src={nft.metadata?.image || nft.image_url} 
                  alt={nft.metadata?.name || 'NFT'} 
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className={`w-full h-48 flex items-center justify-center ${getPlaceholderImage(nft.id)}`}>
                  <span className="text-white text-2xl font-bold">
                    {((nft.metadata?.name || nft.credentialId || 'NFT')?.charAt(0)?.toUpperCase())}
                  </span>
                </div>
              )}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">
                    {nft.metadata?.name || `Credential #${nft.id}`}
                  </h3>
                  {renderStatusBadge(nft.status)}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  {nft.metadata?.description || `Type: ${nft.type}`}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {nft.issuedDate && (
                    <p className="mb-1">Issued: {new Date(nft.issuedDate).toLocaleDateString()}</p>
                  )}
                  {nft.contractAddress && (
                    <p className="mb-1 truncate">
                      Contract: {nft.contractAddress.substring(0, 10)}...
                    </p>
                  )}
                  {nft.tokenId && (
                    <p className="mb-1">Token ID: {nft.tokenId}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Fireblocks NFTs */}
          {nfts.fireblocksNfts && nfts.fireblocksNfts.map(nft => (
            <div key={nft.id || nft.tokenId} className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300`}>
              {nft.image ? (
                <img 
                  src={nft.image} 
                  alt={nft.name || 'NFT'} 
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className={`w-full h-48 flex items-center justify-center ${getPlaceholderImage(nft.id || nft.tokenId)}`}>
                  <span className="text-white text-2xl font-bold">
                    {((nft.name || 'NFT')?.charAt(0)?.toUpperCase())}
                  </span>
                </div>
              )}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">
                    {nft.name || `NFT #${nft.tokenId || ''}`}
                  </h3>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Fireblocks
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  {nft.description || `From Fireblocks`}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {nft.issuedDate && (
                    <p className="mb-1">Issued: {new Date(nft.issuedDate).toLocaleDateString()}</p>
                  )}
                  {nft.contractAddress && (
                    <p className="mb-1 truncate">
                      Contract: {nft.contractAddress.substring(0, 10)}...
                    </p>
                  )}
                  {nft.tokenId && (
                    <p className="mb-1">Token ID: {nft.tokenId}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderErrorState = () => {
    if (!error) return null;
    
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <div className="ml-auto pl-3">
            <button
              onClick={() => fetchWalletData()}
              className="inline-flex items-center px-2 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="text-center mt-8">Loading wallet...</div>;
  if (error) return <div className="text-red-500 text-center mt-8">{error}</div>;

  return (
    <div className={`transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Issuer Wallet</h1>
          <div className="flex space-x-4">
            {!setupCompleted && (
              <button
                onClick={() => navigate('/issuer/setup')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                Configure Asset Settings
              </button>
            )}
            <button 
              onClick={toggleDarkMode}
              className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'}`}
            >
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>

        {!setupCompleted && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Setup Required</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Please configure your asset type, blockchain, and token standard to fully set up your issuer wallet.
                  </p>
                </div>
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <button
                      onClick={() => navigate('/issuer/setup')}
                      className="bg-yellow-100 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      Setup Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!walletData ? (
          <div className="flex flex-col items-center justify-center bg-gradient-to-b from-blue-600 to-purple-600 rounded-xl p-10 text-white shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Setting Up Your Wallet</h2>
            <p className="text-center mb-6">
              {loading ? (
                'Your wallet is being loaded. Please wait a moment...'
              ) : (
                'Your wallet is being created. This may take a few minutes...'
              )}
            </p>
            <div className="w-16 h-16 border-t-4 border-blue-200 border-solid rounded-full animate-spin"></div>
            {!loading && (
              <button
                onClick={handleRefresh}
                className="mt-6 px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-colors duration-200"
              >
                Check Again
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Wallet Card and Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className={`relative ${isDarkMode ? 'bg-gray-800' : 'bg-blue-50'} rounded-xl p-6 h-72 shadow-xl flex flex-col justify-center items-center`}>
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg w-80 h-48 shadow-xl flex flex-col justify-between p-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <div className="flex justify-between items-start">
                    <div className="text-white text-xl font-bold">Issuer Wallet</div>
                    <div className="bg-yellow-400 w-12 h-8 rounded-md opacity-80"></div>
                  </div>
                  <div className="text-white font-mono mt-6 break-all text-xs">
                    {walletData?.address || 'Address pending...'}
                  </div>
                  <div className="text-white text-xs opacity-80">
                    Created: {walletData?.created_at ? new Date(walletData.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>

              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-xl`}>
                <h2 className="text-xl font-bold mb-4">Wallet Summary</h2>
                <div className="mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Chain</p>
                  <p className="font-medium">{walletData?.chain ? walletData.chain.toUpperCase() : 'N/A'}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                  <p className="font-medium">{walletData?.type || 'N/A'}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Custodial</p>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${walletData?.is_custodial ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>
                    {walletData?.is_custodial ? 'Yes' : 'No'}
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Fireblocks Vault ID</p>
                  <p className="font-medium">{walletData?.fireblocks_vault_id || 'N/A'}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Fireblocks Account ID</p>
                  <p className="font-medium">{walletData?.fireblocks_vault_account_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Available Balance</p>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {balanceData && balanceData.balances && balanceData.balances.length > 0 
                      ? `${balanceData.balances[0].amount} ${balanceData.balances[0].token?.toUpperCase() || ''}`
                      : 'No balance data'}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-8">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'overview'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('send')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'send'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    Send
                  </button>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'transactions'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    Transactions
                  </button>
                  <button
                    onClick={() => setActiveTab('nfts')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'nfts'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    NFTs & Credentials
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-xl`}>
              {activeTab === 'overview' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Token Balances</h2>
                  {balanceData && balanceData.balances && balanceData.balances.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Token
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Chain
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Balance
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {balanceData.balances.map((balance, index) => (
                            <tr key={index} className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                                    <span className="text-xs font-bold">{balance.token?.slice(0, 2)?.toUpperCase() || ''}</span>
                                  </div>
                                  <div className="text-sm font-medium">{balance.token?.toUpperCase() || ''}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {balance.chain}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {balance.amount}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">No tokens found in your wallet.</p>
                      <p className="mt-2">Visit a testnet faucet to get some test tokens.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'send' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Send Tokens</h2>
                  
                  {sendStatus && (
                    <div className={`mb-4 p-4 rounded-lg ${
                      sendStatus.status === 'loading' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      sendStatus.status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {sendStatus.message}
                    </div>
                  )}
                  
                  <form onSubmit={handleSendTokens} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Recipient Address</label>
                      <input
                        type="text"
                        name="to"
                        value={sendForm.to}
                        onChange={handleSendFormChange}
                        placeholder="0x..."
                        className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Amount</label>
                        <input
                          type="text"
                          name="amount"
                          value={sendForm.amount}
                          onChange={handleSendFormChange}
                          placeholder="0.01"
                          className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Token</label>
                        <select
                          name="token"
                          value={sendForm.token}
                          onChange={handleSendFormChange}
                          className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                          required
                        >
                          <option value="eth">ETH</option>
                          <option value="usdc">USDC</option>
                          <option value="usdt">USDT</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Chain</label>
                      <select
                        name="chain"
                        value={sendForm.chain}
                        onChange={handleSendFormChange}
                        className={`w-full px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        required
                      >
                        <option value="polygon-mumbai">Polygon Mumbai</option>
                        <option value="base-sepolia">Base Sepolia</option>
                      </select>
                    </div>
                    
                    <div>
                      <button
                        type="submit"
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors duration-300"
                      >
                        Send Transaction
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'transactions' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Transaction History</h2>
                  
                  {transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Type
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Amount
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {transactions.map((tx, index) => (
                            <tr key={index} className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  tx.type === 'send' 
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                }`}>
                                  {tx.type === 'send' ? 'Sent' : 'Received'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {tx.amount} {tx.token?.toUpperCase() || ''}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  tx.status === 'confirmed' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                    : tx.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                  {tx.status ? tx.status.charAt(0).toUpperCase() + tx.status.slice(1) : 'Unknown'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {new Date(tx.timestamp).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">No transactions found.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'nfts' && renderNFTsTab()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default IssuerWallet; 