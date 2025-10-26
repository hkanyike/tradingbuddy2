/**
 * Alpaca WebSocket Streaming Client
 * Real-time market data streaming for stocks and options
 */

type MessageHandler = (data: any) => void;

export interface AlpacaStreamConfig {
  apiKey: string;
  secretKey: string;
  feed?: 'iex' | 'sip'; // IEX (real-time) or SIP (full market data)
  paper?: boolean;
}

export interface OptionsQuote {
  symbol: string;
  bidPrice: number;
  bidSize: number;
  askPrice: number;
  askSize: number;
  lastPrice: number;
  timestamp: string;
}

export interface OptionsTrade {
  symbol: string;
  price: number;
  size: number;
  exchange: string;
  timestamp: string;
}

export interface StockQuote {
  symbol: string;
  bidPrice: number;
  bidSize: number;
  askPrice: number;
  askSize: number;
  timestamp: string;
}

export interface StockTrade {
  symbol: string;
  price: number;
  size: number;
  timestamp: string;
}

export class AlpacaWebSocketClient {
  private ws: WebSocket | null = null;
  private authenticated = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 5000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isIntentionalClose = false;
  private subscriptions = new Set<string>();

  private handlers = {
    optionsQuote: [] as MessageHandler[],
    optionsTrade: [] as MessageHandler[],
    stockQuote: [] as MessageHandler[],
    stockTrade: [] as MessageHandler[],
    stockBar: [] as MessageHandler[],
    error: [] as MessageHandler[],
    connected: [] as (() => void)[],
    disconnected: [] as (() => void)[],
  };

  constructor(private config: AlpacaStreamConfig) {}

  /**
   * Connect to Alpaca WebSocket feed
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('Alpaca WebSocket already connected');
      return;
    }

    const baseUrl = this.config.paper 
      ? 'wss://stream.data.alpaca.markets'
      : 'wss://stream.data.alpaca.markets';
    
    // Options feed
    const wsUrl = `${baseUrl}/v1beta3/options`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Alpaca WebSocket connected');
        this.authenticate();
      };

      this.ws.onmessage = (event) => {
        try {
          const messages = JSON.parse(event.data);
          if (Array.isArray(messages)) {
            messages.forEach(msg => this.handleMessage(msg));
          } else {
            this.handleMessage(messages);
          }
        } catch (error) {
          console.error('Failed to parse Alpaca WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('Alpaca WebSocket error:', error);
        this.handlers.error.forEach(h => h(error));
      };

      this.ws.onclose = () => {
        console.log('Alpaca WebSocket disconnected');
        this.authenticated = false;
        this.handlers.disconnected.forEach(h => h());
        
        if (!this.isIntentionalClose) {
          this.attemptReconnect();
        }
      };
    } catch (error) {
      console.error('Failed to connect Alpaca WebSocket:', error);
      this.attemptReconnect();
    }
  }

  /**
   * Authenticate with Alpaca
   */
  private authenticate(): void {
    const authMsg = {
      action: 'auth',
      key: this.config.apiKey,
      secret: this.config.secretKey,
    };

    this.send(authMsg);
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(msg: any): void {
    const { T, msg: msgType } = msg;

    // Handle control messages
    if (T === 'success') {
      if (msgType === 'authenticated') {
        console.log('Alpaca WebSocket authenticated');
        this.authenticated = true;
        this.reconnectAttempts = 0;
        this.handlers.connected.forEach(h => h());
        
        // Resubscribe to previous subscriptions
        if (this.subscriptions.size > 0) {
          this.resubscribe();
        }
      } else if (msgType === 'connected') {
        console.log('Alpaca WebSocket control: connected');
      }
      return;
    }

    if (T === 'error') {
      console.error('Alpaca WebSocket error:', msg);
      this.handlers.error.forEach(h => h(msg));
      return;
    }

    if (T === 'subscription') {
      console.log('Alpaca subscription confirmed:', msg);
      return;
    }

    // Handle data messages
    switch (T) {
      case 'q': // Options quote
        this.handlers.optionsQuote.forEach(h => h({
          symbol: msg.S,
          bidPrice: msg.bp,
          bidSize: msg.bs,
          askPrice: msg.ap,
          askSize: msg.as,
          lastPrice: msg.lp || 0,
          timestamp: msg.t,
        }));
        break;

      case 't': // Options trade
        this.handlers.optionsTrade.forEach(h => h({
          symbol: msg.S,
          price: msg.p,
          size: msg.s,
          exchange: msg.x,
          timestamp: msg.t,
        }));
        break;

      case 'Q': // Stock quote
        this.handlers.stockQuote.forEach(h => h({
          symbol: msg.S,
          bidPrice: msg.bp,
          bidSize: msg.bs,
          askPrice: msg.ap,
          askSize: msg.as,
          timestamp: msg.t,
        }));
        break;

      case 'T': // Stock trade
        this.handlers.stockTrade.forEach(h => h({
          symbol: msg.S,
          price: msg.p,
          size: msg.s,
          timestamp: msg.t,
        }));
        break;

      case 'b': // Minute bar
        this.handlers.stockBar.forEach(h => h({
          symbol: msg.S,
          open: msg.o,
          high: msg.h,
          low: msg.l,
          close: msg.c,
          volume: msg.v,
          timestamp: msg.t,
        }));
        break;

      default:
        console.log('Unknown message type:', T, msg);
    }
  }

  /**
   * Subscribe to options quotes
   */
  subscribeOptionsQuotes(symbols: string[]): void {
    if (!this.authenticated) {
      console.warn('Not authenticated yet, subscription will be delayed');
      symbols.forEach(s => this.subscriptions.add(`options:${s}`));
      return;
    }

    const subscribeMsg = {
      action: 'subscribe',
      quotes: symbols,
    };

    this.send(subscribeMsg);
    symbols.forEach(s => this.subscriptions.add(`options:${s}`));
  }

  /**
   * Subscribe to options trades
   */
  subscribeOptionsTrades(symbols: string[]): void {
    if (!this.authenticated) {
      console.warn('Not authenticated yet, subscription will be delayed');
      symbols.forEach(s => this.subscriptions.add(`options_trades:${s}`));
      return;
    }

    const subscribeMsg = {
      action: 'subscribe',
      trades: symbols,
    };

    this.send(subscribeMsg);
    symbols.forEach(s => this.subscriptions.add(`options_trades:${s}`));
  }

  /**
   * Subscribe to stock quotes (for underlying prices)
   */
  subscribeStockQuotes(symbols: string[]): void {
    if (!this.authenticated) {
      console.warn('Not authenticated yet, subscription will be delayed');
      symbols.forEach(s => this.subscriptions.add(`stock:${s}`));
      return;
    }

    const subscribeMsg = {
      action: 'subscribe',
      quotes: symbols,
    };

    this.send(subscribeMsg);
    symbols.forEach(s => this.subscriptions.add(`stock:${s}`));
  }

  /**
   * Unsubscribe from symbols
   */
  unsubscribe(symbols: string[]): void {
    const unsubscribeMsg = {
      action: 'unsubscribe',
      quotes: symbols,
      trades: symbols,
    };

    this.send(unsubscribeMsg);
    symbols.forEach(s => {
      this.subscriptions.delete(`options:${s}`);
      this.subscriptions.delete(`options_trades:${s}`);
      this.subscriptions.delete(`stock:${s}`);
    });
  }

  /**
   * Resubscribe to all previous subscriptions
   */
  private resubscribe(): void {
    const optionsSymbols: string[] = [];
    const tradesSymbols: string[] = [];
    const stockSymbols: string[] = [];

    this.subscriptions.forEach(sub => {
      const [type, symbol] = sub.split(':');
      if (type === 'options') optionsSymbols.push(symbol);
      else if (type === 'options_trades') tradesSymbols.push(symbol);
      else if (type === 'stock') stockSymbols.push(symbol);
    });

    if (optionsSymbols.length > 0) {
      this.subscribeOptionsQuotes(optionsSymbols);
    }
    if (tradesSymbols.length > 0) {
      this.subscribeOptionsTrades(tradesSymbols);
    }
    if (stockSymbols.length > 0) {
      this.subscribeStockQuotes(stockSymbols);
    }
  }

  /**
   * Register event handlers
   */
  onOptionsQuote(handler: MessageHandler): () => void {
    this.handlers.optionsQuote.push(handler);
    return () => {
      const index = this.handlers.optionsQuote.indexOf(handler);
      if (index > -1) this.handlers.optionsQuote.splice(index, 1);
    };
  }

  onOptionsTrade(handler: MessageHandler): () => void {
    this.handlers.optionsTrade.push(handler);
    return () => {
      const index = this.handlers.optionsTrade.indexOf(handler);
      if (index > -1) this.handlers.optionsTrade.splice(index, 1);
    };
  }

  onStockQuote(handler: MessageHandler): () => void {
    this.handlers.stockQuote.push(handler);
    return () => {
      const index = this.handlers.stockQuote.indexOf(handler);
      if (index > -1) this.handlers.stockQuote.splice(index, 1);
    };
  }

  onStockTrade(handler: MessageHandler): () => void {
    this.handlers.stockTrade.push(handler);
    return () => {
      const index = this.handlers.stockTrade.indexOf(handler);
      if (index > -1) this.handlers.stockTrade.splice(index, 1);
    };
  }

  onError(handler: MessageHandler): () => void {
    this.handlers.error.push(handler);
    return () => {
      const index = this.handlers.error.indexOf(handler);
      if (index > -1) this.handlers.error.splice(index, 1);
    };
  }

  onConnected(handler: () => void): () => void {
    this.handlers.connected.push(handler);
    return () => {
      const index = this.handlers.connected.indexOf(handler);
      if (index > -1) this.handlers.connected.splice(index, 1);
    };
  }

  onDisconnected(handler: () => void): () => void {
    this.handlers.disconnected.push(handler);
    return () => {
      const index = this.handlers.disconnected.indexOf(handler);
      if (index > -1) this.handlers.disconnected.splice(index, 1);
    };
  }

  /**
   * Send message through WebSocket
   */
  private send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not open, cannot send message');
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
    this.authenticated = false;
    this.subscriptions.clear();
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached for Alpaca WebSocket');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnecting Alpaca WebSocket (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.authenticated;
  }
}

/**
 * Create Alpaca WebSocket client instance
 */
export function createAlpacaWebSocket(config: AlpacaStreamConfig): AlpacaWebSocketClient {
  return new AlpacaWebSocketClient(config);
}