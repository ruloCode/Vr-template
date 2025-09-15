# Cliente VR Vanilla con HTTPS

Este es un cliente VR simple usando A-Frame vanilla con soporte para HTTPS.

## Características

- Experiencia VR 360° con ciclo día/noche
- Servidor HTTPS con certificados SSL locales
- Redirección automática de HTTP a HTTPS
- Assets locales (audio, imágenes, modelos 3D)

## Inicio Rápido

1. **Instalar certificados SSL** (solo la primera vez):
   ```bash
   mkcert -install
   ```

2. **Ejecutar el servidor HTTPS**:
   ```bash
   npm start
   ```

3. **Abrir en el navegador**:
   - HTTPS: https://192.168.40.31:8444
   - HTTP (redirige): http://192.168.40.31:8081
   - Red local: https://192.168.40.31:8444

## Estructura

```
clientevanilla/
├── index.html              # Página principal VR
├── server.js               # Servidor HTTPS
├── package.json            # Configuración npm
├── cert.pem                # Certificado SSL
├── key.pem                 # Clave privada SSL
├── audio/                  # Archivos de audio
├── images/                 # Imágenes y texturas
└── models/                 # Modelos 3D
```

## Funcionalidades VR

- **Skybox 360°**: Cambia entre día y noche
- **Audio ambiental**: Sonidos diferentes para cada período
- **Iluminación dinámica**: Se ajusta según la hora
- **Modelos 3D**: Árboles y vegetación
- **Controles VR**: Soporte para headsets y controles

## Desarrollo

Para desarrollo con auto-reload, puedes usar:
```bash
npm run dev
```

## Requisitos

- Node.js
- mkcert (para certificados SSL)
- Navegador compatible con WebXR