import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const FireblocksSetup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [setupStatus, setSetupStatus] = useState(null);
  const [walletDetails, setWalletDetails] = useState(null);
  const [assetType, setAssetType] = useState('');
  const [blockchain, setBlockchain] = useState('');
  const [tokenStandard, setTokenStandard] = useState('');
  const { issuerId } = useParams(); // If used in a route with issuerId parameter

  // Get token from localStorage
  const getToken = () => localStorage.getItem('token');

  // Check setup status on component mount
  useEffect(() => {
    checkSetupStatus();
  }, []);

  // Check if issuer wallet setup is completed
  const checkSetupStatus = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(
        `/api/fireblocks/status/${issuerId || 'current'}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        }
      );
      
      setSetupStatus(response.data.completed);
      if (response.data.completed && response.data.wallet) {
        setWalletDetails(response.data.wallet);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error checking setup status');
      console.error('Error checking setup status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle vault and wallet setup
  const handleSetupWallet = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);
      
      // First, update the issuer with selected asset type if provided
      if (assetType || blockchain || tokenStandard) {
        await axios.put(
          `/api/issuer/${issuerId || 'current'}`,
          {
            selected_asset_type: assetType,
            selected_blockchain: blockchain,
            selected_token_standard: tokenStandard
          },
          {
            headers: {
              Authorization: `Bearer ${getToken()}`
            }
          }
        );
      }
      
      // Then setup the wallet
      const response = await axios.post(
        `/api/fireblocks/setup/${issuerId || 'current'}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        }
      );
      
      setSuccess(true);
      setWalletDetails(response.data.wallet);
      setSetupStatus(true);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Error setting up wallet');
      console.error('Error setting up wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fireblocks-setup-container">
      <h2>Fireblocks Wallet Setup</h2>
      
      {loading && (
        <div className="loading-spinner">
          <p>Processing...</p>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="success-message">
          <p>Wallet setup completed successfully!</p>
        </div>
      )}
      
      {setupStatus ? (
        <div className="wallet-details">
          <h3>Wallet Details</h3>
          {walletDetails ? (
            <div>
              <p><strong>Wallet ID:</strong> {walletDetails.id}</p>
              <p><strong>Address:</strong> {walletDetails.address}</p>
              <p><strong>Chain:</strong> {walletDetails.chain}</p>
              <p><strong>Type:</strong> {walletDetails.type}</p>
              <p><strong>Provider:</strong> {walletDetails.provider}</p>
              <p><strong>Created At:</strong> {new Date(walletDetails.created_at).toLocaleString()}</p>
              {walletDetails.deposit_address && (
                <p><strong>Deposit Address:</strong> {walletDetails.deposit_address}</p>
              )}
            </div>
          ) : (
            <p>Wallet is setup but details are not available.</p>
          )}
        </div>
      ) : (
        <div className="setup-form">
          <h3>Set Up Your Wallet</h3>
          
          <div className="form-group">
            <label>Asset Type:</label>
            <select 
              value={assetType} 
              onChange={(e) => setAssetType(e.target.value)}
            >
              <option value="">Select Asset Type</option>
              <option value="ETH_TEST">Ethereum (Test)</option>
              <option value="GOLD">Gold</option>
              <option value="SILVER">Silver</option>
              <option value="REAL_ESTATE">Real Estate</option>
              <option value="EQUITY">Equity</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Blockchain:</label>
            <select 
              value={blockchain} 
              onChange={(e) => setBlockchain(e.target.value)}
            >
              <option value="">Select Blockchain</option>
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
              <option value="avalanche">Avalanche</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Token Standard:</label>
            <select 
              value={tokenStandard} 
              onChange={(e) => setTokenStandard(e.target.value)}
            >
              <option value="">Select Token Standard</option>
              <option value="ERC-20">ERC-20</option>
              <option value="ERC-721">ERC-721 (NFT)</option>
              <option value="ERC-1155">ERC-1155 (Multi-Token)</option>
            </select>
          </div>
          
          <button 
            onClick={handleSetupWallet}
            disabled={loading}
          >
            {loading ? 'Setting Up...' : 'Setup Wallet'}
          </button>
        </div>
      )}
    </div>
  );
};

export default FireblocksSetup; 