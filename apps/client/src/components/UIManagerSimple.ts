import { logger } from '@/utils/logger';
import { useAppStore } from '@/store/appStore';

export class UIManagerSimple {
  private overlayElement: HTMLElement | null = null;
  private debugPanel: HTMLElement | null = null;
  private debugUpdateInterval: number | null = null;

  constructor() {
    logger.info('🎨 UIManagerSimple inicializado');
  }

  public async initialize(): Promise<void> {
    this.createOverlayStructure();
    this.setupEventListeners();
    this.setupStoreSubscriptions();
    
    logger.info('✅ UIManagerSimple inicializado completamente');
  }

  private createOverlayStructure(): void {
    const app = document.getElementById('app');
    if (!app) {
      throw new Error('App container not found');
    }

    const overlayHTML = `
      <div id="simple-overlay" class="simple-overlay">
        <!-- Main WebSocket Interface -->
        <div id="websocket-interface" class="websocket-interface" style="display: none;">
          <div class="interface-content">
            <div class="header">
              <div class="logo">🔌</div>
              <h1>WebSocket Test Client</h1>
              <p class="subtitle">Conexión en tiempo real con el servidor</p>
            </div>
            
            <!-- Connection Status -->
            <div class="status-section">
              <div class="status-indicator">
                <div id="status-dot" class="status-dot"></div>
                <span id="status-text">Desconectado</span>
              </div>
              
              <div class="connection-info">
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">Estado:</span>
                    <span id="connection-state" class="value">-</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Latencia:</span>
                    <span id="latency-display" class="value">-</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Device ID:</span>
                    <span id="device-id-display" class="value">-</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Servidor:</span>
                    <span id="server-time" class="value">-</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Controls -->
            <div class="controls-section">
              <h3>Controles</h3>
              <div class="controls-grid">
                <button id="ping-btn" class="btn btn-primary" disabled>
                  🏓 Ping
                </button>
                <button id="hello-btn" class="btn btn-secondary" disabled>
                  👋 Hello
                </button>
                <button id="debug-toggle" class="btn btn-secondary">
                  🔧 Debug
                </button>
                <button id="reconnect-btn" class="btn btn-warning">
                  🔄 Reconectar
                </button>
              </div>
            </div>

            <!-- Server Messages -->
            <div class="messages-section">
              <h3>Mensajes del Servidor</h3>
              <div id="message-log" class="message-log">
                <div class="log-entry info">Esperando mensajes...</div>
              </div>
              <button id="clear-messages" class="btn btn-outline">Limpiar</button>
            </div>
          </div>
        </div>

        <!-- Debug Panel -->
        <div id="debug-panel" class="debug-panel" style="display: none;">
          <div class="debug-header">
            <h4>🔧 Debug Info</h4>
            <button id="debug-close" class="btn-close">×</button>
          </div>
          <div id="debug-content" class="debug-content">
            <!-- Debug info will be populated dynamically -->
          </div>
        </div>
      </div>
    `;

    // Add overlay to app
    app.innerHTML = overlayHTML;
    
    // Get references
    this.overlayElement = document.getElementById('simple-overlay');
    this.debugPanel = document.getElementById('debug-panel');

    // Add CSS
    this.injectStyles();
  }

  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .simple-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: white;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .websocket-interface {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
      }

      .interface-content {
        max-width: 800px;
        width: 100%;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        padding: 40px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        max-height: 90vh;
        overflow-y: auto;
      }

      .header {
        text-align: center;
        margin-bottom: 40px;
      }

      .logo {
        font-size: 4rem;
        margin-bottom: 1rem;
        animation: pulse 2s infinite;
      }

      .header h1 {
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
      }

      .subtitle {
        font-size: 1.1rem;
        opacity: 0.9;
        margin: 0;
      }

      .status-section {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 10px;
        padding: 25px;
        margin-bottom: 30px;
      }

      .status-indicator {
        display: flex;
        align-items: center;
        gap: 15px;
        font-size: 1.3rem;
        margin-bottom: 20px;
        justify-content: center;
      }

      .status-dot {
        width: 15px;
        height: 15px;
        border-radius: 50%;
        background: #dc3545;
        animation: pulse 2s infinite;
      }

      .status-dot.connected { background: #28a745; }
      .status-dot.connecting { background: #ffc107; }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
      }

      .info-item {
        display: flex;
        justify-content: space-between;
        padding: 12px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
      }

      .label {
        font-weight: bold;
        opacity: 0.9;
      }

      .value {
        font-family: monospace;
      }

      .controls-section, .messages-section {
        margin-bottom: 30px;
      }

      .controls-section h3, .messages-section h3 {
        margin-bottom: 15px;
        font-size: 1.3rem;
      }

      .controls-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 15px;
      }

      .message-log {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        padding: 15px;
        height: 200px;
        overflow-y: auto;
        margin-bottom: 15px;
        font-family: monospace;
        font-size: 0.9rem;
      }

      .log-entry {
        margin-bottom: 8px;
        padding: 5px 10px;
        border-radius: 4px;
        border-left: 3px solid transparent;
      }

      .log-entry.info { 
        background: rgba(23, 162, 184, 0.2); 
        border-left-color: #17a2b8;
      }
      .log-entry.success { 
        background: rgba(40, 167, 69, 0.2); 
        border-left-color: #28a745;
      }
      .log-entry.warning { 
        background: rgba(255, 193, 7, 0.2); 
        border-left-color: #ffc107;
      }
      .log-entry.error { 
        background: rgba(220, 53, 69, 0.2); 
        border-left-color: #dc3545;
      }

      .btn {
        padding: 12px 20px;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 600;
        text-decoration: none;
        display: inline-block;
        text-align: center;
      }

      .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
      }

      .btn-primary {
        background: linear-gradient(135deg, #007bff, #0056b3);
        color: white;
      }

      .btn-secondary {
        background: linear-gradient(135deg, #6c757d, #495057);
        color: white;
      }

      .btn-warning {
        background: linear-gradient(135deg, #ffc107, #e0a800);
        color: #212529;
      }

      .btn-outline {
        background: transparent;
        color: white;
        border: 2px solid rgba(255, 255, 255, 0.3);
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      .debug-panel {
        position: absolute;
        top: 20px;
        left: 20px;
        width: 350px;
        max-height: 500px;
        background: rgba(0, 0, 0, 0.9);
        border-radius: 10px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        overflow: hidden;
      }

      .debug-header {
        padding: 15px;
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .debug-content {
        padding: 15px;
        max-height: 400px;
        overflow-y: auto;
        font-family: monospace;
        font-size: 0.8rem;
        line-height: 1.4;
      }

      .btn-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 5px 10px;
        border-radius: 50%;
        width: 35px;
        height: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .btn-close:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(0.95); }
      }

      @media (max-width: 768px) {
        .interface-content {
          padding: 20px;
          margin: 10px;
        }
        
        .controls-grid {
          grid-template-columns: 1fr;
        }
        
        .info-grid {
          grid-template-columns: 1fr;
        }
        
        .debug-panel {
          width: calc(100vw - 40px);
          max-width: 350px;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  private setupEventListeners(): void {
    // Debug panel controls
    const debugClose = document.getElementById('debug-close');
    debugClose?.addEventListener('click', () => {
      useAppStore.getState().setDebugMode(false);
    });

    // Control buttons
    this.setupControlButtons();

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) return;

      switch (e.key) {
        case 'F12':
          e.preventDefault();
          const store = useAppStore.getState();
          store.setDebugMode(!store.showDebug);
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          this.sendPing();
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          this.sendHello();
          break;
      }
    });
  }

  private setupControlButtons(): void {
    const pingBtn = document.getElementById('ping-btn');
    const helloBtn = document.getElementById('hello-btn');
    const debugToggle = document.getElementById('debug-toggle');
    const reconnectBtn = document.getElementById('reconnect-btn');
    const clearMessages = document.getElementById('clear-messages');

    pingBtn?.addEventListener('click', () => this.sendPing());
    helloBtn?.addEventListener('click', () => this.sendHello());
    clearMessages?.addEventListener('click', () => this.clearMessages());

    debugToggle?.addEventListener('click', () => {
      const store = useAppStore.getState();
      store.setDebugMode(!store.showDebug);
    });

    reconnectBtn?.addEventListener('click', () => {
      const event = new CustomEvent('reconnect-websocket');
      window.dispatchEvent(event);
    });
  }

  private setupStoreSubscriptions(): void {
    // Subscribe to connection status
    useAppStore.subscribe((state) => {
      this.updateConnectionStatus(state.connectionStatus);
      this.updateConnectionInfo(state);
    });

    // Subscribe to debug mode
    useAppStore.subscribe((state) => {
      this.toggleDebugPanel(state.showDebug);
    });
  }

  private sendPing(): void {
    const event = new CustomEvent('send-ping');
    window.dispatchEvent(event);
    this.addMessage('📤 Ping enviado', 'info');
  }

  private sendHello(): void {
    const event = new CustomEvent('send-hello');
    window.dispatchEvent(event);
    this.addMessage('📤 Hello enviado', 'info');
  }

  private clearMessages(): void {
    const messageLog = document.getElementById('message-log');
    if (messageLog) {
      messageLog.innerHTML = '<div class="log-entry info">Log limpiado</div>';
    }
  }

  private updateConnectionStatus(status: string): void {
    const statusElement = document.getElementById('status-dot');
    const textElement = document.getElementById('status-text');
    const stateElement = document.getElementById('connection-state');
    const pingBtn = document.getElementById('ping-btn') as HTMLButtonElement;
    const helloBtn = document.getElementById('hello-btn') as HTMLButtonElement;

    if (!statusElement || !textElement || !stateElement) return;

    const statusMap = {
      'disconnected': { text: 'Desconectado', class: 'disconnected' },
      'connecting': { text: 'Conectando...', class: 'connecting' },
      'connected': { text: 'Conectado', class: 'connected' },
      'error': { text: 'Error', class: 'error' }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.disconnected;
    
    statusElement.className = `status-dot ${statusInfo.class}`;
    textElement.textContent = statusInfo.text;
    stateElement.textContent = statusInfo.text;

    // Update button states
    const isConnected = status === 'connected';
    if (pingBtn) pingBtn.disabled = !isConnected;
    if (helloBtn) helloBtn.disabled = !isConnected;
  }

  private updateConnectionInfo(state: any): void {
    const latencyElement = document.getElementById('latency-display');
    const deviceElement = document.getElementById('device-id-display');
    const serverTimeElement = document.getElementById('server-time');

    if (latencyElement) {
      latencyElement.textContent = state.latency ? `${state.latency}ms` : '-';
    }

    if (deviceElement) {
      deviceElement.textContent = state.deviceId ? 
        state.deviceId.substring(0, 12) + '...' : '-';
    }

    if (serverTimeElement) {
      serverTimeElement.textContent = state.serverTime ? 
        new Date(state.serverTime).toLocaleTimeString() : '-';
    }
  }

  private toggleDebugPanel(show: boolean): void {
    if (this.debugPanel) {
      this.debugPanel.style.display = show ? 'block' : 'none';
      
      if (show && !this.debugUpdateInterval) {
        this.startDebugUpdates();
      } else if (!show && this.debugUpdateInterval) {
        this.stopDebugUpdates();
      }
    }
  }

  private startDebugUpdates(): void {
    this.debugUpdateInterval = window.setInterval(() => {
      this.updateDebugInfo();
    }, 1000);
  }

  private stopDebugUpdates(): void {
    if (this.debugUpdateInterval) {
      clearInterval(this.debugUpdateInterval);
      this.debugUpdateInterval = null;
    }
  }

  private updateDebugInfo(): void {
    const debugContent = document.getElementById('debug-content');
    if (!debugContent) return;

    const store = useAppStore.getState();
    const now = new Date();
    
    const debugData = {
      'Timestamp': now.toLocaleTimeString(),
      'Connection': store.connectionStatus,
      'Latency': store.latency + 'ms',
      'Client Offset': store.clientOffset + 'ms',
      'Device ID': store.deviceId.substring(0, 12) + '...',
      'Server Time': store.serverTime ? new Date(store.serverTime).toLocaleTimeString() : 'N/A',
      'User Agent': navigator.userAgent.substring(0, 50) + '...'
    };

    debugContent.innerHTML = Object.entries(debugData)
      .map(([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`)
      .join('');
  }

  // Public methods
  public showWebSocketInterface(): void {
    const interfaceElement = document.getElementById('websocket-interface');
    if (interfaceElement) {
      interfaceElement.style.display = 'flex';
    }
  }

  public addMessage(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const messageLog = document.getElementById('message-log');
    if (!messageLog) return;

    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${timestamp}] ${message}`;
    
    messageLog.appendChild(entry);
    messageLog.scrollTop = messageLog.scrollHeight;

    // Keep only last 50 messages
    const entries = messageLog.children;
    if (entries.length > 50) {
      messageLog.removeChild(entries[0]);
    }
  }

  public showWelcomeMessage(payload: any): void {
    this.addMessage(`👋 Servidor: ${payload.serverVersion || 'unknown'}`, 'success');
    this.addMessage(`🆔 Client ID: ${payload.clientId}`, 'info');
  }

  public setDebugMode(enabled: boolean): void {
    this.toggleDebugPanel(enabled);
  }

  public destroy(): void {
    logger.info('🧹 Destruyendo UIManagerSimple');
    
    this.stopDebugUpdates();
    
    if (this.overlayElement) {
      this.overlayElement.remove();
    }
  }
}
