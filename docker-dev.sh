#!/bin/bash

# Script de inicio rápido para desarrollo con Docker
# VR Ecopetrol - Sistema de Experiencias 360° Sincronizadas

echo "🚀 Iniciando VR Ecopetrol con Docker..."
echo ""

# Verificar que Docker esté ejecutándose
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker no está ejecutándose"
    echo "   Por favor, inicia Docker Desktop y vuelve a intentar"
    exit 1
fi

echo "✅ Docker está ejecutándose"
echo ""

# Verificar si ya existe un contenedor ejecutándose
if docker ps | grep -q "vr-ecopetrol-dev"; then
    echo "⚠️  Ya hay un contenedor ejecutándose"
    echo "   Deteniendo contenedor anterior..."
    docker-compose down
    echo ""
fi

# Construir y ejecutar
echo "🔨 Construyendo imagen Docker..."
docker-compose build

echo ""
echo "🚀 Iniciando servicios..."
docker-compose up -d

echo ""
echo "⏳ Esperando que los servicios estén listos..."
sleep 10

echo ""
echo "🎉 ¡VR Ecopetrol está ejecutándose!"
echo ""
echo "📱 Accesos disponibles:"
echo "   • Cliente VR:     http://localhost:8080/"
echo "   • Dashboard:      http://localhost:8080/dashboard"
echo "   • Cliente Dev:    http://localhost:5173/"
echo "   • API Health:     http://localhost:8080/api/health"
echo ""
echo "🔧 Comandos útiles:"
echo "   • Ver logs:       docker-compose logs -f"
echo "   • Detener:        docker-compose down"
echo "   • Reiniciar:      docker-compose restart"
echo ""
echo "📖 Para más información, consulta DOCKER.md"
echo ""

# Mostrar logs iniciales
echo "📋 Logs iniciales (Ctrl+C para salir):"
echo "----------------------------------------"
docker-compose logs -f
