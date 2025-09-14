import { logger } from "./logger";

export interface NetworkConfig {
  websocket: string;
  server: string;
  dashboard: string;
  serverIP: string;
  isLocal: boolean;
}

/**
 * Obtiene la configuración de red dinámica del servidor
 * Esto permite conectarse automáticamente sin importar la IP
 */
export async function fetchNetworkConfig(): Promise<NetworkConfig> {
  try {
    // Intentar obtener configuración del servidor actual
    const currentHost = window.location.origin;
    const configUrl = `${currentHost}/api/config`;
    
    logger.info("🌐 Obteniendo configuración de red desde:", configUrl);
    
    const response = await fetch(configUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // No usar cache para obtener configuración fresh
      cache: "no-cache"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    const networkConfig: NetworkConfig = {
      websocket: data.urls.websocket,
      server: data.urls.server,
      dashboard: data.urls.dashboard,
      serverIP: data.network.serverIP,
      isLocal: data.network.isLocal
    };

    logger.info("✅ Configuración de red obtenida:", {
      serverIP: networkConfig.serverIP,
      isLocal: networkConfig.isLocal,
      websocket: networkConfig.websocket
    });

    return networkConfig;
    
  } catch (error) {
    logger.warn("⚠️ Error obteniendo configuración de red, usando fallback:", error);
    
    // Fallback: usar la configuración basada en window.location
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1";
    
    return {
      websocket: `${protocol}//${host}:8081/ws`,
      server: `${window.location.protocol}//${host}:8080`,
      dashboard: `${window.location.protocol}//${host}:8080/dashboard`,
      serverIP: host,
      isLocal
    };
  }
}

/**
 * Verifica conectividad con el servidor
 */
export async function testServerConnection(serverUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${serverUrl}/api/health`, {
      method: "GET",
      cache: "no-cache",
      // Timeout corto para detectar problemas rápido
      signal: AbortSignal.timeout(3000)
    });
    
    return response.ok;
  } catch (error) {
    logger.warn("❌ Test de conexión falló:", error);
    return false;
  }
}

/**
 * Inicializa la configuración de red al arranque de la app
 */
export class NetworkConfigManager {
  private static instance: NetworkConfigManager;
  private config: NetworkConfig | null = null;
  
  static getInstance(): NetworkConfigManager {
    if (!NetworkConfigManager.instance) {
      NetworkConfigManager.instance = new NetworkConfigManager();
    }
    return NetworkConfigManager.instance;
  }
  
  async initialize(): Promise<NetworkConfig> {
    if (!this.config) {
      this.config = await fetchNetworkConfig();
      
      // Verificar que el servidor esté accesible
      const isConnected = await testServerConnection(this.config.server);
      if (!isConnected) {
        logger.warn("⚠️ Servidor no accesible, la app funcionará en modo standalone");
      }
    }
    
    return this.config;
  }
  
  getConfig(): NetworkConfig | null {
    return this.config;
  }
  
  updateWebSocketUrl(newUrl: string): void {
    if (this.config) {
      this.config.websocket = newUrl;
      logger.info("🔄 WebSocket URL actualizada:", newUrl);
    }
  }
}