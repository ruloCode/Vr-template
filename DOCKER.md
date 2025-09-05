# 🐳 Desarrollo con Docker

Esta guía te permitirá ejecutar el proyecto VR Ecopetrol usando Docker, independientemente del sistema operativo (Windows, macOS, Linux).

## 📋 Prerrequisitos

- **Docker Desktop** instalado y ejecutándose
- **Docker Compose** (incluido en Docker Desktop)

### Verificar instalación

```bash
docker --version
docker-compose --version
```

## 🚀 Inicio Rápido

### 1. Clonar y preparar

```bash
git clone <repository>
cd vr-ecopetrol
```

### 2. Ejecutar con Docker

```bash
# Opción 1: Usando scripts de npm/pnpm
pnpm docker:dev

# Opción 2: Usando docker-compose directamente
docker-compose up --build
```

### 3. Acceder a la aplicación

Una vez que el contenedor esté ejecutándose, podrás acceder a:

- **Cliente VR**: http://localhost:8080/
- **Dashboard**: http://localhost:8080/dashboard
- **Cliente Dev (Vite)**: http://localhost:5173/
- **API**: http://localhost:8080/api/health
- **WebSocket**: ws://localhost:8081/ws

## 🛠️ Scripts Disponibles

```bash
# Desarrollo con Docker
pnpm docker:dev          # Iniciar desarrollo con hot reload
pnpm docker:stop        # Detener contenedores
pnpm docker:logs        # Ver logs en tiempo real
pnpm docker:clean       # Limpiar contenedores e imágenes

# Build manual
pnpm docker:build       # Construir imagen Docker
```

## 🔧 Configuración

### Volúmenes Montados

El docker-compose.yml monta los siguientes volúmenes para desarrollo:

- `./apps` → `/app/apps` (código fuente con hot reload)
- `./package.json` → `/app/package.json`
- `./pnpm-workspace.yaml` → `/app/pnpm-workspace.yaml`
- `./pnpm-lock.yaml` → `/app/pnpm-lock.yaml`

### Variables de Entorno

```yaml
environment:
  - NODE_ENV=development
  - HOST=0.0.0.0
  - PORT=8080
```

## 🌐 Desarrollo en Red Local

Para que otros dispositivos en tu red puedan conectarse:

1. **Encontrar IP del host**:

   ```bash
   # Windows
   ipconfig | findstr "IPv4"

   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. **Acceder desde otros dispositivos**:
   - Cliente VR: `http://[TU_IP]:8080/`
   - Dashboard: `http://[TU_IP]:8080/dashboard`

## 🐛 Solución de Problemas

### Puerto ya en uso

Si los puertos 8080, 8081 o 5173 están ocupados:

```bash
# Verificar qué proceso usa el puerto
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Cambiar puertos en docker-compose.yml
ports:
  - "8081:8080"  # Cambiar puerto externo
```

### Problemas de permisos (Linux)

```bash
# Agregar usuario al grupo docker
sudo usermod -aG docker $USER
# Reiniciar sesión
```

### Limpiar Docker completamente

```bash
# Detener todos los contenedores
docker stop $(docker ps -aq)

# Eliminar contenedores
docker rm $(docker ps -aq)

# Eliminar imágenes
docker rmi $(docker images -q)

# Limpiar sistema
docker system prune -a
```

### Rebuild completo

```bash
# Limpiar y reconstruir
pnpm docker:clean
pnpm docker:dev
```

## 📁 Estructura de Archivos Docker

```
vr-ecopetrol/
├── Dockerfile              # Imagen base con Node.js + pnpm
├── docker-compose.yml      # Configuración de servicios
├── .dockerignore          # Archivos excluidos del build
└── DOCKER.md              # Esta documentación
```

## 🔄 Hot Reload

El desarrollo con Docker incluye hot reload automático:

- **Servidor**: Reinicia automáticamente con `tsx watch`
- **Cliente**: Vite proporciona hot reload del navegador
- **Volúmenes**: Los cambios en código se reflejan inmediatamente

## 🚀 Producción

Para producción, puedes usar la misma imagen Docker:

```bash
# Build de producción
docker build -t vr-ecopetrol-prod .

# Ejecutar en producción
docker run -p 8080:8080 -e NODE_ENV=production vr-ecopetrol-prod
```

## 💡 Tips de Desarrollo

1. **Usar Docker Desktop**: Asegúrate de que Docker Desktop esté ejecutándose
2. **Monitorear recursos**: Docker puede usar bastante RAM/CPU
3. **Logs útiles**: `pnpm docker:logs` para debug
4. **Reiniciar limpio**: Si algo falla, usa `pnpm docker:clean` y reinicia

## 🆘 Soporte

Si tienes problemas con Docker:

1. Verificar que Docker Desktop esté ejecutándose
2. Revisar logs: `pnpm docker:logs`
3. Limpiar y reconstruir: `pnpm docker:clean && pnpm docker:dev`
4. Verificar puertos disponibles
5. Revisar permisos de Docker (Linux)

---

**¡Listo!** Ahora puedes desarrollar el proyecto VR independientemente del sistema operativo. 🎉
