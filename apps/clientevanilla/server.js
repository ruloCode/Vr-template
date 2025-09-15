const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// SSL configuration - usando certificados SSL personalizados como en vr-a-frame-example
const options = {
  key: fs.readFileSync(path.join(__dirname, 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
};

// MIME types for common files
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream'
};

function serveFile(req, res) {
  let filePath = '.' + req.url;

  // Default to index.html
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // File not found
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, 'utf-8');
      }
    } else {
      // Success
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
      });
      res.end(content, 'utf-8');
    }
  });
}

// Create HTTPS server
const httpsServer = https.createServer(options, serveFile);

// Create HTTP server that redirects to HTTPS
const httpServer = http.createServer((req, res) => {
  res.writeHead(301, { Location: `https://192.168.40.31:8444${req.url}` });
  res.end();
});

// Start servers - usando puerto 8444 para evitar conflicto con vr-a-frame-example
const httpsPort = 8444;
const httpPort = 8081;
const host = '0.0.0.0';

httpsServer.listen(httpsPort, host, () => {
  console.log(`🔒 HTTPS Server running on ${host}:${httpsPort}`);
  console.log(`📱 VR Experience: https://192.168.40.31:${httpsPort}/`);
  console.log(`🌐 Network access: https://192.168.40.31:${httpsPort}/`);
});

httpServer.listen(httpPort, host, () => {
  console.log(`🔄 HTTP Server redirecting from http://${host}:${httpPort}/ to HTTPS`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  httpsServer.close();
  httpServer.close();
  process.exit(0);
});