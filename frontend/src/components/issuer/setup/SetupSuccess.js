import React from 'react';
import { FaCheckCircle, FaWallet, FaFileContract, FaArrowRight } from 'react-icons/fa';

const SetupSuccess = ({ setupResult, onContinue }) => {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-6">
        <FaCheckCircle className="text-green-500 w-20 h-20" />
      </div>
      
      <h2 className="text-3xl font-bold mb-4">Setup Completed!</h2>
      
      <p className="text-gray-400 mb-10 text-lg">
        Your vault has been successfully created and your tokenization platform is ready to use.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-gray-700 p-6 rounded-xl">
          <div className="flex items-center mb-4">
            <FaWallet className="text-blue-500 mr-3" />
            <h3 className="text-xl font-bold">Vault Details</h3>
          </div>
          
          <div className="space-y-3 text-left">
            <div>
              <p className="text-sm text-gray-400">Vault ID</p>
              <p className="font-mono bg-gray-800 p-1 rounded text-sm overflow-x-auto">
                {setupResult?.vault?.id || 'N/A'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">Vault Name</p>
              <p className="font-medium">
                {setupResult?.vault?.name || 'Your Vault'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">Wallet Address</p>
              <p className="font-mono bg-gray-800 p-1 rounded text-sm overflow-x-auto">
                {setupResult?.wallet?.address || '0x0000...0000'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">Blockchain</p>
              <p className="font-medium">
                {setupResult?.wallet?.chain || 'N/A'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-700 p-6 rounded-xl">
          <div className="flex items-center mb-4">
            <FaFileContract className="text-green-500 mr-3" />
            <h3 className="text-xl font-bold">Token Details</h3>
          </div>
          
          <div className="space-y-3 text-left">
            <div>
              <p className="text-sm text-gray-400">Token Name</p>
              <p className="font-medium">
                {setupResult?.token?.name || 'Your Token'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">Token Symbol</p>
              <p className="font-medium">
                {setupResult?.token?.symbol || 'TKN'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">Token Standard</p>
              <p className="font-medium">
                {setupResult?.token?.standard || 'N/A'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">Contract Address</p>
              <p className="font-mono bg-gray-800 p-1 rounded text-sm overflow-x-auto">
                {setupResult?.token?.contractAddress || '0x0000...0000'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-900 p-6 rounded-xl mb-10">
        <h3 className="font-bold text-lg mb-2">What's Next?</h3>
        <p className="text-gray-300">
          Your tokenization platform is now ready. You can start creating offerings, 
          inviting investors, and managing your assets through the dashboard.
        </p>
      </div>
      
      <button
        onClick={onContinue}
        className="flex items-center justify-center space-x-2 mx-auto bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
      >
        <span>Continue to Dashboard</span>
        <FaArrowRight />
      </button>
    </div>
  );
};

export default SetupSuccess; 