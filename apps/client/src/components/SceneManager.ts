import { logger, perf, captureError } from "@/utils/logger";
import { config } from "@/utils/config";
import { VRScene } from "@/types/protocol";
import { AudioManager } from "./AudioManager";
import { useAppStore } from "@/store/appStore";

export class SceneManager {
  private aframeScene: any = null;
  private skyElement: any = null;
  private audioManager: AudioManager;
  private currentScene: VRScene | null = null;
  private isTransitioning = false;
  private floatingScreen: any = null;
  private ambientAudio: any = null;
  private lights: {
    ambient: any;
    directional1: any;
    directional2: any;
  } | null = null;

  constructor(
    // imageCache: Map<string, HTMLImageElement>,
    audioManager: AudioManager
  ) {
    // this.imageCache = imageCache;
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
        renderer="antialias: true; colorManagement: true; physicallyCorrectLights: true; gammaOutput: true; anisotropy: 16; precision: high"
        background="color: #000000"
      >
        <!-- Assets -->
        <a-assets>
          <!-- Panorama 360° assets -->
          <img id="escena-1-image" src="/photos/escena_1.png" crossorigin="anonymous"></img>
          <img id="escena-2-image" src="/photos/escena_2.png" crossorigin="anonymous"></img>
          <!-- Video assets -->
          <video id="escena-1-video" src="/videos/escena-1.mp4" preload="auto" loop="false" crossorigin="anonymous"></video>
          <!-- Audio assets -->
          <audio id="ambient-wind" src="/audio/ambient-wind.mp3" preload="auto" loop="true" volume="1.0"></audio>
        </a-assets>
        
   
        <!-- Camera -->
        <a-camera 
          id="main-camera"
          look-controls="enabled: true;"
          wasd-controls="enabled: false;"
          camera="active: true"
          position="0 -5 0"
          rotation="0 0 0"
        >
        </a-camera>
        

        
        <!-- Floating Screen for "Toma Uno" (inside 360 panorama) -->
        <a-plane 
          id="floating-screen"
          src="#escena-1-video"
          position="0 0 -2"
          width="3"
          height="1.6875"
          rotation="0 0 0"
          material="shader: flat; side: double"
          visible="false"
          floating-screen
        ></a-plane>
        
        <!-- Main sky sphere for 360 images (hidden by default) -->
        <a-sky 
          id="main-sky"
          radius="500"
          visible="false"
          material="transparent: false; side: back; shader: standard; roughness: 0.1; metalness: 0.0"
          geometry="primitive: sphere; radius: 500; segmentsWidth: 64; segmentsHeight: 32"
          seam-correction
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
    this.floatingScreen = document.querySelector("#floating-screen");
    this.ambientAudio = document.querySelector("#ambient-wind");

    // Get references to lights
    this.lights = {
      ambient: document.querySelector("#ambient-light"),
      directional1: document.querySelector("#directional-light-1"),
      directional2: document.querySelector("#directional-light-2"),
    };

    // Setup scene event listeners
    this.setupSceneEvents();

    // Set default 3D model as initial view
    this.setDefaultModel();

    // Expose ambient audio control globally for debugging
    (window as any).startAmbientAudio = () => {
      this.startAmbientAudioManually();
    };
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

  private setDefaultModel(): void {
    // Load panorama as default view instead of 3D model
    this.loadCityPanorama();
    logger.info("🏙️ Vista por defecto establecida: Panorama de la ciudad");
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

      // Floating screen component
      AFRAME.registerComponent("floating-screen", {
        init(this: any) {
          this.currentVideo = "#escena-1-video";
          this.isVisible = false;

          this.showVideo = (videoId: string) => {
            this.currentVideo = `#${videoId}`;
            this.el.setAttribute("src", this.currentVideo);
            this.el.setAttribute("visible", "true");
            this.isVisible = true;

            // Position screen inside the panorama (closer to camera)
            this.el.setAttribute("position", "0 0 -2");
            this.el.setAttribute("width", "3");
            this.el.setAttribute("height", "1.6875");

            // Start video playback
            const video = document.querySelector(
              this.currentVideo
            ) as unknown as HTMLVideoElement;
            if (video) {
              video.currentTime = 0;
              video.play().catch((error) => {
                console.warn(
                  "⚠️ No se pudo reproducir video en pantalla flotante:",
                  error
                );
              });
            }

            console.log(
              `📺 Pantalla flotante mostrando dentro del panorama 360°: ${videoId}`
            );
          };

          this.hide = () => {
            this.el.setAttribute("visible", "false");
            this.isVisible = false;

            // Stop video playback
            const video = document.querySelector(
              this.currentVideo
            ) as unknown as HTMLVideoElement;
            if (video) {
              video.pause();
              video.currentTime = 0;
            }

            console.log("📺 Pantalla flotante oculta");
          };

          // Expose methods globally for easy access
          (window as any).floatingScreen = this;
        },
      });

      // Apply components to camera
      const camera = document.querySelector("#main-camera");
      if (camera) {
        camera.setAttribute("constrained-look-controls", "");
      }
    }
  }

  /**
   * Resetea el estado de transición en caso de que se haya quedado colgado
   */
  public resetTransitionState(): void {
    logger.info("🔄 Reseteando estado de transición");
    this.isTransitioning = false;
    this.showLoading(false);
  }

  public async loadScene(scene: VRScene): Promise<void> {
    if (this.isTransitioning) {
      logger.warn(
        "⚠️ Ya hay una transición en curso, forzando reset del estado"
      );
      this.resetTransitionState();
    }

    try {
      this.isTransitioning = true;
      perf.mark(`scene-load-start-${scene.id}`);

      logger.info("🎬 Cargando escena:", scene.id, "-", scene.title);

      // Stop current scene if any
      if (this.currentScene) {
        logger.debug("⏹️ Deteniendo escena actual:", this.currentScene.id);
        this.stopCurrentScene();
      }

      // Show loading indicator
      logger.debug("⏳ Mostrando indicador de carga");
      this.showLoading(true);

      // Load audio first
      logger.debug("🎵 Cargando audio:", scene.audio);
      await this.audioManager.loadAudio(scene.audio);
      logger.debug("✅ Audio cargado exitosamente");

      // Load scene content (video or image)
      logger.debug("🖼️ Cargando contenido de escena...");
      await this.loadSceneContent(scene);
      logger.debug("✅ Contenido de escena cargado exitosamente");

      // Start ambient audio for scenes that use ambient-wind.mp3
      if (scene.audio === "audio/ambient-wind.mp3") {
        // Small delay to ensure everything is loaded
        setTimeout(() => {
          this.startAmbientAudio();
        }, 100);
      }

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

  private async loadSceneContent(scene: VRScene): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const assetPath = scene.image360;

        // Check if it's an image or video based on file extension
        if (
          assetPath.endsWith(".png") ||
          assetPath.endsWith(".jpg") ||
          assetPath.endsWith(".jpeg")
        ) {
          // Load as panorama 360° image
          this.loadPanoramaFromUrl(`/${assetPath}`);
          logger.info(`🖼️ Cargando imagen como panorama 360°: ${assetPath}`);
        } else if (assetPath.endsWith(".mp4") || assetPath.endsWith(".webm")) {
          // Load as video on floating screen
          this.showFloatingScreen(`${scene.id}-video`);
          logger.info(`🎬 Cargando video en pantalla flotante: ${assetPath}`);
        } else {
          logger.warn(`⚠️ Formato de archivo no reconocido: ${assetPath}`);
        }

        resolve();
      } catch (error) {
        logger.error("❌ Error cargando contenido de escena:", error);
        reject(error);
      }
    });
  }

  private loadPanorama360(imageAssetId: string): void {
    if (!this.skyElement) {
      logger.error("❌ Elemento sky principal no encontrado");
      return;
    }

    try {
      // Set the panorama image as sky texture
      this.skyElement.setAttribute("src", `#${imageAssetId}`);
      this.skyElement.setAttribute("visible", "true");

      // Configure camera for 360° exploration
      this.configureCameraForPanorama();

      logger.info(`🌅 Panorama 360° cargado: ${imageAssetId}`);
    } catch (error) {
      logger.error("❌ Error cargando panorama 360°:", error);
    }
  }

  private configureCameraForPanorama(): void {
    const camera = document.querySelector("#main-camera");
    if (camera) {
      // Position camera much lower for better city view
      camera.setAttribute("position", "0 -5 0");
      camera.setAttribute("rotation", "0 0 0");

      // Enable look controls for 360° exploration
      camera.setAttribute(
        "look-controls",
        "enabled: true; reverseMouseDrag: false;"
      );

      logger.info(
        "📹 Cámara configurada para exploración 360° desde altura más baja"
      );
    }
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
      // Keep camera slightly lower for better city view
      camera.setAttribute("position", "0 -5 0");
      camera.setAttribute("rotation", "0 0 0");

      logger.info(
        "📹 Cámara reseteada para panorama 360° desde altura más baja"
      );
    }
  }

  public setCameraRotation(rotation: string): void {
    const camera = document.querySelector("#main-camera");
    if (camera) {
      camera.setAttribute("rotation", rotation);
      logger.info(`📹 Rotación de cámara cambiada a: ${rotation}`);
    }
  }

  public getCameraInfo(): {
    position: string;
    rotation: string;
    attributes: string[];
  } | null {
    const camera = document.querySelector("#main-camera");
    if (camera) {
      return {
        position: camera.getAttribute("position") || "",
        rotation: camera.getAttribute("rotation") || "",
        attributes: camera.getAttributeNames(),
      };
    }
    return null;
  }

  public returnToDefaultModel(): void {
    // Hide floating screen
    this.hideFloatingScreen();

    // Stop ambient audio when returning to default view
    this.stopAmbientAudio();

    // Restore default lighting
    this.restoreDefaultLighting();

    // Load panorama as default view
    this.loadCityPanorama();

    // Clear current scene
    this.currentScene = null;
    useAppStore.getState().setCurrentScene(null);

    logger.info("🏙️ Volviendo al panorama de la ciudad por defecto");
  }

  public stopCurrentScene(): void {
    // Stop ambient audio when changing scenes
    this.stopAmbientAudio();

    // Hide floating screen
    this.hideFloatingScreen();

    logger.info("🛑 Escena actual detenida");
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
    this.currentScene = null;
    this.floatingScreen = null;
    this.ambientAudio = null;
    this.lights = null;
  }

  // Lighting Control Methods
  public reduceLightingForScene(): void {
    if (!this.lights) {
      logger.warn("⚠️ Referencias de luces no disponibles");
      return;
    }

    try {
      // Reducir intensidad de luz ambiente para ambiente más oscuro
      if (this.lights.ambient) {
        this.lights.ambient.setAttribute("intensity", "0.3");
      }

      // Reducir intensidad de luces direccionales
      if (this.lights.directional1) {
        this.lights.directional1.setAttribute("intensity", "0.5");
      }
      if (this.lights.directional2) {
        this.lights.directional2.setAttribute("intensity", "0.3");
      }

      logger.info("🌙 Iluminación reducida para escena");
    } catch (error) {
      logger.error("❌ Error reduciendo iluminación:", error);
    }
  }

  public restoreDefaultLighting(): void {
    if (!this.lights) {
      logger.warn("⚠️ Referencias de luces no disponibles");
      return;
    }

    try {
      // Restaurar intensidad original de luz ambiente
      if (this.lights.ambient) {
        this.lights.ambient.setAttribute("intensity", "0.8");
      }

      // Restaurar intensidad original de luces direccionales
      if (this.lights.directional1) {
        this.lights.directional1.setAttribute("intensity", "1.2");
      }
      if (this.lights.directional2) {
        this.lights.directional2.setAttribute("intensity", "0.7");
      }

      logger.info("☀️ Iluminación restaurada a valores por defecto");
    } catch (error) {
      logger.error("❌ Error restaurando iluminación:", error);
    }
  }

  public setLightingIntensity(
    ambientIntensity: number,
    directional1Intensity: number,
    directional2Intensity: number
  ): void {
    if (!this.lights) {
      logger.warn("⚠️ Referencias de luces no disponibles");
      return;
    }

    try {
      // Validar valores de intensidad (0.0 a 2.0)
      const clamp = (value: number) => Math.max(0.0, Math.min(2.0, value));

      if (this.lights.ambient) {
        this.lights.ambient.setAttribute(
          "intensity",
          clamp(ambientIntensity).toString()
        );
      }
      if (this.lights.directional1) {
        this.lights.directional1.setAttribute(
          "intensity",
          clamp(directional1Intensity).toString()
        );
      }
      if (this.lights.directional2) {
        this.lights.directional2.setAttribute(
          "intensity",
          clamp(directional2Intensity).toString()
        );
      }

      logger.info(
        `💡 Iluminación ajustada - Ambiente: ${ambientIntensity}, Direccional1: ${directional1Intensity}, Direccional2: ${directional2Intensity}`
      );
    } catch (error) {
      logger.error("❌ Error ajustando iluminación:", error);
    }
  }

  public getLightingInfo(): {
    ambient: { intensity: number; color: string };
    directional1: { intensity: number; color: string; position: string };
    directional2: { intensity: number; color: string; position: string };
  } | null {
    if (!this.lights) {
      return null;
    }

    try {
      return {
        ambient: {
          intensity: parseFloat(
            this.lights.ambient?.getAttribute("intensity") || "0"
          ),
          color: this.lights.ambient?.getAttribute("color") || "#000000",
        },
        directional1: {
          intensity: parseFloat(
            this.lights.directional1?.getAttribute("intensity") || "0"
          ),
          color: this.lights.directional1?.getAttribute("color") || "#000000",
          position:
            this.lights.directional1?.getAttribute("position") || "0 0 0",
        },
        directional2: {
          intensity: parseFloat(
            this.lights.directional2?.getAttribute("intensity") || "0"
          ),
          color: this.lights.directional2?.getAttribute("color") || "#000000",
          position:
            this.lights.directional2?.getAttribute("position") || "0 0 0",
        },
      };
    } catch (error) {
      logger.error("❌ Error obteniendo información de iluminación:", error);
      return null;
    }
  }

  // Ambient Audio Control Methods
  private startAmbientAudio(): void {
    if (!this.ambientAudio) {
      logger.warn("⚠️ Referencia de audio ambiental no disponible");
      return;
    }

    try {
      // Set volume to maximum level (1.0 = 100%)
      this.ambientAudio.volume = 1.0;

      // Ensure loop is enabled
      this.ambientAudio.loop = true;

      // Start playing the ambient wind audio
      this.ambientAudio.currentTime = 0;

      const playPromise = this.ambientAudio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            logger.info(
              "🌬️ Audio ambiental de viento iniciado al 100% de volumen"
            );
          })
          .catch((error: any) => {
            logger.warn("⚠️ No se pudo reproducir audio ambiental:", error);
            // Try again after a short delay
            setTimeout(() => {
              this.startAmbientAudio();
            }, 500);
          });
      }
    } catch (error) {
      logger.error("❌ Error iniciando audio ambiental:", error);
    }
  }

  private stopAmbientAudio(): void {
    if (!this.ambientAudio) {
      logger.warn("⚠️ Referencia de audio ambiental no disponible");
      return;
    }

    try {
      // Stop and reset ambient audio
      this.ambientAudio.pause();
      this.ambientAudio.currentTime = 0;

      logger.info("🔇 Audio ambiental detenido");
    } catch (error) {
      logger.error("❌ Error deteniendo audio ambiental:", error);
    }
  }

  public setAmbientAudioVolume(volume: number): void {
    if (!this.ambientAudio) {
      logger.warn("⚠️ Referencia de audio ambiental no disponible");
      return;
    }

    try {
      // Clamp volume between 0.0 and 1.0
      const clampedVolume = Math.max(0.0, Math.min(1.0, volume));
      this.ambientAudio.volume = clampedVolume;

      logger.info(
        `🔊 Volumen de audio ambiental ajustado a: ${(clampedVolume * 100).toFixed(0)}%`
      );
    } catch (error) {
      logger.error("❌ Error ajustando volumen de audio ambiental:", error);
    }
  }

  public getAmbientAudioInfo(): {
    playing: boolean;
    volume: number;
    currentTime: number;
    duration: number;
  } | null {
    if (!this.ambientAudio) {
      return null;
    }

    try {
      return {
        playing: !this.ambientAudio.paused,
        volume: this.ambientAudio.volume,
        currentTime: this.ambientAudio.currentTime,
        duration: this.ambientAudio.duration || 0,
      };
    } catch (error) {
      logger.error(
        "❌ Error obteniendo información de audio ambiental:",
        error
      );
      return null;
    }
  }

  public startAmbientAudioManually(): void {
    logger.info("🔊 Iniciando audio ambiental manualmente...");
    this.startAmbientAudio();
  }

  // Panorama 360° Control Methods
  public loadCityPanorama(): void {
    this.loadPanorama("city-panorama");
  }

  public loadPanorama(imageAssetId: string): void {
    this.loadPanorama360(imageAssetId);
    logger.info(
      `🌅 Panorama 360° activado: ${imageAssetId} - puedes girar para explorar el escenario`
    );
  }

  // Convenience methods for specific panoramas
  public loadPlayaPanorama(): void {
    this.loadPanorama("playa-panorama");
  }

  public loadMontanaPanorama(): void {
    this.loadPanorama("montana-panorama");
  }

  public loadCiudadPanorama(): void {
    this.loadPanorama("ciudad-panorama");
  }

  public loadPanoramaFromUrl(imageUrl: string): void {
    if (!this.skyElement) {
      logger.error("❌ Elemento sky principal no encontrado");
      return;
    }

    try {
      // Set the panorama image directly from URL
      this.skyElement.setAttribute("src", imageUrl);
      this.skyElement.setAttribute("visible", "true");

      // Configure camera for 360° exploration
      this.configureCameraForPanorama();

      logger.info(
        `🌅 Panorama 360° cargado desde URL: ${imageUrl} - puedes girar para explorar el escenario`
      );
    } catch (error) {
      logger.error("❌ Error cargando panorama desde URL:", error);
    }
  }

  public exitPanoramaMode(): void {
    if (this.skyElement) {
      this.skyElement.setAttribute("visible", "false");
    }

    logger.info("🏠 Modo panorama desactivado - mostrando modelo 3D");
  }

  public isPanoramaModeActive(): boolean {
    return this.skyElement?.getAttribute("visible") === "true";
  }

  // Floating Screen Control Methods
  public showFloatingScreen(videoId: string = "escena-1-video"): void {
    if (this.floatingScreen) {
      const component = (this.floatingScreen as any).components[
        "floating-screen"
      ];
      if (component && component.showVideo) {
        component.showVideo(videoId);
        logger.info(
          `📺 Pantalla flotante mostrada dentro del panorama 360° con video: ${videoId}`
        );
      } else {
        // Fallback method
        this.floatingScreen.setAttribute("src", `#${videoId}`);
        this.floatingScreen.setAttribute("visible", "true");

        // Position screen inside the panorama (closer to camera)
        this.floatingScreen.setAttribute("position", "0 0 -2");
        this.floatingScreen.setAttribute("width", "3");
        this.floatingScreen.setAttribute("height", "1.6875");

        // Start video playback
        const video = document.querySelector(`#${videoId}`) as HTMLVideoElement;
        if (video) {
          video.currentTime = 0;
          video.play().catch((error) => {
            logger.warn(
              "⚠️ No se pudo reproducir video en pantalla flotante:",
              error
            );
          });
        }

        logger.info(
          `📺 Pantalla flotante mostrada dentro del panorama 360° con video: ${videoId}`
        );
      }
    }
  }

  public hideFloatingScreen(): void {
    if (this.floatingScreen) {
      const component = (this.floatingScreen as any).components[
        "floating-screen"
      ];
      if (component && component.hide) {
        component.hide();
        logger.info("📺 Pantalla flotante oculta");
      } else {
        // Fallback method
        this.floatingScreen.setAttribute("visible", "false");

        // Stop video playback
        const videoSrc = this.floatingScreen.getAttribute("src");
        if (videoSrc && videoSrc.startsWith("#")) {
          const video = document.querySelector(
            videoSrc
          ) as unknown as HTMLVideoElement;
          if (video) {
            video.pause();
            video.currentTime = 0;
          }
        }

        logger.info("📺 Pantalla flotante oculta");
      }
    }
  }

  public setFloatingScreenPosition(x: number, y: number, z: number): void {
    if (this.floatingScreen) {
      this.floatingScreen.setAttribute("position", `${x} ${y} ${z}`);
      logger.info(
        `📍 Posición de pantalla flotante cambiada a: ${x}, ${y}, ${z}`
      );
    }
  }

  public setFloatingScreenSize(width: number, height: number): void {
    if (this.floatingScreen) {
      this.floatingScreen.setAttribute("width", width.toString());
      this.floatingScreen.setAttribute("height", height.toString());
      logger.info(
        `📐 Tamaño de pantalla flotante cambiado a: ${width}x${height}`
      );
    }
  }

  public isFloatingScreenVisible(): boolean {
    return this.floatingScreen?.getAttribute("visible") === "true";
  }

  public getFloatingScreenInfo(): {
    visible: boolean;
    src: string;
    position: string;
    size: { width: number; height: number };
  } | null {
    if (this.floatingScreen) {
      return {
        visible: this.floatingScreen.getAttribute("visible") === "true",
        src: this.floatingScreen.getAttribute("src") || "",
        position: this.floatingScreen.getAttribute("position") || "",
        size: {
          width: parseFloat(this.floatingScreen.getAttribute("width") || "4"),
          height: parseFloat(
            this.floatingScreen.getAttribute("height") || "2.25"
          ),
        },
      };
    }
    return null;
  }
}
