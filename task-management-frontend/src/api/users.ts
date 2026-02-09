import { request } from './client'
import type { User } from '../types'

export const usersAPI = {
  getUsers(): Promise<User[]> {
    return request<User[]>('/api/v1/users')
  },
}
