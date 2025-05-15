import React from 'react';
import { useNavigate } from 'react-router-dom';

function KYCVerificationButton({ 
  kycStatus = 'pending', 
  returnUrl = '', 
  buttonText = 'KYC Verification',
  className = ''
}) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate('/kyc-verification', { 
      state: { 
        returnUrl: returnUrl || window.location.pathname 
      } 
    });
  };
  
  // Determine button color based on KYC status
  let buttonColor = 'bg-blue-600 hover:bg-blue-700 text-white';
  
  if (kycStatus === 'completed') {
    buttonColor = 'bg-green-600 hover:bg-green-700 text-white';
  } else if (kycStatus === 'failed') {
    buttonColor = 'bg-red-600 hover:bg-red-700 text-white';
  }
  
  return (
    <button
      onClick={handleClick}
      className={`flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium ${buttonColor} ${className}`}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-5 w-5 mr-2" 
        viewBox="0 0 20 20" 
        fill="currentColor"
      >
        <path 
          fillRule="evenodd" 
          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" 
          clipRule="evenodd" 
        />
      </svg>
      {buttonText}
    </button>
  );
}

export default KYCVerificationButton; 