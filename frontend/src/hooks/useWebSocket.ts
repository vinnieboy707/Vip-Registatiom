import { useEffect, useCallback } from 'react';
import webSocketService from '../services/webSocketService';

type WebSocketEventCallback = (data: any) => void;

export const useWebSocket = (events?: Record<string, WebSocketEventCallback>) => {
  useEffect(() => {
    // Connect on mount
    webSocketService.connect();

    // Subscribe to events
    const unsubscribers: (() => void)[] = [];
    if (events) {
      Object.entries(events).forEach(([event, callback]) => {
        const unsubscribe = webSocketService.on(event, callback);
        unsubscribers.push(unsubscribe);
      });
    }

    // Cleanup on unmount
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [events]);

  const send = useCallback((type: string, payload: any) => {
    webSocketService.send(type, payload);
  }, []);

  const subscribe = useCallback((event: string, callback: WebSocketEventCallback) => {
    return webSocketService.on(event, callback);
  }, []);

  return {
    send,
    subscribe,
    isConnected: webSocketService.isConnected(),
  };
};
