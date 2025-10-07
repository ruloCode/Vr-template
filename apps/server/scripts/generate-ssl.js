#!/usr/bin/env node

/**
 * Dynamic SSL Certificate Generator
 * Auto-generates self-signed certificates with current local IP
 * For offline LAN deployment
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { networkInterfaces } from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SSL directory
const SSL_DIR = path.join(__dirname, '../ssl');
const CERT_FILE = path.join(SSL_DIR, 'cert.pem');
const KEY_FILE = path.join(SSL_DIR, 'key.pem');

/**
 * Get current local IP address
 */
function getLocalIP() {
  const interfaces = networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;

    for (const alias of iface) {
      if (
        alias.family === 'IPv4' &&
        !alias.internal &&
        alias.address !== '127.0.0.1'
      ) {
        return alias.address;
      }
    }
  }

  return null;
}

/**
 * Generate self-signed SSL certificate with OpenSSL
 */
async function generateCertificate(localIP) {
  console.log('\n🔐 Generando Certificados SSL Autofirmados...\n');

  // Ensure SSL directory exists
  if (!fs.existsSync(SSL_DIR)) {
    fs.mkdirSync(SSL_DIR, { recursive: true });
    console.log(`✅ Directorio SSL creado: ${SSL_DIR}`);
  }

  // Build Subject Alternative Names (SAN)
  const sans = [
    'DNS:localhost',
    'IP:127.0.0.1',
    'IP:::1'
  ];

  if (localIP) {
    sans.push(`IP:${localIP}`);
    console.log(`📡 IP Local Detectada: ${localIP}`);
  }

  // Add common private network ranges
  const ipParts = localIP ? localIP.split('.') : [];
  if (ipParts.length === 4) {
    const subnet = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}`;
    console.log(`📶 Subnet: ${subnet}.0/24`);
  }

  const sanString = sans.join(',');

  console.log('\n📋 Subject Alternative Names (SAN):');
  sans.forEach(san => console.log(`   - ${san}`));

  // OpenSSL command to generate self-signed certificate
  const opensslCmd = `openssl req -x509 -newkey rsa:4096 -sha256 -days 365 \
    -nodes \
    -keyout "${KEY_FILE}" \
    -out "${CERT_FILE}" \
    -subj "/C=CO/ST=Bogota/L=Bogota/O=Ecopetrol/OU=VR/CN=${localIP || 'localhost'}" \
    -addext "subjectAltName=${sanString}"`;

  console.log('\n🔨 Ejecutando OpenSSL...');

  try {
    await execAsync(opensslCmd);
    console.log('✅ Certificados generados exitosamente!\n');
    console.log(`📁 Archivos:`);
    console.log(`   🔑 Key:  ${KEY_FILE}`);
    console.log(`   📜 Cert: ${CERT_FILE}`);

    // Set proper permissions
    fs.chmodSync(KEY_FILE, 0o600);
    console.log('\n🔒 Permisos configurados correctamente');

    // Display certificate info
    await displayCertInfo();

    return true;
  } catch (error) {
    console.error('\n❌ Error generando certificados:', error.message);
    console.error('\n💡 Verifica que OpenSSL esté instalado:');
    console.error('   macOS: openssl version');
    console.error('   Linux: sudo apt-get install openssl');
    return false;
  }
}

/**
 * Display certificate information
 */
async function displayCertInfo() {
  try {
    const { stdout } = await execAsync(`openssl x509 -in "${CERT_FILE}" -noout -subject -issuer -dates`);
    console.log('\n📄 Información del Certificado:');
    console.log(stdout);
  } catch (error) {
    // Ignore errors displaying cert info
  }
}

/**
 * Main function
 */
async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 GENERADOR DE CERTIFICADOS SSL DINÁMICOS');
  console.log('   Para VR Ecopetrol - Modo Offline');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const localIP = getLocalIP();

  if (!localIP) {
    console.log('\n⚠️  No se detectó IP local - generando certificado solo para localhost');
  }

  const success = await generateCertificate(localIP);

  if (success) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ CERTIFICADOS SSL GENERADOS CORRECTAMENTE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Próximos pasos:');
    console.log('   1. Los servidores usarán estos certificados automáticamente');
    console.log('   2. En cada dispositivo, acepta el certificado autofirmado');
    console.log('   3. Los navegadores mostrarán una advertencia - esto es normal');
    console.log('   4. Click en "Avanzado" → "Continuar al sitio"');
    console.log('\n🚀 Inicia el servidor con: pnpm dev\n');
    process.exit(0);
  } else {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ ERROR GENERANDO CERTIFICADOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  }
}

main();
