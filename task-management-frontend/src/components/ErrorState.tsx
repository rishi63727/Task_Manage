import React from 'react';

interface ErrorStateProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ title = 'Something went wrong', message, actionLabel, onAction }) => (
  <div className="state state-error">
    <h3>{title}</h3>
    <p>{message}</p>
    {actionLabel && onAction && (
      <button className="btn btn-primary" onClick={onAction}>
        {actionLabel}
      </button>
    )}
  </div>
);

export default ErrorState;
