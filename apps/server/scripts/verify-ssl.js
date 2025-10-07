#!/usr/bin/env node

/**
 * SSL Certificate Verifier
 * Checks if current IP is included in SSL certificate
 * Auto-regenerates if needed
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

const SSL_DIR = path.join(__dirname, '../ssl');
const CERT_FILE = path.join(SSL_DIR, 'cert.pem');

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
 * Check if certificate exists and is valid for current IP
 */
async function verifyCertificate() {
  // Check if cert file exists
  if (!fs.existsSync(CERT_FILE)) {
    console.log('⚠️  Certificado SSL no encontrado');
    return false;
  }

  const localIP = getLocalIP();
  if (!localIP) {
    console.log('✅ No hay IP local - certificado localhost es suficiente');
    return true;
  }

  try {
    // Get certificate Subject Alternative Names
    const { stdout } = await execAsync(`openssl x509 -in "${CERT_FILE}" -noout -text | grep -A1 "Subject Alternative Name"`);

    // Check if current IP is in the certificate
    if (stdout.includes(localIP)) {
      console.log(`✅ Certificado SSL válido para IP actual: ${localIP}`);
      return true;
    } else {
      console.log(`⚠️  Certificado SSL NO incluye IP actual: ${localIP}`);
      console.log(`📋 SANs actuales: ${stdout.trim()}`);
      return false;
    }
  } catch (error) {
    console.log('⚠️  Error verificando certificado:', error.message);
    return false;
  }
}

/**
 * Main verification function
 */
async function main() {
  const localIP = getLocalIP();

  console.log('🔍 Verificando certificado SSL...');
  if (localIP) {
    console.log(`📡 IP Local: ${localIP}`);
  }

  const isValid = await verifyCertificate();

  if (!isValid) {
    console.log('\n🔄 Regenerando certificados SSL...\n');

    // Import and run generate script
    const { default: generateModule } = await import('./generate-ssl.js');
    process.exit(0);
  } else {
    console.log('✅ Certificado SSL verificado correctamente\n');
    process.exit(0);
  }
}

main();
