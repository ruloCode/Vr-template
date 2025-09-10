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
      logger.info("2️⃣ Pre-cargando assets...");
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

      // Initialize audio context but don't unlock automatically
      // User will need to interact to unlock audio
      logger.info(
        "🔊 AudioManager inicializado - requiere interacción del usuario para activar"
      );

      // Step 4: Initialize Scene Manager
      logger.info("4️⃣ Inicializando Scene Manager...");
      this.sceneManager = new SceneManager(
        //  this.preloadedAssets.imageCache,
        this.audioManager
      );
      await this.sceneManager.initialize();

      // Step 5: Initialize WebSocket connection (obligatory)
      logger.info("5️⃣ Inicializando conexión WebSocket...");
      this.wsClient = initializeWebSocket();
      this.setupWebSocketHandlers();

      // Wait for WebSocket connection before proceeding
      await this.connectWebSocketWithRetry();

      // Step 6: Initialize Sync Manager
      logger.info("6️⃣ Inicializando Sync Manager...");
      this.syncManager = new SyncManager(
        this.audioManager,
        this.sceneManager,
        this.wsClient
      );

      // Step 7: Setup app state and UI
      this.setupAppState();

      // Complete loading progress
      const store = useAppStore.getState();
      store.setPreloadProgress({
        percentage: 100,
        currentAsset: "Inicialización completa",
        errors: [],
      });

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

  private async connectWebSocketWithRetry(): Promise<void> {
    if (!this.wsClient) {
      throw new Error("WebSocket client not initialized");
    }

    const maxAttempts = 10; // Más intentos ya que la conexión es obligatoria
    const attemptDelay = 2000; // 2 segundos entre intentos

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        logger.info(`🔌 Intento de conexión ${attempt}/${maxAttempts}...`);

        // Actualizar progreso en la UI
        this.updateConnectionProgress(attempt, maxAttempts);

        await this.wsClient.connect();
        logger.info("✅ WebSocket conectado exitosamente");
        return; // Conexión exitosa, salir del loop
      } catch (error) {
        logger.warn(`⚠️ Intento ${attempt} falló:`, error);

        if (attempt === maxAttempts) {
          logger.error(
            "❌ No se pudo conectar al servidor después de todos los intentos"
          );
          // Mostrar error de conexión crítica
          if (this.uiManager) {
            this.uiManager.showConnectionError();
          }
          // Lanzar error para detener la inicialización
          throw new Error(
            "No se pudo conectar al servidor. La aplicación requiere conexión al servidor para funcionar."
          );
        }

        // Esperar antes del siguiente intento
        await new Promise((resolve) => setTimeout(resolve, attemptDelay));
      }
    }
  }

  private updateConnectionProgress(current: number, total: number): void {
    const progress = Math.round((current / total) * 100);
    const store = useAppStore.getState();

    // Actualizar el progreso de carga para mostrar el estado de conexión
    store.setPreloadProgress({
      percentage: Math.min(95, 80 + progress * 0.15), // 80-95% para conexión
      currentAsset: `Conectando al servidor... (${current}/${total})`,
      errors: [],
    });
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
      case "SHOW_SCREEN":
        this.handleShowScreenCommand(payload.screenType);
        break;
      case "HIDE_SCREEN":
        this.handleHideScreenCommand(payload.screenType);
        break;
      case "HIDE_ALL_SCREENS":
        this.handleHideAllScreensCommand();
        break;
      case "SHOW_ALL_SCREENS":
        this.handleShowAllScreensCommand();
        break;
      case "TOGGLE_SCREEN":
        this.handleToggleScreenCommand(payload.screenType);
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

  private handleShowScreenCommand(screenType: string): void {
    logger.info("📺 Mostrando pantalla:", screenType);

    if (!this.sceneManager) {
      logger.warn("⚠️ SceneManager no disponible");
      return;
    }

    switch (screenType) {
      case "solar":
        this.sceneManager.showParkScreen();
        break;
      case "petroleo":
        this.sceneManager.showPetroleoScreen();
        break;
      case "plataforma":
        this.sceneManager.showPlataformaScreen();
        break;
      case "cpf":
        this.sceneManager.showCpfScreen();
        break;
      default:
        logger.warn("⚠️ Tipo de pantalla no reconocido:", screenType);
    }
  }

  private handleHideScreenCommand(screenType: string): void {
    logger.info("📺 Ocultando pantalla:", screenType);

    if (!this.sceneManager) {
      logger.warn("⚠️ SceneManager no disponible");
      return;
    }

    switch (screenType) {
      case "solar":
        this.sceneManager.hideParkScreen();
        break;
      case "petroleo":
        this.sceneManager.hidePetroleoScreen();
        break;
      case "plataforma":
        this.sceneManager.hidePlataformaScreen();
        break;
      case "cpf":
        this.sceneManager.hideCpfScreen();
        break;
      default:
        logger.warn("⚠️ Tipo de pantalla no reconocido:", screenType);
    }
  }

  private handleHideAllScreensCommand(): void {
    logger.info("📺 Ocultando todas las pantallas");

    if (!this.sceneManager) {
      logger.warn("⚠️ SceneManager no disponible");
      return;
    }

    this.sceneManager.hideParkScreen();
    this.sceneManager.hidePetroleoScreen();
    this.sceneManager.hidePlataformaScreen();
    this.sceneManager.hideCpfScreen();
  }

  private handleShowAllScreensCommand(): void {
    logger.info("📺 Mostrando pantallas de la escena actual");

    if (!this.sceneManager) {
      logger.warn("⚠️ SceneManager no disponible");
      return;
    }

    // Obtener la escena actual
    const currentScene = this.sceneManager.getCurrentScene();

    if (!currentScene) {
      logger.warn("⚠️ No hay escena actual cargada");
      return;
    }

    // Mostrar solo las pantallas correspondientes a la escena actual
    switch (currentScene.id) {
      case "escena-1":
        this.sceneManager.showParkScreen();
        logger.info("☀️ Mostrando pantalla solar para escena 1");
        break;
      case "escena-2":
        this.sceneManager.showPetroleoScreen();
        logger.info("🛢️ Mostrando pantalla de petróleo para escena 2");
        break;
      case "escena-3":
        this.sceneManager.showPlataformaScreen();
        this.sceneManager.showCpfScreen();
        logger.info(
          "🏗️ Mostrando pantallas de plataformas y CPF para escena 3"
        );
        break;
      default:
        logger.info("📺 No hay pantallas flotantes para esta escena");
    }
  }

  private handleToggleScreenCommand(screenType: string): void {
    logger.info("📺 Toggle pantalla:", screenType);

    if (!this.sceneManager) {
      logger.warn("⚠️ SceneManager no disponible");
      return;
    }

    switch (screenType) {
      case "solar":
        if (this.sceneManager.isParkScreenVisible()) {
          this.sceneManager.hideParkScreen();
        } else {
          this.sceneManager.showParkScreen();
        }
        break;
      case "petroleo":
        if (this.sceneManager.isPetroleoScreenVisible()) {
          this.sceneManager.hidePetroleoScreen();
        } else {
          this.sceneManager.showPetroleoScreen();
        }
        break;
      case "plataforma":
        if (this.sceneManager.isPlataformaScreenVisible()) {
          this.sceneManager.hidePlataformaScreen();
        } else {
          this.sceneManager.showPlataformaScreen();
        }
        break;
      case "cpf":
        if (this.sceneManager.isCpfScreenVisible()) {
          this.sceneManager.hideCpfScreen();
        } else {
          this.sceneManager.showCpfScreen();
        }
        break;
      default:
        logger.warn("⚠️ Tipo de pantalla no reconocido:", screenType);
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

    // Setup return to model event listener
    window.addEventListener("return-to-model", () => {
      try {
        logger.info("🎭 Usuario solicitando volver al modelo por defecto...");
        this.returnToDefaultModel();
        logger.info("✅ Volviendo al modelo por defecto");
      } catch (error) {
        logger.error("❌ Error volviendo al modelo:", error);
      }
    });

    // Setup reconnect WebSocket event listener
    window.addEventListener("reconnect-websocket", async () => {
      try {
        logger.info("🔄 Usuario solicitando reconexión de WebSocket...");
        await this.reconnectWebSocket();
        logger.info("✅ WebSocket reconectado exitosamente");
      } catch (error) {
        logger.error("❌ Error reconectando WebSocket:", error);
      }
    });

    // Setup retry connection event listener
    window.addEventListener("retry-connection", async () => {
      try {
        logger.info("🔄 Usuario solicitando reintento de conexión...");
        if (this.uiManager) {
          this.uiManager.hideConnectionError();
        }
        await this.connectWebSocketWithRetry();
        logger.info("✅ Conexión establecida exitosamente");
        // Si llegamos aquí, la conexión fue exitosa, continuar con la inicialización
        this.uiManager?.showMainInterface();
      } catch (error) {
        logger.error("❌ Error en reintento de conexión:", error);
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

  public async reconnectWebSocket(): Promise<void> {
    logger.info("🔄 Reconectando WebSocket manualmente...");
    if (this.wsClient) {
      try {
        // Resetear intentos de reconexión para empezar fresco
        this.wsClient.resetReconnectAttempts();
        await this.wsClient.connect();
        logger.info("✅ WebSocket reconectado exitosamente");
      } catch (error) {
        logger.error("❌ Error reconectando WebSocket:", error);
        throw error;
      }
    }
  }

  public returnToDefaultModel(): void {
    if (this.sceneManager) {
      this.sceneManager.returnToDefaultModel();
    }
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
