import { logger, captureError } from '@/utils/logger';
import { initializeWebSocket } from '@/utils/websocket';
import { useAppStore } from '@/store/appStore';
import { UIManagerSimple } from '@/components/UIManagerSimple';

// Simple WebSocket-only VR App
class SimpleWebSocketApp {
  private wsClient: any = null;
  private uiManager: UIManagerSimple | null = null;
  private isInitialized = false;

  constructor() {
    logger.info('🎭 SimpleWebSocketApp constructor');
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('⚠️ App ya está inicializada');
      return;
    }

    try {
      logger.info('🚀 Iniciando SimpleWebSocketApp');

      // Step 1: Initialize Simple UI Manager
      logger.info('1️⃣ Inicializando UI Manager Simple...');
      this.uiManager = new UIManagerSimple();
      await this.uiManager.initialize();

      // Step 2: Initialize WebSocket connection
      logger.info('2️⃣ Inicializando conexión WebSocket...');
      this.wsClient = initializeWebSocket();
      this.setupWebSocketHandlers();
      
      // Step 3: Try to connect (non-blocking)
      this.connectWebSocket();
      
      // Setup event listeners for UI interactions
      this.setupUIEventListeners();

      // Step 4: Setup app state
      this.setupAppState();
      
      // Step 5: Show main interface
      this.uiManager.showWebSocketInterface();

      this.isInitialized = true;
      logger.info('✅ SimpleWebSocketApp inicializada completamente');

    } catch (error) {
      logger.error('❌ Error inicializando SimpleWebSocketApp:', error);
      captureError(error as Error, 'simple-app-initialization');
      throw error;
    }
  }

  private async connectWebSocket(): Promise<void> {
    try {
      if (this.wsClient) {
        await this.wsClient.connect();
        logger.info('🔗 WebSocket conectado exitosamente');
      }
    } catch (error) {
      logger.warn('⚠️ No se pudo conectar al WebSocket:', error);
      // Continue in offline mode
    }
  }

  private setupWebSocketHandlers(): void {
    if (!this.wsClient) return;

    this.wsClient.onMessageReceived((message: any) => {
      this.handleServerMessage(message);
    });

    this.wsClient.onConnectionStateChange((state: string) => {
      logger.info('🔄 Estado de conexión WebSocket:', state);
      useAppStore.getState().setConnectionStatus(state as any);
    });
  }

  private handleServerMessage(message: any): void {
    logger.debug('📥 Mensaje del servidor:', message);

    switch (message.type) {
      case 'WELCOME':
        logger.info('👋 Bienvenida del servidor');
        if (this.uiManager) {
          this.uiManager.showWelcomeMessage(message.payload);
        }
        break;
      case 'PONG':
        // Handled by WebSocket client automatically
        break;
      default:
        logger.info('📨 Mensaje del servidor:', message.type, message.payload);
    }
  }

  private setupAppState(): void {
    // Subscribe to store changes for debugging
    useAppStore.subscribe((state, prevState) => {
      if (state.showDebug !== prevState.showDebug) {
        this.toggleDebugMode(state.showDebug);
      }
    });
  }

  private toggleDebugMode(enabled: boolean): void {
    logger.info('🔧 Debug mode:', enabled ? 'enabled' : 'disabled');
    
    if (this.uiManager) {
      this.uiManager.setDebugMode(enabled);
    }
  }

  private setupUIEventListeners(): void {
    // Listen for UI events from the UIManagerSimple
    window.addEventListener('send-ping', () => {
      this.sendTestMessage();
    });

    window.addEventListener('send-hello', () => {
      this.sendHelloMessage();
    });

    window.addEventListener('reconnect-websocket', () => {
      this.reconnectWebSocket();
    });
  }

  private sendHelloMessage(): void {
    if (this.wsClient) {
      const store = useAppStore.getState();
      this.wsClient.send({
        type: 'HELLO',
        payload: {
          deviceId: store.deviceId,
          version: '1.0.0-simple',
          userAgent: navigator.userAgent
        }
      });
      logger.info('👋 Mensaje Hello enviado');
    }
  }

  private reconnectWebSocket(): void {
    logger.info('🔄 Reconectando WebSocket...');
    if (this.wsClient) {
      this.wsClient.disconnect();
      setTimeout(() => {
        this.connectWebSocket();
      }, 1000);
    }
  }

  // Public methods for manual control
  public sendTestMessage(): void {
    if (this.wsClient) {
      this.wsClient.send({
        type: 'PING',
        payload: { tClient: Date.now() }
      });
      logger.info('🏓 Mensaje de test enviado');
    }
  }

  public getConnectionStatus(): string {
    return this.wsClient?.getConnectionState() || 'disconnected';
  }

  // Cleanup
  public destroy(): void {
    logger.info('🧹 Destruyendo SimpleWebSocketApp');
    
    if (this.wsClient) {
      this.wsClient.destroy();
    }
    
    if (this.uiManager) {
      this.uiManager.destroy();
    }
    
    this.isInitialized = false;
  }
}

// Initialize the simple application
async function initializeSimpleApp() {
  try {
    logger.info('🚀 Iniciando Simple WebSocket Client');
    logger.info('📱 User Agent:', navigator.userAgent);
    logger.info('🌐 URL:', window.location.href);

    // Initialize the Simple App
    const app = new SimpleWebSocketApp();
    await app.initialize();

    // Hide initial loader
    const loader = document.getElementById('initial-loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 500);
    }

    // Expose app for debugging
    (window as any).simpleApp = app;

    logger.info('✅ Simple WebSocket Client inicializado exitosamente');

  } catch (error) {
    logger.error('❌ Error inicializando la aplicación:', error);
    captureError(error as Error, 'simple-app-initialization');
    showError(error as Error);
  }
}

function showError(error: Error) {
  const app = document.getElementById('app');
  if (!app) return;

  const errorHtml = `
    <div style="
      padding: 40px;
      text-align: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="
        max-width: 500px;
        margin: 0 auto;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        padding: 30px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      ">
        <div style="font-size: 4rem; margin-bottom: 20px;">❌</div>
        <h1>Error de Inicialización</h1>
        <p>No se pudo cargar la aplicación WebSocket:</p>
        <p><strong>${error.message}</strong></p>
        <button onclick="window.location.reload()" style="
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          background: #007bff;
          color: white;
          font-size: 1rem;
          cursor: pointer;
          margin-top: 20px;
        ">
          🔄 Reintentar
        </button>
      </div>
    </div>
  `;

  // Hide loader and show error
  const loader = document.getElementById('initial-loader');
  if (loader) {
    loader.remove();
  }

  app.innerHTML = errorHtml;
}

// Global error handlers
window.addEventListener('error', (event) => {
  logger.error('💥 Error global:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
  captureError(event.error || new Error(event.message), 'global-error');
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('💥 Promesa rechazada no manejada:', event.reason);
  captureError(
    event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
    'unhandled-rejection'
  );
});

// Expose global utilities for debugging
if (import.meta.env.DEV) {
  (window as any).SIMPLE_DEBUG = {
    logger,
    store: useAppStore,
    version: '1.0.0-simple'
  };
  
  logger.info('🔧 Debug mode enabled. Use window.SIMPLE_DEBUG for debugging tools.');
}

// Start the application
initializeSimpleApp();
