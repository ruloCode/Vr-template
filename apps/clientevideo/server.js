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

// CORS middleware for offline LAN operation
app.use((req, res, next) => {
    // Allow all origins for LAN deployment (offline mode)
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
});

// Serve static files with aggressive caching for offline mode
app.use(express.static(__dirname, {
    maxAge: '1d',
    etag: true,
    lastModified: true
}));

// Serve videos from local videos folder
app.use('/videos', express.static(path.join(__dirname, 'videos'), {
    maxAge: '1d',
    etag: true,
    lastModified: true
}));

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve PWA manifest
app.get('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.sendFile(path.join(__dirname, 'manifest.json'));
});

// Serve Service Worker
app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Service-Worker-Allowed', '/');
    res.sendFile(path.join(__dirname, 'sw.js'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'clientevideo', offline_support: true });
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
    console.log('📱 CLIENTE DE VIDEO SINCRONIZADO - HTTP');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🔗 URLs de Acceso HTTP (Testing):');
    console.log(`   Local:  http://localhost:${HTTP_PORT}`);
    if (localIP !== 'localhost') {
        console.log(`   Red:    http://${localIP}:${HTTP_PORT}`);
    }
    console.log('');
    console.log('📹 Videos servidos desde: apps/clientevideo/videos/');
    console.log('🌐 CORS: ✅ Enabled (Offline LAN mode)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

// Start HTTPS server if certificates are available
if (sslOptions) {
    const httpsServer = https.createServer(sslOptions, app);
    const localIP = getLocalIP();

    httpsServer.listen(HTTPS_PORT, HOST, () => {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔒 CLIENTE DE VIDEO SINCRONIZADO - HTTPS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('🔐 URLs de Acceso HTTPS (Recomendado):');
        console.log(`   Local:  https://localhost:${HTTPS_PORT}`);
        if (localIP !== 'localhost') {
            console.log(`   Red:    https://${localIP}:${HTTPS_PORT}`);
        }
        console.log('');
        console.log('📱 Desde Dispositivos Móviles:');
        console.log(`   🌐 https://${localIP}:${HTTPS_PORT}`);
        console.log('');
        console.log('🔐 SSL Certificate: ✅ Loaded');
        console.log('🌐 CORS: ✅ Enabled (Offline LAN mode)');
        console.log('📹 Videos: ✅ Serving from local directory');
        console.log('');
        console.log('⚠️  IMPORTANTE:');
        console.log('   Los navegadores mostrarán advertencia de certificado');
        console.log('   En cada dispositivo:');
        console.log('   1. Click "Avanzado" o "Advanced"');
        console.log('   2. Click "Continuar al sitio" o "Proceed to site"');
        console.log('   3. El sitio funcionará completamente OFFLINE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });

    httpsServer.on('error', (error) => {
        console.error('❌ HTTPS Server error:', error);
        console.error('💡 Verify SSL certificates in apps/server/ssl/\n');
    });
} else {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  HTTPS NOT AVAILABLE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('SSL certificates not found');
    console.log('');
    console.log('💡 To enable HTTPS, generate certificates:');
    console.log('   cd apps/server');
    console.log('   pnpm ssl:generate');
    console.log('');
    console.log('The server will auto-detect and use them on next restart');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
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
