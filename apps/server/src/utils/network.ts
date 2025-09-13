import { networkInterfaces } from "os";
import { logger } from "./logger.js";

/**
 * Obtiene la IP local del servidor para conexiones LAN
 */
export function getLocalIP(): string {
  const interfaces = networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    
    for (const alias of iface) {
      // Buscar IPv4, no interna, no loopback
      if (
        alias.family === "IPv4" &&
        !alias.internal &&
        alias.address !== "127.0.0.1"
      ) {
        logger.info(`📡 IP local detectada: ${alias.address} (${name})`);
        return alias.address;
      }
    }
  }
  
  logger.warn("⚠️ No se pudo detectar IP local, usando localhost");
  return "localhost";
}

/**
 * Obtiene todas las IPs disponibles para mostrar en logs
 */
export function getAllLocalIPs(): string[] {
  const interfaces = networkInterfaces();
  const ips: string[] = [];
  
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    
    for (const alias of iface) {
      if (alias.family === "IPv4" && !alias.internal) {
        ips.push(`${alias.address} (${name})`);
      }
    }
  }
  
  return ips;
}

/**
 * Genera URLs de acceso para dispositivos
 */
export function generateAccessUrls(port: number): {
  local: string;
  network: string[];
} {
  const localIP = getLocalIP();
  const allIPs = getAllLocalIPs();
  
  return {
    local: `http://localhost:${port}`,
    network: allIPs.map(ip => {
      const cleanIP = ip.split(' ')[0]; // Remover nombre de interfaz
      return `http://${cleanIP}:${port}`;
    })
  };
}