import { create } from 'zustand'
import { authAPI } from '../api'

export interface User {
  id: string | number
  email: string
  name?: string
  role?: 'admin' | 'manager' | 'member'
  avatar?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => {
  // Initialize from localStorage if available
  const storedToken = localStorage.getItem('access_token')
  const storedUser = localStorage.getItem('user')
  const user = storedUser ? JSON.parse(storedUser) : null

  return {
    user,
    token: storedToken || null,
    isAuthenticated: !!storedToken,
    isLoading: false,
    error: null,

    login: async (email: string, password: string) => {
      set({ isLoading: true, error: null })

      try {
        const response = await authAPI.login(email, password)

        const { access_token, user } = response

        localStorage.setItem('access_token', access_token)
        localStorage.setItem('user', JSON.stringify(user))

        set({
          user,
          token: access_token,
          isAuthenticated: true,
          isLoading: false,
        })
      } catch (error: any) {
        set({
          error: error?.response?.data?.detail || 'Login failed',
          isLoading: false,
        })
        throw error
      }
    },

    register: async (email: string, password: string) => {
      set({ isLoading: true, error: null })

      try {
        const response = await authAPI.register(email, password)

        const { access_token, user } = response

        localStorage.setItem('access_token', access_token)
        localStorage.setItem('user', JSON.stringify(user))

        set({
          user,
          token: access_token,
          isAuthenticated: true,
          isLoading: false,
        })
      } catch (error: any) {
        set({
          error: error?.response?.data?.detail || 'Registration failed',
          isLoading: false,
        })
        throw error
      }
    },

    logout: () => {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      })
    },

    setUser: (user: User) => {
      localStorage.setItem('user', JSON.stringify(user))
      set({ user })
    },

    clearError: () => {
      set({ error: null })
    },
  }
})
