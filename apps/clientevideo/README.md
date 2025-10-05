# Cliente de Video Sincronizado - Ecopetrol

Cliente simplificado de reproducción de video sincronizada vía WebSocket.

## Características

- **Video Player HTML5**: Reproducción nativa sin dependencias de A-Frame
- **Fullscreen Automático**: Maximiza la experiencia al reproducir
- **Sincronización WebSocket**: Orquestación centralizada desde el servidor
- **Multi-dispositivo**: Hasta 35 dispositivos sincronizados simultáneamente
- **HTTPS/WSS**: Soporte SSL para conexiones seguras

## Estructura

```
apps/clientevideo/
├── index.html          # Cliente HTML5
├── client.js           # Lógica WebSocket y control de video
├── styles.css          # Estilos y fullscreen
├── server.js           # Servidor HTTPS local
├── package.json        # Dependencias
└── README.md           # Esta documentación
```

## Instalación

```bash
# Instalar dependencias del monorepo
pnpm install
```

## Desarrollo

```bash
# Iniciar servidor de video (HTTP: 8085, HTTPS: 8445)
pnpm dev:clientevideo

# Iniciar servidor backend (WebSocket en puerto 8081)
pnpm dev:server
```

## Uso

### 1. Servidor Backend
El servidor backend debe estar corriendo en puerto 8080/8081 (WebSocket).

```bash
pnpm dev:server
```

### 2. Cliente de Video
Acceder desde dispositivos en la red:

- **HTTP**: `http://localhost:8085` o `http://<SERVER_IP>:8085`
- **HTTPS**: `https://localhost:8445` o `https://<SERVER_IP>:8445`

### 3. Dashboard de Control
Controlar la reproducción desde:

- `http://localhost:8080/video-dashboard`
- `http://<SERVER_IP>:8080/video-dashboard`

## Dashboard de Video

El dashboard permite:

1. **Seleccionar Video**: Lista de videos disponibles de `clientevanilla/videos/`
2. **Cargar Video**: Envía el video a todos los clientes conectados
3. **PLAY**: Reproduce sincronizadamente (delay de 3s para sincronización)
4. **PAUSE**: Pausa en todos los dispositivos
5. **STOP**: Detiene y resetea el video

## Videos Disponibles

El cliente sirve automáticamente videos desde:
- `apps/clientevideo/videos/` (carpeta local del cliente)

Formatos soportados: `.mp4`, `.MP4`

### Agregar Videos

Simplemente coloca tus archivos `.mp4` en:
```
apps/clientevideo/videos/
```

Ejemplo:
```bash
cp mi-video.mp4 apps/clientevideo/videos/
```

Los videos aparecerán automáticamente en el dashboard.

## Comandos WebSocket

### Cliente → Servidor
- `HELLO`: Conexión inicial con deviceId
- `PING`: Sincronización de tiempo
- `READY`: Cliente listo después de cargar video
- `STATE`: Estado actual de reproducción

### Servidor → Cliente
- `WELCOME`: Confirmación de conexión
- `PONG`: Respuesta de sincronización
- `LOAD_VIDEO`: Cargar video específico
- `PLAY_VIDEO`: Reproducir con timestamp de sincronización
- `PAUSE_VIDEO`: Pausar reproducción
- `STOP_VIDEO`: Detener y resetear
- `SEEK_VIDEO`: Saltar a tiempo específico

## Modo Debug

Para habilitar información de debug:
```
http://localhost:8085?debug
```

Muestra:
- Video actual
- Estado (reproduciendo/pausado)
- Tiempo de reproducción
- Latencia de red

## SSL/HTTPS

El servidor buscará certificados en:
1. `apps/server/ssl/cert.pem` y `key.pem`
2. `apps/clientevanilla/cert.pem` y `key.pem`

Si no encuentra certificados, corre solo en HTTP.

### Generar Certificados

```bash
# Con mkcert (recomendado)
mkcert -key-file apps/server/ssl/key.pem -cert-file apps/server/ssl/cert.pem localhost

# O con openssl
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

## Sincronización

La sincronización se logra mediante:

1. **Clock Sync**: Protocolo NTP-style para sincronizar relojes
2. **Scheduled Playback**: Timestamp futuro para inicio sincronizado
3. **Latency Compensation**: Ajuste automático según latencia de red
4. **Default Delay**: 3 segundos de margen para carga y sincronización

## Diferencias con ClienteVanilla

| Característica | ClienteVanilla | ClienteVideo |
|----------------|----------------|--------------|
| Framework | A-Frame + WebXR | HTML5 Video |
| Contenido | 360° Panoramas + Audio | Video simple |
| Complejidad | Alta | Baja |
| Uso | Experiencia VR inmersiva | Reproducción video simple |
| Controles | Secuencias automatizadas | Play/Pause/Stop |

## Troubleshooting

### Video no reproduce
- Verificar que el servidor backend esté corriendo
- Revisar conexión WebSocket (estado debe ser "Listo")
- En móviles, puede requerir interacción de usuario (botón de play)

### Audio no se escucha
- Verificar volumen del dispositivo
- En móviles, activar audio manualmente

### Fullscreen no funciona
- Algunos navegadores requieren interacción de usuario
- Verificar permisos del navegador

## Producción

Para deployment en LAN:

```bash
# Build del servidor
pnpm build

# Iniciar en producción
pnpm start:production
```

## Tecnologías

- **HTML5 Video API**: Reproducción nativa
- **WebSocket**: Sincronización en tiempo real
- **Express**: Servidor HTTP/HTTPS
- **Zod**: Validación de mensajes WebSocket
