/**
 * WebSocket Manager for Real-Time Market Data
 * Handles WebSocket connections for live price updates, order fills, and position changes
 */

type MessageHandler = (data: any) => void;
type ConnectionCallback = () => void;

interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private connectionCallbacks: ConnectionCallback[] = [];
  private disconnectionCallbacks: ConnectionCallback[] = [];
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isIntentionalClose = false;

  constructor(private config: WebSocketConfig) {}

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      return;
    }

    try {
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = () => {
        console.log("WebSocket connected");
        this.reconnectAttempts = 0;
        this.connectionCallbacks.forEach(cb => cb());
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      this.ws.onclose = () => {
        console.log("WebSocket disconnected");
        this.disconnectionCallbacks.forEach(cb => cb());
        
        if (!this.isIntentionalClose) {
          this.attemptReconnect();
        }
      };
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      this.attemptReconnect();
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    this.isIntentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  /**
   * Send message through WebSocket
   */
  send(type: string, payload: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.warn("WebSocket not connected, cannot send message");
    }
  }

  /**
   * Subscribe to specific message type
   */
  subscribe(messageType: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(messageType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(data: any): void {
    const { type, payload } = data;
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach(handler => handler(payload));
    }
  }

  /**
   * Attempt to reconnect WebSocket
   */
  private attemptReconnect(): void {
    const maxAttempts = this.config.maxReconnectAttempts || 10;
    const interval = this.config.reconnectInterval || 5000;

    if (this.reconnectAttempts >= maxAttempts) {
      console.error("Max reconnect attempts reached");
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnecting WebSocket (attempt ${this.reconnectAttempts}/${maxAttempts})...`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, interval);
  }

  /**
   * Register connection callback
   */
  onConnect(callback: ConnectionCallback): void {
    this.connectionCallbacks.push(callback);
  }

  /**
   * Register disconnection callback
   */
  onDisconnect(callback: ConnectionCallback): void {
    this.disconnectionCallbacks.push(callback);
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

/**
 * Create WebSocket manager instance
 */
export function createWebSocketManager(config: WebSocketConfig): WebSocketManager {
  return new WebSocketManager(config);
}

/**
 * Simulated WebSocket for development/paper trading
 */
export class SimulatedWebSocket extends WebSocketManager {
  private simulationInterval: NodeJS.Timeout | null = null;

  constructor(config: WebSocketConfig) {
    super(config);
  }

  connect(): void {
    console.log("Starting simulated WebSocket connection");
    
    // Simulate connection after 1 second
    setTimeout(() => {
      console.log("Simulated WebSocket connected");
      this.startSimulation();
    }, 1000);
  }

  disconnect(): void {
    console.log("Disconnecting simulated WebSocket");
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  private startSimulation(): void {
    // Simulate price updates every 2 seconds
    this.simulationInterval = setInterval(() => {
      // Simulate random price movements
      const mockPriceUpdate = {
        type: "price_update",
        payload: {
          symbol: ["SPY", "AAPL", "TSLA", "NVDA"][Math.floor(Math.random() * 4)],
          price: 100 + Math.random() * 100,
          change: (Math.random() - 0.5) * 2,
          timestamp: new Date().toISOString(),
        },
      };

      const handlers = (this as any).messageHandlers.get("price_update");
      if (handlers) {
        handlers.forEach((handler: MessageHandler) => handler(mockPriceUpdate.payload));
      }
    }, 2000);
  }
}
