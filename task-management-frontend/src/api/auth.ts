import { request } from './client'
import type { AuthResponse, User } from '../types'

export const authAPI = {
  async register(email: string, password: string): Promise<AuthResponse> {
    const data = await request<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (data.access_token) localStorage.setItem('token', data.access_token)
    return data
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await request<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (data.access_token) localStorage.setItem('token', data.access_token)
    return data
  },

  async getMe(): Promise<User> {
    return request<User>('/api/v1/auth/me')
  },

  logout(): void {
    localStorage.removeItem('token')
  },
}
