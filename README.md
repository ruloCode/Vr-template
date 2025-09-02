# VR Ecopetrol - Sistema de Experiencias 360° Sincronizadas

Sistema de realidad virtual 360° para experiencias inmersivas sincronizadas entre múltiples dispositivos en red local, desarrollado para Ecopetrol.

## 🚀 Características Principales

- **🥽 Experiencia VR 360°** con A-Frame y WebXR
- **🔄 Sincronización en tiempo real** entre hasta 35 dispositivos
- **📱 PWA Offline** funcionamiento sin internet
- **🎵 Audio narrativo sincronizado** con corrección de drift
- **🎮 Dashboard de control** para orquestar la experiencia
- **🌐 Red LAN** diseñado para eventos itinerantes
- **⚡ Preloader inteligente** con caché offline

## 📁 Estructura del Proyecto

```
vr-ecopetrol/
├── package.json              # Scripts raíz del monorepo
├── pnpm-workspace.yaml       # Configuración de workspace
├── apps/
│   ├── server/               # Servidor Node.js + WebSocket + Dashboard
│   │   ├── src/
│   │   │   ├── websocket/    # Sistema de sincronización WebSocket
│   │   │   ├── dashboard/    # Dashboard web de control
│   │   │   ├── routes/       # API REST
│   │   │   └── types/        # Esquemas TypeScript + Zod
│   │   └── dist/             # Build del servidor
│   └── client/               # Cliente VR (Vite + A-Frame + PWA)
│       ├── src/
│       │   ├── components/   # Managers de VR, Audio, Sync, UI
│       │   ├── store/        # Estado global (Zustand)
│       │   ├── utils/        # WebSocket, Preloader, Config
│       │   └── types/        # Tipos compartidos
│       ├── public/
│       │   ├── panos/        # Imágenes 360° (8K recomendado)
│       │   ├── audio/        # Audio narrativo (MP3)
│       │   └── manifest.webmanifest
│       └── dist/             # Build del cliente (servido por server)
└── README.md
```

## 🛠️ Instalación y Configuración

### Prerrequisitos

- **Node.js** 18+ 
- **pnpm** 8+
- **Navegador moderno** con soporte WebGL/WebXR

### 1. Instalación

```bash
git clone <repository>
cd vr-ecopetrol
pnpm install
```

### 2. Configuración de Assets

Coloque los archivos multimedia en las siguientes ubicaciones:

#### Imágenes 360°:
```
apps/client/public/panos/
├── escena1_8k.jpg    # Riqueza Natural (4096x2048)
├── escena2_8k.jpg    # Dinámica del País (4096x2048)  
├── escena3_8k.jpg    # Exploración On/Offshore (4096x2048)
└── placeholder.jpg   # Para escenas futuras
```

#### Audio Narrativo:
```
apps/client/public/audio/
├── escena1.mp3       # ~45 segundos, 128kbps
├── escena2.mp3       # ~50 segundos, 128kbps
├── escena3.mp3       # ~40 segundos, 128kbps
└── placeholder.mp3   # Audio silencioso para testing
```

## 🚀 Desarrollo

### Scripts Principales

```bash
# Desarrollo (ambos servicios)
pnpm dev

# Desarrollo individual
pnpm -F server dev    # Servidor en :8080
pnpm -F client dev    # Cliente en :5173

# Build de producción
pnpm build

# Producción
pnpm start
```

### Acceso Local

- **Cliente VR**: http://localhost:8080/
- **Dashboard**: http://localhost:8080/dashboard  
- **API**: http://localhost:8080/api/health
- **WebSocket**: ws://localhost:8081/ws

## 🌐 Despliegue en Red Local

### Configuración del Servidor

1. **Editar configuración de red**:
   ```bash
   # En apps/server/.env
   HOST=0.0.0.0
   PORT=8080
   ```

2. **Iniciar servidor**:
   ```bash
   pnpm build
   pnpm start:production
   ```

3. **Obtener IP local**:
   ```bash
   # Linux/Mac
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig | findstr "IPv4"
   ```

### Conexión de Dispositivos

1. **Conectar dispositivos** a la misma red WiFi
2. **Abrir navegador** en cada dispositivo
3. **Navegar a**: `http://[IP_SERVIDOR]:8080`
   
   Ejemplo: `http://192.168.1.100:8080`

4. **Dashboard**: `http://[IP_SERVIDOR]:8080/dashboard`

## 🎮 Uso del Dashboard

### Panel de Control

El dashboard permite orquestar la experiencia desde un dispositivo central:

1. **Estadísticas en tiempo real**:
   - Dispositivos conectados
   - Latencia promedio  
   - Escena actual

2. **Control de escenas**:
   - `LOAD` - Cargar escena en todos los dispositivos
   - `START` - Iniciar reproducción sincronizada
   - `PAUSE` / `RESUME` - Control de reproducción
   - `SEEK` - Avanzar/retroceder ±5s o personalizado

3. **Monitoreo de dispositivos**:
   - Estado de conexión
   - Latencia individual
   - Nivel de batería (móviles)
   - Escena actual por dispositivo

### Flujo de Operación Típico

1. **Verificar conexiones** - Confirmar que todos los dispositivos aparezcan en el dashboard
2. **Cargar escena** - Seleccionar y cargar "escena-1"
3. **Esperar "Ready"** - Todos los dispositivos deben reportar "ready"
4. **Iniciar experiencia** - Usar "START en 3s" para sincronización
5. **Monitorear** - Observar reproducción y métricas de sync

## 🛠️ Características Técnicas

### Protocolo de Sincronización

- **WebSocket bidireccional** con esquemas Zod
- **Sincronización de reloj** tipo NTP simplificado
- **Corrección de drift** automática (<120ms tolerancia)
- **Heartbeat** cada 30 segundos

### Sistema de Audio

- **Web Audio API** con programación precisa
- **Crossfade** entre escenas (500ms)
- **Corrección temporal** en tiempo real
- **Soporte de fade in/out**

### Optimizaciones

- **Precarga inteligente** de todos los assets
- **Caché offline** con Service Worker
- **Compresión WebGL** automática
- **Batching de comandos** para reducir latencia

## 📱 Experiencia del Usuario

### Flujo del Cliente

1. **Conexión automática** al servidor
2. **Activación de audio** (requerido por navegadores)
3. **Precarga de assets** con barra de progreso
4. **Estado "Listo"** - esperando comandos
5. **Experiencia sincronizada** controlada desde dashboard

### Controles de Usuario

- **Modo Debug** - F12 o Ctrl+Shift+D
- **Controles manuales** - Tecla 'C'
- **Reset cámara** - Disponible en modo debug
- **Modo VR** - Si disponible en el dispositivo

## 🔧 Solución de Problemas

### Problemas Comunes

**Audio no se reproduce**:
- Verificar que el usuario haya activado audio (botón requerido)
- Revisar que los archivos MP3 estén en /public/audio/

**Imágenes 360° no cargan**:
- Confirmar que las imágenes estén en formato JPEG
- Verificar resolución mínima 2048x1024
- Revisar nombres de archivo en asset-manifest.json

**Dispositivos no se conectan**:
- Verificar que estén en la misma red
- Revisar firewall del servidor
- Confirmar IP y puerto correctos

**Desincronización**:
- Revisar latencia en dashboard (debe ser <200ms)
- Verificar estabilidad de red WiFi
- Considerar reiniciar experiencia si drift es muy alto

### Debug

Usar `window.VR_DEBUG` en consola del navegador:
```javascript
// Ver estado de la aplicación
VR_DEBUG.store.getState()

// Información de conexión
VR_DEBUG.store.getState().connectionStatus

// Estado de audio
VR_DEBUG.store.getState().audioState
```

## 🔒 Consideraciones de Seguridad

- **Red LAN únicamente** - No exponer a internet
- **CORS básico** habilitado para la red local
- **Validación Zod** en todos los mensajes WebSocket
- **Rate limiting** implícito por conexión WebSocket

## ⚡ Performance

### Recomendaciones de Hardware

**Servidor** (Mini PC):
- CPU: Intel i5/AMD Ryzen 5 o superior
- RAM: 8GB mínimo
- Almacenamiento: SSD 256GB
- Red: Gigabit Ethernet

**Dispositivos Cliente** (Tablets/Móviles):
- RAM: 4GB mínimo
- GPU: Soporte WebGL 2.0
- Navegador: Chrome/Edge/Safari actualizado

**Red WiFi**:
- Estándar: 802.11ac (WiFi 5) o superior
- Ancho de banda: 100Mbps mínimo
- Latencia: <50ms entre dispositivos

### Optimizaciones

- Assets precargados completamente antes de iniciar
- Texturas optimizadas para WebGL
- Audio comprimido pero alta calidad
- Garbage collection minimizado durante experiencia

## 🤝 Contribución

### Estructura de Desarrollo

- **TypeScript estricto** en cliente y servidor
- **Zod schemas** para validación de datos
- **ESLint + Prettier** para código consistente
- **Modular architecture** para mantenibilidad

### Testing

```bash
# Lint
pnpm lint

# Type checking
pnpm type-check

# Testing de carga (simular múltiples clientes)
# Abrir múltiples pestañas en http://localhost:8080
```

## 📄 Licencia

Copyright Ecopetrol - Todos los derechos reservados.

---

## 🆘 Soporte

Para soporte técnico durante eventos:

1. **Revisar dashboard** - Estado de conexiones y métricas
2. **Verificar logs** - Consola del servidor para errores
3. **Restart secuencial** - Servidor → Clientes → Red
4. **Modo manual** - Usar controles offline si falla sync

**Contacto técnico**: [Insertar información de contacto]


