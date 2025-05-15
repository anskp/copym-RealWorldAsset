import React from 'react';
import { useIssuerSetup } from '../../../contexts/IssuerSetupContext';
import { FaCoins, FaBuilding, FaHome, FaPalette, FaLeaf, FaBoxes } from 'react-icons/fa';

// Asset type icons mapping
const assetIcons = {
  GOLD: <FaCoins className="w-10 h-10 mb-3 text-yellow-500" />,
  EQUITY: <FaBuilding className="w-10 h-10 mb-3 text-blue-500" />,
  REAL_ESTATE: <FaHome className="w-10 h-10 mb-3 text-green-500" />,
  ART: <FaPalette className="w-10 h-10 mb-3 text-purple-500" />,
  CARBON_CREDITS: <FaLeaf className="w-10 h-10 mb-3 text-emerald-500" />,
  COMMODITIES: <FaBoxes className="w-10 h-10 mb-3 text-amber-500" />
};

const AssetTypeSelection = () => {
  const { assetTypeOptions, selectAssetType, selectedAssetType } = useIssuerSetup();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Step 1: Select Asset Type</h2>
      <p className="text-gray-400 mb-8">
        Choose the type of asset you want to tokenize on the blockchain.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assetTypeOptions.map((assetType) => (
          <button
            key={assetType.id}
            onClick={() => selectAssetType(assetType.id)}
            className={`p-6 rounded-xl text-center transition-all ${
              selectedAssetType === assetType.id
                ? 'bg-blue-700 border-2 border-blue-400 shadow-lg scale-105 transform'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <div className="flex flex-col items-center justify-center">
              {assetIcons[assetType.id] || (
                <div className="w-10 h-10 rounded-full bg-blue-600 mb-3"></div>
              )}
              <h3 className="text-lg font-bold">{assetType.name}</h3>
              <p className="text-sm text-gray-400 mt-2">
                {getAssetTypeDescription(assetType.id)}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="text-xs text-gray-500 mt-8">
        <p>
          Each asset type has specific compatible blockchains and token standards
          designed for optimal performance.
        </p>
      </div>
    </div>
  );
};

// Helper function to get asset type description
function getAssetTypeDescription(assetTypeId) {
  const descriptions = {
    GOLD: 'Tokenize gold and precious metals',
    EQUITY: 'Tokenize company shares and equity',
    REAL_ESTATE: 'Tokenize real estate properties',
    ART: 'Tokenize artwork and collectibles',
    CARBON_CREDITS: 'Tokenize carbon credits and offsets',
    COMMODITIES: 'Tokenize various commodities'
  };
  
  return descriptions[assetTypeId] || 'Tokenize your assets';
}

export default AssetTypeSelection; 