import React from 'react';

interface LoadingProps {
  message?: string;
}

const Loading: React.FC<LoadingProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="spinner-container">
      <div className="flex flex-col items-center gap-4">
        <div className="spinner"></div>
        <p className="text-secondary">{message}</p>
      </div>
    </div>
  );
};

export default Loading;
