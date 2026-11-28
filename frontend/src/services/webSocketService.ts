/**
 * WebSocket Service for real-time communication
 * Handles real-time notifications, updates, and live data
 */

type WebSocketEventCallback = (data: any) => void;

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private eventListeners: Map<string, Set<WebSocketEventCallback>> = new Map();
  private isConnecting = false;

  /**
   * Initialize WebSocket connection
   */
  connect(url?: string) {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      console.log('[WebSocket] Already connected or connecting');
      return;
    }

    this.isConnecting = true;
    const wsUrl = url || this.getWebSocketUrl();

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit('connected', { timestamp: new Date().toISOString() });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('[WebSocket] Message received:', message.type);
          this.emit(message.type, message.payload);
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        this.emit('error', { error });
      };

      this.ws.onclose = (event) => {
        console.log('[WebSocket] Connection closed:', event.code, event.reason);
        this.isConnecting = false;
        this.emit('disconnected', { code: event.code, reason: event.reason });
        this.handleReconnect();
      };
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  /**
   * Get WebSocket URL based on environment
   */
  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    
    // In development, use localhost
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      return `ws://localhost:5000/ws`;
    }
    
    return `${protocol}//${host}/ws`;
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[WebSocket] Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('[WebSocket] Max reconnection attempts reached');
      this.emit('max_reconnect_attempts', { attempts: this.reconnectAttempts });
    }
  }

  /**
   * Send message through WebSocket
   */
  send(type: string, payload: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        payload,
        timestamp: new Date().toISOString(),
      };
      this.ws.send(JSON.stringify(message));
      console.log('[WebSocket] Message sent:', type);
    } else {
      console.warn('[WebSocket] Cannot send message - not connected');
    }
  }

  /**
   * Subscribe to WebSocket events
   */
  on(event: string, callback: WebSocketEventCallback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from WebSocket events
   */
  off(event: string, callback: WebSocketEventCallback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[WebSocket] Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Subscribe to vehicle updates
   */
  subscribeToVehicleUpdates(vehicleId: string) {
    this.send('subscribe', { entity: 'vehicle', id: vehicleId });
  }

  /**
   * Subscribe to registration updates
   */
  subscribeToRegistrationUpdates(registrationId: string) {
    this.send('subscribe', { entity: 'registration', id: registrationId });
  }

  /**
   * Subscribe to user notifications
   */
  subscribeToNotifications(userId: string) {
    this.send('subscribe', { entity: 'notifications', id: userId });
  }
}

export const webSocketService = new WebSocketService();

export default webSocketService;
