import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { WebSocketManager } from "./websocket/manager.js";
import { createApiRoutes } from "./routes/api.js";
import { createDashboardRoutes } from "./dashboard/routes.js";
import { createVideoDashboardRoutes } from "./dashboard/video-routes.js";
import { config, isDevelopment } from "./utils/config.js";
import { logger } from "./utils/logger.js";
import { getLocalIP, generateAccessUrls } from "./utils/network.js";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VRSyncServer {
  private app: express.Application;
  private wsManager!: WebSocketManager;
  private sslOptions: https.ServerOptions | null = null;

  constructor() {
    this.app = express();
  }

  async initialize(): Promise<void> {
    await this.loadSSLCertificates();
    this.wsManager = new WebSocketManager(this.sslOptions);
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private async verifySSlCertificates(): Promise<boolean> {
    const sslPath = path.join(__dirname, "../ssl");
    const certPath = path.join(sslPath, "cert.pem");
    const localIP = getLocalIP();

    // Check if certificate exists
    if (!fs.existsSync(certPath)) {
      logger.warn("⚠️ SSL certificate not found");
      return false;
    }

    // If no local IP, localhost cert is fine
    if (!localIP || localIP === "localhost") {
      return true;
    }

    try {
      // Check if current IP is in certificate SANs
      const { stdout } = await execAsync(`openssl x509 -in "${certPath}" -noout -text | grep -A1 "Subject Alternative Name" || echo ""`);

      if (stdout.includes(localIP)) {
        logger.info(`✅ SSL certificate valid for current IP: ${localIP}`);
        return true;
      } else {
        logger.warn(`⚠️ SSL certificate does NOT include current IP: ${localIP}`);
        logger.warn(`📋 Regenerating certificate for current network...`);
        return false;
      }
    } catch (error) {
      logger.warn("⚠️ Could not verify SSL certificate");
      return false;
    }
  }

  private async generateSSLCertificates(): Promise<boolean> {
    try {
      logger.info("🔐 Generating SSL certificates with current IP...");
      const scriptPath = path.join(__dirname, "../scripts/generate-ssl.js");

      await execAsync(`node "${scriptPath}"`);
      logger.info("✅ SSL certificates generated successfully");
      return true;
    } catch (error) {
      logger.error("❌ Failed to generate SSL certificates:", error);
      return false;
    }
  }

  private async loadSSLCertificates(): Promise<void> {
    try {
      const sslPath = path.join(__dirname, "../ssl");
      const keyPath = path.join(sslPath, "key.pem");
      const certPath = path.join(sslPath, "cert.pem");

      // Verify if certificates are valid for current IP
      const isValid = await this.verifySSlCertificates();

      // If not valid, regenerate
      if (!isValid) {
        logger.info("🔄 Auto-regenerating SSL certificates for current network...");
        await this.generateSSLCertificates();
      }

      // Load certificates
      if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        this.sslOptions = {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        };
        logger.info("✅ SSL certificates loaded successfully");

        // Display certificate info
        const localIP = getLocalIP();
        if (localIP) {
          logger.info(`🔐 Certificate includes IP: ${localIP}`);
        }
      } else {
        logger.warn("⚠️ SSL certificates not found, running HTTP only");
        logger.warn("💡 Run: pnpm ssl:generate to create certificates");
      }
    } catch (error) {
      logger.error("❌ Error loading SSL certificates:", error);
      logger.warn("⚠️ Falling back to HTTP only");
    }
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: false, // Disable for dashboard inline scripts
        crossOriginEmbedderPolicy: false,
      })
    );

    // CORS configuration for LAN access and WebSocket support
    this.app.use(
      cors({
        origin: (origin, callback) => {
          // Allow all origins for LAN deployment
          callback(null, true);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: [
          "Content-Type",
          "Authorization",
          "X-Requested-With",
          // WebSocket headers
          "Sec-WebSocket-Protocol",
          "Sec-WebSocket-Version",
          "Sec-WebSocket-Key",
          "Connection",
          "Upgrade"
        ],
        // Expose headers needed for WebSocket
        exposedHeaders: [
          "Sec-WebSocket-Accept",
          "Sec-WebSocket-Protocol",
          "Sec-WebSocket-Version"
        ]
      })
    );

    // Handle preflight requests for WebSocket
    this.app.options('*', (req, res) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Sec-WebSocket-Protocol, Sec-WebSocket-Version, Sec-WebSocket-Key, Connection, Upgrade');
      res.sendStatus(200);
    });

    // Compression and parsing
    this.app.use(compression());
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Request logging in development
    if (isDevelopment) {
      this.app.use((req, res, next) => {
        // Request logged
        next();
      });
    }
  }

  private setupRoutes(): void {
    // API routes
    this.app.use("/api", createApiRoutes(this.wsManager));

    // Dashboard routes
    this.app.use("/dashboard", createDashboardRoutes(this.wsManager));

    // Video Dashboard routes
    this.app.use("/video-dashboard", createVideoDashboardRoutes(this.wsManager));

    // Serve videos from clientevideo (for video dashboard)
    const videoPath = path.join(__dirname, "../../clientevideo/videos");
    if (fs.existsSync(videoPath)) {
      this.app.use("/videos", express.static(videoPath, {
        maxAge: isDevelopment ? 0 : "1d",
        etag: true,
        lastModified: true,
      }));
      logger.info(`📹 Serving videos from: ${videoPath}`);
    } else {
      logger.warn(`⚠️ Video directory not found at: ${videoPath}`);
    }

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
    const localIP = getLocalIP();
    const protocol = this.sslOptions ? "https" : "http";
    const wsProtocol = this.sslOptions ? "wss" : "ws";
    const hasSSL = !!this.sslOptions;

    const serverCreation = this.sslOptions
      ? https.createServer(this.sslOptions, this.app)
      : this.app;

    const server = serverCreation.listen(config.port, config.host, () => {
      const urls = generateAccessUrls(config.port, hasSSL);
      const wsPort = config.port + 1;

      logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      logger.info("🚀 VR SYNC SERVER - ECOPETROL");
      logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      logger.info(`📡 Server running on: ${protocol}://${config.host}:${config.port}`);
      logger.info(`🌐 Local IP: ${localIP}`);
      logger.info(`🔐 SSL: ${hasSSL ? "✅ ENABLED (HTTPS)" : "⚠️  DISABLED (HTTP only)"}`);
      logger.info("");

      if (urls.network.length > 0) {
        logger.info("🌐 Network Access URLs:");
        urls.network.forEach(url => logger.info(`   ${url}`));
        logger.info("");
      }

      // Video Dashboard (Main)
      logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      logger.info("🎬 DASHBOARD DE CONTROL DE VIDEO (Principal)");
      logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      logger.info(`📺 Local:   ${protocol}://localhost:${config.port}/video-dashboard`);
      if (localIP !== "localhost") {
        logger.info(`📺 Red:     ${protocol}://${localIP}:${config.port}/video-dashboard`);
      }

      logger.info("");
      logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      logger.info("📱 CLIENTE DE VIDEO (Dispositivos)");
      logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      logger.info(`   🔗 HTTP:  http://localhost:8085 (testing)`);
      logger.info(`   🔒 HTTPS: https://localhost:8445 (recomendado)`);
      if (localIP !== "localhost") {
        logger.info("");
        logger.info(`   📱 Desde dispositivos móviles:`);
        logger.info(`      🔗 HTTP:  http://${localIP}:8085`);
        logger.info(`      🔒 HTTPS: https://${localIP}:8445`);
      }

      logger.info("");
      logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      logger.info("📊 Otros Dashboards y APIs");
      logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      logger.info(`🎮 Dashboard VR: ${protocol}://localhost:${config.port}/dashboard`);
      logger.info(`📊 Health Check: ${protocol}://localhost:${config.port}/health`);
      logger.info(`🔌 WebSocket:`);
      logger.info(`   WSS (Secure):   ${wsProtocol}://localhost:${wsPort}/ws`);
      logger.info(`   WS (Insecure):  ws://localhost:${wsPort + 1}/ws`);
      logger.info("");

      if (isDevelopment) {
        logger.info("🔧 Development mode - Hot reload enabled");
      }

      if (hasSSL) {
        logger.info("");
        logger.info("⚠️  NOTA IMPORTANTE PARA HTTPS:");
        logger.info("   Los navegadores mostrarán advertencia de certificado autofirmado");
        logger.info("   En cada dispositivo:");
        logger.info("   1. Click en 'Avanzado' o 'Advanced'");
        logger.info("   2. Click en 'Continuar al sitio' o 'Proceed to site'");
      }

      logger.info("");
      logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      logger.info("✨ Sistema listo para usar - 100% OFFLINE");
      logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      logger.info("");
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

// Start server with async initialization
(async () => {
  const server = new VRSyncServer();
  await server.initialize();
  server.start();
})();
