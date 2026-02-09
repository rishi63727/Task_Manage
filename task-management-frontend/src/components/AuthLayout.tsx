import React from 'react';

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="auth-layout">
    <div className="auth-panel">
      <div className="brand brand-auth">
        <span>Autonomize</span>
        <small>Sign in to keep work flowing</small>
      </div>
      {children}
    </div>
    <div className="auth-aside">
      <div className="auth-aside-inner">
        <h2>Focus your team on outcomes.</h2>
        <p>Automated triage, real-time updates, and analytics that move projects forward.</p>
        <ul>
          <li>AI-ready task summaries</li>
          <li>Adaptive priorities</li>
          <li>Integrated file delivery</li>
        </ul>
      </div>
    </div>
  </div>
);

export default AuthLayout;
