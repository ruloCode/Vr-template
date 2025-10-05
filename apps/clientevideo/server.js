/**
 * HTTPS Server for ClienteVideo
 * Serves the video sync client with SSL support
 */

import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Get local IP
function getLocalIP() {
    const networkInterfaces = os.networkInterfaces();
    for (const name of Object.keys(networkInterfaces)) {
        for (const iface of networkInterfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// Configuration
const HTTP_PORT = 8085;
const HTTPS_PORT = 8445;
const HOST = '0.0.0.0';

// Serve static files
app.use(express.static(__dirname));

// Serve videos from local videos folder
app.use('/videos', express.static(path.join(__dirname, 'videos')));

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'clientevideo' });
});

// Try to load SSL certificates
let sslOptions = null;
const certPaths = [
    // From server SSL directory
    path.join(__dirname, '../server/ssl/cert.pem'),
    path.join(__dirname, '../server/ssl/key.pem'),
    // From clientevanilla directory
    path.join(__dirname, '../clientevanilla/cert.pem'),
    path.join(__dirname, '../clientevanilla/key.pem'),
];

try {
    const certPath = certPaths[0];
    const keyPath = certPaths[1];

    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        sslOptions = {
            cert: fs.readFileSync(certPath),
            key: fs.readFileSync(keyPath)
        };
        console.log('✅ SSL certificates loaded from server/ssl/');
    } else {
        // Try clientevanilla certificates
        const altCertPath = certPaths[2];
        const altKeyPath = certPaths[3];

        if (fs.existsSync(altCertPath) && fs.existsSync(altKeyPath)) {
            sslOptions = {
                cert: fs.readFileSync(altCertPath),
                key: fs.readFileSync(altKeyPath)
            };
            console.log('✅ SSL certificates loaded from clientevanilla/');
        }
    }
} catch (error) {
    console.log('⚠️ No SSL certificates found, running HTTP only');
}

// Start servers
const httpServer = http.createServer(app);

httpServer.listen(HTTP_PORT, HOST, () => {
    const localIP = getLocalIP();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 CLIENTE DE VIDEO SINCRONIZADO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🔗 URLs de Acceso:');
    console.log(`   Local:  http://localhost:${HTTP_PORT}`);
    if (localIP !== 'localhost') {
        console.log(`   Red:    http://${localIP}:${HTTP_PORT}`);
    }
    console.log('');
    console.log('📹 Videos disponibles: apps/clientevideo/videos/');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

// Start HTTPS server if certificates are available
if (sslOptions) {
    const httpsServer = https.createServer(sslOptions, app);
    const localIP = getLocalIP();

    httpsServer.listen(HTTPS_PORT, HOST, () => {
        console.log('🔒 HTTPS Server (Seguro - Recomendado):');
        console.log(`   Local:  https://localhost:${HTTPS_PORT}`);
        if (localIP !== 'localhost') {
            console.log(`   Red:    https://${localIP}:${HTTPS_PORT}`);
        }
        console.log('');
        console.log('📱 Acceso desde dispositivos en la red:');
        console.log(`   🌐 https://${localIP}:${HTTPS_PORT}`);
        console.log('');
        console.log('⚠️  Nota: Aceptar certificado SSL en cada dispositivo');
        console.log('    (Los navegadores mostrarán advertencia de seguridad)');
        console.log('═══════════════════════════════════════════\n');
    });

    httpsServer.on('error', (error) => {
        console.error('❌ HTTPS Server error:', error);
    });
} else {
    console.log('⚠️ HTTPS not available - no SSL certificates found');
    console.log('💡 To enable HTTPS:');
    console.log('   1. Generate certificates: mkcert -key-file key.pem -cert-file cert.pem localhost');
    console.log('   2. Place in apps/server/ssl/ or apps/clientevanilla/\n');
}

httpServer.on('error', (error) => {
    console.error('❌ HTTP Server error:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down servers...');
    httpServer.close(() => {
        console.log('✅ HTTP Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    httpServer.close(() => {
        console.log('✅ HTTP Server closed');
        process.exit(0);
    });
});
