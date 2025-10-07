# Sistema VR Ecopetrol - Configuración Offline 100%

## ✨ Características

- 🔐 **SSL Dinámico**: Certificados autofirmados generados automáticamente con la IP actual
- 🌐 **100% Offline**: Funciona completamente sin conexión a internet
- 📱 **Multi-dispositivo**: Soporta hasta 35+ dispositivos conectados simultáneamente
- 🎬 **Videos Sincronizados**: Reproducción sincronizada de video_general.mp4 y video_guajira.mp4
- 🔒 **HTTPS Seguro**: Conexiones cifradas para mejor compatibilidad móvil

## 🚀 Inicio Rápido

### 1. Instalación Inicial

```bash
# Instalar dependencias
pnpm install

# Generar certificados SSL (automático con IP actual)
pnpm ssl:generate

# Construir servidor
pnpm build
```

### 2. Iniciar el Sistema

```bash
# Iniciar todos los servicios
pnpm dev
```

El sistema iniciará automáticamente:
- ✅ Servidor principal (Dashboard de Video) en puerto 8080
- ✅ Cliente de Video HTTP en puerto 8085
- ✅ Cliente de Video HTTPS en puerto 8445
- ✅ WebSocket Seguro (WSS) en puerto 8081
- ✅ WebSocket Regular (WS) en puerto 8082

## 📡 URLs de Acceso

### Dashboard de Control (Administrador)

```
🎬 Dashboard de Video:
   Local:  https://localhost:8080/video-dashboard
   Red:    https://192.168.X.X:8080/video-dashboard

🎮 Dashboard VR:
   Local:  https://localhost:8080/dashboard
   Red:    https://192.168.X.X:8080/dashboard
```

### Cliente de Video (Dispositivos)

```
📱 HTTPS (Recomendado):
   Local:  https://localhost:8445
   Red:    https://192.168.X.X:8445

🔗 HTTP (Testing):
   Local:  http://localhost:8085
   Red:    http://192.168.X.X:8085
```

**Nota**: La IP exacta (192.168.X.X) se muestra en los logs al iniciar el servidor.

## 🔐 Configuración de Certificados SSL

### Generación Automática

El sistema detecta automáticamente tu IP local y genera certificados válidos:

```bash
# Generar/regenerar certificados
pnpm ssl:generate

# Verificar certificados
pnpm ssl:verify
```

### Auto-Verificación

Al iniciar, el servidor automáticamente:
1. ✅ Detecta la IP actual de red
2. ✅ Verifica si el certificado incluye esa IP
3. ✅ Si NO coincide → regenera certificados automáticamente
4. ✅ Si coincide → usa certificados existentes

### Certificados Incluyen

- `localhost`
- `127.0.0.1`
- `::1` (IPv6 localhost)
- Tu IP local actual (ej: 192.168.1.98)

## 📱 Configuración de Dispositivos

### En cada dispositivo móvil/tablet:

#### 1. Conectar a la Red WiFi Local

Asegúrate de que todos los dispositivos estén en la **misma red WiFi** que el servidor.

#### 2. Acceder al Cliente de Video

Abre el navegador y ve a:
```
https://192.168.X.X:8445
```
(Reemplaza X.X con la IP mostrada en los logs del servidor)

#### 3. Aceptar Certificado Autofirmado

El navegador mostrará una advertencia de seguridad:

**En Chrome/Safari:**
1. Click en "Avanzado" o "Advanced"
2. Click en "Continuar al sitio" o "Proceed to site"

**En Firefox:**
1. Click en "Avanzado" o "Advanced"
2. Click en "Aceptar el riesgo y continuar"

**Esto es completamente normal** - el certificado es autofirmado para uso offline.

#### 4. Listo

El cliente mostrará:
- ✓ "Listo para Reproducir"
- Estado de conexión: Conectado
- ID del dispositivo

## 🎬 Uso del Dashboard de Video

### 1. Abrir Dashboard

En tu computadora (servidor), abre:
```
https://localhost:8080/video-dashboard
```

### 2. Controlar Videos

1. **Seleccionar Video**: Elige `video_general.mp4` o `video_guajira.mp4`
2. **PLAY**: Reproduce en todos los dispositivos sincronizadamente
3. **PAUSE**: Pausa en todos los dispositivos
4. **STOP**: Detiene y reinicia

### Videos Disponibles

- **video_general.mp4** (233.92 MB)
- **video_guajira.mp4** (138.01 MB)

Ambos ubicados en: `apps/clientevideo/videos/`

## 🔄 Sincronización

### WebSocket

El sistema usa dos tipos de WebSocket para máxima compatibilidad:

- **WSS (Seguro)**: Puerto 8081 - Para clientes HTTPS
- **WS (Regular)**: Puerto 8082 - Para clientes HTTP

### Precisión

- Sincronización con corrección de latencia de red
- Tolerancia: ±120ms
- Ajuste automático de drift

## 🌐 Funcionamiento Offline

### Características Offline

- ✅ **Sin Internet Requerido**: Funciona completamente en red local (LAN)
- ✅ **CORS Habilitado**: Permite conexiones cross-origin en red local
- ✅ **Cache Agresivo**: Assets cacheados para máximo rendimiento
- ✅ **Videos Locales**: Servidos desde disco local, no CDN
- ✅ **Auto-reconexión**: Los clientes se reconectan automáticamente si pierden conexión

### Red Recomendada

- **WiFi**: 5GHz preferible (menos interferencia)
- **Velocidad**: 100Mbps mínimo
- **Dispositivos**: Hasta 35+ soportados
- **Latencia**: <50ms entre dispositivos

## 🛠️ Comandos Útiles

```bash
# Desarrollo
pnpm dev                  # Iniciar servidor + cliente video
pnpm dev:server          # Solo servidor
pnpm dev:clientevideo    # Solo cliente video

# SSL
pnpm ssl:generate        # Generar certificados
pnpm ssl:verify          # Verificar certificados

# Producción
pnpm build               # Construir servidor
pnpm start               # Iniciar en producción
pnpm start:production    # Producción con NODE_ENV

# Limpieza
pnpm clean               # Limpiar builds
```

## 🐛 Troubleshooting

### "No se puede conectar"

1. Verifica que todos los dispositivos estén en la misma WiFi
2. Verifica que el servidor esté corriendo (`pnpm dev`)
3. Verifica la IP en los logs y úsala en los dispositivos
4. Intenta con HTTP primero: `http://192.168.X.X:8085`

### "Certificado SSL inválido"

1. Regenera certificados: `pnpm ssl:generate`
2. Reinicia el servidor: `Ctrl+C` y luego `pnpm dev`
3. El servidor auto-verificará y usará la nueva IP

### "Videos no cargan"

1. Verifica que existan en `apps/clientevideo/videos/`:
   - video_general.mp4
   - video_guajira.mp4
2. Revisa el dashboard: `https://localhost:8080/video-dashboard/api/videos`
3. Verifica permisos de lectura en los archivos

### "No se sincroniza"

1. Verifica WebSocket en logs del servidor
2. Abre consola del navegador en cliente (F12)
3. Busca errores de conexión WebSocket
4. Verifica firewall no bloquee puertos 8081/8082

## 📊 Arquitectura

```
┌─────────────────────────────────────────────────────┐
│  Servidor Principal (puerto 8080 HTTPS)             │
│  - Dashboard de Video                               │
│  - API REST                                         │
│  - Servir videos desde /videos                     │
├─────────────────────────────────────────────────────┤
│  WebSocket Servers                                  │
│  - WSS (8081): Conexiones seguras                  │
│  - WS (8082): Conexiones regulares                 │
├─────────────────────────────────────────────────────┤
│  Cliente de Video (puertos 8085/8445)              │
│  - HTTP (8085): Testing                            │
│  - HTTPS (8445): Producción                        │
│  - Archivos estáticos + videos                     │
│  - CORS habilitado                                  │
└─────────────────────────────────────────────────────┘
              ↓ ↑ WebSocket Bidireccional
┌─────────────────────────────────────────────────────┐
│  Dispositivos Clientes (35+ simultáneos)            │
│  - Tablets, móviles, desktops                      │
│  - Video player sincronizado                        │
│  - Auto-fullscreen                                  │
│  - Orientación landscape                            │
└─────────────────────────────────────────────────────┘
```

## 🎯 Flujo de Operación

1. **Setup**:
   - Servidor genera certificados SSL con IP actual
   - Inicia servicios HTTP/HTTPS y WebSocket

2. **Conexión Dispositivos**:
   - Dispositivos acceden vía HTTPS a 192.168.X.X:8445
   - Aceptan certificado autofirmado
   - Conectan vía WebSocket (auto WSS/WS según protocolo)

3. **Control**:
   - Dashboard selecciona video
   - Envía comando LOAD_VIDEO → todos los clientes
   - Clientes cargan video y reportan READY
   - Dashboard envía PLAY_VIDEO con timestamp
   - Todos reproducen sincronizadamente

4. **Offline**:
   - Todo funciona sin internet
   - Videos servidos localmente
   - WebSocket en red local
   - Cache agresivo para performance

## 📝 Notas Importantes

- ⚠️ Los certificados son autofirmados - **normales las advertencias de navegador**
- ⚠️ Aceptar certificado en **cada dispositivo** individualmente
- ⚠️ Si cambias de red WiFi, regenera certificados: `pnpm ssl:generate`
- ⚠️ Para eventos, llegar 30min antes para setup de red
- ⚠️ Probar en 2-3 dispositivos antes del evento completo

## 🆘 Soporte

Para problemas o preguntas:
1. Revisa logs del servidor (`pnpm dev`)
2. Revisa consola del navegador (F12) en cliente
3. Verifica [CLAUDE.md](./CLAUDE.md) para detalles técnicos
4. Revisa [README.md](./README.md) para arquitectura general

---

**Sistema VR Ecopetrol** - Versión 1.0.0
Optimizado para despliegue offline en eventos LAN
