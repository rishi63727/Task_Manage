import { useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';

type SocketEventHandler = () => void;

interface SocketHandlers {
  onTaskEvent?: SocketEventHandler;
  onCommentEvent?: SocketEventHandler;
  onFileEvent?: SocketEventHandler;
}

export const useSocket = (
  token: string | null,
  { onTaskEvent, onCommentEvent, onFileEvent }: SocketHandlers
) => {
  const socket: Socket | null = useMemo(() => {
    if (!token) return null;
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    return io(baseUrl, {
      transports: ['websocket'],
      auth: { token },
    });
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    const handleTask = () => onTaskEvent?.();
    const handleComment = () => onCommentEvent?.();
    const handleFile = () => onFileEvent?.();

    socket.on('task:created', handleTask);
    socket.on('task:updated', handleTask);
    socket.on('task:deleted', handleTask);
    socket.on('comment:created', handleComment);
    socket.on('file:uploaded', handleFile);

    return () => {
      socket.off('task:created', handleTask);
      socket.off('task:updated', handleTask);
      socket.off('task:deleted', handleTask);
      socket.off('comment:created', handleComment);
      socket.off('file:uploaded', handleFile);
      socket.disconnect();
    };
  }, [socket, onTaskEvent, onCommentEvent, onFileEvent]);
};
