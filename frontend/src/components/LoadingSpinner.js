import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
      <p className="text-gray-700">{message}</p>
    </div>
  );
};

export default LoadingSpinner; 