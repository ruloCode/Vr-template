import { WebSocket, WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import https from "https";
import {
  ClientMessage,
  ClientMessageSchema,
  ServerMessage,
  ClientStatus,
  RoomState,
  SequenceState,
  PROTOCOL_VERSION,
  HEARTBEAT_INTERVAL_MS,
  CLIENT_TIMEOUT_MS,
  PING_INTERVAL_MS,
} from "../types/protocol.js";
import { logger } from "../utils/logger.js";
import { config } from "../utils/config.js";
import { SequenceManager, SequenceManagerEvents } from "../managers/sequence-manager.js";

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, ClientConnection> = new Map();
  private room: RoomState;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private sslOptions: https.ServerOptions | null;
  private sequenceManager: SequenceManager;

  constructor(sslOptions: https.ServerOptions | null = null) {
    this.sslOptions = sslOptions;
    const wsPort = config.port + 1;

    logger.info("🔄 Initializing WebSocket server...");

    const wsOptions: any = {
      port: wsPort,
      path: config.paths.websocket,
    };

    // If SSL is available, create HTTPS server for WSS
    if (this.sslOptions) {
      logger.info("🔐 SSL certificates detected, configuring WSS server...");

      const httpsServer = https.createServer(this.sslOptions);
      wsOptions.server = httpsServer;
      delete wsOptions.port; // Remove port when using existing server

      httpsServer.listen(wsPort, config.host, () => {
        logger.info(`🔒 WSS (Secure WebSocket) server listening on ${config.host}:${wsPort}`);
        logger.info(`🔗 WSS URL: wss://${config.host}:${wsPort}${config.paths.websocket}`);
      });

      httpsServer.on('error', (error) => {
        logger.error("🚨 HTTPS server error:", error);
        logger.error("💡 Verificar certificados SSL en apps/server/ssl/");
      });

    } else {
      logger.info("🔓 No SSL certificates, using regular WebSocket server...");
      logger.info(`🔌 WS server will listen on ${config.host}:${wsPort}`);
      logger.info(`🔗 WS URL: ws://${config.host}:${wsPort}${config.paths.websocket}`);
    }

    // Create WebSocket server with error handling
    try {
      this.wss = new WebSocketServer(wsOptions);
      logger.info("✅ WebSocket server instance created successfully");
    } catch (error) {
      logger.error("❌ Failed to create WebSocket server:", error);
      throw error;
    }

    // Initialize room state
    this.room = {
      id: "main",
      clients: [],
      isPlaying: false,
      seekOffset: 0,
      sequenceState: {
        isActive: false,
        isPaused: false,
        currentSceneIndex: 0,
        progress: 0,
        autoLoop: false,
      },
    };

    // Initialize sequence manager with event handlers
    this.sequenceManager = new SequenceManager({
      onSceneChange: (sceneId: string, sceneIndex: number) => {
        logger.info(`🎬 Sequence scene change: ${sceneId} (${sceneIndex})`);
        this.room.currentScene = sceneId;
        this.broadcastCommand({
          type: "COMMAND",
          payload: { commandType: "LOAD", sceneId }
        });
        this.updateRoomState();
      },
      onSequenceComplete: (sequenceId: string) => {
        logger.info(`✅ Sequence completed: ${sequenceId}`);
        this.updateRoomState();
      },
      onSequencePaused: (sequenceId: string) => {
        logger.info(`⏸️ Sequence paused: ${sequenceId}`);
        this.broadcastCommand({
          type: "COMMAND",
          payload: { commandType: "PAUSE" }
        });
        this.updateRoomState();
      },
      onSequenceResumed: (sequenceId: string) => {
        logger.info(`▶️ Sequence resumed: ${sequenceId}`);
        this.broadcastCommand({
          type: "COMMAND",
          payload: { commandType: "RESUME" }
        });
        this.updateRoomState();
      },
      onProgress: (progress: number, remainingMs: number) => {
        // Update room state with current progress
        if (this.room.sequenceState) {
          this.room.sequenceState.progress = progress;
          this.room.sequenceState.remainingTime = remainingMs;
        }
      },
      onError: (error: Error) => {
        logger.error("SequenceManager error:", error);
      }
    });

    this.setupWebSocketServer();
    this.startHeartbeat();

    const protocol = this.sslOptions ? "WSS" : "WS";
    logger.info(`✅ ${protocol} WebSocket server initialized on port ${wsPort}`);
    logger.info(`🎯 Ready to accept ${this.sslOptions ? 'secure' : 'regular'} WebSocket connections`);
  }

  private setupWebSocketServer(): void {
    this.wss.on("connection", (ws: WebSocket, request) => {
      const clientId = uuidv4();
      const clientIP = request.socket.remoteAddress || "unknown";
      const userAgent = request.headers['user-agent'] || "unknown";

      logger.info(`🎮 Nueva conexión WebSocket:`);
      logger.info(`   Client ID: ${clientId}`);
      logger.info(`   IP: ${clientIP}`);
      logger.info(`   User-Agent: ${userAgent.substring(0, 50)}...`);
      logger.info(`   Protocol: ${this.sslOptions ? 'WSS (Secure)' : 'WS (Regular)'}`);

      const connection = new ClientConnection(clientId, ws, this);
      this.clients.set(clientId, connection);

      logger.info(`📊 Total clientes conectados: ${this.clients.size}`);

      ws.on("close", (code, reason) => {
        logger.info(`🔌 Cliente desconectado: ${clientId}`);
        logger.info(`   Código: ${code}, Razón: ${reason?.toString() || 'Sin especificar'}`);
        this.handleClientDisconnect(clientId);
      });

      ws.on("error", (error) => {
        logger.error(`🚨 Error en WebSocket ${clientId}:`, error);
        logger.error(`   IP: ${clientIP}`);
        this.handleClientDisconnect(clientId);
      });
    });

    this.wss.on("error", (error) => {
      logger.error("🚨 WebSocket Server Error:", error);
    });

    this.wss.on("listening", () => {
      logger.info("👂 WebSocket server is now listening for connections");
    });

    logger.info("🔧 WebSocket server event handlers configured");
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();

      for (const [clientId, connection] of this.clients) {
        if (now - connection.lastPing > CLIENT_TIMEOUT_MS) {
          logger.warn(`Cliente ${clientId} timeout, desconectando`);
          this.handleClientDisconnect(clientId);
        }
      }

      this.updateRoomState();
    }, HEARTBEAT_INTERVAL_MS);
  }

  private handleClientDisconnect(clientId: string): void {
    const connection = this.clients.get(clientId);
    if (connection) {
      const status = connection.getStatus();
      logger.info(`📤 Removing client ${clientId}:`);
      logger.info(`   Device ID: ${status.deviceId || 'Not provided'}`);
      logger.info(`   Last status: ${status.status}`);
      logger.info(`   Connected duration: ${Math.round((Date.now() - status.connectedAt) / 1000)}s`);

      connection.close();
      this.clients.delete(clientId);
      this.updateRoomState();

      logger.info(`📊 Remaining clients: ${this.clients.size}`);
    } else {
      logger.warn(`⚠️ Attempted to disconnect unknown client: ${clientId}`);
    }
  }

  private updateRoomState(): void {
    this.room.clients = Array.from(this.clients.values()).map((conn) =>
      conn.getStatus()
    );
    this.room.sequenceState = this.sequenceManager.getState();
  }

  public broadcastCommand(command: ServerMessage): void {
    // Broadcasting command

    for (const connection of this.clients.values()) {
      connection.send(command);
    }
  }

  public getRoom(): RoomState {
    this.updateRoomState();
    return this.room;
  }

  public getClientCount(): number {
    return this.clients.size;
  }

  public getReadyClientCount(): number {
    return Array.from(this.clients.values()).filter(
      (conn) => conn.getStatus().status === "ready"
    ).length;
  }

  // Sequence management methods
  public async startSequence(sequenceId: string, config?: { autoLoop?: boolean, showScreensAutomatically?: boolean }): Promise<boolean> {
    const result = await this.sequenceManager.startSequence(sequenceId, config);
    this.updateRoomState();
    return result;
  }

  public async stopSequence(): Promise<void> {
    await this.sequenceManager.stopSequence();
    this.updateRoomState();
  }

  public pauseSequence(): boolean {
    const result = this.sequenceManager.pauseSequence();
    this.updateRoomState();
    return result;
  }

  public resumeSequence(): boolean {
    const result = this.sequenceManager.resumeSequence();
    this.updateRoomState();
    return result;
  }

  public async nextScene(): Promise<boolean> {
    const result = await this.sequenceManager.nextScene();
    this.updateRoomState();
    return result;
  }

  public async previousScene(): Promise<boolean> {
    const result = await this.sequenceManager.previousScene();
    this.updateRoomState();
    return result;
  }

  public async jumpToScene(sceneIndex: number): Promise<boolean> {
    const result = await this.sequenceManager.jumpToScene(sceneIndex);
    this.updateRoomState();
    return result;
  }

  public getAvailableSequences() {
    return this.sequenceManager.getAvailableSequences();
  }

  public updateSequence(sequenceId: string, scenes: any[], config?: any) {
    // This would involve more complex validation and updating
    // For now, we'll implement the basic structure
    logger.info(`📝 Update sequence request for ${sequenceId}`);
    this.updateRoomState();
  }

  /**
   * Get debug information about WebSocket server
   */
  public getDebugInfo() {
    const clientsInfo = Array.from(this.clients.values()).map(conn => {
      const status = conn.getStatus();
      return {
        id: status.id,
        deviceId: status.deviceId,
        status: status.status,
        latency: status.latencyMs,
        connectedDuration: Math.round((Date.now() - status.connectedAt) / 1000)
      };
    });

    return {
      server: {
        protocol: this.sslOptions ? 'WSS' : 'WS',
        port: config.port + 1,
        hasSSL: !!this.sslOptions,
        uptime: process.uptime()
      },
      clients: {
        total: this.clients.size,
        connected: clientsInfo.filter(c => c.status === 'connected').length,
        ready: clientsInfo.filter(c => c.status === 'ready').length,
        playing: clientsInfo.filter(c => c.status === 'playing').length,
        list: clientsInfo
      },
      room: {
        id: this.room.id,
        currentScene: this.room.currentScene,
        isPlaying: this.room.isPlaying,
        sequenceActive: this.room.sequenceState?.isActive || false
      },
      timestamp: Date.now()
    };
  }

  /**
   * Log detailed debug information
   */
  public logDebugInfo() {
    const debug = this.getDebugInfo();

    logger.info("🔍 WebSocket Server Debug Information:");
    logger.info("═══════════════════════════════════════");
    logger.info(`🔧 Server: ${debug.server.protocol} on port ${debug.server.port}`);
    logger.info(`🔐 SSL: ${debug.server.hasSSL ? 'Enabled' : 'Disabled'}`);
    logger.info(`⏱️ Uptime: ${Math.round(debug.server.uptime)}s`);
    logger.info("───────────────────────────────────────");
    logger.info(`👥 Clients: ${debug.clients.total} total`);
    logger.info(`   Connected: ${debug.clients.connected}`);
    logger.info(`   Ready: ${debug.clients.ready}`);
    logger.info(`   Playing: ${debug.clients.playing}`);
    logger.info("───────────────────────────────────────");
    logger.info(`🎬 Room: ${debug.room.id}`);
    logger.info(`   Current Scene: ${debug.room.currentScene || 'None'}`);
    logger.info(`   Playing: ${debug.room.isPlaying}`);
    logger.info(`   Sequence Active: ${debug.room.sequenceActive}`);

    if (debug.clients.list.length > 0) {
      logger.info("───────────────────────────────────────");
      logger.info("📱 Client Details:");
      debug.clients.list.forEach((client, index) => {
        logger.info(`   ${index + 1}. ${client.deviceId || client.id.substr(0, 8)}`);
        logger.info(`      Status: ${client.status}`);
        logger.info(`      Latency: ${client.latency}ms`);
        logger.info(`      Connected: ${client.connectedDuration}s`);
      });
    }

    logger.info("═══════════════════════════════════════");
  }

  public close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Stop any active sequence
    this.sequenceManager.stopSequence();

    for (const connection of this.clients.values()) {
      connection.close();
    }

    this.wss.close();
    // WebSocket server closed
  }
}

class ClientConnection {
  private ws: WebSocket;
  private clientId: string;
  private manager: WebSocketManager;
  private status: ClientStatus;
  public lastPing: number = Date.now();

  constructor(clientId: string, ws: WebSocket, manager: WebSocketManager) {
    this.clientId = clientId;
    this.ws = ws;
    this.manager = manager;

    this.status = {
      id: clientId,
      deviceId: "",
      lastPingMs: Date.now(),
      latencyMs: 0,
      offsetMs: 0,
      status: "connected",
      connectedAt: Date.now(),
      lastStateUpdate: Date.now(),
    };

    this.setupMessageHandling();
  }

  private setupMessageHandling(): void {
    this.ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        const validatedMessage = ClientMessageSchema.parse(message);
        this.handleMessage(validatedMessage);
      } catch (error) {
        logger.error(`Error parsing message from ${this.clientId}:`, error);
        this.send({
          type: "ERROR",
          payload: { message: "Invalid message format" },
        });
      }
    });
  }

  private handleMessage(message: ClientMessage): void {
    this.lastPing = Date.now();

    switch (message.type) {
      case "HELLO":
        this.handleHello(message);
        break;
      case "PING":
        this.handlePing(message);
        break;
      case "READY":
        this.handleReady(message);
        break;
      case "STATE":
        this.handleState(message);
        break;
      default:
        logger.warn(`Mensaje no reconocido de ${this.clientId}:`, message);
    }
  }

  private handleHello(message: ClientMessage & { type: "HELLO" }): void {
    this.status.deviceId = message.payload.deviceId;
    this.status.battery = message.payload.battery;

    logger.info(`👋 HELLO recibido de ${this.clientId}:`);
    logger.info(`   Device ID: ${message.payload.deviceId}`);
    logger.info(`   Version: ${message.payload.version}`);
    logger.info(`   Battery: ${message.payload.battery || 'N/A'}%`);
    logger.info(`   User Agent: ${message.payload.userAgent?.substring(0, 50)}...`);

    const welcomeMessage = {
      type: "WELCOME" as const,
      payload: {
        serverEpochMs: Date.now(),
        clientId: this.clientId,
        serverVersion: PROTOCOL_VERSION,
      },
    };

    this.send(welcomeMessage);

    logger.info(`🎉 WELCOME enviado a ${message.payload.deviceId} (${this.clientId})`);
    logger.info(`   Server time: ${new Date().toISOString()}`);
    logger.info(`   Protocol version: ${PROTOCOL_VERSION}`);
  }

  private handlePing(message: ClientMessage & { type: "PING" }): void {
    const tServer = Date.now();
    const tClient = message.payload.tClient;
    const latency = tServer - tClient;

    this.status.latencyMs = latency;
    this.status.offsetMs = tServer - (tClient + latency / 2);
    this.status.lastPingMs = tServer;

    this.send({
      type: "PONG",
      payload: {
        tServer,
        tClient,
      },
    });
  }

  private handleReady(message: ClientMessage & { type: "READY" }): void {
    this.status.sceneId = message.payload.sceneId;
    this.status.status = "ready";
    this.status.lastStateUpdate = Date.now();

    logger.info(`✅ Cliente READY: ${this.status.deviceId} (${this.clientId})`);
    logger.info(`   Scene ID: ${message.payload.sceneId}`);
    logger.info(`   Status: ${this.status.status}`);
    logger.info(`   Latency: ${this.status.latencyMs}ms`);

    // Log total ready clients after this client becomes ready
    const manager = this.manager as any;
    const readyClients = manager.getReadyClientCount();
    const totalClients = manager.getClientCount();
    logger.info(`📊 Clientes listos: ${readyClients}/${totalClients}`);
  }

  private handleState(message: ClientMessage & { type: "STATE" }): void {
    this.status.sceneId = message.payload.sceneId;
    this.status.status = message.payload.playing ? "playing" : "paused";
    this.status.lastStateUpdate = Date.now();
  }

  public send(message: ServerMessage): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  public getStatus(): ClientStatus {
    return { ...this.status };
  }

  public close(): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
  }
}
