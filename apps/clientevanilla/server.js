const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

/**
 * Obtiene la IP local del servidor para conexiones LAN
 */
function getLocalIP() {
  const interfaces = os.networkInterfaces();

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
        console.log(`📡 IP local detectada: ${alias.address} (${name})`);
        return alias.address;
      }
    }
  }

  console.warn("⚠️ No se pudo detectar IP local, usando localhost");
  return "localhost";
}

/**
 * Obtiene todas las IPs disponibles para mostrar en logs
 */
function getAllLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];

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

// SSL configuration - usando certificados SSL personalizados como en vr-a-frame-example
const options = {
  key: fs.readFileSync(path.join(__dirname, "key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "cert.pem")),
};

// MIME types for common files
const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".woff": "application/font-woff",
  ".ttf": "application/font-ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".otf": "application/font-otf",
  ".wasm": "application/wasm",
  ".gltf": "model/gltf+json",
  ".bin": "application/octet-stream",
};

function serveFile(req, res) {
  // Decode URL to handle encoded spaces and special characters
  let filePath = "." + decodeURIComponent(req.url);

  // Default to index.html
  if (filePath === "./") {
    filePath = "./index.html";
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = mimeTypes[extname] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        // File not found
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("<h1>404 - File Not Found</h1>", "utf-8");
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, "utf-8");
      }
    } else {
      // Success
      res.writeHead(200, {
        "Content-Type": mimeType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Origin, X-Requested-With, Content-Type, Accept",
      });
      res.end(content, "utf-8");
    }
  });
}

// Get local IP dynamically
const localIP = getLocalIP();
const allIPs = getAllLocalIPs();

// Create HTTPS server
const httpsServer = https.createServer(options, serveFile);

// Create HTTP server that redirects to HTTPS
const httpServer = http.createServer((req, res) => {
  res.writeHead(301, { Location: `https://${localIP}:8444${req.url}` });
  res.end();
});

// Start servers - usando puerto 8444 para evitar conflicto con vr-a-frame-example
const httpsPort = 8444;
const httpPort = 8082; // Changed from 8081 to avoid conflict with WebSocket server
const host = "0.0.0.0";

httpsServer.listen(httpsPort, host, () => {
  console.log(`🔒 HTTPS Server running on ${host}:${httpsPort}`);
  console.log(`📱 VR Experience Local: https://localhost:${httpsPort}/`);
  console.log(`🌐 VR Experience Network: https://${localIP}:${httpsPort}/`);

  // Show all available network interfaces
  if (allIPs.length > 0) {
    console.log(`📡 Available network interfaces:`);
    allIPs.forEach(ip => {
      const cleanIP = ip.split(' ')[0];
      console.log(`   https://${cleanIP}:${httpsPort}/`);
    });
  }
});

httpServer.listen(httpPort, host, () => {
  console.log(
    `🔄 HTTP Server redirecting from http://${host}:${httpPort}/ to HTTPS`
  );
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down servers...");
  httpsServer.close();
  httpServer.close();
  process.exit(0);
});
