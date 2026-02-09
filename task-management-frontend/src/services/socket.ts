/**
 * WebSocket client for real-time task events (TASK_CREATED, TASK_UPDATED, TASK_DELETED).
 * Connect to backend /ws to receive broadcasts; refetch data in onMessage when needed.
 */

function getWsUrl(): string {
  const envUrl = import.meta.env.VITE_WS_URL
  if (envUrl) return envUrl
  const apiBase = import.meta.env.VITE_API_URL || ''
  if (apiBase.startsWith('http://')) return apiBase.replace('http://', 'ws://') + '/ws'
  if (apiBase.startsWith('https://')) return apiBase.replace('https://', 'wss://') + '/ws'
  return 'ws://localhost:8000/ws'
}

let socket: WebSocket | null = null

export type TaskEventType = 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_DELETED'

export interface TaskEvent {
  type: TaskEventType
  payload: unknown
}

export function connectSocket(onMessage: (event: TaskEvent) => void): void {
  if (socket?.readyState === WebSocket.OPEN) return
  const wsUrl = getWsUrl()
  socket = new WebSocket(wsUrl)

  socket.onmessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as TaskEvent
      onMessage(data)
    } catch {
      // ignore non-JSON or invalid messages
    }
  }

  socket.onclose = () => {
    socket = null
  }

  socket.onerror = () => {
    // Connection failed or dropped; onclose will run
  }
}

export function disconnectSocket(): void {
  if (!socket) return
  const ws = socket
  socket = null
  if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CLOSING) {
    ws.close()
  } else if (ws.readyState === WebSocket.CONNECTING) {
    ws.onopen = () => ws.close()
  }
}
