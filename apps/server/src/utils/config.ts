import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT || "8080"),
  host: process.env.HOST || "0.0.0.0", // Permitir conexiones desde cualquier IP
  staticDir:
    process.env.STATIC_DIR ||
    (process.env.NODE_ENV === "development"
      ? "../client/dev-dist"
      : "../client/dist"),
  nodeEnv: process.env.NODE_ENV || "development",
  logLevel: process.env.LOG_LEVEL || "info",

  // WebSocket configuration
  websocket: {
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || "30000"),
    clientTimeout: parseInt(process.env.WS_CLIENT_TIMEOUT || "60000"),
    maxClients: parseInt(process.env.MAX_CLIENTS || "50"),
    maxPingLatency: parseInt(process.env.MAX_PING_LATENCY || "5000"),
  },

  // Paths
  paths: {
    dashboard: "/dashboard",
    health: "/health",
    api: "/api",
    websocket: "/ws",
  },
} as const;

export const isDevelopment = config.nodeEnv === "development";
export const isProduction = config.nodeEnv === "production";
