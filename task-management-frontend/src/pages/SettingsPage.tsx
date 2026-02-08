'use client';

import React from "react"

import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import styles from './SettingsPage.module.css'

function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })
  const [changePassword, setChangePassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  const [saved, setSaved] = useState(false)

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    if (user) {
      setUser({
        ...user,
        name: formData.name,
        email: formData.email,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.new === passwordData.confirm) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      setChangePassword(false)
      setPasswordData({ current: '', new: '', confirm: '' })
    }
  }

  return (
    <div className={styles.settingsPage}>
      <h1>Settings</h1>

      <div className={styles.settingsContainer}>
        <div className={styles.card}>
          <h2>Profile Information</h2>
          <form onSubmit={handleSaveProfile} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleProfileChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleProfileChange}
              />
            </div>

            {saved && <p className={styles.success}>Settings saved!</p>}

            <button type="submit" className={styles.submitButton}>
              Save Changes
            </button>
          </form>
        </div>

        <div className={styles.card}>
          <h2>Security</h2>
          <div className={styles.securitySection}>
            <p>
              Keep your account secure by changing your password regularly.
            </p>

            {!changePassword ? (
              <button
                className={styles.changePasswordButton}
                onClick={() => setChangePassword(true)}
              >
                Change Password
              </button>
            ) : (
              <form onSubmit={handlePasswordChange} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="current">Current Password</label>
                  <input
                    id="current"
                    type="password"
                    value={passwordData.current}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        current: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="new">New Password</label>
                  <input
                    id="new"
                    type="password"
                    value={passwordData.new}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        new: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="confirm">Confirm Password</label>
                  <input
                    id="confirm"
                    type="password"
                    value={passwordData.confirm}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirm: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                {saved && <p className={styles.success}>Password updated!</p>}

                <div className={styles.formActions}>
                  <button type="submit" className={styles.submitButton}>
                    Update Password
                  </button>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => setChangePassword(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <h2>Preferences</h2>
          <div className={styles.preferenceGroup}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" defaultChecked />
              Email notifications for task assignments
            </label>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" defaultChecked />
              Daily task digest
            </label>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" />
              Weekly activity report
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
