import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import * as Y from 'yjs';

export function useCollabSocket({ docId, user, ydoc }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [remoteTitle, setRemoteTitle] = useState(null);

  useEffect(() => {
    if (!docId || !user || !ydoc) return;

    const token = localStorage.getItem('token');
    const socket = io(import.meta.env.VITE_API_URL || '', {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-document', { docId });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('sync-state', ({ update }) => {
      Y.applyUpdate(ydoc, new Uint8Array(update), 'remote');
    });

    socket.on('receive-update', ({ update }) => {
      Y.applyUpdate(ydoc, new Uint8Array(update), 'remote');
    });

    socket.on('presence-update', ({ users }) => {
      setOnlineUsers(users.filter(u => u.socketId !== socket.id));
    });

    socket.on('user-joined', ({ socketId, user: joinedUser }) => {
      setOnlineUsers(prev => {
        if (prev.find(u => u.socketId === socketId)) return prev;
        return [...prev, { socketId, user: joinedUser }];
      });
    });

    socket.on('user-left', ({ socketId }) => {
      setOnlineUsers(prev => prev.filter(u => u.socketId !== socketId));
    });

    socket.on('cursor-update', ({ socketId, user: cursorUser, cursor }) => {
      setOnlineUsers(prev => prev.map(u =>
        u.socketId === socketId ? { ...u, cursor, user: cursorUser } : u
      ));
    });

    socket.on('title-change', ({ title }) => setRemoteTitle(title));

    ydoc.on('update', (update, origin) => {
      if (origin !== 'remote') {
        socket.emit('send-update', { docId, update: Array.from(update) });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [docId, user]);

  const sendCursor = useCallback((cursor) => {
    socketRef.current?.emit('cursor-update', { docId, cursor });
  }, [docId]);

  const sendTitleChange = useCallback((title) => {
    socketRef.current?.emit('title-change', { docId, title });
  }, [docId]);

  return { connected, onlineUsers, remoteTitle, sendCursor, sendTitleChange };
}
