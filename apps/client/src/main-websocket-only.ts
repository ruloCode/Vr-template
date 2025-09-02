import { logger } from '@/utils/logger';

// Ultra simple WebSocket-only client
class WebSocketOnlyClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private pingInterval: number | null = null;
  
  // Scenario state
  private currentScenario: string | null = null;
  private isPlaying = false;
  private countdownInterval: number | null = null;
  private scenarioStartTime: number | null = null;

  constructor() {
    logger.info('🔌 WebSocket-only client iniciado');
    this.setupUI();
    this.connect();
  }

  private setupUI(): void {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      <div style="
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          max-width: 600px;
          width: 100%;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 40px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          text-align: center;
        ">
          <div style="font-size: 4rem; margin-bottom: 20px;" id="status-icon">🔌</div>
          <h1 style="margin-bottom: 10px;">WebSocket Test Client</h1>
          <p style="margin-bottom: 30px; opacity: 0.9;">Prueba de conexión WebSocket con el servidor</p>
          
          <div style="
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 30px;
          ">
            <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 15px;">
              <div id="status-dot" style="
                width: 15px;
                height: 15px;
                border-radius: 50%;
                background: #dc3545;
                animation: pulse 2s infinite;
              "></div>
              <span id="status-text" style="font-size: 1.2rem; font-weight: bold;">Desconectado</span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
              <div style="text-align: left;">
                <div style="opacity: 0.8; font-size: 0.9rem;">WebSocket URL:</div>
                <div id="ws-url" style="font-family: monospace; font-size: 0.8rem; word-break: break-all;">-</div>
              </div>
              <div style="text-align: left;">
                <div style="opacity: 0.8; font-size: 0.9rem;">Latencia:</div>
                <div id="latency" style="font-family: monospace;">-</div>
              </div>
              <div style="text-align: left;">
                <div style="opacity: 0.8; font-size: 0.9rem;">Intentos:</div>
                <div id="attempts" style="font-family: monospace;">0</div>
              </div>
              <div style="text-align: left;">
                <div style="opacity: 0.8; font-size: 0.9rem;">Device ID:</div>
                <div id="device-id" style="font-family: monospace; font-size: 0.8rem;">-</div>
              </div>
            </div>
          </div>

          <!-- Scenario Status -->
          <div id="scenario-status" style="
            background: rgba(0, 0, 0, 0.4);
            border-radius: 10px;
            padding: 25px;
            margin-bottom: 20px;
            text-align: center;
            display: none;
          ">
            <div id="scenario-icon" style="font-size: 3rem; margin-bottom: 15px;">🎬</div>
            <h2 id="scenario-title" style="margin-bottom: 10px; font-size: 1.5rem;">Sin Escenario</h2>
            <div id="scenario-state" style="
              font-size: 1.1rem;
              margin-bottom: 15px;
              opacity: 0.9;
            ">Esperando comandos...</div>
            
            <!-- Countdown -->
            <div id="countdown-container" style="display: none;">
              <div id="countdown-timer" style="
                font-size: 4rem;
                font-weight: bold;
                color: #ffc107;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                margin: 20px 0;
              ">10</div>
              <div style="font-size: 1.2rem; opacity: 0.9;">
                Iniciando en...
              </div>
            </div>
            
            <!-- Playing indicator -->
            <div id="playing-container" style="display: none;">
              <div style="
                font-size: 2rem;
                color: #28a745;
                margin: 20px 0;
                animation: pulse 1s infinite;
              ">▶️ REPRODUCIENDO</div>
              <div id="play-timer" style="font-size: 1.2rem; opacity: 0.9;">
                00:00
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 15px; justify-content: center; margin-bottom: 30px; flex-wrap: wrap;">
            <button id="connect-btn" onclick="window.wsClient.connect()" style="
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              background: #28a745;
              color: white;
              font-size: 1rem;
              cursor: pointer;
              font-weight: 600;
            ">🔗 Conectar</button>
            
            <button id="disconnect-btn" onclick="window.wsClient.disconnect()" style="
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              background: #dc3545;
              color: white;
              font-size: 1rem;
              cursor: pointer;
              font-weight: 600;
            " disabled>🔌 Desconectar</button>
            
            <button id="ping-btn" onclick="window.wsClient.sendPing()" style="
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              background: #007bff;
              color: white;
              font-size: 1rem;
              cursor: pointer;
              font-weight: 600;
            " disabled>🏓 Ping</button>
            
            <button id="ready-btn" onclick="window.wsClient.sendReady()" style="
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              background: #17a2b8;
              color: white;
              font-size: 1rem;
              cursor: pointer;
              font-weight: 600;
            " disabled>✅ Ready</button>
          </div>

          <div style="
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            padding: 20px;
            text-align: left;
            max-height: 300px;
            overflow-y: auto;
          ">
            <h3 style="margin-bottom: 15px; text-align: center;">📋 Log de Eventos</h3>
            <div id="log" style="
              font-family: monospace;
              font-size: 0.9rem;
              line-height: 1.4;
            ">
              <div style="color: #17a2b8;">[${new Date().toLocaleTimeString()}] Cliente WebSocket iniciado</div>
            </div>
          </div>
        </div>
      </div>

      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }
        .scenario-loading {
          animation: bounce 2s infinite;
        }
      </style>
    `;

    // Initialize UI
    const deviceId = this.generateDeviceId();
    document.getElementById('device-id')!.textContent = deviceId.substring(0, 12) + '...';
    
    const wsUrl = this.getWebSocketURL();
    document.getElementById('ws-url')!.textContent = wsUrl;
  }

  private generateDeviceId(): string {
    return 'ws-test-' + Math.random().toString(36).substr(2, 9);
  }

  private getWebSocketURL(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = 8081; // Fixed WebSocket port
    return `${protocol}//${host}:${port}/ws`;
  }

  private log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info'): void {
    const logElement = document.getElementById('log');
    if (!logElement) return;

    const colors = {
      info: '#17a2b8',
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107'
    };

    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.style.color = colors[type];
    entry.innerHTML = `[${timestamp}] ${message}`;
    
    logElement.appendChild(entry);
    logElement.scrollTop = logElement.scrollHeight;

    // Keep only last 20 entries
    const entries = logElement.children;
    if (entries.length > 20) {
      logElement.removeChild(entries[0]);
    }

    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  private updateStatus(status: 'connected' | 'connecting' | 'disconnected' | 'error', text?: string): void {
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const statusIcon = document.getElementById('status-icon');
    const connectBtn = document.getElementById('connect-btn') as HTMLButtonElement;
    const disconnectBtn = document.getElementById('disconnect-btn') as HTMLButtonElement;
    const pingBtn = document.getElementById('ping-btn') as HTMLButtonElement;
    const readyBtn = document.getElementById('ready-btn') as HTMLButtonElement;

    if (!statusDot || !statusText || !statusIcon) return;

    const configs = {
      connected: { color: '#28a745', icon: '✅', text: 'Conectado' },
      connecting: { color: '#ffc107', icon: '🔄', text: 'Conectando...' },
      disconnected: { color: '#dc3545', icon: '🔌', text: 'Desconectado' },
      error: { color: '#dc3545', icon: '❌', text: 'Error' }
    };

    const config = configs[status];
    statusDot.style.background = config.color;
    statusText.textContent = text || config.text;
    statusIcon.textContent = config.icon;

    // Update button states
    const isConnected = status === 'connected';
    connectBtn.disabled = isConnected;
    disconnectBtn.disabled = !isConnected;
    pingBtn.disabled = !isConnected;
    readyBtn.disabled = !isConnected;
  }

  public connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.log('Ya hay una conexión activa', 'warning');
      return;
    }

    const wsUrl = this.getWebSocketURL();
    this.log(`Conectando a ${wsUrl}...`, 'info');
    this.updateStatus('connecting');

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.log('✅ Conexión WebSocket establecida', 'success');
        this.updateStatus('connected');
        this.reconnectAttempts = 0;
        this.startPingInterval();
        this.sendHello();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          this.log(`Error parseando mensaje: ${error}`, 'error');
        }
      };

      this.ws.onclose = (event) => {
        this.log(`Conexión cerrada - Código: ${event.code}`, 'warning');
        this.updateStatus('disconnected');
        this.stopPingInterval();
        
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        this.log('Error en la conexión WebSocket', 'error');
        this.updateStatus('error');
      };

    } catch (error) {
      this.log(`Error creando WebSocket: ${error}`, 'error');
      this.updateStatus('error');
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.log('Desconectando...', 'info');
      this.ws.close(1000, 'Desconectado por el usuario');
      this.ws = null;
    }
    this.stopPingInterval();
    this.updateStatus('disconnected');
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const attempts = document.getElementById('attempts');
    if (attempts) attempts.textContent = this.reconnectAttempts.toString();

    this.log(`Reintentando conexión en 3s (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 'warning');
    
    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  private startPingInterval(): void {
    this.pingInterval = window.setInterval(() => {
      this.sendPing();
    }, 5000);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public sendPing(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.log('No hay conexión para enviar ping', 'warning');
      return;
    }

    const pingData = {
      type: 'PING',
      payload: { tClient: Date.now() }
    };

    this.ws.send(JSON.stringify(pingData));
    this.log('🏓 Ping enviado', 'info');
  }

  private sendHello(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const helloData = {
      type: 'HELLO',
      payload: {
        deviceId: this.generateDeviceId(),
        version: '1.0.0-websocket-only',
        userAgent: navigator.userAgent
      }
    };

    this.ws.send(JSON.stringify(helloData));
    this.log('👋 Hello enviado', 'info');
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'WELCOME':
        this.log(`👋 Bienvenida del servidor - ID: ${message.payload.clientId}`, 'success');
        this.showScenarioStatus();
        break;
      
      case 'PONG':
        const latency = Date.now() - message.payload.tClient;
        const latencyElement = document.getElementById('latency');
        if (latencyElement) latencyElement.textContent = `${latency}ms`;
        this.log(`🏓 Pong recibido - ${latency}ms`, 'success');
        break;
      
      case 'COMMAND':
        this.handleCommand(message.payload);
        break;
      
      default:
        this.log(`📨 Mensaje: ${message.type}`, 'info');
        if (message.payload) {
          this.log(`   Datos: ${JSON.stringify(message.payload)}`, 'info');
        }
    }
  }

  private handleCommand(payload: any): void {
    switch (payload.commandType) {
      case 'LOAD':
        this.handleLoadScene(payload.sceneId);
        break;
      
      case 'START_AT':
        this.handleStartAt(payload.epochMs);
        break;
      
      case 'PAUSE':
        this.handlePause();
        break;
      
      case 'RESUME':
        this.handleResume();
        break;
      
      default:
        this.log(`❓ Comando desconocido: ${payload.commandType}`, 'warning');
    }
  }

  private handleLoadScene(sceneId: string): void {
    this.currentScenario = sceneId;
    this.log(`🎬 Cargando escena: ${sceneId}`, 'info');
    
    const scenarioMap: { [key: string]: string } = {
      'escena-1': 'Riqueza Natural',
      'escena-2': 'Dinámica del País',
      'escena-3': 'Exploración On/Offshore'
    };
    
    const scenarioTitle = scenarioMap[sceneId] || sceneId;
    this.updateScenarioUI(scenarioTitle, 'Escena cargada - Esperando inicio...', '🎬');
    
    // Simulate loading time
    setTimeout(() => {
      this.updateScenarioUI(scenarioTitle, 'Listo para reproducir', '✅');
      this.sendReadyMessage();
    }, 2000);
  }

  private handleStartAt(epochMs: number): void {
    if (!this.currentScenario) {
      this.log('❌ No hay escena cargada para iniciar', 'error');
      return;
    }

    const now = Date.now();
    const delayMs = epochMs - now;
    
    this.log(`⏰ Inicio programado en ${Math.round(delayMs/1000)}s`, 'info');
    this.scenarioStartTime = epochMs;
    
    if (delayMs > 0) {
      this.startCountdown(Math.ceil(delayMs / 1000));
    } else {
      this.startPlayback();
    }
  }

  private handlePause(): void {
    this.isPlaying = false;
    this.log('⏸️ Reproducción pausada', 'warning');
    this.updateScenarioUI(null, 'PAUSADO', '⏸️');
    this.stopCountdown();
  }

  private handleResume(): void {
    this.isPlaying = true;
    this.log('▶️ Reproducción reanudada', 'success');
    this.updateScenarioUI(null, 'REPRODUCIENDO', '▶️');
  }

  private startCountdown(seconds: number): void {
    this.stopCountdown();
    this.showCountdown();
    
    let remaining = seconds;
    const countdownTimer = document.getElementById('countdown-timer');
    
    this.countdownInterval = window.setInterval(() => {
      if (countdownTimer) {
        countdownTimer.textContent = remaining.toString();
      }
      
      this.log(`⏰ Iniciando en ${remaining}s`, 'warning');
      remaining--;
      
      if (remaining < 0) {
        this.startPlayback();
      }
    }, 1000);
  }

  private startPlayback(): void {
    this.stopCountdown();
    this.hideCountdown();
    this.showPlaying();
    
    this.isPlaying = true;
    this.log('▶️ ¡Reproducción iniciada!', 'success');
    
    // Start play timer
    this.startPlayTimer();
  }

  private startPlayTimer(): void {
    const playTimer = document.getElementById('play-timer');
    if (!playTimer || !this.scenarioStartTime) return;
    
    const updateTimer = () => {
      if (!this.isPlaying || !this.scenarioStartTime) return;
      
      const elapsed = Math.max(0, Date.now() - this.scenarioStartTime);
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      
      playTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
    
    updateTimer();
    setInterval(updateTimer, 1000);
  }

  private stopCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  private showScenarioStatus(): void {
    const scenarioStatus = document.getElementById('scenario-status');
    if (scenarioStatus) scenarioStatus.style.display = 'block';
  }

  private showCountdown(): void {
    const countdownContainer = document.getElementById('countdown-container');
    const playingContainer = document.getElementById('playing-container');
    
    if (countdownContainer) countdownContainer.style.display = 'block';
    if (playingContainer) playingContainer.style.display = 'none';
  }

  private hideCountdown(): void {
    const countdownContainer = document.getElementById('countdown-container');
    if (countdownContainer) countdownContainer.style.display = 'none';
  }

  private showPlaying(): void {
    const playingContainer = document.getElementById('playing-container');
    if (playingContainer) playingContainer.style.display = 'block';
  }

  private updateScenarioUI(title?: string | null, state?: string, icon?: string): void {
    const titleElement = document.getElementById('scenario-title');
    const stateElement = document.getElementById('scenario-state');
    const iconElement = document.getElementById('scenario-icon');
    
    if (title && titleElement) titleElement.textContent = title;
    if (state && stateElement) stateElement.textContent = state;
    if (icon && iconElement) iconElement.textContent = icon;
  }

  public sendReady(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.log('No hay conexión para enviar ready', 'warning');
      return;
    }

    const readyData = {
      type: 'READY',
      payload: { sceneId: this.currentScenario || 'unknown' }
    };

    this.ws.send(JSON.stringify(readyData));
    this.log('✅ Ready enviado', 'success');
  }

  private sendReadyMessage(): void {
    this.sendReady();
  }
}

// Initialize and expose globally
const wsClient = new WebSocketOnlyClient();
(window as any).wsClient = wsClient;

// Auto-connect after 1 second
setTimeout(() => {
  wsClient.connect();
}, 1000);
