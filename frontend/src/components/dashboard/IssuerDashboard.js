import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/axios';
import { useIssuerSetup } from '../../contexts/IssuerSetupContext';
import IssuerWallet from '../wallet/IssuerWallet';
import IssuerKYC from '../kyc/IssuerKYC';
import { useAuth } from '../../context/AuthContext';

const IssuerDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [issuingVC, setIssuingVC] = useState(false);
  const [vcMessage, setVcMessage] = useState(null);
  const navigate = useNavigate();
  const { setupCompleted, isLoading: isSetupLoading } = useIssuerSetup();
  const { user } = useAuth();

  useEffect(() => {
    // If setup is not completed and not currently loading, redirect to setup page
    if (!isSetupLoading && setupCompleted === false) {
      navigate('/issuer/setup');
    }
  }, [setupCompleted, isSetupLoading, navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Get the token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Not authenticated. Please log in again.');
          setLoading(false);
          return;
        }
        
        const response = await api.get('/issuer/profile');
        
        setUserData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch user data. Please try again later.');
        setLoading(false);
        console.error('Error fetching issuer profile:', err);
      }
    };

    fetchUserData();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleIssueCredential = async () => {
    try {
      setIssuingVC(true);
      setVcMessage(null);
      
      console.log('Starting credential issuance process');
      
      // Get token from localStorage to ensure it's fresh
      const token = localStorage.getItem('token');
      if (!token) {
        setVcMessage({
          type: 'error',
          text: 'Authentication required. Please log in again.'
        });
        return;
      }
      
      // Call the backend API to issue the VC to the issuer's wallet
      const response = await api.post('/issuer-vc', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Credential issuance response:', response.data);
      
      setVcMessage({
        type: 'success',
        text: `Credential successfully issued! Transaction ID: ${response.data.actionId || response.data.id}`
      });
    } catch (err) {
      console.error('Error issuing VC:', err);
      
      if (err.response?.status === 401) {
        // Handle authentication errors
        localStorage.removeItem('token'); // Clear invalid token
        setVcMessage({
          type: 'error',
          text: 'Authentication required. Please log in again.'
        });
      } else if (err.response?.status === 404) {
        // Handle missing issuer profile
        setVcMessage({
          type: 'error',
          text: 'Issuer profile not found. Please complete your profile setup.'
        });
      } else if (err.response?.status === 400 && err.response?.data?.message?.includes('wallet')) {
        // Handle missing wallet
        setVcMessage({
          type: 'error',
          text: 'You need to create a wallet first. Please visit the Wallet tab.'
        });
      } else if ((err.response?.status === 403 && err.response?.data?.message?.includes('verification')) ||
                (err.response?.status === 400 && err.response?.data?.message?.includes('verified'))) {
        // Handle verification issues - try to update verification status automatically
        try {
          setVcMessage({
            type: 'warning',
            text: 'Attempting to update verification status...'
          });
          
          // Get token again to ensure it's in scope
          const authToken = localStorage.getItem('token');
          if (!authToken) {
            setVcMessage({
              type: 'error',
              text: 'Authentication required. Please log in again.'
            });
            return;
          }
          
          // Call the endpoint to force update verification status
          await api.post('/issuer/update-verification', {}, {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          });
          
          // Try issuing the credential again after updating verification status
          const retryResponse = await api.post('/issuer-vc', {}, {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          });
          
          console.log('Credential issuance retry response:', retryResponse.data);
          
          setVcMessage({
            type: 'success',
            text: `Credential successfully issued after verification update! Transaction ID: ${retryResponse.data.actionId || retryResponse.data.id}`
          });
          
          return;
        } catch (retryErr) {
          console.error('Error during verification update and retry:', retryErr);
        setVcMessage({
          type: 'error',
          text: 'Your account needs to be verified first. Please complete KYC verification.'
        });
        }
      } else {
        // Handle other errors
        setVcMessage({
          type: 'error',
          text: err.response?.data?.message || 'Failed to issue credential. Please try again.'
        });
      }
    } finally {
      setIssuingVC(false);
    }
  };

  if (loading) return <div className="text-center mt-8">Loading...</div>;
  if (error) return <div className="text-red-500 text-center mt-8">{error}</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-1/4">
            <div className="bg-white shadow rounded-lg p-4">
              <div className="text-center mb-6">
                <div className="h-24 w-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-bold mx-auto">
                  {userData?.profile?.company_name?.charAt(0) || 'I'}
                </div>
                <h2 className="mt-2 font-bold text-xl">{userData?.profile?.company_name || 'Issuer'}</h2>
                <p className="text-gray-600 text-sm">{userData?.email}</p>
                <div className="mt-2 inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Verified Issuer
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <nav>
                  <button
                    onClick={() => handleTabChange('dashboard')}
                    className={`w-full text-left px-4 py-2 rounded-lg mb-1 flex items-center ${
                      activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="material-icons-outlined mr-3">Dashboard</span>
                  </button>
                  <button
                    onClick={() => handleTabChange('wallet')}
                    className={`w-full text-left px-4 py-2 rounded-lg mb-1 flex items-center ${
                      activeTab === 'wallet' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="material-icons-outlined mr-3">Wallet</span>
                  </button>
                  <Link
                    to="/issuer/setup"
                    className="w-full text-left px-4 py-2 rounded-lg mb-1 flex items-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                    onClick={(e) => {
                      // Add a fallback navigation if Link doesn't work
                      console.log('Asset Setup button clicked');
                      
                      // Don't prevent default behavior - let Link work normally
                      // Just add safety navigation as a backup
                      setTimeout(() => {
                        console.log('Checking if navigation occurred');
                        if (window.location.pathname !== '/issuer/setup') {
                          console.log('Fallback navigation to /issuer/setup');
                          navigate('/issuer/setup');
                        }
                      }, 500);
                    }}
                  >
                    <span className="material-icons-outlined mr-3">Settings</span>
                    <span>Asset Setup</span>
                  </Link>
                  <button
                    onClick={() => handleTabChange('kyc')}
                    className={`w-full text-left px-4 py-2 rounded-lg mb-1 flex items-center ${
                      activeTab === 'kyc' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="material-icons-outlined mr-3">KYC Verification</span>
                  </button>
                  <button
                    onClick={handleIssueCredential}
                    className={`w-full text-left px-4 py-2 rounded-lg mb-1 flex items-center text-blue-600 hover:bg-blue-50`}
                    disabled={issuingVC}
                  >
                    <span className="material-icons-outlined mr-3">Issue Credential</span>
                    {issuingVC && <span className="ml-auto text-xs">Processing...</span>}
                  </button>
                  <button
                    onClick={() => handleTabChange('offerings')}
                    className={`w-full text-left px-4 py-2 rounded-lg mb-1 flex items-center ${
                      activeTab === 'offerings' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="material-icons-outlined mr-3">Storefront</span>
                  </button>
                  <button
                    onClick={() => handleTabChange('profile')}
                    className={`w-full text-left px-4 py-2 rounded-lg mb-1 flex items-center ${
                      activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="material-icons-outlined mr-3">Person</span>
                  </button>
                </nav>
              </div>
              
              {/* VC Status Message */}
              {vcMessage && (
                <div className={`mt-4 p-3 rounded ${vcMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {vcMessage.text}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full md:w-3/4">
            {activeTab === 'dashboard' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h1 className="text-2xl font-bold mb-6">Issuer Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-600">Active Offerings</h3>
                    <p className="text-3xl font-bold mt-2">2</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-600">Total Raised</h3>
                    <p className="text-3xl font-bold mt-2">$250,000</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-600">Investors</h3>
                    <p className="text-3xl font-bold mt-2">42</p>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-6">
                  <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                  <ul className="space-y-3">
                    <li className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between">
                        <span>New investment in Project Alpha</span>
                        <span className="text-sm text-gray-500">2 hours ago</span>
                      </div>
                      <p className="text-green-600 font-semibold">+$10,000</p>
                    </li>
                    <li className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between">
                        <span>Document verification approved</span>
                        <span className="text-sm text-gray-500">Yesterday</span>
                      </div>
                      <p className="text-blue-600">Project Beta prospectus</p>
                    </li>
                    <li className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between">
                        <span>New offering created</span>
                        <span className="text-sm text-gray-500">3 days ago</span>
                      </div>
                      <p className="text-blue-600">Project Beta</p>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'wallet' && (
              <div>
                <IssuerWallet />
              </div>
            )}

            {activeTab === 'kyc' && (
              <IssuerKYC />
            )}

            {activeTab === 'offerings' && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">My Offerings</h1>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow">
                    + New Offering
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="py-3 px-4 text-left">Offering</th>
                        <th className="py-3 px-4 text-left">Status</th>
                        <th className="py-3 px-4 text-left">Target</th>
                        <th className="py-3 px-4 text-left">Raised</th>
                        <th className="py-3 px-4 text-left">Investors</th>
                        <th className="py-3 px-4 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4">
                          <div className="font-semibold">Project Alpha</div>
                          <div className="text-sm text-gray-500">Created 2 months ago</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Active
                          </span>
                        </td>
                        <td className="py-3 px-4">$500,000</td>
                        <td className="py-3 px-4">$230,000</td>
                        <td className="py-3 px-4">27</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-800">
                              View
                            </button>
                            <button className="text-blue-600 hover:text-blue-800">
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4">
                          <div className="font-semibold">Project Beta</div>
                          <div className="text-sm text-gray-500">Created 5 days ago</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Active
                          </span>
                        </td>
                        <td className="py-3 px-4">$350,000</td>
                        <td className="py-3 px-4">$20,000</td>
                        <td className="py-3 px-4">15</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-800">
                              View
                            </button>
                            <button className="text-blue-600 hover:text-blue-800">
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4">
                          <div className="font-semibold">Project Gamma</div>
                          <div className="text-sm text-gray-500">Created 6 months ago</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                            Completed
                          </span>
                        </td>
                        <td className="py-3 px-4">$200,000</td>
                        <td className="py-3 px-4">$200,000</td>
                        <td className="py-3 px-4">31</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-800">
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h1 className="text-2xl font-bold mb-6">My Profile</h1>
                <p>Profile management coming soon.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssuerDashboard;