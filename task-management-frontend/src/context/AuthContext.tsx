import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authAPI } from '../api'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem('token')) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const me = await authAPI.getMe()
      setUser(me)
    } catch {
      setUser(null)
      authAPI.logout()
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  useEffect(() => {
    const onLogout = () => setUser(null)
    window.addEventListener('auth:logout', onLogout)
    return () => window.removeEventListener('auth:logout', onLogout)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await authAPI.login(email, password)
    setUser(data.user)
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const data = await authAPI.register(email, password)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    authAPI.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser }),
    [user, loading, login, register, logout, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
