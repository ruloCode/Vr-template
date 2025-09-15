# Sistema de Cambio de Escenas - ClienteVanilla VR

## Resumen de Cambios Implementados

### 1. **Configuración Simplificada de Escenas**
Se modificó `scenes-config.js` para usar solo dos escenas con tus assets:

- **Escena 1**: `escena_1.png` - Energías Renovables (solar y eólica)
- **Escena 2**: `escena_2.png` - Operaciones Petroleras

### 2. **Sistema de Cambio Automático**
El sistema ahora alterna automáticamente entre las dos escenas cada **30 minutos virtuales** (30 segundos reales):

```javascript
// Alternar cada 30 segundos virtuales
const shouldUseEscena1 = Math.floor(minuto / 30) % 2 === 0;
const targetScene = shouldUseEscena1 ? 'escena1' : 'escena2';
```

### 3. **Controles Manuales Disponibles**
Desde la consola del navegador puedes usar:

```javascript
// Cambiar manualmente entre escenas
loadScene("escena1")     // Cargar escena de energías renovables
loadScene("escena2")     // Cargar escena de operaciones petroleras
toggleScene()            // Alternar entre escenas manualmente

// Controles de tiempo
setTime(8, 0)            // Establecer hora virtual
```

### 4. **Assets Ubicados**
Las imágenes se copiaron a:
- `/apps/clientevanilla/images/escena_1.png`
- `/apps/clientevanilla/images/escena_2.png`

## Cómo Probar

1. **Ejecutar el servidor**: 
   ```bash
   cd apps/clientevanilla
   node server.js
   ```

2. **Abrir en navegador**: `http://localhost:3000`

3. **Ver cambio automático**: Las escenas cambiarán cada 30 segundos

4. **Control manual**: Abre la consola (F12) y usa `toggleScene()`

## Funcionalidades

- ✅ **Cambio automático** cada 30 segundos virtuales
- ✅ **Control manual** desde consola
- ✅ **Sincronización WebSocket** con servidor
- ✅ **Transiciones suaves** entre escenas
- ✅ **Audio ambiental** diferente por escena
- ✅ **Iluminación apropiada** para cada escena

## Próximos Pasos

- El sistema está listo para usar con tus dos escenas
- Se puede integrar fácilmente con el dashboard del servidor
- Las escenas se cargan dinámicamente sin recargar la página
