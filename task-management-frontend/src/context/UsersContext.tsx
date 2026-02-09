import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { usersAPI } from '../api'
import { useAuth } from './AuthContext'
import type { User } from '../types'

interface UsersContextValue {
  users: User[]
  getUserEmail: (id?: number | null) => string
}

const UsersContext = createContext<UsersContextValue | null>(null)

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    if (!user) {
      setUsers([])
      return
    }
    usersAPI.getUsers().then(setUsers).catch(() => setUsers([]))
  }, [user])

  const getUserEmail = useCallback(
    (id?: number | null) => users.find((u) => u.id === id)?.email ?? 'Unassigned',
    [users]
  )

  const value: UsersContextValue = { users, getUserEmail }

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>
}

export function useUsers(): UsersContextValue {
  const ctx = useContext(UsersContext)
  if (!ctx) {
    return {
      users: [],
      getUserEmail: () => 'Unassigned',
    }
  }
  return ctx
}
