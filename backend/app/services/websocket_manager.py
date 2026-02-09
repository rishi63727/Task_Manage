from typing import Dict, List

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # Store active connections: client_id -> list of WebSockets (allowing multiple tabs per user)
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        if client_id not in self.active_connections:
            self.active_connections[client_id] = []
        self.active_connections[client_id].append(websocket)

    def disconnect(self, websocket: WebSocket, client_id: str):
        if client_id in self.active_connections:
            if websocket in self.active_connections[client_id]:
                self.active_connections[client_id].remove(websocket)
            if not self.active_connections[client_id]:
                del self.active_connections[client_id]

    def _remove_connection(self, websocket: WebSocket) -> None:
        """Remove a single websocket from the pool (e.g. after send failure)."""
        for cid in list(self.active_connections.keys()):
            if websocket in self.active_connections[cid]:
                self.active_connections[cid].remove(websocket)
                if not self.active_connections[cid]:
                    del self.active_connections[cid]
                return

    async def send_personal_message(self, message: str, client_id: str):
        if client_id in self.active_connections:
            for connection in self.active_connections[client_id]:
                await connection.send_text(message)

    async def broadcast(self, message: dict):
        """Broadcast JSON message to all connected clients; remove dead connections."""
        dead: List[WebSocket] = []
        for client_id in list(self.active_connections.keys()):
            for connection in self.active_connections[client_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    dead.append(connection)
        for conn in dead:
            self._remove_connection(conn)


manager = ConnectionManager()
