# 🌐 Guía de Uso: Sistema de Video Sincronizado SIN INTERNET

## ✅ Características Offline

Este sistema está **completamente diseñado para funcionar SIN conexión a internet**:

- ✅ Todo el código está alojado localmente
- ✅ Videos se sirven desde archivos locales
- ✅ HTTPS con certificados SSL autofirmados
- ✅ WebSocket seguro (WSS) para sincronización
- ✅ Solo requiere red local (LAN/WiFi)

---

## 🔐 Acceso HTTPS Seguro

### URLs del Sistema

#### 📺 Dashboard (Control Central)
```
https://192.168.102.27:8080/video-dashboard
```
- Desde aquí se controla la reproducción
- Selección de videos
- Comandos PLAY/PAUSE/STOP

#### 📱 Cliente de Video (Dispositivos)
```
https://192.168.102.27:8445
```
- Abrir en todos los dispositivos que reproducirán video
- Pantalla morada "Listo para Reproducir"
- Reproducción sincronizada

#### 🔌 WebSocket (Comunicación)
```
wss://192.168.102.27:8081/ws
```
- Conexión automática desde cliente
- Sincronización en tiempo real

**Nota**: Reemplaza `192.168.102.27` con la IP de tu servidor.

---

## 📱 Configuración en Dispositivos

### Paso 1: Conectar a la Red Local

Todos los dispositivos deben estar en la **misma red WiFi/LAN** que el servidor:

```
Red WiFi: [Nombre de tu red]
Sin necesidad de internet
```

### Paso 2: Aceptar Certificado SSL

Como usamos certificados autofirmados, cada dispositivo mostrará una advertencia de seguridad la primera vez.

#### En Chrome/Edge:
1. Verás: "Tu conexión no es privada"
2. Click en **"Avanzado"**
3. Click en **"Acceder a [IP] (sitio no seguro)"**
4. El navegador recordará esta excepción

#### En Firefox:
1. Verás: "Advertencia: Riesgo potencial de seguridad a continuación"
2. Click en **"Avanzado"**
3. Click en **"Aceptar el riesgo y continuar"**

#### En Safari (iOS):
1. Verás: "Esta conexión no es privada"
2. Tap en **"Mostrar detalles"**
3. Tap en **"Visitar este sitio web"**
4. Confirmar en el diálogo

#### En Android (Chrome):
1. Verás advertencia de seguridad
2. Tap en **"Avanzado"**
3. Tap en **"Continuar a [IP] (no seguro)"**

**⚠️ Importante**: Esto es normal y seguro en una red local privada. Los certificados autofirmados no son confiables para el navegador, pero la conexión SÍ está cifrada.

---

## 🚀 Flujo de Uso Completo

### 1. Iniciar el Sistema

En el servidor (computadora host):

```bash
cd /ruta/al/proyecto
pnpm dev
```

Verás:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎬 DASHBOARD DE CONTROL DE VIDEO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📺 Local:   https://localhost:8080/video-dashboard
📺 Red:     https://192.168.102.27:8080/video-dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 CLIENTE DE VIDEO (Dispositivos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 HTTPS Server (Seguro - Recomendado):
   Local:  https://localhost:8445
   Red:    https://192.168.102.27:8445

📱 Acceso desde dispositivos en la red:
   🌐 https://192.168.102.27:8445

⚠️  Nota: Aceptar certificado SSL en cada dispositivo
```

Copia la IP que aparece en "Red" (en este ejemplo: `192.168.102.27`).

### 2. Configurar Dashboard (Control)

En una computadora/tablet de control:

1. Abre el navegador
2. Ve a: `https://[IP-DEL-SERVIDOR]:8080/video-dashboard`
3. Acepta el certificado SSL
4. Verás la interfaz de control

### 3. Configurar Clientes (Dispositivos de Reproducción)

En cada dispositivo que reproducirá video:

1. Conectar a la misma red WiFi
2. Abrir navegador
3. Ve a: `https://[IP-DEL-SERVIDOR]:8445`
4. Acepta el certificado SSL
5. Verás pantalla morada: "✓ Listo para Reproducir"
6. En la barra superior verás: "Conectado" con punto verde

### 4. Reproducir Video

Desde el dashboard:

1. **Seleccionar video**: Elige del dropdown (ej: `video_general.mp4`)
   - Todos los clientes mostrarán: "Cargando video..."
   - Cuando cargue: Volverán a "Listo"

2. **Click PLAY**:
   - Video se reproducirá en **todos** los dispositivos
   - Sincronización con 3 segundos de delay
   - Reproducción en fullscreen automáticamente

3. **Click PAUSE**:
   - Pausa en todos los dispositivos simultáneamente

4. **Click STOP**:
   - Detiene video
   - Vuelve a pantalla "Listo para Reproducir"

---

## 🔧 Troubleshooting

### "No se puede conectar al servidor"

**Solución**:
1. Verificar que todos estén en la misma red
2. Verificar que el servidor esté corriendo (`pnpm dev`)
3. Verificar que no haya firewall bloqueando los puertos 8080, 8081, 8445

### "WebSocket desconectado"

**Solución**:
1. Verificar que aceptaste el certificado SSL del servidor principal
2. Abrir: `https://[IP]:8080/health` y aceptar certificado
3. Recargar la página del cliente

### "Video no carga"

**Solución**:
1. Verificar que el video existe en `apps/clientevideo/videos/`
2. Formato soportado: MP4 con H.264
3. Reiniciar el servidor para re-escanear videos

### "Navegador pide usuario/contraseña"

**Solución**:
1. Esto NO debería pasar con HTTPS
2. Si pasa, usar HTTP: `http://[IP]:8085` (menos seguro)

### "No puedo aceptar certificado en iOS/iPad"

**Solución en iOS**:
1. Safari → Preferencias
2. O directamente tap en "Visitar este sitio web"
3. Si persiste, instalar certificado en el dispositivo:
   - Configuración → General → VPN y administración de dispositivos

---

## 📋 Checklist Pre-Evento

Antes de un evento/presentación:

- [ ] Servidor iniciado: `pnpm dev`
- [ ] Verificar IP del servidor: `ifconfig` o ver logs
- [ ] Router WiFi configurado (sin internet OK)
- [ ] Videos copiados a `apps/clientevideo/videos/`
- [ ] Probar en 1 dispositivo primero
- [ ] Aceptar certificados SSL en todos los dispositivos
- [ ] Verificar sincronización con 2+ dispositivos
- [ ] Volumen configurado en dispositivos
- [ ] Batería cargada en dispositivos móviles

---

## 🌐 Información Técnica

### Puertos Utilizados

- **8080**: Dashboard HTTPS (control)
- **8081**: WebSocket WSS (sincronización)
- **8445**: Cliente HTTPS (reproducción)
- **8085**: Cliente HTTP (fallback opcional)

### Certificados SSL

Ubicación: `apps/server/ssl/`
- `cert.pem`: Certificado SSL
- `key.pem`: Llave privada

**Generados con**: mkcert (certificados autofirmados)

### Requisitos de Red

- **Ancho de banda**: 100 Mbps recomendado para 10+ dispositivos
- **Latencia**: < 200ms entre dispositivos
- **Router**: Cualquier router WiFi estándar
- **Internet**: **NO requerido** (sistema 100% offline)

---

## ✅ Confirmación de Funcionamiento Offline

Para confirmar que el sistema funciona sin internet:

1. **Desconectar internet del router** (dejar solo WiFi local)
2. Iniciar servidor: `pnpm dev`
3. Conectar dispositivos al WiFi local
4. Abrir URLs HTTPS
5. Todo debe funcionar normalmente

El sistema **NUNCA** hace peticiones externas. Todo es local:
- ✅ HTML, CSS, JS servidos localmente
- ✅ Videos desde disco local
- ✅ WebSocket en red local
- ✅ Sin CDNs, sin APIs externas, sin Google Fonts

---

## 🎉 Sistema 100% Offline Confirmado

Este sistema está diseñado específicamente para eventos sin conexión a internet, como:
- Ferias comerciales
- Presentaciones corporativas
- Instalaciones artísticas
- Demos en ubicaciones remotas

**Todo funciona en red local (LAN) sin necesidad de internet.**
