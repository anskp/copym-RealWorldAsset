import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { motion } from 'framer-motion';

const AdminWalletDetails = ({ walletId, onBack }) => {
  const [wallet, setWallet] = useState(null);
  const [balanceData, setBalanceData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('balance');

  useEffect(() => {
    fetchWalletDetails();
  }, [walletId]);

  const fetchWalletDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/wallets/${walletId}`);
      setWallet(response.data);
      
      // Once we have the wallet, fetch balance and transactions
      await Promise.all([
        fetchBalanceData(response.data.address),
        fetchTransactions(response.data.address)
      ]);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching wallet details:', err);
      setError('Failed to load wallet details. Please try again later.');
      setLoading(false);
    }
  };
  
  const fetchBalanceData = async (address) => {
    try {
      const response = await api.get(`/admin/wallets/${walletId}/balance`);
      
      if (response.data && response.data.balances) {
        setBalanceData(response.data.balances);
      }
    } catch (err) {
      console.error('Error fetching wallet balance:', err);
      // We'll show an error message in the UI but not stop the entire component
    }
  };
  
  const fetchTransactions = async (address) => {
    try {
      const response = await api.get(`/admin/wallets/${walletId}/transactions`);
      
      if (response.data && response.data.transactions) {
        setTransactions(response.data.transactions);
      }
    } catch (err) {
      console.error('Error fetching wallet transactions:', err);
      // We'll show an error message in the UI but not stop the entire component
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const truncateAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
  
  if (error) return (
    <div className="text-red-500 text-center mt-8 p-4 bg-red-50 rounded-lg">
      <p>{error}</p>
      <button 
        onClick={fetchWalletDetails}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
      >
        Try Again
      </button>
    </div>
  );
  
  if (!wallet) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-md overflow-hidden"
    >
      {/* Header with Back Button */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Wallet Details</h2>
          <p className="text-gray-500 text-sm mt-1">Detailed information for wallet #{walletId}</p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition flex items-center"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Wallets
        </button>
      </div>
      
      {/* Wallet Info Card */}
      <div className="p-6 border-b border-gray-200">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Wallet Address</h3>
              <div className="mt-1 flex items-center">
                <span className="text-lg font-mono">{wallet.address}</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(wallet.address)}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                  title="Copy address"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Owner</h3>
              <p className="mt-1 text-lg">{wallet.user.first_name} {wallet.user.last_name}</p>
              <p className="text-sm text-gray-500">{wallet.user.email}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Wallet Type</h3>
              <p className="mt-1 text-lg">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  wallet.type.includes('smart') ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {wallet.type}
                </span>
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created At</h3>
              <p className="mt-1 text-lg">{formatDate(wallet.created_at)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Blockchain</h3>
              <p className="mt-1 text-lg">{wallet.chain.toUpperCase()}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Custodial</h3>
              <p className="mt-1 text-lg">
                {wallet.is_custodial ? (
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Yes
                  </span>
                ) : (
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    No
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          <button
            className={`py-4 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'balance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('balance')}
          >
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Balance
            </div>
          </button>
          <button
            className={`py-4 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('transactions')}
          >
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Transactions
            </div>
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="p-6"
      >
        {/* Balance Tab Content */}
        {activeTab === 'balance' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Wallet Balance</h3>
            {balanceData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {balanceData.map((balance, index) => (
                  <div key={index} className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">{balance.token.toUpperCase()}</h4>
                        <p className="mt-1 text-2xl font-bold">
                          {parseFloat(balance.amount).toFixed(balance.token === 'eth' ? 6 : 2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Chain: {balance.chain}
                        </p>
                      </div>
                      <div className={`p-2 rounded-full ${
                        balance.token === 'eth' ? 'bg-blue-100' : 
                        balance.token === 'usdc' ? 'bg-green-100' : 
                        'bg-yellow-100'
                      }`}>
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          balance.token === 'eth' ? 'text-blue-600' : 
                          balance.token === 'usdc' ? 'text-green-600' : 
                          'text-yellow-600'
                        }`}>
                          {balance.token === 'eth' ? 'ETH' : 
                           balance.token === 'usdc' ? 'USDC' : 
                           balance.token.toUpperCase().substring(0, 4)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No balance data</h3>
                <p className="mt-1 text-sm text-gray-500">No balance information is available for this wallet.</p>
                <div className="mt-6">
                  <button
                    onClick={() => fetchBalanceData(wallet.address)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Balance
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Transactions Tab Content */}
        {activeTab === 'transactions' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
            
            {transactions.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction Hash
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((tx, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <a 
                            href={`https://testnet.snowtrace.io/tx/${tx.hash}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-800"
                          >
                            {truncateAddress(tx.hash)}
                            <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            tx.from.toLowerCase() === wallet.address.toLowerCase() 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {tx.from.toLowerCase() === wallet.address.toLowerCase() ? 'Sent' : 'Received'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tx.value} {tx.token.toUpperCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            tx.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                            tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(tx.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
                <p className="mt-1 text-sm text-gray-500">This wallet has no transaction history yet.</p>
                <div className="mt-6">
                  <button
                    onClick={() => fetchTransactions(wallet.address)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Transactions
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AdminWalletDetails; 