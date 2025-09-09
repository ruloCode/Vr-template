// Client configuration
export const config = {
  // WebSocket connection
  wsUrl:
    import.meta.env.VITE_WS_URL ||
    (() => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.hostname;
      const port = 8081;

      // Usar la misma IP/hostname para el WebSocket
      return `${protocol}//${host}:${port}/ws`;
    })(),

  // Server URL for API calls
  serverUrl:
    import.meta.env.VITE_SERVER_URL ||
    (() => {
      const protocol = window.location.protocol;
      const host = window.location.hostname; // Usar el hostname actual (permite acceso móvil)
      const port = 8080;
      return `${protocol}//${host}:${port}`;
    })(),

  // Debug mode
  debug: import.meta.env.VITE_DEBUG === "true" || import.meta.env.DEV,

  // WebSocket settings
  websocket: {
    reconnectInterval: 1000, // Reducido de 3000 a 1000ms para reconexión más rápida
    maxReconnectAttempts: 15, // Aumentado para más intentos
    pingInterval: 5000,
    connectionTimeout: 3000, // Reducido de 10000 a 3000ms para detección más rápida
    initialRetryDelay: 500, // Delay inicial más corto
  },

  // Audio settings
  audio: {
    crossfadeDuration: 0.5, // seconds
    fadeInDuration: 0.2,
    fadeOutDuration: 0.3,
    syncTolerance: 120, // milliseconds before correction
    maxDriftCorrection: 1000, // max ms to correct in one go
  },

  // Preloader settings
  preloader: {
    timeout: 30000, // 30 seconds per asset
    retryAttempts: 3,
    parallelLoads: 3,
  },

  // A-Frame settings
  aframe: {
    fadeTransitionSpeed: 1.0, // seconds
    maxAnisotropy: 16,
    enableVR: true,
    enableAR: false,
  },

  // PWA settings
  pwa: {
    updateCheckInterval: 60000, // 1 minute
    enableNotifications: false,
  },
} as const;

export const isDebug = config.debug;
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
