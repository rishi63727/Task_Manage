import React from 'react';

interface LoadingStateProps {
  label?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ label = 'Loading…' }) => (
  <div className="state state-loading">
    <div className="spinner" />
    <p>{label}</p>
  </div>
);

export default LoadingState;
