import { logger, perf, captureError } from "@/utils/logger";
import { initializeWebSocket, VRWebSocketClient } from "@/utils/websocket";
import { assetPreloader, PreloadedAssets } from "@/utils/preloader";
import { AudioManager } from "./AudioManager";
import { SceneManager } from "./SceneManager";
import { UIManager } from "./UIManager";
import { SyncManager } from "./SyncManager";
import { useAppStore } from "@/store/appStore";
import { ServerMessage, VRScene } from "@/types/protocol";

export class VRApp {
  private wsClient: VRWebSocketClient | null = null;
  private audioManager: AudioManager | null = null;
  private sceneManager: SceneManager | null = null;
  private uiManager: UIManager | null = null;
  private syncManager: SyncManager | null = null;
  private preloadedAssets: PreloadedAssets | null = null;
  private isInitialized = false;

  constructor() {
    logger.info("🎭 VRApp constructor");
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn("⚠️ VRApp ya está inicializada");
      return;
    }

    try {
      perf.mark("app-init-start");

      // Step 1: Initialize UI Manager first (for progress display)
      logger.info("1️⃣ Inicializando UI Manager...");
      this.uiManager = new UIManager();
      await this.uiManager.initialize();

      // Step 2: Preload all assets
      logger.info("2️⃣ Precargando assets...");
      this.preloadedAssets = await assetPreloader.preloadAll();

      if (this.preloadedAssets.errors.length > 0) {
        logger.warn(
          "⚠️ Algunos assets fallaron al cargar:",
          this.preloadedAssets.errors
        );
      }

      // Step 3: Initialize Audio Manager and unlock automatically
      logger.info("3️⃣ Inicializando Audio Manager...");
      this.audioManager = new AudioManager(this.preloadedAssets.audioCache);

      // Auto-unlock audio context
      try {
        logger.info("🔊 Desbloqueando AudioContext automáticamente...");
        await this.audioManager.unlock();
        useAppStore.getState().setAudioUnlocked(true);
        logger.info("✅ AudioContext desbloqueado automáticamente");
      } catch (error) {
        logger.warn("⚠️ No se pudo desbloquear audio automáticamente:", error);
        // Continue without audio - user can unlock manually later
      }

      // Step 4: Initialize Scene Manager
      logger.info("4️⃣ Inicializando Scene Manager...");
      this.sceneManager = new SceneManager(
        this.preloadedAssets.imageCache,
        this.audioManager
      );
      await this.sceneManager.initialize();

      // Step 5: Initialize WebSocket connection
      logger.info("5️⃣ Inicializando conexión WebSocket...");
      this.wsClient = initializeWebSocket();
      this.setupWebSocketHandlers();

      // Try to connect (non-blocking)
      this.connectWebSocket();

      // Step 6: Initialize Sync Manager
      logger.info("6️⃣ Inicializando Sync Manager...");
      this.syncManager = new SyncManager(
        this.audioManager,
        this.sceneManager,
        this.wsClient
      );

      // Step 7: Setup app state and UI
      this.setupAppState();
      this.uiManager.showMainInterface();

      perf.mark("app-init-end");
      perf.measure(
        "Total app initialization",
        "app-init-start",
        "app-init-end"
      );

      this.isInitialized = true;
      logger.info("✅ VRApp inicializada completamente");
    } catch (error) {
      logger.error("❌ Error inicializando VRApp:", error);
      captureError(error as Error, "vrapp-initialization");
      throw error;
    }
  }

  private async connectWebSocket(): Promise<void> {
    try {
      if (this.wsClient) {
        await this.wsClient.connect();
        logger.info("🔗 WebSocket conectado exitosamente");
      }
    } catch (error) {
      logger.warn(
        "⚠️ No se pudo conectar al WebSocket (modo offline disponible):",
        error
      );
      // Continue in offline mode
    }
  }

  private setupWebSocketHandlers(): void {
    if (!this.wsClient) return;

    this.wsClient.onMessageReceived(async (message: ServerMessage) => {
      await this.handleServerMessage(message);
    });

    this.wsClient.onConnectionStateChange((state) => {
      logger.info("🔄 Estado de conexión WebSocket:", state);
      useAppStore.getState().setConnectionStatus(state);
    });
  }

  private async handleServerMessage(message: ServerMessage): Promise<void> {
    logger.debug("📥 Mensaje del servidor:", message);

    switch (message.type) {
      case "COMMAND":
        await this.handleServerCommand(message);
        break;
      case "WELCOME":
        logger.info("👋 Bienvenida del servidor");
        break;
      case "PONG":
        // Handled by WebSocket client automatically
        break;
      default:
        logger.warn("⚠️ Mensaje del servidor no reconocido:", message);
    }
  }

  private async handleServerCommand(
    message: ServerMessage & { type: "COMMAND" }
  ): Promise<void> {
    const { payload } = message;

    switch (payload.commandType) {
      case "LOAD":
        await this.handleLoadCommand(payload.sceneId);
        break;
      case "START_AT":
        await this.handleStartAtCommand(payload.epochMs);
        break;
      case "PAUSE":
        this.handlePauseCommand();
        break;
      case "RESUME":
        this.handleResumeCommand();
        break;
      case "SEEK":
        this.handleSeekCommand(payload.deltaMs);
        break;
      default:
        logger.warn("⚠️ Comando no reconocido:", payload);
    }
  }

  private async handleLoadCommand(sceneId: string): Promise<void> {
    logger.info("🎬 Cargando escena:", sceneId);

    if (!this.sceneManager || !this.preloadedAssets) {
      logger.error("❌ Managers no inicializados para cargar escena");
      return;
    }

    const scene = this.preloadedAssets.manifest.scenes.find(
      (s) => s.id === sceneId
    );
    if (!scene) {
      logger.error("❌ Escena no encontrada:", sceneId);
      return;
    }

    // Ensure audio is unlocked before loading scene
    if (this.audioManager && !useAppStore.getState().audioUnlocked) {
      try {
        logger.info("🔊 Desbloqueando audio antes de cargar escena...");
        await this.enableAudio();
      } catch (error) {
        logger.error("❌ Error desbloqueando audio:", error);
        // Continue without audio
      }
    }

    try {
      await this.sceneManager.loadScene(scene);
      // Notify server that we're ready
      if (this.wsClient) {
        this.wsClient.send({
          type: "READY",
          payload: { sceneId },
        });
      }
    } catch (error) {
      logger.error("❌ Error cargando escena:", error);
    }
  }

  private async handleStartAtCommand(epochMs: number): Promise<void> {
    logger.info(
      "▶️ Iniciando reproducción en:",
      new Date(epochMs).toISOString()
    );

    if (this.syncManager) {
      await this.syncManager.startSyncedPlayback(epochMs);
    }
  }

  private handlePauseCommand(): void {
    logger.info("⏸️ Pausando reproducción");

    if (this.audioManager) {
      this.audioManager.pause();
    }
  }

  private handleResumeCommand(): void {
    logger.info("▶️ Reanudando reproducción");

    if (this.audioManager) {
      this.audioManager.resume();
    }
  }

  private handleSeekCommand(deltaMs: number): void {
    logger.info("⏩ Seeking:", deltaMs + "ms");

    if (this.syncManager) {
      this.syncManager.seek(deltaMs);
    }
  }

  private setupAppState(): void {
    const store = useAppStore.getState();

    // Set available scenes from manifest
    if (this.preloadedAssets) {
      store.setAvailableScenes(this.preloadedAssets.manifest.scenes);
    }

    // Subscribe to store changes for debugging
    useAppStore.subscribe((state, prevState) => {
      if (state.showDebug !== prevState.showDebug) {
        this.toggleDebugMode(state.showDebug);
      }
    });

    // Setup audio unlock event listener
    window.addEventListener("audio-unlock-requested", async () => {
      try {
        logger.info("🔊 Usuario solicitando desbloqueo de audio...");
        await this.enableAudio();
        logger.info("✅ Audio desbloqueado exitosamente");
      } catch (error) {
        logger.error("❌ Error desbloqueando audio:", error);
      }
    });
  }

  private toggleDebugMode(enabled: boolean): void {
    logger.info("🔧 Debug mode:", enabled ? "enabled" : "disabled");

    if (this.uiManager) {
      this.uiManager.setDebugMode(enabled);
    }
  }

  // Public methods for manual control (debug/offline mode)
  public async enableAudio(): Promise<void> {
    if (!this.audioManager) {
      throw new Error("AudioManager not initialized");
    }

    await this.audioManager.unlock();
    useAppStore.getState().setAudioUnlocked(true);
  }

  public loadScene(sceneId: string): Promise<void> {
    if (!this.preloadedAssets) {
      throw new Error("Assets not preloaded");
    }

    const scene = this.preloadedAssets.manifest.scenes.find(
      (s) => s.id === sceneId
    );
    if (!scene) {
      throw new Error(`Scene ${sceneId} not found`);
    }

    return (this.handleLoadCommand(sceneId), Promise.resolve());
  }

  public async startManualPlayback(): Promise<void> {
    logger.info("🎮 Iniciando reproducción manual");

    if (this.audioManager) {
      await this.audioManager.play();
    }
  }

  public getAvailableScenes(): VRScene[] {
    return this.preloadedAssets?.manifest.scenes || [];
  }

  public getConnectionStatus(): string {
    return this.wsClient?.getConnectionState() || "disconnected";
  }

  // Cleanup
  public destroy(): void {
    logger.info("🧹 Destruyendo VRApp");

    if (this.wsClient) {
      this.wsClient.destroy();
    }

    if (this.audioManager) {
      this.audioManager.destroy();
    }

    if (this.sceneManager) {
      this.sceneManager.destroy();
    }

    if (this.uiManager) {
      this.uiManager.destroy();
    }

    this.isInitialized = false;
  }
}
