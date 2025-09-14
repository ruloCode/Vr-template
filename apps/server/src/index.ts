import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketManager } from "./websocket/manager.js";
import { createApiRoutes } from "./routes/api.js";
import { createDashboardRoutes } from "./dashboard/routes.js";
import { config, isDevelopment } from "./utils/config.js";
import { logger } from "./utils/logger.js";
import { getLocalIP, generateAccessUrls } from "./utils/network.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VRSyncServer {
  private app: express.Application;
  private wsManager: WebSocketManager;

  constructor() {
    this.app = express();
    this.wsManager = new WebSocketManager();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: false, // Disable for dashboard inline scripts
        crossOriginEmbedderPolicy: false,
      })
    );

    // CORS configuration for LAN access
    this.app.use(
      cors({
        origin: true, // Allow all origins for LAN
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      })
    );

    // Compression and parsing
    this.app.use(compression());
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Request logging in development
    if (isDevelopment) {
      this.app.use((req, res, next) => {
        logger.debug(`${req.method} ${req.path}`, {
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        });
        next();
      });
    }
  }

  private setupRoutes(): void {
    // API routes
    this.app.use("/api", createApiRoutes(this.wsManager));

    // Dashboard routes
    this.app.use("/dashboard", createDashboardRoutes(this.wsManager));

    // Health check (also available at root level)
    this.app.get("/health", (req, res) => {
      res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        clients: this.wsManager.getClientCount(),
      });
    });

    // Serve static files (built client)
    const staticPath = path.resolve(__dirname, config.staticDir);
    this.app.use(
      express.static(staticPath, {
        maxAge: isDevelopment ? 0 : "1y",
        etag: true,
        lastModified: true,
      })
    );

    // Fallback to index.html for SPA routing
    this.app.get("*", (req, res) => {
      // Don't fallback for API or dashboard routes
      if (
        req.path.startsWith("/api") ||
        req.path.startsWith("/dashboard") ||
        req.path.startsWith("/ws")
      ) {
        return res.status(404).json({ error: "Endpoint no encontrado" });
      }

      return res.sendFile(path.join(staticPath, "index.html"), (err) => {
        if (err) {
          res.status(404).send(`
            <html>
              <body>
                <h1>VR Sync Server - Ecopetrol</h1>
                <p>Cliente no encontrado. Ejecuta el build del cliente primero.</p>
                <p><a href="/dashboard">🎮 Ir al Dashboard</a></p>
                <p><a href="/health">🔍 Health Check</a></p>
              </body>
            </html>
          `);
        }
      });
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: "Endpoint no encontrado",
        path: req.path,
        method: req.method,
      });
    });

    // Global error handler
    this.app.use(
      (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        logger.error("Unhandled error:", err);

        res.status(err.status || 500).json({
          error: isDevelopment ? err.message : "Error interno del servidor",
          ...(isDevelopment && { stack: err.stack }),
        });
      }
    );

    // Graceful shutdown
    process.on("SIGTERM", () => this.shutdown("SIGTERM"));
    process.on("SIGINT", () => this.shutdown("SIGINT"));

    process.on("uncaughtException", (err) => {
      logger.error("Uncaught Exception:", err);
      this.shutdown("uncaughtException");
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    });
  }

  public start(): void {
    const server = this.app.listen(config.port, config.host, () => {
      const localIP = getLocalIP();
      const urls = generateAccessUrls(config.port);
      
      logger.info(`🚀 VR Sync Server iniciado`);
      logger.info(`📡 HTTP Server: http://${config.host}:${config.port}`);
      logger.info(`🔗 WebSocket: ws://${config.host}:${config.port + 1}${config.paths.websocket}`);
      logger.info(`🌍 Environment: ${config.nodeEnv}`);
      logger.info(`📁 Static files: ${config.staticDir}`);
      
      // Mostrar URLs de acceso para dispositivos
      logger.info("📱 URLs de acceso para dispositivos:");
      logger.info(`   Local: http://localhost:${config.port}`);
      logger.info(`   Red: http://${localIP}:${config.port}`);
      logger.info(`   Dashboard: http://${localIP}:${config.port}/dashboard`);
      
      if (urls.network.length > 1) {
        logger.info("🌐 Interfaces de red disponibles:");
        urls.network.forEach(url => logger.info(`   ${url}`));
      }

      if (isDevelopment) {
        logger.info(
          `📋 Health Check: http://${localIP}:${config.port}/health`
        );
        logger.info(`🔧 API Config: http://${localIP}:${config.port}/api/config`);
      }
    });

    server.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        logger.error(`Puerto ${config.port} ya está en uso`);
      } else {
        logger.error("Error del servidor:", err);
      }
      process.exit(1);
    });
  }

  private shutdown(signal: string): void {
    logger.info(`Recibida señal ${signal}, cerrando servidor...`);

    this.wsManager.close();

    setTimeout(() => {
      logger.info("Servidor cerrado exitosamente");
      process.exit(0);
    }, 1000);
  }
}

// Start server
const server = new VRSyncServer();
server.start();
