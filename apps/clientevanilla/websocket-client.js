/**
 * WebSocket Client for VR Sync - Ecopetrol
 * Implements full protocol compatibility with server
 */
class VRWebSocketClient {
  constructor(options = {}) {
    // No default hardcoded URL - must be provided by caller
    if (!options.serverUrl) {
      throw new Error("🚨 serverUrl is required - no hardcoded URLs allowed");
    }
    this.serverUrl = options.serverUrl;
    this.deviceId = options.deviceId || `client-${Date.now()}`;
    this.reconnectInterval = options.reconnectInterval || 3000;
    this.pingInterval = options.pingInterval || 5000;

    this.ws = null;
    this.clientId = null;
    this.isConnected = false;
    this.lastPing = 0;
    this.serverOffset = 0; // Server time offset for sync
    this.latency = 0;

    this.reconnectTimer = null;
    this.pingTimer = null;

    // Event callbacks
    this.onConnect = options.onConnect || (() => {});
    this.onDisconnect = options.onDisconnect || (() => {});
    this.onCommand = options.onCommand || (() => {});
    this.onError = options.onError || (() => {});
    this.onPong = options.onPong || (() => {});

    console.log("🔌 VRWebSocketClient initialized for:", this.serverUrl);
  }

  connect() {
    console.log("🔄 Iniciando conexión WebSocket...");
    console.log("🎯 URL de destino:", this.serverUrl);
    console.log("📱 Device ID:", this.deviceId);

    try {
      this.ws = new WebSocket(this.serverUrl);
      console.log("🔌 WebSocket object creado, esperando conexión...");

      this.ws.onopen = () => {
        console.log("✅ WebSocket conectado exitosamente");
        console.log("🌐 URL conectada:", this.serverUrl);
        console.log("🕒 Timestamp de conexión:", new Date().toISOString());

        this.isConnected = true;
        this.sendHello();
        this.startPing();
        this.onConnect();
      };

      this.ws.onmessage = (event) => {
        console.log("📨 Mensaje recibido:", event.data.substring(0, 100) + (event.data.length > 100 ? "..." : ""));
        this.handleMessage(event.data);
      };

      this.ws.onclose = (event) => {
        console.log("❌ WebSocket desconectado");
        console.log("🔢 Código de cierre:", event.code);
        console.log("📝 Razón:", event.reason || "Sin razón específica");
        console.log("🔄 ¿Fue limpio?:", event.wasClean);

        this.logDisconnectReason(event.code);

        this.isConnected = false;
        this.stopPing();
        this.onDisconnect(event);
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error("🚨 Error de WebSocket:");
        console.error("📍 URL:", this.serverUrl);
        console.error("🔍 Error:", error);
        console.error("🕒 Timestamp:", new Date().toISOString());

        // Try to provide more context about the error
        if (this.serverUrl.startsWith("wss:") && window.location.protocol === "https:") {
          console.log("🔐 Conexión segura (WSS) desde página HTTPS - configuración correcta");
        } else if (this.serverUrl.startsWith("ws:") && window.location.protocol === "https:") {
          console.warn("⚠️ Intento de conexión WS desde página HTTPS - posible problema de mixed content");
        }

        this.onError(error);
      };
    } catch (error) {
      console.error("❌ Error crítico creando WebSocket:");
      console.error("📍 URL:", this.serverUrl);
      console.error("🔍 Error:", error);
      console.error("📊 Navigator info:", {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      });

      this.onError(error);
      this.scheduleReconnect();
    }
  }

  disconnect() {
    console.log("🔌 Disconnecting WebSocket...");

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopPing();

    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }

    this.isConnected = false;
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;

    console.log(`🔄 Programando reconexión en ${this.reconnectInterval}ms...`);
    console.log(`⏰ Próximo intento a las: ${new Date(Date.now() + this.reconnectInterval).toLocaleTimeString()}`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      console.log("🔄 Iniciando intento de reconexión automática...");
      this.connect();
    }, this.reconnectInterval);
  }

  logDisconnectReason(code) {
    const reasons = {
      1000: "🟢 Conexión cerrada normalmente",
      1001: "🔄 Cliente navegando a otra página",
      1002: "🚨 Error de protocolo WebSocket",
      1003: "❌ Datos no aceptables recibidos",
      1006: "🔌 Conexión cerrada de forma anormal (sin close frame)",
      1011: "🚨 Error inesperado en el servidor",
      1012: "🔄 Servidor reiniciando",
      1013: "⏳ Servidor temporalmente no disponible",
      1015: "🔐 Error de handshake TLS"
    };

    const reason = reasons[code] || `❓ Código desconocido: ${code}`;
    console.log("📋 Razón de desconexión:", reason);

    // Provide suggestions based on error code
    if (code === 1006) {
      console.warn("💡 Sugerencia: Verificar que el servidor WebSocket esté ejecutándose");
      console.warn("💡 Sugerencia: Verificar la URL del WebSocket y el puerto");
    } else if (code === 1015) {
      console.warn("💡 Sugerencia: Problema con certificados SSL/TLS");
      console.warn("💡 Sugerencia: Verificar configuración HTTPS/WSS");
    }
  }

  sendHello() {
    const battery = this.getBatteryLevel();
    const userAgent = navigator.userAgent;

    const message = {
      type: "HELLO",
      payload: {
        deviceId: this.deviceId,
        version: "1.0.0",
        userAgent: userAgent,
        battery: battery,
      },
    };

    console.log("👋 Enviando mensaje HELLO al servidor:");
    console.log("📱 Device ID:", this.deviceId);
    console.log("🔋 Batería:", battery + "%");
    console.log("🌐 User Agent:", userAgent.substring(0, 50) + "...");

    this.send(message);
  }

  startPing() {
    this.stopPing();

    this.pingTimer = setInterval(() => {
      if (this.isConnected) {
        this.sendPing();
      }
    }, this.pingInterval);
  }

  stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  sendPing() {
    const tClient = Date.now();
    this.lastPing = tClient;

    const message = {
      type: "PING",
      payload: { tClient },
    };

    this.send(message);
  }

  sendReady(sceneId) {
    const message = {
      type: "READY",
      payload: { sceneId },
    };

    this.send(message);
    console.log("✅ Sent READY for scene:", sceneId);
  }

  sendState(sceneId, currentTime, playing, buffered = 100) {
    // Ensure buffered is a valid percentage (0-100) as expected by server protocol
    const validBuffered = Math.min(100, Math.max(0, Number(buffered) || 0));

    const message = {
      type: "STATE",
      payload: {
        sceneId,
        currentTime,
        playing,
        buffered: validBuffered,
      },
    };

    this.send(message);
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("⚠️ WebSocket not connected, cannot send message:", message);
    }
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case "WELCOME":
          this.handleWelcome(message);
          break;
        case "PONG":
          this.handlePong(message);
          break;
        case "COMMAND":
          this.handleCommand(message);
          break;
        case "ERROR":
          this.handleError(message);
          break;
        default:
          console.warn("🤷 Unknown message type:", message.type);
      }
    } catch (error) {
      console.error("❌ Error parsing message:", error, data);
    }
  }

  handleWelcome(message) {
    this.clientId = message.payload.clientId;
    const serverTime = message.payload.serverEpochMs;
    const clientTime = Date.now();

    // Calculate server offset for sync
    this.serverOffset = serverTime - clientTime;

    console.log("🎉 ¡WELCOME recibido del servidor!");
    console.log("🆔 Client ID asignado:", this.clientId);
    console.log("📦 Versión del servidor:", message.payload.serverVersion);
    console.log("🕒 Tiempo del servidor:", new Date(serverTime).toISOString());
    console.log("🕒 Tiempo del cliente:", new Date(clientTime).toISOString());
    console.log("⚖️ Offset de sincronización:", this.serverOffset + "ms");

    if (Math.abs(this.serverOffset) > 5000) {
      console.warn("⚠️ Gran diferencia de tiempo detectada:", this.serverOffset + "ms");
      console.warn("💡 Esto puede afectar la sincronización de audio/video");
    } else {
      console.log("✅ Sincronización de tiempo aceptable");
    }
  }

  handlePong(message) {
    const tClient = message.payload.tClient;
    const tServer = message.payload.tServer;
    const now = Date.now();

    // Calculate latency
    this.latency = now - tClient;

    // Update server offset with RTT compensation
    this.serverOffset = tServer - (tClient + this.latency / 2);

    // Solo mostrar log si hay problemas de conectividad
    if (this.latency > 1000 || Math.abs(this.serverOffset) > 5000) {
      console.warn(
        "🏓 PONG con problemas - Latency:",
        this.latency,
        "ms, Offset:",
        this.serverOffset,
        "ms"
      );
    }
    this.onPong({ latency: this.latency, offset: this.serverOffset });
  }

  handleCommand(message) {
    const command = message.payload;
    console.log("📢 Comando recibido:", command.commandType);

    this.onCommand(command);
  }

  handleError(message) {
    console.error("🚨 Server error:", message.payload.message);
    this.onError(new Error(message.payload.message));
  }

  getBatteryLevel() {
    // Return a default value since battery API is async and optional
    return 75; // Default battery level for compatibility
  }

  // Utility methods for time sync
  getServerTime() {
    return Date.now() + this.serverOffset;
  }

  getStatus() {
    return {
      connected: this.isConnected,
      clientId: this.clientId,
      deviceId: this.deviceId,
      latency: this.latency,
      serverOffset: this.serverOffset,
      lastPing: this.lastPing,
    };
  }

  /**
   * Get detailed debug information
   */
  getDebugInfo() {
    const info = {
      connection: {
        url: this.serverUrl,
        connected: this.isConnected,
        readyState: this.ws?.readyState,
        protocol: this.ws?.protocol || "unknown"
      },
      client: {
        clientId: this.clientId,
        deviceId: this.deviceId,
        userAgent: navigator.userAgent
      },
      sync: {
        latency: this.latency,
        serverOffset: this.serverOffset,
        lastPing: this.lastPing,
        serverTime: this.getServerTime()
      },
      page: {
        url: window.location.href,
        protocol: window.location.protocol,
        host: window.location.host,
        port: window.location.port
      },
      timestamps: {
        now: Date.now(),
        lastConnection: this.lastPing
      }
    };

    console.log("🔍 Debug Info:", info);
    return info;
  }

  /**
   * Log connection diagnostics
   */
  logDiagnostics() {
    console.log("🏥 Diagnóstico de conexión WebSocket:");
    console.log("═══════════════════════════════════");

    const debug = this.getDebugInfo();

    console.log("🔗 Estado de conexión:");
    console.log(`   URL: ${debug.connection.url}`);
    console.log(`   Conectado: ${debug.connection.connected ? '✅' : '❌'}`);
    console.log(`   Ready State: ${this.getReadyStateText(debug.connection.readyState)}`);

    console.log("👤 Información del cliente:");
    console.log(`   Device ID: ${debug.client.deviceId}`);
    console.log(`   Client ID: ${debug.client.clientId || 'No asignado'}`);

    console.log("📡 Sincronización:");
    console.log(`   Latencia: ${debug.sync.latency}ms`);
    console.log(`   Offset: ${debug.sync.serverOffset}ms`);
    console.log(`   Último ping: ${debug.sync.lastPing ? new Date(debug.sync.lastPing).toLocaleTimeString() : 'Nunca'}`);

    console.log("═══════════════════════════════════");
  }

  getReadyStateText(state) {
    const states = {
      0: "CONNECTING (Conectando)",
      1: "OPEN (Abierto)",
      2: "CLOSING (Cerrando)",
      3: "CLOSED (Cerrado)"
    };
    return states[state] || `Unknown (${state})`;
  }
}

// Export for use in other scripts
window.VRWebSocketClient = VRWebSocketClient;

// Auto-connect if in development
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "192.168.40.31"
) {
  console.log("🚀 Auto-initializing WebSocket client for development...");
}
