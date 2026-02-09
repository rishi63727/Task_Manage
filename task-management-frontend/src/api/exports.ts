import { getApiBase } from './client'

const API_BASE = getApiBase()

export interface ExportParams {
  format: 'csv' | 'json'
  completed?: boolean
  priority?: string
  limit?: number
  offset?: number
}

export const exportsAPI = {
  getExportUrl(params: ExportParams): string {
    const sp = new URLSearchParams()
    sp.set('format', params.format)
    if (params.completed != null) sp.set('completed', String(params.completed))
    if (params.priority) sp.set('priority', params.priority)
    if (params.limit != null) sp.set('limit', String(params.limit))
    if (params.offset != null) sp.set('offset', String(params.offset))
    const token = localStorage.getItem('token')
    let url = `${API_BASE}/api/v1/tasks/export?${sp.toString()}`
    if (token) url += `&token=${encodeURIComponent(token)}`
    return url
  },

  async downloadExport(params: ExportParams): Promise<void> {
    const token = localStorage.getItem('token')
    const sp = new URLSearchParams()
    sp.set('format', params.format)
    if (params.completed != null) sp.set('completed', String(params.completed))
    if (params.priority) sp.set('priority', params.priority)
    if (params.limit != null) sp.set('limit', String(params.limit))
    if (params.offset != null) sp.set('offset', String(params.offset))
    const res = await fetch(`${API_BASE}/api/v1/tasks/export?${sp.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) throw new Error(`Export failed: ${res.status}`)
    const blob = await res.blob()
    const ext = params.format === 'csv' ? 'csv' : 'json'
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `tasks_export.${ext}`
    a.click()
    URL.revokeObjectURL(a.href)
  },
}
