import Stock from '../classes/Stock';

// Event types that can be emitted by the WebSocket service
export type WebSocketEventTypes = 
  | 'connect'      // Connection established
  | 'disconnect'   // Connection closed
  | 'error'        // Connection error
  | 'stocks'       // Received stock updates
  | 'init';        // Initial data load

// Interface for WebSocket event payload
export interface WebSocketEvent<T = unknown> {
  type: WebSocketEventTypes;
  payload?: T;
}

// Stock data received from WebSocket
interface StockData {
  name: string;
  price: number;
  amount_owned: number;
  change: number;
  image_src?: string;
  marketCap: number;
  dividendAmount: number;
  industry: string;
  headquarters: string;
  peRatio: number;
}

// Event listener type
export type WebSocketEventListener = (event: WebSocketEvent) => void;

/**
 * WebSocket service for real-time stock updates
 */
class WebSocketService {
  private socket: WebSocket | null = null;
  private readonly url: string = 'ws://localhost:5001';
  private reconnectTimer: number | null = null;
  private listeners: WebSocketEventListener[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    if (this.socket) {
      console.log('🔌 WebSocket: Connection already exists');
      return;
    }

    console.log(`🔌 WebSocket: Connecting to ${this.url}...`);

    try {
      this.socket = new WebSocket(this.url);

      this.socket.addEventListener('open', () => {
        console.log('🔌 WebSocket: Connection established');
        this.reconnectAttempts = 0;
        this.emitEvent({ type: 'connect' });
      });

      this.socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`📥 WebSocket: Received data type: ${data.type}`);
          
          if (data.type === 'init') {
            // Initial data load
            const stocks = data.stocks.map((stockData: StockData) => new Stock(
              stockData.name,
              stockData.price,
              stockData.amount_owned,
              stockData.change,
              stockData.image_src,
              stockData.marketCap,
              stockData.dividendAmount,
              stockData.industry,
              stockData.headquarters,
              stockData.peRatio
            ));
            this.emitEvent({ type: 'init', payload: stocks });
          } 
          else if (data.type === 'stockUpdates') {
            // Stock updates
            console.log('📊 WebSocket: Received stock updates:', data.stocks.length);
            const stocks = data.stocks.map((stockData: StockData) => {
              const stock = new Stock(
                stockData.name,
                stockData.price,
                stockData.amount_owned,
                stockData.change,
                stockData.image_src,
                stockData.marketCap,
                stockData.dividendAmount,
                stockData.industry,
                stockData.headquarters,
                stockData.peRatio
              );
              console.log(`📈 Updated ${stock.name}: Price ${stock.price}, Change ${stock.change}%`);
              return stock;
            });
            this.emitEvent({ type: 'stocks', payload: stocks });
          }
        } catch (error) {
          console.error('❌ WebSocket: Error parsing message:', error);
        }
      });

      this.socket.addEventListener('close', (event) => {
        console.log(`🔌 WebSocket: Connection closed: ${event.code} ${event.reason}`);
        this.socket = null;
        this.emitEvent({ type: 'disconnect' });
        this.reconnect();
      });

      this.socket.addEventListener('error', (error) => {
        console.error('❌ WebSocket: Connection error:', error);
        this.emitEvent({ type: 'error', payload: error });
      });
    } catch (error) {
      console.error('❌ WebSocket: Failed to create connection:', error);
      this.reconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (!this.socket) {
      return;
    }

    console.log('🔌 WebSocket: Disconnecting...');

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.socket.close();
    this.socket = null;
  }

  /**
   * Add event listener
   */
  addEventListener(listener: WebSocketEventListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: WebSocketEventListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Reconnect to the WebSocket server
   */
  private reconnect(): void {
    if (this.reconnectTimer || this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log(`🔌 WebSocket: Max reconnect attempts (${this.maxReconnectAttempts}) reached`);
      }
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * (2 ** this.reconnectAttempts), 30000);
    
    console.log(`🔌 WebSocket: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(event: WebSocketEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('❌ WebSocket: Error in event listener:', error);
      }
    });
  }
}

// Export singleton instance
export const websocketService = new WebSocketService(); 