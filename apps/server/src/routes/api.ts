import { Router, Request, Response } from "express";
import { WebSocketManager } from "../websocket/manager.js";
import { logger } from "../utils/logger.js";
import { getLocalIP, generateAccessUrls } from "../utils/network.js";
import { config } from "../utils/config.js";

export function createApiRoutes(wsManager: WebSocketManager): Router {
  const router = Router();

  // Health check endpoint
  router.get("/health", (req: Request, res: Response) => {
    const uptime = process.uptime();
    const memory = process.memoryUsage();

    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      memory: {
        rss: Math.round(memory.rss / 1024 / 1024) + " MB",
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + " MB",
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + " MB",
      },
      clients: {
        total: wsManager.getClientCount(),
        ready: wsManager.getReadyClientCount(),
      },
    });
  });

  // Get room state
  router.get("/room", (req: Request, res: Response) => {
    try {
      const room = wsManager.getRoom();
      res.json(room);
    } catch (error) {
      logger.error("Error getting room state:", error);
      res.status(500).json({ error: "Error obteniendo estado del room" });
    }
  });

  // Get clients statistics
  router.get("/stats", (req: Request, res: Response) => {
    try {
      const room = wsManager.getRoom();
      const stats = {
        totalClients: room.clients.length,
        clientsByStatus: {
          connected: room.clients.filter((c) => c.status === "connected")
            .length,
          ready: room.clients.filter((c) => c.status === "ready").length,
          playing: room.clients.filter((c) => c.status === "playing").length,
          paused: room.clients.filter((c) => c.status === "paused").length,
        },
        averageLatency:
          room.clients.length > 0
            ? Math.round(
                room.clients.reduce((sum, c) => sum + c.latencyMs, 0) /
                  room.clients.length
              )
            : 0,
        currentScene: room.currentScene,
        isPlaying: room.isPlaying,
        lastUpdate: Date.now(),
      };

      res.json(stats);
    } catch (error) {
      logger.error("Error getting stats:", error);
      res.status(500).json({ error: "Error obteniendo estadísticas" });
    }
  });

  // Send command to all clients
  router.post("/command", (req: Request, res: Response) => {
    try {
      const { commandType, ...payload } = req.body;

      if (!commandType) {
        return res.status(400).json({ error: "commandType es requerido" });
      }

      let command;

      switch (commandType) {
        case "LOAD":
          if (!payload.sceneId) {
            return res
              .status(400)
              .json({ error: "sceneId es requerido para LOAD" });
          }
          command = {
            type: "COMMAND" as const,
            payload: { commandType: "LOAD" as const, sceneId: payload.sceneId },
          };
          break;

        case "START_AT":
          const epochMs =
            payload.epochMs || Date.now() + (payload.delayMs || 3000);
          command = {
            type: "COMMAND" as const,
            payload: { commandType: "START_AT" as const, epochMs },
          };
          break;

        case "PAUSE":
          command = {
            type: "COMMAND" as const,
            payload: { commandType: "PAUSE" as const },
          };
          break;

        case "RESUME":
          command = {
            type: "COMMAND" as const,
            payload: { commandType: "RESUME" as const },
          };
          break;

        case "SEEK":
          if (typeof payload.deltaMs !== "number") {
            return res
              .status(400)
              .json({ error: "deltaMs es requerido para SEEK" });
          }
          command = {
            type: "COMMAND" as const,
            payload: { commandType: "SEEK" as const, deltaMs: payload.deltaMs },
          };
          break;

        default:
          return res
            .status(400)
            .json({ error: `Comando ${commandType} no reconocido` });
      }

      wsManager.broadcastCommand(command);
      logger.info(`Comando ${commandType} enviado via API`);

      return res.json({
        success: true,
        command: commandType,
        payload: command.payload,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error("Error sending command:", error);
      return res.status(500).json({ error: "Error enviando comando" });
    }
  });

  // Network configuration endpoint for dynamic client connection
  router.get("/config", (req: Request, res: Response) => {
    try {
      const localIP = getLocalIP();
      const urls = generateAccessUrls(config.port);
      const wsPort = config.port + 1;
      
      // Detectar si la petición viene de la misma máquina o red
      const clientIP = req.ip || req.connection.remoteAddress || "unknown";
      const isLocal = clientIP.includes("127.0.0.1") || clientIP.includes("::1");
      
      const wsUrl = isLocal 
        ? `ws://localhost:${wsPort}/ws`
        : `ws://${localIP}:${wsPort}/ws`;
      
      const serverUrl = isLocal
        ? `http://localhost:${config.port}`
        : `http://${localIP}:${config.port}`;

      res.json({
        network: {
          serverIP: localIP,
          serverPort: config.port,
          wsPort: wsPort,
          clientIP: clientIP,
          isLocal: isLocal
        },
        urls: {
          websocket: wsUrl,
          server: serverUrl,
          dashboard: `${serverUrl}/dashboard`,
          available: urls.network
        },
        timestamp: Date.now()
      });
      
      logger.debug(`📡 Config request from ${clientIP} - Local: ${isLocal}`);
    } catch (error) {
      logger.error("Error getting network config:", error);
      res.status(500).json({ error: "Error obteniendo configuración de red" });
    }
  });

  return router;
}
