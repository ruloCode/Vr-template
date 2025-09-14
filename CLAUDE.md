# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VR Ecopetrol is a synchronized 360° VR experience system built for immersive educational demonstrations. The system allows up to 35 devices to view and navigate synchronized 360° environments controlled from a central dashboard, designed for offline LAN deployment at events.

## Architecture

This is a **pnpm monorepo** with two main applications:

- **Server** (`apps/server/`): Node.js + Express + WebSocket server that handles synchronization, serves static assets, and provides a dashboard
- **Client** (`apps/client/`): A-Frame + Vite PWA that delivers the VR experience on devices

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

# Start both server and client in development mode
pnpm dev

# Individual services
pnpm -F server dev    # Server on port 8080
pnpm -F client dev    # Client on port 3000

# Production build
pnpm build

# Production server
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

### Client Architecture (`apps/client/src/`)
- **VR App** (`components/VRApp.ts`): Main application coordinator
- **Scene Manager** (`components/SceneManager.ts`): 360° image and transition management
- **Audio Manager** (`components/AudioManager.ts`): Synchronized audio with drift correction
- **Sync Manager** (`components/SyncManager.ts`): WebSocket communication and timing sync
- **App Store** (`store/appStore.ts`): Zustand-based global state management
- **Utilities** (`utils/`): WebSocket client, asset preloader, PWA management

### Asset Structure
```
apps/client/public/
├── panos/           # 360° images (8K JPEG recommended)
│   ├── escena1_8k.jpg
│   ├── escena2_8k.jpg
│   └── escena3_8k.jpg
├── audio/           # Narration audio (MP3, ~128kbps)
│   ├── escena1.mp3
│   ├── escena2.mp3
│   └── escena3.mp3
└── manifest.webmanifest
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

## Testing and Debugging

### Local Testing
- Server: `http://localhost:8080/`
- Client Dev: `http://localhost:3000/`  
- Dashboard: `http://localhost:8080/dashboard`
- WebSocket: `ws://localhost:8081/ws`

### Multi-Device Testing
1. Get server IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
2. Connect devices to same WiFi
3. Navigate to `http://[SERVER_IP]:8080`

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