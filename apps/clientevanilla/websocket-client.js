/**
 * WebSocket Client for VR Sync - Ecopetrol
 * Implements full protocol compatibility with server
 */
class VRWebSocketClient {
  constructor(options = {}) {
    this.serverUrl = options.serverUrl || "wss://192.168.40.31:8081/ws";
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
    console.log("🔄 Connecting to WebSocket server...");

    try {
      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        console.log("✅ WebSocket connected");
        this.isConnected = true;
        this.sendHello();
        this.startPing();
        this.onConnect();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = (event) => {
        console.log("❌ WebSocket disconnected:", event.code, event.reason);
        this.isConnected = false;
        this.stopPing();
        this.onDisconnect(event);
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error("🚨 WebSocket error:", error);
        this.onError(error);
      };
    } catch (error) {
      console.error("❌ Failed to create WebSocket connection:", error);
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

    console.log(`🔄 Scheduling reconnect in ${this.reconnectInterval}ms...`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectInterval);
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

    this.send(message);
    console.log("👋 Sent HELLO message");
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
    const message = {
      type: "STATE",
      payload: {
        sceneId,
        currentTime,
        playing,
        buffered,
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

    console.log("🎉 Received WELCOME:", {
      clientId: this.clientId,
      serverVersion: message.payload.serverVersion,
      serverOffset: this.serverOffset,
    });
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
