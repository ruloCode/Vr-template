# 📹 Guía de Uso - Sistema de Video Sincronizado

## 🚀 Inicio Rápido

### 1. Iniciar el Sistema

```bash
# Desde la raíz del proyecto
pnpm dev
```

Esto iniciará automáticamente:
- ✅ **Servidor Backend** (puertos 8080/8081)
- ✅ **Cliente de Video** (puertos 8085/8445)

### 2. Abrir el Dashboard de Control

En tu computadora/laptop, abre en el navegador:

```
http://localhost:8080/video-dashboard
```

O desde la red local:

```
http://<TU_IP>:8080/video-dashboard
```

**Para encontrar tu IP:**
- **Windows**: `ipconfig` → busca "IPv4 Address"
- **Mac/Linux**: `ifconfig` → busca "inet"
- **Ejemplo**: `192.168.1.100`

### 3. Conectar Dispositivos Cliente

En cada tablet/celular/dispositivo, abre el navegador y ve a:

```
http://<TU_IP>:8085
```

**Ejemplo:** Si tu IP es `192.168.1.100`:
```
http://192.168.1.100:8085
```

Verás:
- Estado de conexión (debe decir "Listo" con punto azul)
- Pantalla negra lista para reproducir video
- ID del dispositivo

## 🎮 Uso del Dashboard

El dashboard es super simple, solo tiene:

```
┌─────────────────────────────────┐
│   🎬 Control de Video           │
│   📱 5 Dispositivos Conectados  │ ← Contador en tiempo real
├─────────────────────────────────┤
│                                 │
│  [Seleccionar Video  ▼]         │ ← 1. Selecciona aquí
│                                 │
│  ┌───────────────────────────┐  │
│  │    ▶️  PLAY               │  │ ← 2. Click PLAY
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │    ⏸️  PAUSE              │  │ ← Para pausar
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │    ⏹️  STOP               │  │ ← Para detener
│  └───────────────────────────┘  │
│                                 │
│  Video Actual: [nombre.mp4]    │ ← Info del video
└─────────────────────────────────┘
```

### Pasos:

1. **Seleccionar Video**: Click en el dropdown y elige un video
   - El video se carga automáticamente en todos los dispositivos
   - Los botones se activan

2. **PLAY**: Click en el botón verde grande
   - Todos los dispositivos reproducen **sincronizados**
   - Hay un delay de 3 segundos para sincronización perfecta
   - El video va a fullscreen automáticamente

3. **PAUSE**: Click en el botón naranja
   - Pausa en todos los dispositivos simultáneamente

4. **STOP**: Click en el botón rojo
   - Detiene y resetea el video
   - Sale de fullscreen
   - Deselecciona el video

## 📱 Uso en Dispositivos Cliente

Los clientes son **100% automáticos**:

1. Solo abre la URL: `http://<TU_IP>:8085`
2. Espera que diga "Listo" (punto azul)
3. **No toques nada más**
4. Espera comandos del dashboard

**Nota:** En móviles, puede aparecer un botón de PLAY la primera vez (restricción del navegador). Solo haz click una vez y ya.

## 🎯 Flujo Completo de Uso

### Setup Inicial (una sola vez):

1. Conecta todos los dispositivos a la misma WiFi
2. Ejecuta `pnpm dev`
3. Anota tu IP (ejemplo: `192.168.1.100`)
4. Abre dashboard en tu computadora
5. En cada dispositivo cliente: `http://192.168.1.100:8085`
6. Verifica que todos digan "Listo"

### Cada Presentación:

1. En dashboard: Selecciona video
2. Espera 2-3 segundos (carga en dispositivos)
3. Click **PLAY**
4. Todos reproducen sincronizados en fullscreen
5. Usa **PAUSE** si necesitas
6. Al terminar: **STOP**
7. Repite con otro video si quieres

## 🔧 Solución de Problemas

### "No hay dispositivos conectados"
- ✅ Verifica que todos estén en la misma WiFi
- ✅ Usa la IP correcta (no `localhost`)
- ✅ Verifica que el servidor esté corriendo

### "Video no carga"
- ✅ Espera 5-10 segundos (videos grandes tardan)
- ✅ Verifica que el archivo `.mp4` exista en `apps/clientevanilla/videos/`
- ✅ Refresca la página del cliente

### "Video no reproduce"
- ✅ En móviles: Click en el botón de PLAY que aparece
- ✅ Verifica volumen del dispositivo
- ✅ Usa Chrome/Safari (mejor soporte)

### "Dispositivos no sincronizados"
- ✅ Asegúrate de usar el botón PLAY del dashboard (no del navegador)
- ✅ WiFi lenta puede causar delays
- ✅ Reinicia los clientes si es necesario

## 📂 Agregar Nuevos Videos

1. Coloca tus archivos `.mp4` en:
   ```
   apps/clientevideo/videos/
   ```

2. Ejemplo:
   ```bash
   cp mi-video.mp4 apps/clientevideo/videos/
   ```

3. Reinicia el servidor (`Ctrl+C` y luego `pnpm dev`)

4. Los videos aparecerán automáticamente en el dropdown

**Nota**: Solo coloca videos en el directorio raíz `videos/`, no uses subdirectorios.

## 🌐 URLs de Referencia

| Servicio | URL Local | URL Red |
|----------|-----------|---------|
| **Dashboard** | `http://localhost:8080/video-dashboard` | `http://<TU_IP>:8080/video-dashboard` |
| **Cliente Video** | `http://localhost:8085` | `http://<TU_IP>:8085` |
| **Cliente VR** | `http://localhost:8445` | `https://<TU_IP>:8445` |
| **Health Check** | `http://localhost:8080/health` | `http://<TU_IP>:8080/health` |

## ⚙️ Configuración Avanzada

### Cambiar Puerto del Cliente

Edita `apps/clientevideo/server.js`:

```javascript
const HTTP_PORT = 8085;  // Cambia este número
const HTTPS_PORT = 8445;
```

### Delay de Sincronización

Edita `apps/server/src/dashboard/video-routes.ts` línea ~515:

```javascript
const delayMs = 3000; // Cambia 3000 a lo que necesites (milisegundos)
```

## 📊 Información Técnica

- **Sincronización**: NTP-style clock sync con 3s de delay
- **Protocolo**: WebSocket (puerto 8081)
- **Videos**: Formato MP4 recomendado
- **Dispositivos**: Hasta 35 clientes simultáneos
- **Latencia**: <200ms recomendada
- **Red**: WiFi 100Mbps mínimo

## 💡 Tips

- ✅ **Mejor rendimiento**: Usa WiFi 5GHz
- ✅ **Videos grandes**: Pre-carga antes de la presentación
- ✅ **Móviles**: Activa "No molestar" y "Pantalla siempre activa"
- ✅ **Tablets**: Usa landscape para mejor experiencia
- ✅ **Testing**: Prueba con 2-3 dispositivos antes del evento
- ✅ **Backup**: Ten un video de prueba corto para verificar

## 🆘 Soporte

Si algo no funciona:

1. Revisa la consola del navegador (F12 → Console)
2. Verifica logs del servidor en la terminal
3. Reinicia todo: `Ctrl+C` → `pnpm dev`
4. Cierra y abre los clientes
