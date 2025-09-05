import { logger } from "@/utils/logger";
import { useAppStore } from "@/store/appStore";

export class UIManager {
  private overlayElement: HTMLElement | null = null;
  private progressContainer: HTMLElement | null = null;
  private debugPanel: HTMLElement | null = null;
  private controlsPanel: HTMLElement | null = null;
  private debugUpdateInterval: number | null = null;

  constructor() {
    logger.info("🎨 UIManager inicializado");
  }

  public async initialize(): Promise<void> {
    this.createOverlayStructure();
    this.setupEventListeners();
    this.setupStoreSubscriptions();

    logger.info("✅ UIManager inicializado completamente");
  }

  private createOverlayStructure(): void {
    const app = document.getElementById("app");
    if (!app) {
      throw new Error("App container not found");
    }

    const overlayHTML = `
      <div id="vr-overlay" class="vr-overlay">
        <!-- Preload Progress -->
        <div id="preload-container" class="preload-container">
          <div class="preload-content">
            <div class="logo">🌟</div>
            <h1>VR Ecopetrol</h1>
            <p class="subtitle">Experiencia 360° - Preparando recursos...</p>
            
            <div class="progress-section">
              <div class="progress-bar">
                <div id="progress-fill" class="progress-fill"></div>
              </div>
              <div id="progress-text" class="progress-text">0%</div>
              <div id="progress-detail" class="progress-detail">Inicializando...</div>
            </div>
            
            <div id="preload-errors" class="error-list" style="display: none;">
              <h4>⚠️ Advertencias:</h4>
              <ul id="error-list"></ul>
            </div>
          </div>
        </div>

        <!-- Connection Status -->
        <div id="connection-status" class="connection-status" style="display: none;">
          <div class="status-indicator">
            <div id="status-dot" class="status-dot"></div>
            <span id="status-text">Desconectado</span>
          </div>
        </div>

        <!-- Audio Unlock -->
        <div id="audio-unlock" class="audio-unlock" style="display: none;">
          <div class="unlock-content">
            <div class="icon">🎵</div>
            <h2>Activar Audio</h2>
            <p>Toca para habilitar la experiencia de audio inmersiva</p>
            <button id="unlock-audio-btn" class="btn btn-primary">
              🔊 Activar Audio
            </button>
          </div>
        </div>

        <!-- Ready State -->
        <div id="ready-state" class="ready-state" style="display: none;">
          <div class="ready-content">
            <div class="status-icon">✅</div>
            <h2>Sistema Listo</h2>
            <p id="ready-message">Esperando comandos del dashboard...</p>
            
            <div class="device-info">
              <div class="info-item">
                <span class="label">Dispositivo:</span>
                <span id="device-id">-</span>
              </div>
              <div class="info-item">
                <span class="label">Conexión:</span>
                <span id="connection-state">-</span>
              </div>
              <div class="info-item" id="battery-info" style="display: none;">
                <span class="label">Batería:</span>
                <span id="battery-level">-</span>
              </div>
            </div>

            <div class="manual-controls" style="display: none;">
              <h4>Modo Manual (Offline)</h4>
              <div class="controls-grid">
                <select id="scene-selector" class="scene-select">
                  <option value="">Seleccionar escena...</option>
                </select>
                <button id="manual-start" class="btn btn-secondary" disabled>
                  ▶️ Iniciar Manual
                </button>
                <button id="return-model" class="btn btn-primary">
                  🎭 Volver al Modelo
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Debug Panel -->
        <div id="debug-panel" class="debug-panel" style="display: none;">
          <div class="debug-header">
            <h4>🔧 Debug Info</h4>
            <button id="debug-close" class="btn-close">×</button>
          </div>
          <div id="debug-content" class="debug-content">
            <!-- Debug info will be populated dynamically -->
          </div>
        </div>

        <!-- Controls Panel -->
        <div id="controls-panel" class="controls-panel" style="display: none;">
          <div class="controls-header">
            <h4>🎮 Controles</h4>
            <button id="controls-close" class="btn-close">×</button>
          </div>
          <div class="controls-content">
            <button id="vr-toggle" class="btn btn-primary">🥽 VR</button>
            <button id="reset-camera" class="btn btn-secondary">📹 Reset Camera</button>
            <button id="debug-toggle" class="btn btn-secondary">🔧 Debug</button>
            <button id="fullscreen-toggle" class="btn btn-secondary">⛶ Fullscreen</button>
          </div>
        </div>
      </div>
    `;

    // Add overlay to app
    app.insertAdjacentHTML("beforeend", overlayHTML);

    // Get references
    this.overlayElement = document.getElementById("vr-overlay");
    this.progressContainer = document.getElementById("preload-container");
    this.debugPanel = document.getElementById("debug-panel");
    this.controlsPanel = document.getElementById("controls-panel");

    // Add CSS
    this.injectStyles();
  }

  private injectStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
      .vr-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: white;
      }

      .preload-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .preload-content {
        text-align: center;
        max-width: 500px;
        padding: 2rem;
      }

      .logo {
        font-size: 4rem;
        margin-bottom: 1rem;
        animation: pulse 2s infinite;
      }

      .preload-content h1 {
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
      }

      .subtitle {
        font-size: 1.1rem;
        opacity: 0.9;
        margin-bottom: 3rem;
      }

      .progress-section {
        margin-bottom: 2rem;
      }

      .progress-bar {
        width: 100%;
        height: 12px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 1rem;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #00d4aa, #00b4d8);
        border-radius: 6px;
        transition: width 0.3s ease;
        width: 0%;
      }

      .progress-text {
        font-size: 1.5rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
      }

      .progress-detail {
        font-size: 0.9rem;
        opacity: 0.8;
        margin-bottom: 1rem;
      }

      .error-list {
        background: rgba(220, 53, 69, 0.1);
        border: 1px solid rgba(220, 53, 69, 0.3);
        border-radius: 8px;
        padding: 1rem;
        text-align: left;
      }

      .error-list ul {
        margin: 0.5rem 0 0 1rem;
        font-size: 0.9rem;
      }

      .connection-status {
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        padding: 0.5rem 1rem;
        border-radius: 20px;
        backdrop-filter: blur(10px);
      }

      .status-indicator {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #dc3545;
        animation: pulse 2s infinite;
      }

      .status-dot.connected { background: #28a745; }
      .status-dot.connecting { background: #ffc107; }

      .audio-unlock {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .unlock-content {
        text-align: center;
        max-width: 400px;
        padding: 2rem;
      }

      .unlock-content .icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }

      .unlock-content h2 {
        font-size: 2rem;
        margin-bottom: 1rem;
      }

      .unlock-content p {
        font-size: 1.1rem;
        margin-bottom: 2rem;
        opacity: 0.9;
      }

      .ready-state {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .ready-content {
        text-align: center;
        max-width: 500px;
        padding: 2rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 15px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .status-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }

      .device-info {
        margin: 2rem 0;
        text-align: left;
      }

      .info-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 5px;
      }

      .label {
        font-weight: bold;
      }

      .manual-controls {
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
      }

      .controls-grid {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 1rem;
        margin-top: 1rem;
      }

      .debug-panel {
        position: absolute;
        top: 20px;
        left: 20px;
        width: 350px;
        max-height: 500px;
        background: rgba(0, 0, 0, 0.9);
        border-radius: 10px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        overflow: hidden;
      }

      .debug-header {
        padding: 1rem;
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .debug-content {
        padding: 1rem;
        max-height: 400px;
        overflow-y: auto;
        font-family: monospace;
        font-size: 0.8rem;
        line-height: 1.4;
      }

      .controls-panel {
        position: absolute;
        bottom: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.9);
        border-radius: 10px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .controls-header {
        padding: 1rem;
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .controls-content {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 600;
        text-decoration: none;
        display: inline-block;
        text-align: center;
      }

      .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
      }

      .btn-primary {
        background: linear-gradient(135deg, #007bff, #0056b3);
        color: white;
      }

      .btn-secondary {
        background: linear-gradient(135deg, #6c757d, #495057);
        color: white;
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      .btn-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .btn-close:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .scene-select {
        padding: 0.75rem;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 5px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        font-size: 1rem;
      }

      .scene-select option {
        background: #333;
        color: white;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(0.95); }
      }

      @media (max-width: 768px) {
        .preload-content {
          padding: 1rem;
        }
        
        .debug-panel {
          width: calc(100vw - 40px);
          max-width: 350px;
        }
        
        .controls-panel {
          bottom: 10px;
          right: 10px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  private setupEventListeners(): void {
    // Audio unlock button
    const unlockBtn = document.getElementById("unlock-audio-btn");
    unlockBtn?.addEventListener("click", async () => {
      try {
        logger.info("🔊 Usuario activando audio...");
        const event = new CustomEvent("audio-unlock-requested");
        window.dispatchEvent(event);
      } catch (error) {
        logger.error("❌ Error activando audio:", error);
      }
    });

    // Debug panel controls
    const debugClose = document.getElementById("debug-close");
    debugClose?.addEventListener("click", () => {
      useAppStore.getState().setDebugMode(false);
    });

    // Controls panel
    const controlsClose = document.getElementById("controls-close");
    controlsClose?.addEventListener("click", () => {
      useAppStore.getState().setControlsVisible(false);
    });

    // Control buttons
    this.setupControlButtons();

    // Manual controls
    this.setupManualControls();

    // Keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  private setupControlButtons(): void {
    const vrToggle = document.getElementById("vr-toggle");
    const resetCamera = document.getElementById("reset-camera");
    const debugToggle = document.getElementById("debug-toggle");
    const fullscreenToggle = document.getElementById("fullscreen-toggle");

    vrToggle?.addEventListener("click", () => {
      const event = new CustomEvent("vr-toggle");
      window.dispatchEvent(event);
    });

    resetCamera?.addEventListener("click", () => {
      const event = new CustomEvent("camera-reset");
      window.dispatchEvent(event);
    });

    debugToggle?.addEventListener("click", () => {
      const store = useAppStore.getState();
      store.setDebugMode(!store.showDebug);
    });

    fullscreenToggle?.addEventListener("click", () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    });
  }

  private setupManualControls(): void {
    const sceneSelector = document.getElementById(
      "scene-selector"
    ) as HTMLSelectElement;
    const manualStart = document.getElementById("manual-start");
    const returnModel = document.getElementById("return-model");

    sceneSelector?.addEventListener("change", () => {
      const startBtn = manualStart as HTMLButtonElement;
      startBtn.disabled = !sceneSelector.value;
    });

    manualStart?.addEventListener("click", () => {
      const sceneId = sceneSelector?.value;
      if (sceneId) {
        const event = new CustomEvent("manual-scene-start", {
          detail: { sceneId },
        });
        window.dispatchEvent(event);
      }
    });

    returnModel?.addEventListener("click", () => {
      const event = new CustomEvent("return-to-model");
      window.dispatchEvent(event);
    });
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey) return;

      switch (e.key) {
        case "F12":
          e.preventDefault();
          const store = useAppStore.getState();
          store.setDebugMode(!store.showDebug);
          break;
        case "c":
        case "C":
          e.preventDefault();
          useAppStore.getState().setControlsVisible(true);
          break;
        case "Escape":
          e.preventDefault();
          useAppStore.getState().setControlsVisible(false);
          useAppStore.getState().setDebugMode(false);
          break;
      }
    });
  }

  private setupStoreSubscriptions(): void {
    // Subscribe to preload progress
    useAppStore.subscribe((state) => {
      this.updatePreloadProgress(state.preloadProgress);
    });

    // Subscribe to connection status
    useAppStore.subscribe((state) => {
      this.updateConnectionStatus(state.connectionStatus, state.isConnected);
    });

    // Subscribe to debug mode
    useAppStore.subscribe((state) => {
      this.toggleDebugPanel(state.showDebug);
    });

    // Subscribe to controls visibility
    useAppStore.subscribe((state) => {
      this.toggleControlsPanel(state.showControls);
    });

    // Subscribe to available scenes
    useAppStore.subscribe((state) => {
      this.updateSceneSelector(state.availableScenes);
    });
  }

  private updatePreloadProgress(progress: any): void {
    const fillElement = document.getElementById("progress-fill");
    const textElement = document.getElementById("progress-text");
    const detailElement = document.getElementById("progress-detail");
    const errorsContainer = document.getElementById("preload-errors");
    const errorsList = document.getElementById("error-list");

    if (fillElement) {
      fillElement.style.width = `${progress.percentage}%`;
    }

    if (textElement) {
      textElement.textContent = `${progress.percentage}%`;
    }

    if (detailElement) {
      detailElement.textContent = progress.currentAsset || "Procesando...";
    }

    // Show errors if any
    if (
      progress.errors &&
      progress.errors.length > 0 &&
      errorsContainer &&
      errorsList
    ) {
      errorsContainer.style.display = "block";
      errorsList.innerHTML = progress.errors
        .map((error: string) => `<li>${error}</li>`)
        .join("");
    }
  }

  private updateConnectionStatus(status: string, _isConnected: boolean): void {
    const statusElement = document.getElementById("connection-status");
    const dotElement = document.getElementById("status-dot");
    const textElement = document.getElementById("status-text");

    if (!statusElement || !dotElement || !textElement) return;

    const statusMap = {
      disconnected: { text: "Desconectado", class: "disconnected" },
      connecting: { text: "Conectando...", class: "connecting" },
      connected: { text: "Conectado", class: "connected" },
      error: { text: "Error", class: "error" },
    };

    const statusInfo =
      statusMap[status as keyof typeof statusMap] || statusMap.disconnected;

    dotElement.className = `status-dot ${statusInfo.class}`;
    textElement.textContent = statusInfo.text;
    statusElement.style.display = "block";
  }

  private toggleDebugPanel(show: boolean): void {
    if (this.debugPanel) {
      this.debugPanel.style.display = show ? "block" : "none";

      if (show && !this.debugUpdateInterval) {
        this.startDebugUpdates();
      } else if (!show && this.debugUpdateInterval) {
        this.stopDebugUpdates();
      }
    }
  }

  private toggleControlsPanel(show: boolean): void {
    if (this.controlsPanel) {
      this.controlsPanel.style.display = show ? "block" : "none";
    }
  }

  private updateSceneSelector(scenes: any[]): void {
    const selector = document.getElementById(
      "scene-selector"
    ) as HTMLSelectElement;
    if (!selector) return;

    // Clear existing options except first
    selector.innerHTML = '<option value="">Seleccionar escena...</option>';

    scenes.forEach((scene) => {
      const option = document.createElement("option");
      option.value = scene.id;
      option.textContent = `${scene.title} (${scene.durationSec}s)`;
      selector.appendChild(option);
    });
  }

  private startDebugUpdates(): void {
    this.debugUpdateInterval = window.setInterval(() => {
      this.updateDebugInfo();
    }, 1000);
  }

  private stopDebugUpdates(): void {
    if (this.debugUpdateInterval) {
      clearInterval(this.debugUpdateInterval);
      this.debugUpdateInterval = null;
    }
  }

  private updateDebugInfo(): void {
    const debugContent = document.getElementById("debug-content");
    if (!debugContent) return;

    const store = useAppStore.getState();
    const now = new Date();

    const debugData = {
      Timestamp: now.toLocaleTimeString(),
      Connection: store.connectionStatus,
      Latency: store.latency + "ms",
      "Client Offset": store.clientOffset + "ms",
      "Device ID": store.deviceId.substring(0, 12) + "...",
      "Audio Unlocked": store.audioUnlocked ? "Yes" : "No",
      "Current Scene": store.currentScene?.id || "None",
      "Preload Complete": store.preloadComplete ? "Yes" : "No",
      Battery: store.battery ? store.battery + "%" : "N/A",
    };

    debugContent.innerHTML = Object.entries(debugData)
      .map(([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`)
      .join("");
  }

  // Public methods
  public showPreloader(): void {
    if (this.progressContainer) {
      this.progressContainer.style.display = "flex";
    }
  }

  public hidePreloader(): void {
    if (this.progressContainer) {
      this.progressContainer.style.display = "none";
    }
  }

  public showAudioUnlock(): void {
    const audioUnlock = document.getElementById("audio-unlock");
    if (audioUnlock) {
      audioUnlock.style.display = "flex";
    }
  }

  public hideAudioUnlock(): void {
    const audioUnlock = document.getElementById("audio-unlock");
    if (audioUnlock) {
      audioUnlock.style.display = "none";
    }
  }

  public showMainInterface(): void {
    const readyState = document.getElementById("ready-state");
    const store = useAppStore.getState();

    if (readyState) {
      // Update device info
      this.updateDeviceInfo();

      // Show manual controls if offline
      const manualControls = readyState.querySelector(
        ".manual-controls"
      ) as HTMLElement;
      if (manualControls) {
        manualControls.style.display =
          store.connectionStatus === "connected" ? "none" : "block";
      }

      readyState.style.display = "flex";
    }

    this.hidePreloader();
    this.hideAudioUnlock();
  }

  public hideMainInterface(): void {
    const readyState = document.getElementById("ready-state");
    if (readyState) {
      readyState.style.display = "none";
    }
  }

  private updateDeviceInfo(): void {
    const store = useAppStore.getState();

    const deviceIdElement = document.getElementById("device-id");
    const connectionElement = document.getElementById("connection-state");
    const batteryInfo = document.getElementById("battery-info");
    const batteryLevel = document.getElementById("battery-level");

    if (deviceIdElement) {
      deviceIdElement.textContent = store.deviceId.substring(0, 12) + "...";
    }

    if (connectionElement) {
      connectionElement.textContent = store.connectionStatus;
    }

    if (store.battery && batteryInfo && batteryLevel) {
      batteryInfo.style.display = "flex";
      batteryLevel.textContent = store.battery + "%";
    }
  }

  public setDebugMode(enabled: boolean): void {
    this.toggleDebugPanel(enabled);
  }

  public destroy(): void {
    logger.info("🧹 Destruyendo UIManager");

    this.stopDebugUpdates();

    if (this.overlayElement) {
      this.overlayElement.remove();
    }
  }
}
