# Modo Offline - Cliente VR Ecopetrol

## Descripción

El cliente VR ahora funciona **completamente offline** sin necesidad de conectarse al servidor WebSocket. El sistema detecta automáticamente si el servidor está disponible y se adapta en consecuencia.

## Modos de Operación

### 1. Modo Online (Con Servidor)
- El cliente intenta conectarse al servidor WebSocket
- Sincronización en tiempo real con el dashboard
- Control centralizado de escenas desde el servidor
- Múltiples dispositivos sincronizados

### 2. Modo Offline (Sin Servidor)
- El cliente funciona de forma completamente autónoma
- Sin sincronización de red
- Navegación manual de escenas
- Todos los assets se cargan desde caché local

## Detección Automática

El cliente detecta automáticamente el modo offline en los siguientes casos:

1. **Variable explícita**: `window.OFFLINE_MODE = true` antes de cargar
2. **Navigator.onLine**: El navegador reporta sin conexión
3. **Server timeout**: El servidor no responde en 3 segundos
4. **Fetch failure**: Error al obtener configuración del servidor

## Cómo Habilitar Modo Offline Manualmente

### Opción 1: Variable Global
Agregar antes del script principal en `index.html`:
```html
<script>
  window.OFFLINE_MODE = true;
</script>
```

### Opción 2: Console
En la consola del navegador antes de cargar:
```javascript
window.OFFLINE_MODE = true;
location.reload();
```

## Verificar Estado

### En Console:
```javascript
// Ver estado completo
window.appInitializer.getStatus();

// Verificar solo modo offline
window.OFFLINE_MODE

// Ver info de VR_DEBUG
window.VR_DEBUG.info()
```

### Respuesta esperada:
```javascript
{
  initialized: true,
  serviceWorkerReady: true,
  assetsPreloaded: true,
  offlineMode: false,  // o true si está offline
  totalTime: 2500,
  manifest: true,
  navigatorOnline: true  // estado del navegador
}
```

## Navegación de Escenas en Modo Offline

### Desde Console:
```javascript
// Cargar escena específica
window.loadScene('escena-1');
window.loadScene('escena-2');
window.loadScene('guajira-1');

// Toggle entre escenas
window.toggleScene();
```

### Escenas Disponibles:
- `base` - Escena base por defecto
- `escena-1` a `escena-11` - Escenas principales
- `guajira-1` a `guajira-10` - Escenas de Guajira

## Cambios Implementados

### 1. `index.html`
✅ Removido DNS prefetch de IP hardcodeada
- Antes: `<link rel="dns-prefetch" href="//192.168.40.31" />`
- Ahora: Eliminado completamente

### 2. `websocket-client.js`
✅ Auto-conexión deshabilitada
- Antes: Auto-conectaba en localhost y 192.168.40.31
- Ahora: Solo clase disponible, conexión opt-in

### 3. `websocket-handler.js`
✅ WebSocket completamente opcional
- Detecta `window.OFFLINE_MODE`
- Timeout de 3 segundos para conexión servidor
- Continúa sin error si servidor no disponible
- Mensajes informativos de modo offline

### 4. `app-initializer.js`
✅ Detección automática de offline
- Detecta `navigator.onLine`
- Escucha eventos `online`/`offline`
- Actualiza estado dinámicamente

## Logs Esperados

### Modo Online (Con Servidor):
```
🌐 Starting in online mode (will auto-switch if server unavailable)
🔍 Obteniendo configuración de red del servidor...
🌐 Configuración de red obtenida:
✅ WebSocket connection initialized successfully
```

### Modo Offline (Sin Servidor):
```
🔌 Modo offline detectado - WebSocket deshabilitado
✅ Cliente funcionando en modo standalone sin sincronización
```

### Auto-Switch a Offline:
```
🌐 Starting in online mode (will auto-switch if server unavailable)
🔍 Obteniendo configuración de red del servidor...
⚠️ Servidor no disponible - continuando en modo offline
📱 El cliente funcionará sin sincronización de red
✅ Todas las funcionalidades locales disponibles
```

## Service Worker

El Service Worker funciona en ambos modos:
- **Online**: Cachea assets para futuro uso offline
- **Offline**: Sirve assets desde cache
- **Cache-First**: Assets multimedia siempre desde cache si disponible

## Limitaciones en Modo Offline

❌ No sincronización multi-dispositivo
❌ No control remoto desde dashboard
❌ No comandos de servidor (LOAD, START_AT, etc.)
✅ Navegación local de escenas funcional
✅ Audio y video locales funcionan
✅ Todos los assets accesibles

## Troubleshooting

### Problema: Cliente no carga
**Solución**: Verificar que los assets estén en cache
```javascript
window.cacheStatus
```

### Problema: Audio no reproduce
**Solución**: Requiere interacción del usuario
```javascript
// Click en la pantalla primero, luego:
window.sceneManager.updateAudio(window.currentSceneId)
```

### Problema: Service Worker no funciona
**Solución**: HTTPS requerido (excepto localhost)
```javascript
window.location.protocol // debe ser 'https:'
```

## Testing Offline

1. Cargar página con servidor activo
2. Esperar a que assets se cacheen
3. Detener servidor
4. Recargar página
5. ✅ Debe funcionar completamente offline

## Production Deployment

Para eventos offline:
1. Pre-cargar todos los assets en dispositivos
2. Verificar cache completo
3. Desconectar de red si es necesario
4. Dispositivos funcionan autónomos

Para eventos online:
1. Servidor activo en LAN
2. Dispositivos se conectan automáticamente
3. Sincronización centralizada

---

**Nota**: El sistema está diseñado para ser resiliente y funcionar en ambos escenarios sin configuración manual adicional.
