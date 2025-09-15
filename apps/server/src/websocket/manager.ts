import { WebSocket, WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import https from "https";
import {
  ClientMessage,
  ClientMessageSchema,
  ServerMessage,
  ClientStatus,
  RoomState,
  PROTOCOL_VERSION,
  HEARTBEAT_INTERVAL_MS,
  CLIENT_TIMEOUT_MS,
  PING_INTERVAL_MS,
} from "../types/protocol.js";
import { logger } from "../utils/logger.js";
import { config } from "../utils/config.js";

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, ClientConnection> = new Map();
  private room: RoomState;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private sslOptions: https.ServerOptions | null;

  constructor(sslOptions: https.ServerOptions | null = null) {
    this.sslOptions = sslOptions;

    const wsOptions: any = {
      port: config.port + 1, // WS en puerto +1
      path: config.paths.websocket,
    };

    // If SSL is available, create HTTPS server for WSS
    if (this.sslOptions) {
      const httpsServer = https.createServer(this.sslOptions);
      wsOptions.server = httpsServer;
      delete wsOptions.port; // Remove port when using existing server

      httpsServer.listen(config.port + 1, config.host, () => {
        logger.info(`🔒 WSS (Secure WebSocket) server started on port ${config.port + 1}`);
      });
    } else {
      logger.info(`🔓 WS (Regular WebSocket) server starting on port ${config.port + 1}`);
    }

    this.wss = new WebSocketServer(wsOptions);

    this.room = {
      id: "main",
      clients: [],
      isPlaying: false,
      seekOffset: 0,
    };

    this.setupWebSocketServer();
    this.startHeartbeat();

    const protocol = this.sslOptions ? "WSS" : "WS";
    logger.info(`✅ ${protocol} WebSocket server initialized on port ${config.port + 1}`);
  }

  private setupWebSocketServer(): void {
    this.wss.on("connection", (ws: WebSocket, request) => {
      const clientId = uuidv4();
      const connection = new ClientConnection(clientId, ws, this);
      this.clients.set(clientId, connection);

      logger.info(
        `Cliente conectado: ${clientId} desde ${request.socket.remoteAddress}`
      );

      ws.on("close", () => {
        this.handleClientDisconnect(clientId);
      });

      ws.on("error", (error) => {
        logger.error(`Error en WebSocket ${clientId}:`, error);
        this.handleClientDisconnect(clientId);
      });
    });
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
      connection.close();
      this.clients.delete(clientId);
      this.updateRoomState();
      logger.info(`Cliente desconectado: ${clientId}`);
    }
  }

  private updateRoomState(): void {
    this.room.clients = Array.from(this.clients.values()).map((conn) =>
      conn.getStatus()
    );
  }

  public broadcastCommand(command: ServerMessage): void {
    logger.info(`Broadcasting command: ${command.type}`, command.payload);

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

  public close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    for (const connection of this.clients.values()) {
      connection.close();
    }

    this.wss.close();
    logger.info("WebSocket server cerrado");
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

    this.send({
      type: "WELCOME",
      payload: {
        serverEpochMs: Date.now(),
        clientId: this.clientId,
        serverVersion: PROTOCOL_VERSION,
      },
    });

    logger.info(
      `Cliente ${this.clientId} (${message.payload.deviceId}) enviado WELCOME`
    );
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

    logger.info(
      `Cliente ${this.clientId} listo para escena ${message.payload.sceneId}`
    );
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
