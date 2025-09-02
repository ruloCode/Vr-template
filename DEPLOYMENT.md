# 🚀 Guía de Despliegue - VR Ecopetrol

Instrucciones paso a paso para desplegar el sistema VR en eventos itinerantes.

## 📋 Lista de Verificación Pre-Evento

### Hardware Requerido

- [ ] **Mini PC/Servidor** (Intel i5/AMD Ryzen 5+, 8GB RAM, SSD)
- [ ] **Router WiFi** (802.11ac, preferible WiFi 6)
- [ ] **Switch Ethernet** (si necesario)
- [ ] **Cables de red** (al menos 2m)
- [ ] **UPS/Batería** para respaldo eléctrico
- [ ] **35 dispositivos cliente** (tablets/móviles con 4GB+ RAM)

### Software Pre-instalado

- [ ] **Node.js 18+** en el servidor
- [ ] **pnpm** instalado globalmente
- [ ] **Proyecto VR Ecopetrol** clonado y configurado
- [ ] **Assets multimedia** (imágenes 360° y audio) en lugar
- [ ] **Navegadores actualizados** en todos los dispositivos

## 🔧 Configuración del Servidor

### 1. Preparación del Mini PC

```bash
# Verificar sistema
node --version    # Debe ser 18+
pnpm --version   # Debe estar instalado

# Clonar proyecto (si no está)
git clone <repository>
cd vr-ecopetrol

# Instalar dependencias
pnpm install

# Verificar build
pnpm build
```

### 2. Configuración de Red

```bash
# Configurar IP estática (opcional pero recomendado)
# Ubuntu/Debian ejemplo:
sudo nano /etc/netplan/01-netcfg.yaml

# Contenido ejemplo:
network:
  version: 2
  renderer: networkd
  ethernets:
    enp0s3:
      dhcp4: no
      addresses:
        - 192.168.1.100/24
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 1.1.1.1]

# Aplicar configuración
sudo netplan apply
```

### 3. Configuración del Firewall

```bash
# Ubuntu/Linux - Abrir puertos necesarios
sudo ufw allow 8080/tcp    # HTTP
sudo ufw allow 8081/tcp    # WebSocket
sudo ufw enable

# Windows - Configurar desde Panel de Control > Firewall
# Abrir puertos TCP 8080 y 8081
```

## 🌐 Configuración de Red WiFi

### Router/Access Point

1. **SSID**: `VR-Ecopetrol-Event` (o nombre específico del evento)
2. **Seguridad**: WPA2/WPA3 con contraseña simple
3. **Canal**: Fijo (evitar auto para estabilidad)
4. **Ancho de banda**: 5GHz preferible para mejor performance
5. **Límite de dispositivos**: Configurar para 40+ dispositivos

### Configuración IP

- **Servidor**: IP fija (ej: 192.168.1.100)
- **Clientes**: DHCP automático
- **Rango DHCP**: 192.168.1.101-192.168.1.150

## 🚀 Despliegue Paso a Paso

### Día del Evento - Setup

#### 1. Configuración Física (30 min)

```bash
# 1. Conectar mini PC a router por Ethernet
# 2. Verificar conectividad
ping 8.8.8.8

# 3. Obtener IP asignada
ifconfig | grep "inet " | grep -v 127.0.0.1
# O en Windows: ipconfig
```

#### 2. Iniciar Servidor (5 min)

```bash
cd vr-ecopetrol

# Modo rápido con script
./start.sh production

# O manualmente
pnpm build
pnpm start

# Verificar que esté funcionando
curl http://localhost:8080/health
```

#### 3. Verificar Dashboard (5 min)

Abrir navegador en: `http://[IP_SERVIDOR]:8080/dashboard`

Verificar:
- [ ] Dashboard carga correctamente
- [ ] Estadísticas muestran 0 dispositivos conectados
- [ ] Controles responden

#### 4. Test de Conectividad (10 min)

```bash
# En dispositivo de prueba, conectar a WiFi
# Abrir: http://[IP_SERVIDOR]:8080

# Verificar:
# - Página carga sin errores
# - Preloader funciona
# - Audio se puede activar
# - Estado "Listo" aparece
# - Dashboard muestra 1 dispositivo conectado
```

### Durante el Evento

#### Flujo Operativo Estándar

1. **Inicio de Sesión** (5 min):
   ```
   - Verificar todos los dispositivos conectados en dashboard
   - Cargar escena: "escena-1"
   - Esperar que todos reporten "Ready"
   - Iniciar con "START en 5s"
   ```

2. **Transición entre Escenas** (30 seg):
   ```
   - LOAD nueva escena
   - Esperar Ready (automático)
   - START inmediato o programado
   ```

3. **Control de Problemas**:
   ```
   - PAUSE para detener todo
   - SEEK ±5s para corregir desvíos
   - RESUME para continuar
   ```

#### Monitoreo Continuo

Observar en dashboard:
- **Dispositivos conectados**: Debe mantenerse constante
- **Latencia promedio**: <200ms ideal, <500ms aceptable  
- **Estados de dispositivos**: Mayoría en "playing" durante reproducción
- **Escena actual**: Consistent across devices

### Solución de Problemas en Vivo

#### Dispositivo Desconectado
```bash
# 1. Verificar WiFi del dispositivo
# 2. Recargar página en dispositivo
# 3. Si persiste, reiniciar navegador
# 4. Último recurso: reconectar a WiFi
```

#### Audio Desincronizado
```bash
# Desde dashboard:
# 1. PAUSE
# 2. SEEK -2000 (retroceder 2s)
# 3. RESUME
# 4. Si persiste, recargar escena completa
```

#### Latencia Alta
```bash
# 1. Verificar interferencia WiFi
# 2. Reducir dispositivos activos si es temporal
# 3. Cambiar canal WiFi si es generalizado
# 4. Reiniciar router si es crítico
```

#### Servidor No Responde
```bash
# SSH al servidor o acceso físico
sudo systemctl restart networking  # Si es problema de red
cd vr-ecopetrol && pnpm start     # Si es problema de app

# Verificar logs
journalctl -f  # Linux
# O ver consola directa del proceso
```

## 📊 Métricas de Éxito

### Objetivos de Performance

- **Conexión inicial**: <30 segundos por dispositivo
- **Sincronización**: ±150ms entre dispositivos
- **Uptime**: >99% durante el evento
- **Latencia promedio**: <200ms
- **Experiencias completadas**: >95% sin interrupciones

### Registro de Métricas

Crear log manual durante el evento:

```
Hora | Dispositivos | Latencia Avg | Incidentes | Acciones
-----|-------------|--------------|------------|----------
10:00| 35         | 145ms        | 0          | Inicio exitoso
10:30| 34         | 167ms        | 1 descon.  | Reconectado dispositivo 12
11:00| 35         | 134ms        | 0          | Cambio a escena-2
```

## 🧹 Post-Evento

### Recolección de Datos

```bash
# Exportar logs del servidor
journalctl --since="2024-01-15 09:00" --until="2024-01-15 17:00" > evento-logs.txt

# Estadísticas de red (si disponible)
iftop -t -s 60 > network-stats.txt

# Screenshots del dashboard para reporte
```

### Limpieza

```bash
# Limpiar caché de dispositivos si se reutilizan
# En cada dispositivo, limpiar datos del navegador

# Backup de configuración que funcionó
cp apps/server/.env apps/server/.env.evento-exitoso
```

## 📞 Contactos de Emergencia

**Soporte Técnico en Evento**:
- Coordinador IT: [Nombre] - [Teléfono]
- Soporte Remoto: [Nombre] - [Teléfono] 
- Proveedor Red: [Empresa] - [Teléfono]

**Escalación**:
- Gerente Proyecto: [Nombre] - [Email/Teléfono]
- Backup Técnico: [Nombre] - [Email/Teléfono]

---

## ⚡ Comandos de Emergencia Rápida

```bash
# Reinicio rápido del servidor
cd vr-ecopetrol && pnpm start

# Verificar conectividad básica
ping 8.8.8.8
curl http://localhost:8080/health

# Ver dispositivos conectados (desde dashboard API)
curl http://localhost:8080/api/stats

# Verificar uso de puertos
netstat -tulpn | grep :8080
netstat -tulpn | grep :8081

# Limpiar caché de navegador (comando para usuarios)
Ctrl+Shift+R (o Cmd+Shift+R en Mac)
```

¡El sistema está listo para el evento! 🚀


