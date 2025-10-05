/**
 * Cliente de Video Sincronizado - Ecopetrol
 * Cliente WebSocket para reproducción de video sincronizada
 */

class VideoSyncClient {
    constructor() {
        // WebSocket connection
        this.ws = null;
        this.wsUrl = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 3000;

        // Video state
        this.videoPlayer = document.getElementById('video-player');
        this.currentVideoUrl = null;
        this.isPlaying = false;

        // Client state
        this.deviceId = this.generateDeviceId();
        this.clientId = null;
        this.serverTimeOffset = 0;
        this.latency = 0;

        // UI elements
        this.statusDot = document.querySelector('.status-dot');
        this.statusText = document.getElementById('status-text');
        this.deviceIdElement = document.getElementById('device-id');
        this.loadingOverlay = document.getElementById('loading');
        this.playOverlay = document.getElementById('play-overlay');
        this.playButton = document.getElementById('play-button');
        this.readyOverlay = document.getElementById('ready-overlay');

        // Debug
        this.debugMode = window.location.search.includes('debug');
        if (this.debugMode) {
            document.getElementById('debug-info').classList.remove('hidden');
        }

        // Initialize
        this.init();
    }

    init() {
        console.log('🎬 Inicializando Cliente de Video Sincronizado');
        console.log('📱 Device ID:', this.deviceId);

        // Set device ID in UI
        this.deviceIdElement.textContent = `Dispositivo: ${this.deviceId}`;

        // Setup WebSocket URL
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        // Use port 8081 for WSS (HTTPS) or port 8082 for WS (HTTP)
        const port = window.location.protocol === 'https:' ? 8081 : 8082;
        this.wsUrl = `${protocol}//${host}:${port}/ws`;

        console.log('🔌 WebSocket URL:', this.wsUrl);
        console.log(`   Protocol: ${window.location.protocol} → WebSocket ${protocol.replace(':', '')}`);

        // Setup video player events
        this.setupVideoEvents();

        // Setup play button for mobile
        this.playButton.addEventListener('click', () => {
            this.handleUserInteraction();
        });

        // Connect to WebSocket
        this.connect();

        // Start ping interval
        setInterval(() => this.sendPing(), 5000);
    }

    setupVideoEvents() {
        this.videoPlayer.addEventListener('loadstart', () => {
            this.showLoading('Cargando video...');
            this.updateDebug();
        });

        this.videoPlayer.addEventListener('canplay', () => {
            this.hideLoading();
            this.updateDebug();
        });

        this.videoPlayer.addEventListener('playing', () => {
            this.isPlaying = true;
            this.updateDebug();
        });

        this.videoPlayer.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updateDebug();
        });

        this.videoPlayer.addEventListener('ended', () => {
            console.log('✅ Video terminado');
            this.isPlaying = false;
            this.sendState();
            this.updateDebug();
        });

        this.videoPlayer.addEventListener('error', (e) => {
            console.error('❌ Error en video:', e);
            this.showLoading('Error cargando video');
        });

        this.videoPlayer.addEventListener('timeupdate', () => {
            this.updateDebug();
        });
    }

    generateDeviceId() {
        const stored = localStorage.getItem('deviceId');
        if (stored) return stored;

        const id = `VIDEO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        localStorage.setItem('deviceId', id);
        return id;
    }

    connect() {
        try {
            console.log('🔄 Conectando a WebSocket...');
            this.updateStatus('disconnected', 'Conectando...');

            this.ws = new WebSocket(this.wsUrl);

            this.ws.onopen = () => this.handleOpen();
            this.ws.onmessage = (event) => this.handleMessage(event);
            this.ws.onclose = () => this.handleClose();
            this.ws.onerror = (error) => this.handleError(error);

        } catch (error) {
            console.error('❌ Error conectando WebSocket:', error);
            this.scheduleReconnect();
        }
    }

    handleOpen() {
        console.log('✅ WebSocket conectado');
        this.reconnectAttempts = 0;
        this.updateStatus('connected', 'Conectado');

        // Send HELLO message
        this.sendHello();
    }

    handleMessage(event) {
        try {
            const message = JSON.parse(event.data);
            console.log('📨 Mensaje recibido:', message.type);

            switch (message.type) {
                case 'WELCOME':
                    this.handleWelcome(message.payload);
                    break;
                case 'PONG':
                    this.handlePong(message.payload);
                    break;
                case 'COMMAND':
                    this.handleCommand(message.payload);
                    break;
                case 'ERROR':
                    console.error('❌ Error del servidor:', message.payload.message);
                    break;
                default:
                    console.warn('⚠️ Mensaje no reconocido:', message.type);
            }
        } catch (error) {
            console.error('❌ Error procesando mensaje:', error);
        }
    }

    handleClose() {
        console.log('🔌 WebSocket desconectado');
        this.updateStatus('disconnected', 'Desconectado');
        this.scheduleReconnect();
    }

    handleError(error) {
        console.error('❌ Error WebSocket:', error);
    }

    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Máximo de intentos de reconexión alcanzado');
            this.updateStatus('disconnected', 'Error de conexión');
            return;
        }

        this.reconnectAttempts++;
        console.log(`🔄 Reintentando conexión en ${this.reconnectDelay}ms (intento ${this.reconnectAttempts})`);
        this.updateStatus('disconnected', `Reconectando... (${this.reconnectAttempts})`);

        setTimeout(() => this.connect(), this.reconnectDelay);
    }

    // WebSocket Message Handlers
    handleWelcome(payload) {
        console.log('👋 WELCOME recibido');
        this.clientId = payload.clientId;
        this.serverTimeOffset = Date.now() - payload.serverEpochMs;

        console.log('   Client ID:', this.clientId);
        console.log('   Server Time Offset:', this.serverTimeOffset, 'ms');

        this.updateStatus('ready', 'Conectado');

        // Show ready overlay
        this.showReady();
    }

    handlePong(payload) {
        const now = Date.now();
        this.latency = now - payload.tClient;
        this.serverTimeOffset = payload.tServer - (payload.tClient + this.latency / 2);

        this.updateDebug();
    }

    handleCommand(payload) {
        console.log('🎬 Comando recibido:', payload.commandType);

        switch (payload.commandType) {
            case 'LOAD_VIDEO':
                this.loadVideo(payload.videoUrl);
                break;
            case 'PLAY_VIDEO':
                this.playVideo(payload.epochMs);
                break;
            case 'PAUSE_VIDEO':
                this.pauseVideo();
                break;
            case 'STOP_VIDEO':
                this.stopVideo();
                break;
            case 'SEEK_VIDEO':
                this.seekVideo(payload.currentTime);
                break;
            default:
                console.warn('⚠️ Comando no reconocido:', payload.commandType);
        }
    }

    // Video Control Methods
    async loadVideo(videoUrl) {
        console.log('📹 Cargando video:', videoUrl);
        this.hideReady(); // Hide ready overlay
        this.showLoading('Cargando video...');

        try {
            this.currentVideoUrl = videoUrl;
            this.videoPlayer.src = videoUrl;

            // Wait for video to be ready
            await new Promise((resolve, reject) => {
                this.videoPlayer.addEventListener('canplay', resolve, { once: true });
                this.videoPlayer.addEventListener('error', reject, { once: true });
            });

            console.log('✅ Video cargado');
            this.hideLoading();
            this.sendReady();

        } catch (error) {
            console.error('❌ Error cargando video:', error);
            this.showLoading('Error cargando video');
        }
    }

    async playVideo(epochMs) {
        console.log('▶️ Reproduciendo video en:', epochMs);

        try {
            // Request fullscreen
            await this.requestFullscreen();

            if (epochMs) {
                // Scheduled playback
                const delay = epochMs - (Date.now() + this.serverTimeOffset);
                console.log(`⏱️ Esperando ${delay}ms para sincronización`);

                if (delay > 0) {
                    setTimeout(async () => {
                        await this.videoPlayer.play();
                        this.sendState();
                    }, delay);
                } else {
                    // Already past the time, play immediately
                    await this.videoPlayer.play();
                    this.sendState();
                }
            } else {
                // Immediate playback
                await this.videoPlayer.play();
                this.sendState();
            }

        } catch (error) {
            console.error('❌ Error reproduciendo video:', error);

            // Show play button for user interaction (mobile autoplay restriction)
            if (error.name === 'NotAllowedError') {
                this.playOverlay.classList.remove('hidden');
            }
        }
    }

    pauseVideo() {
        console.log('⏸️ Pausando video');
        this.videoPlayer.pause();
        this.sendState();
    }

    stopVideo() {
        console.log('⏹️ Deteniendo video');
        this.videoPlayer.pause();
        this.videoPlayer.currentTime = 0;
        this.videoPlayer.src = ''; // Clear video source
        this.currentVideoUrl = null;
        this.exitFullscreen();
        this.showReady(); // Show ready overlay again
        this.sendState();
    }

    seekVideo(currentTime) {
        console.log('⏩ Seeking a:', currentTime);
        this.videoPlayer.currentTime = currentTime;
        this.sendState();
    }

    async handleUserInteraction() {
        // Handle mobile autoplay restriction
        this.playOverlay.classList.add('hidden');

        try {
            await this.videoPlayer.play();
            await this.requestFullscreen();
            this.sendState();
        } catch (error) {
            console.error('❌ Error en interacción de usuario:', error);
        }
    }

    // Fullscreen Methods
    async requestFullscreen() {
        const container = document.getElementById('video-container');

        try {
            if (container.requestFullscreen) {
                await container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                await container.webkitRequestFullscreen();
            } else if (container.mozRequestFullScreen) {
                await container.mozRequestFullScreen();
            } else if (container.msRequestFullscreen) {
                await container.msRequestFullscreen();
            }
            console.log('🖥️ Fullscreen activado');
        } catch (error) {
            console.log('⚠️ Fullscreen no disponible:', error.message);
        }
    }

    exitFullscreen() {
        try {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            console.log('🖥️ Fullscreen desactivado');
        } catch (error) {
            console.log('⚠️ Error saliendo de fullscreen:', error.message);
        }
    }

    // WebSocket Send Methods
    sendHello() {
        const message = {
            type: 'HELLO',
            payload: {
                deviceId: this.deviceId,
                version: '1.0.0',
                userAgent: navigator.userAgent,
                battery: this.getBatteryLevel()
            }
        };
        this.send(message);
    }

    sendPing() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const message = {
            type: 'PING',
            payload: {
                tClient: Date.now()
            }
        };
        this.send(message);
    }

    sendReady() {
        const message = {
            type: 'READY',
            payload: {
                sceneId: this.currentVideoUrl || 'video'
            }
        };
        this.send(message);
    }

    sendState() {
        const message = {
            type: 'STATE',
            payload: {
                sceneId: this.currentVideoUrl || 'video',
                currentTime: this.videoPlayer.currentTime,
                playing: !this.videoPlayer.paused,
                buffered: this.getBufferedPercentage()
            }
        };
        this.send(message);
    }

    send(message) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('⚠️ WebSocket no conectado, no se puede enviar mensaje');
            return;
        }

        this.ws.send(JSON.stringify(message));
    }

    // UI Methods
    updateStatus(status, text) {
        this.statusDot.className = `status-dot ${status}`;
        this.statusText.textContent = text;
    }

    showLoading(text) {
        this.loadingOverlay.classList.remove('hidden');
        document.getElementById('loading-text').textContent = text;
    }

    hideLoading() {
        this.loadingOverlay.classList.add('hidden');
    }

    showReady() {
        this.readyOverlay.classList.remove('hidden');
    }

    hideReady() {
        this.readyOverlay.classList.add('hidden');
    }

    updateDebug() {
        if (!this.debugMode) return;

        document.getElementById('debug-video').textContent = this.currentVideoUrl || '-';
        document.getElementById('debug-state').textContent = this.videoPlayer.paused ? 'Pausado' : 'Reproduciendo';
        document.getElementById('debug-time').textContent = `${this.videoPlayer.currentTime.toFixed(2)}s / ${this.videoPlayer.duration.toFixed(2)}s`;
        document.getElementById('debug-latency').textContent = `${this.latency}ms`;
    }

    // Helper Methods
    getBatteryLevel() {
        // Try to get battery level (not supported in all browsers)
        if (navigator.getBattery) {
            navigator.getBattery().then(battery => {
                return Math.round(battery.level * 100);
            });
        }
        return undefined;
    }

    getBufferedPercentage() {
        if (this.videoPlayer.buffered.length === 0) return 0;

        const buffered = this.videoPlayer.buffered.end(this.videoPlayer.buffered.length - 1);
        const duration = this.videoPlayer.duration;

        return Math.round((buffered / duration) * 100);
    }
}

// Initialize client when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.videoClient = new VideoSyncClient();
    });
} else {
    window.videoClient = new VideoSyncClient();
}
