from typing import List, Dict
import json
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

    async def send_personal_message(self, message: str, client_id: str):
        if client_id in self.active_connections:
            for connection in self.active_connections[client_id]:
                await connection.send_text(message)

    async def broadcast(self, message: dict):
        # Broadcast to all connected clients
        # In a real app with multiple workers, this would need Redis Pub/Sub
        message_str = json.dumps(message)
        for client_id in self.active_connections:
            for connection in self.active_connections[client_id]:
                await connection.send_text(message_str)

manager = ConnectionManager()
