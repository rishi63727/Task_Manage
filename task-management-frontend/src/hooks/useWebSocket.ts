import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
    type: string;
    payload: any;
}

export const useWebSocket = (url: string) => {
    const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Generate a random client ID for this user session/tab
        const clientId = Math.random().toString(36).substring(2, 15);
        // Determine WS protocol based on current window protocol
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Assume backend is on port 8000 for now, or match current hostname
        const wsUrl = `ws://localhost:8000${url}/${clientId}`;

        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log('WebSocket Connected');
            setIsConnected(true);
        };

        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                setLastMessage(message);
            } catch (error) {
                console.error('Failed to parse WebSocket message', error);
            }
        };

        socket.onclose = () => {
            console.log('WebSocket Disconnected');
            setIsConnected(false);
        };

        socket.onerror = (error) => {
            console.error('WebSocket Error', error);
        };

        ws.current = socket;

        return () => {
            socket.close();
        };
    }, [url]);

    return { lastMessage, isConnected, sendMessage: ws.current?.send.bind(ws.current) };
};
