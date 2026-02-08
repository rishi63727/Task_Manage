'use client';

import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import styles from './Sidebar.module.css'

interface NavItem {
  label: string
  path: string
  icon: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: '📊' },
  { label: 'Tasks', path: '/tasks', icon: '✓' },
  { label: 'Analytics', path: '/analytics', icon: '📈' },
  { label: 'Team', path: '/team', icon: '👥' },
  { label: 'Settings', path: '/settings', icon: '⚙️' },
]

function Sidebar() {
  const location = useLocation()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <>
      <button
        className={styles.mobileToggle}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        ☰
      </button>
      <aside className={`${styles.sidebar} ${isMobileOpen ? styles.open : ''}`}>
        <div className={styles.logo}>TaskMaster</div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${
                isActive(item.path) ? styles.active : ''
              }`}
              onClick={() => setIsMobileOpen(false)}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
