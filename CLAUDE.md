# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VR Ecopetrol is a synchronized 360° VR experience system built for immersive educational demonstrations. The system allows up to 35 devices to view and navigate synchronized 360° environments controlled from a central dashboard, designed for offline LAN deployment at events.

## Architecture

This is a **pnpm monorepo** with two main applications:

- **Server** (`apps/server/`): Node.js + Express + WebSocket server that handles synchronization, serves static assets, and provides a dashboard
- **ClienteVanilla** (`apps/clientevanilla/`): Vanilla A-Frame HTTPS client that delivers the VR experience on devices

### Key Technologies
- **Synchronization**: WebSocket with Zod schema validation and NTP-style clock sync
- **VR**: A-Frame framework with WebXR support
- **Audio**: Web Audio API with drift correction and crossfade transitions
- **State Management**: Zustand for client-side state
- **PWA**: Service worker with offline asset caching via vite-plugin-pwa

## Development Commands

### Primary Development Workflow
```bash
# Install dependencies (use pnpm only)
pnpm install

# Start server and clientevanilla-https in development mode
pnpm dev

# Individual services
pnpm dev:server              # Server only on port 8080
pnpm dev:clientevanilla      # Vanilla HTTPS client

# Production build
pnpm build

# Start production server
pnpm start

# Production server with explicit NODE_ENV
pnpm start:production
```

### Docker Development (Recommended)
```bash
# Start development environment with Docker
pnpm docker:dev

# View logs
pnpm docker:logs

# Stop containers
pnpm docker:stop

# Clean up Docker resources
pnpm docker:clean
```

### Code Quality
```bash
# Lint all packages
pnpm lint

# Type checking
pnpm type-check

# Clean all build artifacts
pnpm clean
```

## Architecture Details

### Server Architecture (`apps/server/src/`)
- **WebSocket Manager** (`websocket/manager.ts`): Handles client connections and message routing
- **Protocol Types** (`types/protocol.ts`): Zod schemas for WebSocket message validation
- **Dashboard** (`dashboard/routes.ts`): Web interface for controlling the experience
- **API Routes** (`routes/api.ts`): Health checks and status endpoints
- **Configuration** (`utils/config.ts`): Environment and network settings

### ClienteVanilla Architecture (`apps/clientevanilla/`)
- **HTTPS Server** (`server.js`): Self-signed SSL server running on port 8444
- **HTML5 + A-Frame**: Direct integration with A-Frame components
- **scenes-config.js**: Central configuration for scenes, assets, and synchronization
- **Static assets**: Direct serving of panos, audio, and videos for 360° experiences
- **WebSocket integration**: Direct connection to server for real-time synchronization
- **SSL Certificates**: Requires `key.pem` and `cert.pem` for HTTPS functionality

### Asset Structure
```
apps/clientevanilla/
├── panos/           # 360° images (8K JPEG recommended)
│   ├── escena1_8k.jpg
│   ├── escena2_8k.jpg
│   └── escena3_8k.jpg
├── audio/           # Narration audio (MP3, ~128kbps)
│   ├── toma_01_02.mp3
│   ├── toma_03.mp3
│   ├── toma_04.mp3
│   └── [additional audio files...]
├── videos/          # 360° videos for enhanced scenes
│   └── escena 4/
│       └── escena_4.3.mp4
└── scenes-config.js # Central scene configuration
```

## Key Development Patterns

### WebSocket Message Flow
1. Client connects → Server assigns device ID
2. Dashboard sends scene commands → Server broadcasts to all clients
3. Clients report status updates → Server aggregates for dashboard
4. All messages use Zod validation via `protocol.ts`

### Synchronization Protocol
- **Clock Sync**: NTP-style time synchronization with server
- **Command Timing**: Commands include target execution timestamps
- **Drift Correction**: Audio playback adjusts for network latency
- **Tolerance**: 120ms sync tolerance before correction

### A-Frame Component System
- Custom components in `components/` for VR functionality
- Scene transitions via `a-animation` and crossfade effects
- WebXR support for VR headsets when available

### Scene Configuration (`apps/clientevanilla/scenes-config.js`)
- Central configuration file defining all scenes, assets, and metadata
- Handles panoramic images, audio files, and video content
- Configures scene transitions, durations, and synchronization parameters
- Supports multiple scene types: image panoramas, video panoramas, and mixed content

## Testing and Debugging

### Local Testing
- Server: `http://localhost:8080/`
- ClienteVanilla HTTPS: `https://192.168.0.59:8444/` (requires SSL certificates)
- ClienteVanilla HTTP redirect: `http://localhost:8082/` (redirects to HTTPS)
- Dashboard: `http://localhost:8080/dashboard`
- WebSocket: `ws://localhost:8081/ws`

### Multi-Device Testing
1. Get server IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
2. Connect devices to same WiFi
3. **Server/Dashboard**: Navigate to `http://[SERVER_IP]:8080`
4. **ClienteVanilla HTTPS**: Navigate to `https://[SERVER_IP]:8444`
   - Note: You may need to accept self-signed certificate warnings on each device

### Debug Tools
- Global `window.VR_DEBUG` object available in development
- Browser dev tools for WebGL/WebXR debugging
- Network tab for WebSocket message inspection

## Environment Configuration

### Server Environment (`.env` in `apps/server/`)
```
NODE_ENV=development
HOST=0.0.0.0
PORT=8080
WS_PORT=8081
```

### Build Configuration
- **TypeScript**: Strict mode enabled for both apps
- **ESLint**: Shared configuration with TypeScript rules
- **Vite**: Client bundling with PWA plugin
- **TSC**: Server compilation target ES2022

## Production Deployment

### LAN Event Setup
1. Configure server networking in `apps/server/.env`
2. Build production assets: `pnpm build`
3. Start server: `pnpm start:production`
4. Verify dashboard access from devices
5. Load assets and test synchronization

### Asset Requirements
- **360° Images**: Minimum 2048x1024, optimal 4096x2048 JPEG
- **Audio**: MP3 format, ~45-50 seconds duration, 128kbps
- **Network**: 100Mbps WiFi, <50ms latency between devices

## Common Issues

### Audio Not Playing
- Ensure user interaction before audio (browser requirement)
- Check MP3 files exist in `/public/audio/`
- Verify Web Audio API support

### Sync Drift
- Check network latency in dashboard (<200ms recommended)
- Verify stable WiFi connection
- Consider restarting experience if drift exceeds tolerance

### VR Scene Loading
- Verify JPEG format and resolution for 360° images
- Check `asset-manifest.json` configuration
- Ensure sufficient device RAM (4GB+ recommended)

## Performance Considerations

- All assets are preloaded before experience starts
- Service worker caches assets for offline operation
- WebGL textures optimized during A-Frame initialization
- Garbage collection minimized during active experience
- WebSocket batching reduces network overhead

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.