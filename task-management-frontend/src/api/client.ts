const API_BASE = import.meta.env.VITE_API_URL || ''

function getToken(): string | null {
  return localStorage.getItem('token')
}

export async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const res = await fetch(url, { ...options, headers })
  if (res.status === 401) {
    localStorage.removeItem('token')
    window.dispatchEvent(new CustomEvent('auth:logout'))
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const msg = typeof data.detail === 'string'
      ? data.detail
      : Array.isArray(data.detail)
        ? data.detail.map((e: { msg?: string }) => e.msg).filter(Boolean).join('; ') || 'Validation error'
        : data.message || `Request failed: ${res.status}`
    throw new Error(msg)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function requestBlob(path: string): Promise<Blob> {
  const token = getToken()
  const headers: HeadersInit = {}
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const res = await fetch(url, { headers })
  if (res.status === 401) {
    localStorage.removeItem('token')
    window.dispatchEvent(new CustomEvent('auth:logout'))
    throw new Error('Unauthorized')
  }
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.blob()
}

export function getApiBase(): string {
  return API_BASE
}
