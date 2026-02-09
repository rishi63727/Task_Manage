import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import ThemeToggle from './ThemeToggle';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span>Autonomize</span>
          <small>Task OS</small>
        </div>
        <nav>
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/tasks">Tasks</NavLink>
          <NavLink to="/analytics">Analytics</NavLink>
          <NavLink to="/profile">Profile</NavLink>
        </nav>
        <div className="sidebar-footer">
          <ThemeToggle />
          <button className="btn btn-ghost" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div>
            <span className="status-dot" />
            <span className="topbar-label">Realtime sync enabled</span>
          </div>
          <div className="topbar-user">
            <div>
              <strong>{user?.email || 'Loading…'}</strong>
              <span>Workspace owner</span>
            </div>
            <div className="avatar">{user?.email?.[0]?.toUpperCase() || 'U'}</div>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
