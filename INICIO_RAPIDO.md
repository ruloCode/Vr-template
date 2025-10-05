# 🚀 Inicio Rápido - Sistema de Video Sincronizado

## ▶️ Comando para Iniciar

```bash
pnpm dev
```

## 📺 Lo que Verás en la Terminal

Cuando ejecutes `pnpm dev`, verás algo como esto:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎬 DASHBOARD DE CONTROL DE VIDEO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📺 Local:   http://localhost:8080/video-dashboard
📺 Red:     http://192.168.1.100:8080/video-dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 CLIENTE DE VIDEO (Dispositivos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔗 http://localhost:8085
   🔗 http://192.168.1.100:8085

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Otros Dashboards y APIs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎮 Dashboard VR: http://localhost:8080/dashboard
📊 Health Check: http://localhost:8080/health
🔌 WebSocket:    ws://localhost:8081/ws

✨ Sistema listo para usar!
```

## 🎯 URLs Importantes

### 🎬 Dashboard de Control (PRINCIPAL)
**Puerto: 8080**

Abre en tu computadora/laptop:
```
http://localhost:8080/video-dashboard
```

O desde la red:
```
http://<TU_IP>:8080/video-dashboard
```

### 📱 Cliente de Video (Dispositivos)
**Puerto: 8085**

Abre en cada tablet/celular/dispositivo:
```
http://<TU_IP>:8085
```

**Ejemplo:** Si tu IP es `192.168.1.100`:
```
http://192.168.1.100:8085
```

## 📋 Pasos para Usar

### 1️⃣ Inicia el Sistema
```bash
pnpm dev
```

### 2️⃣ Abre el Dashboard
En tu computadora:
```
http://localhost:8080/video-dashboard
```

### 3️⃣ Conecta Dispositivos
En cada tablet/celular (reemplaza con tu IP):
```
http://192.168.1.100:8085
```

### 4️⃣ Controla la Reproducción
En el dashboard:
1. **Selecciona** un video del dropdown
2. Click **▶️ PLAY** → reproducen todos (3s delay)
3. Click **⏸️ PAUSE** → pausa todos
4. Click **⏹️ STOP** → detiene todos

## 🔍 Cómo Encontrar Tu IP

### Windows
```bash
ipconfig
```
Busca "IPv4 Address" (ejemplo: `192.168.1.100`)

### Mac/Linux
```bash
ifconfig | grep "inet "
```
O simplemente mira el mensaje cuando inicies `pnpm dev`

## 📹 Agregar Videos

Coloca tus archivos `.mp4` en:
```
apps/clientevideo/videos/
```

Ejemplo:
```bash
cp mi-video.mp4 apps/clientevideo/videos/
```

Reinicia el servidor:
```bash
# Ctrl+C para detener
pnpm dev
```

Los videos aparecerán automáticamente en el dropdown.

## 🆘 Problemas Comunes

### "No hay dispositivos conectados"
✅ Verifica que todos estén en la misma WiFi
✅ Usa la IP correcta, no `localhost`

### "Video no carga"
✅ Espera 5-10 segundos (videos grandes)
✅ Refresca la página del cliente

### "No sincroniza"
✅ Usa el botón PLAY del dashboard
✅ Verifica que la WiFi sea estable

## 📊 Puertos Usados

| Servicio | Puerto | URL |
|----------|--------|-----|
| **Dashboard** | 8080 | `http://localhost:8080/video-dashboard` |
| **WebSocket** | 8081 | `ws://localhost:8081/ws` |
| **Cliente Video** | 8085 | `http://localhost:8085` |

## ✨ ¡Listo!

Ahora tienes un sistema completo de video sincronizado funcionando.

Para más detalles, revisa `GUIA_USO.md`
