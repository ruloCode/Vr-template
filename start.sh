#!/bin/bash

# VR Ecopetrol - Script de inicio para producción
# Uso: ./start.sh [development|production]

set -e

# Configuración por defecto
MODE=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Iniciando VR Ecopetrol en modo: $MODE"
echo "📁 Directorio: $SCRIPT_DIR"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js: $NODE_VERSION"

# Verificar pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm no está instalado"
    echo "💡 Instalar con: npm install -g pnpm"
    exit 1
fi

PNPM_VERSION=$(pnpm --version)
echo "✅ pnpm: v$PNPM_VERSION"

cd "$SCRIPT_DIR"

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    pnpm install
fi

# Verificar assets (solo advertencia)
if [ ! -f "apps/client/public/panos/escena1_8k.jpg" ]; then
    echo "⚠️  Assets de ejemplo no encontrados en apps/client/public/panos/"
    echo "💡 Consulte apps/client/public/panos/README.md para más información"
fi

if [ ! -f "apps/client/public/audio/escena1.mp3" ]; then
    echo "⚠️  Audio narrativo no encontrado en apps/client/public/audio/"
    echo "💡 Consulte apps/client/public/audio/README.md para más información"
fi

# Configurar variables de entorno
export NODE_ENV=$MODE

if [ "$MODE" = "development" ]; then
    echo "🔧 Modo desarrollo - Iniciando con hot reload..."
    echo "🌐 Cliente: http://localhost:5173"
    echo "🎮 Dashboard: http://localhost:8080/dashboard"
    echo "🔗 WebSocket: ws://localhost:8081/ws"
    echo ""
    echo "Para acceso desde red local, usar la IP del servidor:"
    echo "💡 Obtener IP: ifconfig | grep 'inet ' | grep -v 127.0.0.1"
    echo ""
    pnpm dev
else
    echo "🏭 Modo producción - Construyendo aplicación..."
    
    # Build
    pnpm build
    
    if [ $? -ne 0 ]; then
        echo "❌ Error en el build"
        exit 1
    fi
    
    echo "✅ Build completado"
    
    # Obtener IP local para mostrar información de acceso
    LOCAL_IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -n1)
    
    echo ""
    echo "🌟 VR Ecopetrol listo para producción"
    echo "=================================="
    echo "🖥️  Servidor local: http://localhost:8080"
    
    if [ ! -z "$LOCAL_IP" ]; then
        echo "🌐 Red local: http://$LOCAL_IP:8080"
        echo "🎮 Dashboard: http://$LOCAL_IP:8080/dashboard"
        echo ""
        echo "📱 Para conectar dispositivos:"
        echo "   1. Conectar a la misma red WiFi"
        echo "   2. Abrir: http://$LOCAL_IP:8080"
        echo "   3. Dashboard: http://$LOCAL_IP:8080/dashboard"
    else
        echo "⚠️  No se pudo detectar IP local"
        echo "💡 Usar: ifconfig | grep 'inet ' | grep -v 127.0.0.1"
    fi
    
    echo ""
    echo "🔄 Para detener: Ctrl+C"
    echo "📊 Logs en tiempo real abajo..."
    echo ""
    
    # Iniciar servidor
    pnpm start
fi


