import React from 'react';
import { useIssuerSetup } from '../../../contexts/IssuerSetupContext';
import { FaChevronLeft, FaInfoCircle } from 'react-icons/fa';

const TokenStandardSelection = ({ onComplete }) => {
  const {
    tokenStandardOptions,
    selectTokenStandard,
    selectedAssetType,
    selectedBlockchain,
    selectedTokenStandard,
    goBack
  } = useIssuerSetup();

  return (
    <div>
      <div className="flex items-center mb-6">
        <button 
          onClick={goBack}
          className="mr-4 p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
        >
          <FaChevronLeft />
        </button>
        <h2 className="text-2xl font-bold">Step 3: Select Token Standard</h2>
      </div>
      
      <p className="text-gray-400 mb-8">
        Choose the token standard for your {getAssetTypeName(selectedAssetType)} token 
        on {getBlockchainName(selectedBlockchain)}.
      </p>

      <div className="space-y-4 mb-8">
        {tokenStandardOptions.map((standard) => (
          <button
            key={standard}
            onClick={() => selectTokenStandard(standard)}
            className={`w-full p-6 rounded-xl transition-all flex items-center justify-between ${
              selectedTokenStandard === standard
                ? 'bg-blue-700 border-2 border-blue-400 shadow-lg'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <div className="text-left">
              <h3 className="text-lg font-bold">{standard}</h3>
              <p className="text-sm text-gray-400 mt-1">
                {getTokenStandardDescription(standard, selectedAssetType)}
              </p>
            </div>
            <div>
              <div className="tooltip">
                <FaInfoCircle className="text-gray-400" />
                <span className="tooltip-text">
                  {getTokenStandardTooltip(standard)}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-end mt-8">
        <button
          onClick={onComplete}
          disabled={!selectedTokenStandard}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            selectedTokenStandard
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          Complete Setup
        </button>
      </div>

      <style jsx>{`
        .tooltip {
          position: relative;
          display: inline-block;
        }
        
        .tooltip .tooltip-text {
          visibility: hidden;
          width: 250px;
          background-color: #1f2937;
          color: #fff;
          text-align: center;
          border-radius: 6px;
          padding: 10px;
          position: absolute;
          z-index: 1;
          bottom: 125%;
          left: 50%;
          margin-left: -125px;
          opacity: 0;
          transition: opacity 0.3s;
          font-size: 0.75rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        
        .tooltip:hover .tooltip-text {
          visibility: visible;
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

// Helper function to get asset type name
function getAssetTypeName(assetTypeId) {
  const names = {
    GOLD: 'Gold',
    EQUITY: 'Equity',
    REAL_ESTATE: 'Real Estate',
    ART: 'Art',
    CARBON_CREDITS: 'Carbon Credits',
    COMMODITIES: 'Commodities'
  };
  
  return names[assetTypeId] || 'asset';
}

// Helper function to get blockchain name
function getBlockchainName(blockchainId) {
  const names = {
    ethereum: 'Ethereum',
    polygon: 'Polygon',
    solana: 'Solana'
  };
  
  return names[blockchainId] || 'selected blockchain';
}

// Helper function to get token standard description
function getTokenStandardDescription(standard, assetType) {
  // More specific descriptions based on asset type and standard
  if (assetType === 'EQUITY' && standard === 'ERC-1400') {
    return 'Security token standard ideal for equity tokens';
  }
  
  // General descriptions
  const descriptions = {
    'ERC-20': 'Fungible token standard for divisible assets',
    'ERC-721': 'Non-fungible token (NFT) standard for unique assets',
    'ERC-1155': 'Multi-token standard for both fungible and non-fungible tokens',
    'ERC-1400': 'Security token standard with transfer restrictions',
    'SPL': 'Solana Program Library token standard'
  };
  
  return descriptions[standard] || 'Token standard';
}

// Helper function to get token standard tooltip
function getTokenStandardTooltip(standard) {
  const tooltips = {
    'ERC-20': 'The most common token standard, used for fungible tokens with equal value like cryptocurrencies. Divisible and ideal for assets where one unit is equal to any other.',
    'ERC-721': 'Used for non-fungible tokens (NFTs) where each token represents a unique asset. Ideal for digital art, collectibles, or unique property.',
    'ERC-1155': 'A multi-token standard that allows for both fungible and non-fungible tokens within a single contract, optimizing efficiency.',
    'ERC-1400': 'Designed specifically for security tokens with built-in compliance mechanisms, transfer restrictions, and forced transfers if required by regulations.',
    'SPL': 'Solana\'s native token standard that enables high throughput and low transaction costs.'
  };
  
  return tooltips[standard] || 'No additional information available';
}

export default TokenStandardSelection; 