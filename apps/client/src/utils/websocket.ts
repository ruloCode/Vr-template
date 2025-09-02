import { 
  ClientMessage, 
  ServerMessage, 
  ClientMessageSchema,
  ServerMessageSchema,
  WSConnectionOptions,
  ConnectionState,
  PING_INTERVAL_MS
} from '@/types/protocol';
import { logger, captureError } from './logger';
import { config } from './config';
import { useAppStore } from '@/store/appStore';

export class VRWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private pingTimer: number | null = null;
  private reconnectAttempts = 0;
  private isIntentionalClose = false;
  
  private readonly options: Required<WSConnectionOptions>;
  
  // Event handlers
  private onMessage: ((message: ServerMessage) => void) | null = null;
  private onConnectionChange: ((state: ConnectionState) => void) | null = null;

  constructor(options: Partial<WSConnectionOptions> = {}) {
    this.options = {
      url: config.wsUrl,
      autoReconnect: true,
      reconnectInterval: config.websocket.reconnectInterval,
      maxReconnectAttempts: config.websocket.maxReconnectAttempts,
      ...options
    };
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.isIntentionalClose = false;
        this.updateConnectionState('connecting');
        
        logger.info('🔌 Conectando a WebSocket:', this.options.url);
        
        this.ws = new WebSocket(this.options.url);
        
        const connectionTimeout = setTimeout(() => {
          if (this.ws?.readyState === WebSocket.CONNECTING) {
            logger.error('❌ Timeout conectando a WebSocket');
            this.ws?.close();
            reject(new Error('Connection timeout'));
          }
        }, config.websocket.connectionTimeout);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          logger.info('✅ WebSocket conectado');
          this.reconnectAttempts = 0;
          this.updateConnectionState('connected');
          this.startPingInterval();
          this.sendHello();
          resolve();
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          this.cleanup();
          
          if (event.wasClean) {
            logger.info('🔌 WebSocket cerrado limpiamente');
            this.updateConnectionState('disconnected');
          } else {
            logger.warn('⚠️ WebSocket cerrado inesperadamente:', event.code, event.reason);
            this.updateConnectionState('disconnected');
            this.handleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          logger.error('❌ Error en WebSocket:', error);
          this.updateConnectionState('error');
          captureError(new Error('WebSocket error'), 'websocket-connection');
          reject(error);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

      } catch (error) {
        logger.error('❌ Error creando WebSocket:', error);
        this.updateConnectionState('error');
        reject(error);
      }
    });
  }

  public disconnect(): void {
    this.isIntentionalClose = true;
    this.cleanup();
    
    if (this.ws) {
      this.ws.close(1000, 'Disconnected by client');
      this.ws = null;
    }
    
    this.updateConnectionState('disconnected');
    logger.info('🔌 WebSocket desconectado por el cliente');
  }

  public send(message: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        const validatedMessage = ClientMessageSchema.parse(message);
        this.ws.send(JSON.stringify(validatedMessage));
        
        if (message.type !== 'PING') { // Don't log pings to reduce noise
          logger.debug('📤 Enviado:', message.type, message.payload);
        }
      } catch (error) {
        logger.error('❌ Error validando mensaje:', error);
        captureError(error as Error, 'message-validation');
      }
    } else {
      logger.warn('⚠️ WebSocket no está conectado, no se puede enviar:', message.type);
    }
  }

  public onMessageReceived(handler: (message: ServerMessage) => void): void {
    this.onMessage = handler;
  }

  public onConnectionStateChange(handler: (state: ConnectionState) => void): void {
    this.onConnectionChange = handler;
  }

  private handleMessage(data: string): void {
    try {
      const parsed = JSON.parse(data);
      const message = ServerMessageSchema.parse(parsed);
      
      if (message.type !== 'PONG') { // Don't log pongs to reduce noise
        logger.debug('📥 Recibido:', message.type, message.payload);
      }
      
      // Handle internal messages
      switch (message.type) {
        case 'WELCOME':
          this.handleWelcome(message);
          break;
        case 'PONG':
          this.handlePong(message);
          break;
      }
      
      // Forward to external handler
      this.onMessage?.(message);
      
    } catch (error) {
      logger.error('❌ Error parseando mensaje del servidor:', error);
      captureError(error as Error, 'message-parsing');
    }
  }

  private handleWelcome(message: ServerMessage & { type: 'WELCOME' }): void {
    const { serverEpochMs } = message.payload;
    const clientTime = Date.now();
    const roundTripTime = 0; // We'll calculate this with pings
    
    // Initial rough sync
    useAppStore.getState().updateServerTime(serverEpochMs, clientTime - serverEpochMs, roundTripTime);
    
    logger.info('👋 Recibido WELCOME del servidor');
  }

  private handlePong(message: ServerMessage & { type: 'PONG' }): void {
    const { tServer, tClient } = message.payload;
    const now = Date.now();
    
    // Calculate round-trip time and server offset
    const roundTripTime = now - tClient;
    const serverOffset = tServer - (tClient + roundTripTime / 2);
    
    useAppStore.getState().updateServerTime(tServer, serverOffset, roundTripTime);
    
    logger.debug('🏓 Ping/Pong - RTT:', roundTripTime + 'ms', 'Offset:', serverOffset + 'ms');
  }

  private sendHello(): void {
    const store = useAppStore.getState();
    
    this.send({
      type: 'HELLO',
      payload: {
        deviceId: store.deviceId,
        version: __VR_VERSION__,
        userAgent: navigator.userAgent,
        battery: store.battery || undefined
      }
    });
  }

  private sendPing(): void {
    this.send({
      type: 'PING',
      payload: {
        tClient: Date.now()
      }
    });
  }

  private startPingInterval(): void {
    this.pingTimer = window.setInterval(() => {
      this.sendPing();
    }, PING_INTERVAL_MS);
  }

  private updateConnectionState(state: ConnectionState): void {
    useAppStore.getState().setConnectionStatus(state);
    this.onConnectionChange?.(state);
  }

  private handleReconnect(): void {
    if (this.isIntentionalClose || !this.options.autoReconnect) {
      return;
    }

    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      logger.error('❌ Máximo número de intentos de reconexión alcanzado');
      this.updateConnectionState('error');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.options.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);
    
    logger.info(`🔄 Reintentando conexión en ${delay}ms (intento ${this.reconnectAttempts}/${this.options.maxReconnectAttempts})`);
    
    this.reconnectTimer = window.setTimeout(() => {
      this.connect().catch(error => {
        logger.error('❌ Error en reconexión:', error);
      });
    }, delay);
  }

  private cleanup(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  public getConnectionState(): ConnectionState {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'error';
    }
  }

  public destroy(): void {
    this.disconnect();
    this.onMessage = null;
    this.onConnectionChange = null;
  }
}

// Global WebSocket instance
export let wsClient: VRWebSocketClient | null = null;

export const initializeWebSocket = (): VRWebSocketClient => {
  if (wsClient) {
    wsClient.destroy();
  }
  
  wsClient = new VRWebSocketClient();
  return wsClient;
};

export const getWebSocketClient = (): VRWebSocketClient | null => {
  return wsClient;
};


