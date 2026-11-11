'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

export interface WSMessage {
  type: string;
  data: any;
  timestamp?: string;
}

function getResolvedWsUrl(explicitUrl?: string): string {
  if (explicitUrl) return explicitUrl;
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    const wsScheme = apiUrl.startsWith('https://') ? 'wss://' : 'ws://';
    const cleanUrl = apiUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    if (cleanUrl.endsWith('/api/v1')) {
      return `${wsScheme}${cleanUrl}/ws/dashboard`;
    }
    return `${wsScheme}${cleanUrl}/api/v1/ws/dashboard`;
  }
  return 'ws://localhost:8000/api/v1/ws/dashboard';
}

/**
 * Custom React Hook for Real-Time Streaming over WebSocket
 * Connects to MediSphere AI FastAPI WebSocket endpoint with auto-reconnect logic.
 */
export function useWebSocket(url?: string) {
  const wsUrl = getResolvedWsUrl(url);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectRef = useRef<() => void>(() => {});

  const connect = useCallback(() => {
    try {
      if (socketRef.current?.readyState === WebSocket.OPEN) return;

      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected:', wsUrl);
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setLastMessage(parsed);
        } catch (e) {
          setLastMessage({ type: 'text', data: event.data });
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        console.log('WebSocket connection closed. Attempting reconnect in 5s...');
        reconnectTimeoutRef.current = setTimeout(() => {
          connectRef.current();
        }, 5000);
      };

      socket.onerror = (err) => {
        console.warn('WebSocket error encountered:', err);
        socket.close();
      };

      socketRef.current = socket;
    } catch (e) {
      console.warn('WebSocket connection failed:', e);
    }
  }, [wsUrl]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [connect]);

  const sendMessage = useCallback((msg: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  }, []);

  return { isConnected, lastMessage, sendMessage };
}
