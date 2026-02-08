'use client';

import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import styles from './Header.module.css'
import ThemeToggle from './ThemeToggle'

function Header() {
  const { user, logout } = useAuthStore()
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = () => {
    logout()
  }

  return (
    <header className={styles.header}>
      <div className={styles.content}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <div className={styles.userSection}>
          <ThemeToggle />
          <button
            className={styles.userButton}
            onClick={() => setShowMenu(!showMenu)}
          >
            <div className={styles.avatar}>{user?.name?.[0]?.toUpperCase() || 'U'}</div>
            <span className={styles.userName}>{user?.name}</span>
          </button>

          {showMenu && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownItem}>{user?.email}</div>
              <div className={styles.dropdownDivider} />
              <button
                className={styles.dropdownItem}
                onClick={() => {
                  setShowMenu(false)
                  handleLogout()
                }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
