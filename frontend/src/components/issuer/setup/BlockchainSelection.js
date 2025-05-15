import React from 'react';
import { useIssuerSetup } from '../../../contexts/IssuerSetupContext';
import { FaEthereum, FaChevronLeft } from 'react-icons/fa';
import { SiPolygon, SiSolana } from 'react-icons/si';

// Blockchain icons mapping
const blockchainIcons = {
  ethereum: <FaEthereum className="w-8 h-8 mb-3 text-blue-400" />,
  polygon: <SiPolygon className="w-8 h-8 mb-3 text-purple-400" />,
  solana: <SiSolana className="w-8 h-8 mb-3 text-green-400" />
};

const BlockchainSelection = () => {
  const { 
    blockchainOptions, 
    selectBlockchain, 
    selectedAssetType, 
    selectedBlockchain,
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
        <h2 className="text-2xl font-bold">Step 2: Select Blockchain</h2>
      </div>
      
      <p className="text-gray-400 mb-8">
        Choose the blockchain network for your {getAssetTypeName(selectedAssetType)} token.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {blockchainOptions.map((blockchain) => (
          <button
            key={blockchain.id}
            onClick={() => selectBlockchain(blockchain.id)}
            className={`p-6 rounded-xl transition-all ${
              selectedBlockchain === blockchain.id
                ? 'bg-blue-700 border-2 border-blue-400 shadow-lg'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <div className="flex items-center">
              <div className="mr-4">
                {blockchainIcons[blockchain.id] || (
                  <div className="w-8 h-8 rounded-full bg-blue-600"></div>
                )}
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold">{blockchain.name}</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {getBlockchainDescription(blockchain.id)}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-gray-700 rounded-lg p-4 text-sm">
        <h4 className="font-bold mb-2">Why choose carefully?</h4>
        <p className="text-gray-400">
          Each blockchain has different performance characteristics, 
          transaction costs, and ecosystem support. Your selection 
          will impact how your tokens operate and who can interact with them.
        </p>
      </div>
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

// Helper function to get blockchain description
function getBlockchainDescription(blockchainId) {
  const descriptions = {
    ethereum: 'Most widely adopted for security tokens and DeFi',
    polygon: 'Low gas fees and fast transactions',
    solana: 'High throughput and low transaction costs'
  };
  
  return descriptions[blockchainId] || 'Blockchain network';
}

export default BlockchainSelection; 