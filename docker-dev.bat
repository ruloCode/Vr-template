@echo off
REM Script de inicio rápido para desarrollo con Docker
REM VR Ecopetrol - Sistema de Experiencias 360° Sincronizadas

echo 🚀 Iniciando VR Ecopetrol con Docker...
echo.

REM Verificar que Docker esté ejecutándose
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Docker no está ejecutándose
    echo    Por favor, inicia Docker Desktop y vuelve a intentar
    pause
    exit /b 1
)

echo ✅ Docker está ejecutándose
echo.

REM Verificar si ya existe un contenedor ejecutándose
docker ps | findstr "vr-ecopetrol-dev" >nul
if not errorlevel 1 (
    echo ⚠️  Ya hay un contenedor ejecutándose
    echo    Deteniendo contenedor anterior...
    docker-compose down
    echo.
)

REM Construir y ejecutar
echo 🔨 Construyendo imagen Docker...
docker-compose build

echo.
echo 🚀 Iniciando servicios...
docker-compose up -d

echo.
echo ⏳ Esperando que los servicios estén listos...
timeout /t 10 /nobreak >nul

echo.
echo 🎉 ¡VR Ecopetrol está ejecutándose!
echo.
echo 📱 Accesos disponibles:
echo    • Cliente VR:     http://localhost:8080/
echo    • Dashboard:      http://localhost:8080/dashboard
echo    • Cliente Dev:    http://localhost:3000/
echo    • API Health:     http://localhost:8080/api/health
echo.
echo 🔧 Comandos útiles:
echo    • Ver logs:       docker-compose logs -f
echo    • Detener:        docker-compose down
echo    • Reiniciar:      docker-compose restart
echo.
echo 📖 Para más información, consulta DOCKER.md
echo.

REM Mostrar logs iniciales
echo 📋 Logs iniciales (Ctrl+C para salir):
echo ----------------------------------------
docker-compose logs -f

pause
