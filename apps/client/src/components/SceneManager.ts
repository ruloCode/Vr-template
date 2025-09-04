import { logger, perf, captureError } from "@/utils/logger";
import { config } from "@/utils/config";
import { VRScene } from "@/types/protocol";
import { AudioManager } from "./AudioManager";
import { useAppStore } from "@/store/appStore";

export class SceneManager {
  private aframeScene: any = null;
  private skyElement: any = null;
  private currentSky: any = null;
  private nextSky: any = null;
  private imageCache: Map<string, HTMLImageElement>;
  private audioManager: AudioManager;
  private currentScene: VRScene | null = null;
  private isTransitioning = false;

  constructor(
    imageCache: Map<string, HTMLImageElement>,
    audioManager: AudioManager
  ) {
    this.imageCache = imageCache;
    this.audioManager = audioManager;
    logger.info("🎬 SceneManager inicializado");
  }

  public async initialize(): Promise<void> {
    try {
      logger.info("🏗️ Creando escena A-Frame...");

      await this.createAFrameScene();
      this.setupVRControls();

      logger.info("✅ SceneManager inicializado completamente");
    } catch (error) {
      logger.error("❌ Error inicializando SceneManager:", error);
      captureError(error as Error, "scene-manager-init");
      throw error;
    }
  }

  private async createAFrameScene(): Promise<void> {
    return new Promise((resolve) => {
      // Wait for A-Frame to be ready
      if (typeof AFRAME === "undefined") {
        document.addEventListener("DOMContentLoaded", () => {
          this.buildScene();
          resolve();
        });
      } else {
        this.buildScene();
        resolve();
      }
    });
  }

  private buildScene(): void {
    const app = document.getElementById("app");
    if (!app) {
      throw new Error("App container not found");
    }

    // Create A-Frame scene
    const sceneHTML = `
      <a-scene 
        id="vr-scene"
        embedded
        vr-mode-ui="enabled: ${config.aframe.enableVR}"
        device-orientation-permission-ui="enabled: false"
        renderer="antialias: true; colorManagement: true; physicallyCorrectLights: true; gammaOutput: true"
        background="color: #000000"
      >
        <!-- Assets -->
        <a-assets>
          <!-- Placeholder assets will be added dynamically -->
        </a-assets>
        
        <!-- Lighting -->
        <a-light type="ambient" color="#404040" intensity="0.4"></a-light>
        
        <!-- Camera -->
        <a-camera 
          id="main-camera"
          look-controls="enabled: true; pointerLockEnabled: false"
          wasd-controls="enabled: false"
          position="0 1.6 0"
          camera="active: true"
        >
          <!-- Cursor for interaction -->
          <a-cursor
            position="0 0 -1"
            geometry="primitive: ring; radiusInner: 0.02; radiusOuter: 0.03"
            material="color: white; shader: flat; transparent: true; opacity: 0.8"
            cursor="rayOrigin: mouse"
            raycaster="far: 20; interval: 200; objects: .clickable"
          ></a-cursor>
        </a-camera>
        
        <!-- Main sky sphere for 360 images -->
        <a-sky 
          id="main-sky"
          radius="500"
          phi-start="0"
          phi-length="360"
          theta-start="0"
          theta-length="180"
          material="src: /panos/forest.jpg; transparent: false; side: back"
        ></a-sky>
        
        <!-- Secondary sky for transitions -->
        <a-sky 
          id="transition-sky"
          radius="499"
          visible="false"
          material="transparent: false; side: back; opacity: 0"
        ></a-sky>
        
        <!-- Debug Info (only in debug mode) -->
        <a-text 
          id="debug-info"
          position="-2 2 -3"
          value="Debug Info"
          color="white"
          font="kelsonsans"
          width="6"
          visible="false"
        ></a-text>
        
        <!-- Loading indicator -->
        <a-text 
          id="loading-text"
          position="0 0 -2"
          value="Cargando..."
          color="white"
          align="center"
          font="kelsonsans"
          width="8"
          visible="false"
        ></a-text>
      </a-scene>
    `;

    app.innerHTML = sceneHTML;

    // Get references to elements
    this.aframeScene = document.querySelector("#vr-scene");
    this.skyElement = document.querySelector("#main-sky");
    this.currentSky = this.skyElement;
    this.nextSky = document.querySelector("#transition-sky");

    // Setup scene event listeners
    this.setupSceneEvents();

    // Set default background image
    this.setDefaultBackground();
  }

  private setupSceneEvents(): void {
    if (!this.aframeScene) return;

    this.aframeScene.addEventListener("loaded", () => {
      logger.info("🎬 A-Frame scene loaded");
    });

    this.aframeScene.addEventListener("enter-vr", () => {
      logger.info("🥽 Entrando en modo VR");
      useAppStore.getState().setFullscreen(true);
    });

    this.aframeScene.addEventListener("exit-vr", () => {
      logger.info("👀 Saliendo de modo VR");
      useAppStore.getState().setFullscreen(false);
    });

    // Listen for controller events if available
    this.aframeScene.addEventListener("controllerconnected", (event: any) => {
      logger.info("🎮 Controller conectado:", event.detail);
    });
  }

  private setDefaultBackground(): void {
    if (this.currentSky) {
      this.currentSky.setAttribute(
        "material",
        "src: /panos/forest.jpg; transparent: false; side: back"
      );
      logger.info("🌲 Fondo por defecto establecido: forest.jpg");
    }
  }

  private setupVRControls(): void {
    // Add custom components for enhanced controls
    if (typeof AFRAME !== "undefined") {
      // Custom look controls with constraints
      AFRAME.registerComponent("constrained-look-controls", {
        init() {
          this.el.addEventListener("componentchanged", (evt: any) => {
            if (evt.detail.name === "rotation") {
              const rotation = this.el.getAttribute("rotation");
              // Prevent camera from flipping upside down
              if (rotation.x > 90) rotation.x = 90;
              if (rotation.x < -90) rotation.x = -90;
              this.el.setAttribute("rotation", rotation);
            }
          });
        },
      });

      // Apply to camera
      const camera = document.querySelector("#main-camera");
      if (camera) {
        camera.setAttribute("constrained-look-controls", "");
      }
    }
  }

  public async loadScene(scene: VRScene): Promise<void> {
    if (this.isTransitioning) {
      logger.warn("⚠️ Ya hay una transición en curso");
      return;
    }

    try {
      this.isTransitioning = true;
      perf.mark(`scene-load-start-${scene.id}`);

      logger.info("🎬 Cargando escena:", scene.id, "-", scene.title);

      // Show loading indicator
      this.showLoading(true);

      // Load audio first
      await this.audioManager.loadAudio(scene.audio);

      // Load 360 image
      await this.load360Image(scene);

      // Update current scene
      this.currentScene = scene;
      useAppStore.getState().setCurrentScene(scene);

      // Hide loading indicator
      this.showLoading(false);

      perf.mark(`scene-load-end-${scene.id}`);
      perf.measure(
        `Scene load: ${scene.id}`,
        `scene-load-start-${scene.id}`,
        `scene-load-end-${scene.id}`
      );

      logger.info("✅ Escena cargada:", scene.id);
    } catch (error) {
      logger.error("❌ Error cargando escena:", error);
      this.showLoading(false);
      throw error;
    } finally {
      this.isTransitioning = false;
    }
  }

  private async load360Image(scene: VRScene): Promise<void> {
    const img = this.imageCache.get(scene.image360);
    if (!img) {
      throw new Error(`Image not found in cache: ${scene.image360}`);
    }

    return new Promise((resolve, reject) => {
      try {
        // Use the original image URL instead of converting to data URL
        const imageUrl = `/${scene.image360}`;

        // Apply to sky with crossfade
        this.applySkyTexture(imageUrl, config.aframe.fadeTransitionSpeed);

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private applySkyTexture(
    textureUrl: string,
    fadeDuration: number = 1.0
  ): void {
    if (!this.currentSky || !this.nextSky) {
      logger.error("❌ Sky elements no encontrados");
      return;
    }

    // Set texture on next sky
    this.nextSky.setAttribute(
      "material",
      `src: ${textureUrl}; transparent: true; opacity: 0`
    );
    this.nextSky.setAttribute("visible", "true");

    // Animate crossfade
    this.animateCrossfade(fadeDuration * 1000);
  }

  private animateCrossfade(durationMs: number): void {
    if (!this.currentSky || !this.nextSky) return;

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      // Smooth easing function
      const eased = progress * progress * (3 - 2 * progress);

      // Fade out current, fade in next
      this.currentSky.setAttribute("material", `opacity: ${1 - eased}`);
      this.nextSky.setAttribute("material", `opacity: ${eased}`);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Swap sky references
        this.currentSky.setAttribute("visible", "false");
        [this.currentSky, this.nextSky] = [this.nextSky, this.currentSky];

        logger.debug("🔄 Crossfade completado");
      }
    };

    requestAnimationFrame(animate);
  }

  private showLoading(show: boolean): void {
    const loadingText = document.querySelector("#loading-text");
    if (loadingText) {
      loadingText.setAttribute("visible", show.toString());
    }
  }

  public updateDebugInfo(info: any): void {
    const debugElement = document.querySelector("#debug-info");
    const store = useAppStore.getState();

    if (debugElement && store.showDebug) {
      const debugText = `
Scene: ${this.currentScene?.id || "None"}
Audio: ${this.audioManager.getPlaybackState().isPlaying ? "Playing" : "Stopped"}
Time: ${this.audioManager.getCurrentTime().toFixed(2)}s
Connection: ${store.connectionStatus}
Latency: ${store.latency}ms
FPS: ${info.fps || "N/A"}
      `.trim();

      debugElement.setAttribute("value", debugText);
      debugElement.setAttribute("visible", "true");
    } else if (debugElement) {
      debugElement.setAttribute("visible", "false");
    }
  }

  public getCurrentScene(): VRScene | null {
    return this.currentScene;
  }

  public enterVR(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.aframeScene) {
        this.aframeScene.enterVR().then(resolve).catch(reject);
      } else {
        reject(new Error("A-Frame scene not initialized"));
      }
    });
  }

  public exitVR(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.aframeScene) {
        this.aframeScene.exitVR().then(resolve).catch(reject);
      } else {
        reject(new Error("A-Frame scene not initialized"));
      }
    });
  }

  public isVRAvailable(): boolean {
    return this.aframeScene?.is("vr-mode-ui") || false;
  }

  public takeScreenshot(): string | null {
    if (!this.aframeScene) return null;

    try {
      const canvas = this.aframeScene.canvas;
      return canvas.toDataURL("image/png");
    } catch (error) {
      logger.error("❌ Error tomando screenshot:", error);
      return null;
    }
  }

  public resetCamera(): void {
    const camera = document.querySelector("#main-camera");
    if (camera) {
      camera.setAttribute("rotation", "0 0 0");
      camera.setAttribute("position", "0 1.6 0");
      logger.info("📹 Cámara reseteada");
    }
  }

  public destroy(): void {
    logger.info("🧹 Destruyendo SceneManager");

    // Remove A-Frame scene
    const app = document.getElementById("app");
    if (app) {
      app.innerHTML = "";
    }

    this.aframeScene = null;
    this.skyElement = null;
    this.currentSky = null;
    this.nextSky = null;
    this.currentScene = null;
  }
}
