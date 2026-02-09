import { request, getApiBase } from './client'
import type { FileRecord } from '../types'

const API_BASE = getApiBase()

export const filesAPI = {
  getTaskFiles(taskId: number): Promise<FileRecord[]> {
    return request<FileRecord[]>(`/api/v1/tasks/${taskId}/files`)
  },

  uploadTaskFile(taskId: number, file: File): Promise<FileRecord> {
    const form = new FormData()
    form.append('file', file)
    const token = localStorage.getItem('token')
    const headers: HeadersInit = {}
    if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    return fetch(`${API_BASE}/api/v1/tasks/${taskId}/files`, {
      method: 'POST',
      headers,
      body: form,
    }).then(async (res) => {
      if (res.status === 401) {
        localStorage.removeItem('token')
        window.dispatchEvent(new CustomEvent('auth:logout'))
        throw new Error('Unauthorized')
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || data.message || `Upload failed: ${res.status}`)
      }
      return res.json()
    })
  },

  async downloadFile(fileId: number, filename: string): Promise<void> {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/api/v1/files/${fileId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (res.status === 401) {
      localStorage.removeItem('token')
      window.dispatchEvent(new CustomEvent('auth:logout'))
      throw new Error('Unauthorized')
    }
    if (!res.ok) throw new Error(`Download failed: ${res.status}`)
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    a.click()
    URL.revokeObjectURL(a.href)
  },

  deleteFile(fileId: number): Promise<void> {
    return request<void>(`/api/v1/files/${fileId}`, { method: 'DELETE' })
  },
}
