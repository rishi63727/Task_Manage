import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>
          <Link to="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>Task Manager</Link>
        </h1>
        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/tasks">Tasks</Link>
          <Link to="/analytics">Analytics</Link>
          <Link to="/profile">Profile</Link>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{user?.email}</span>
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  )
}
