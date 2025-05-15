import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../utils/axios';
import KYCVerificationButton from '../kyc/KYCVerificationButton';

const InvestorDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [kycStatus, setKycStatus] = useState('pending');
  const [kycMessage, setKycMessage] = useState('');
  const location = useLocation();

  useEffect(() => {
    // Check if KYC was just completed
    if (location.state?.kycCompleted) {
      setKycStatus('completed');
      setKycMessage('KYC verification completed successfully!');
      // Show the success message for 5 seconds
      setTimeout(() => {
        setKycMessage('');
      }, 5000);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch user profile data
        const profileResponse = await api.get('/investor/profile');
        
        // Fetch available offerings
        const offeringsResponse = await api.get('/investor/offerings');
        
        // Check KYC status
        if (profileResponse.data?.kyc_status) {
          setKycStatus(profileResponse.data.kyc_status);
        } else if (profileResponse.data?.profile?.kyc_verified) {
          setKycStatus('completed');
        }
        
        setUserData(profileResponse.data);
        setOfferings(offeringsResponse.data.offerings || []);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data. Please try again later.');
        setLoading(false);
        console.error('Error fetching investor data:', err);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="text-center mt-8">Loading...</div>;
  if (error) return <div className="text-red-500 text-center mt-8">{error}</div>;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {kycMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative">
            <span className="block sm:inline">{kycMessage}</span>
            <button 
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setKycMessage('')}
            >
              <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
              </svg>
            </button>
          </div>
        )}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-1/4">
            <div className="bg-white shadow rounded-lg p-4">
              <div className="text-center mb-6">
                <div className="h-24 w-24 rounded-full bg-green-500 flex items-center justify-center text-white text-3xl font-bold mx-auto">
                  {userData?.profile?.first_name?.charAt(0) || 'I'}
                </div>
                <h2 className="mt-2 font-bold text-xl">
                  {userData?.profile ? `${userData.profile.first_name} ${userData.profile.last_name}` : 'Investor'}
                </h2>
                <p className="text-gray-600 text-sm">{userData?.email}</p>
                <div className="mt-2 inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Verified Investor
                </div>
                
                {/* Add KYC Verification button */}
                <div className="mt-3">
                  <KYCVerificationButton 
                    kycStatus={kycStatus}
                    returnUrl="/investor/dashboard"
                    buttonText={kycStatus === 'completed' ? 'KYC Verified' : 'KYC Verification'}
                    className="w-full justify-center"
                  />
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <nav>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`w-full text-left px-4 py-2 rounded-lg mb-1 flex items-center ${
                      activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="material-icons-outlined mr-3">dashboard</span>
                    Dashboard
                  </button>
                  <button
                    onClick={() => setActiveTab('investments')}
                    className={`w-full text-left px-4 py-2 rounded-lg mb-1 flex items-center ${
                      activeTab === 'investments' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="material-icons-outlined mr-3">savings</span>
                    My Investments
                  </button>
                  <button
                    onClick={() => setActiveTab('offerings')}
                    className={`w-full text-left px-4 py-2 rounded-lg mb-1 flex items-center ${
                      activeTab === 'offerings' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="material-icons-outlined mr-3">storefront</span>
                    Offerings
                  </button>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full text-left px-4 py-2 rounded-lg mb-1 flex items-center ${
                      activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="material-icons-outlined mr-3">person</span>
                    Profile
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full md:w-3/4">
            {activeTab === 'dashboard' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h1 className="text-2xl font-bold mb-6">Investor Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-600">Active Investments</h3>
                    <p className="text-3xl font-bold mt-2">3</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-600">Total Invested</h3>
                    <p className="text-3xl font-bold mt-2">$25,000</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-600">Portfolio Value</h3>
                    <p className="text-3xl font-bold mt-2">$28,500</p>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-6">
                  <h2 className="text-xl font-bold mb-4">Recent Activities</h2>
                  <ul className="space-y-3">
                    <li className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between">
                        <span>Invested in Project Beta</span>
                        <span className="text-sm text-gray-500">2 days ago</span>
                      </div>
                      <p className="text-green-600 font-semibold">$5,000</p>
                    </li>
                    <li className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between">
                        <span>Dividend payment received</span>
                        <span className="text-sm text-gray-500">1 week ago</span>
                      </div>
                      <p className="text-green-600 font-semibold">$250</p>
                    </li>
                    <li className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between">
                        <span>Completed KYC verification</span>
                        <span className="text-sm text-gray-500">2 weeks ago</span>
                      </div>
                      <p className="text-blue-600">Verification approved</p>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'investments' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h1 className="text-2xl font-bold mb-6">My Investments</h1>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="py-3 px-4 text-left">Project</th>
                        <th className="py-3 px-4 text-left">Issuer</th>
                        <th className="py-3 px-4 text-left">Amount</th>
                        <th className="py-3 px-4 text-left">Date</th>
                        <th className="py-3 px-4 text-left">Status</th>
                        <th className="py-3 px-4 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4">
                          <div className="font-semibold">Project Alpha</div>
                          <div className="text-sm text-gray-500">Commercial Real Estate</div>
                        </td>
                        <td className="py-3 px-4">Alpha Properties LLC</td>
                        <td className="py-3 px-4">$10,000</td>
                        <td className="py-3 px-4">Jan 15, 2023</td>
                        <td className="py-3 px-4">
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Active
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button className="text-blue-600 hover:text-blue-800">
                            Details
                          </button>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4">
                          <div className="font-semibold">Project Beta</div>
                          <div className="text-sm text-gray-500">Renewable Energy</div>
                        </td>
                        <td className="py-3 px-4">Beta Green Energy Inc.</td>
                        <td className="py-3 px-4">$5,000</td>
                        <td className="py-3 px-4">Mar 22, 2023</td>
                        <td className="py-3 px-4">
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Active
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button className="text-blue-600 hover:text-blue-800">
                            Details
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4">
                          <div className="font-semibold">Project Gamma</div>
                          <div className="text-sm text-gray-500">Technology Startup</div>
                        </td>
                        <td className="py-3 px-4">Gamma Tech Solutions</td>
                        <td className="py-3 px-4">$10,000</td>
                        <td className="py-3 px-4">Nov 5, 2022</td>
                        <td className="py-3 px-4">
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Active
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button className="text-blue-600 hover:text-blue-800">
                            Details
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'offerings' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h1 className="text-2xl font-bold mb-6">Available Offerings</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {offerings.length > 0 ? (
                    offerings.map((offering, index) => (
                      <div key={index} className="border rounded-lg overflow-hidden shadow-sm">
                        <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                          <img 
                            src={offering.image_url || "https://via.placeholder.com/300x169?text=Project+Image"} 
                            alt={offering.title} 
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-lg mb-1">{offering.title}</h3>
                          <p className="text-sm text-gray-500 mb-2">{offering.issuer}</p>
                          <p className="text-sm mb-3 line-clamp-2">{offering.description}</p>
                          <div className="flex justify-between mb-3">
                            <div>
                              <p className="text-xs text-gray-500">Target</p>
                              <p className="font-semibold">${offering.target_amount}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Raised</p>
                              <p className="font-semibold">${offering.raised_amount}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Min. Investment</p>
                              <p className="font-semibold">${offering.min_investment}</p>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ width: `${(offering.raised_amount / offering.target_amount) * 100}%` }}
                            ></div>
                          </div>
                          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">
                            View Details
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-12">
                      <p className="text-gray-500">No offerings available at this time.</p>
                      <p className="mt-2">Please check back later for new investment opportunities.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h1 className="text-2xl font-bold mb-6">Investor Profile</h1>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">First Name</p>
                      <p className="font-medium">{userData?.profile?.first_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Name</p>
                      <p className="font-medium">{userData?.profile?.last_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{userData?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{userData?.profile?.phone}</p>
                    </div>
                  </div>
                </div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-4">Accreditation Status</h2>
                  <div className="flex items-center">
                    <div className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full mr-3">
                      Accredited Investor
                    </div>
                    <p className="text-sm text-gray-500">Verified on {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-4">Investment Preferences</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Investment Goal</p>
                      <p className="font-medium">Growth</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Risk Tolerance</p>
                      <p className="font-medium">Moderate</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Investment Horizon</p>
                      <p className="font-medium">5-10 years</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Preferred Sectors</p>
                      <p className="font-medium">Real Estate, Technology, Renewable Energy</p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-6">
                  <div className="flex justify-between">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow">
                      Edit Profile
                    </button>
                    <button className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg shadow">
                      Update Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorDashboard; 