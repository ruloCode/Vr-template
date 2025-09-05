import { logger, perf, captureError } from "@/utils/logger";
import { config } from "@/utils/config";
import { VRScene } from "@/types/protocol";
import { AudioManager } from "./AudioManager";
import { useAppStore } from "@/store/appStore";

export class SceneManager {
  private aframeScene: any = null;
  private skyElement: any = null;
  // private currentSky: any = null;
  private nextSky: any = null;
  // private imageCache: Map<string, HTMLImageElement>;
  private audioManager: AudioManager;
  private currentScene: VRScene | null = null;
  private isTransitioning = false;
  private defaultModel: any = null;
  private videoElement: any = null;
  private cinemaScreen: any = null;
  private ambientAudio: any = null;
  private lights: {
    ambient: any;
    directional1: any;
    directional2: any;
    screen: any;
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
        renderer="antialias: true; colorManagement: true; physicallyCorrectLights: true; gammaOutput: true"
        background="color: #000000"
      >
        <!-- Assets -->
        <a-assets>
          <!-- Model assets -->
          <a-asset-item id="default-model" src="/models/theater_cinema.glb"></a-asset-item>
          <!-- Image assets for cinema screen -->
          <img id="forest-screen" src="/panos/forest.jpg" crossorigin="anonymous"></img>
          <img id="grass-screen" src="/panos/grass.jpg" crossorigin="anonymous"></img>
          <img id="escena1-screen" src="/panos/escena1_8k.jpg" crossorigin="anonymous"></img>
          <!-- Video assets -->
          <video id="escena-1-video" src="/videos/escena-1.mp4" preload="auto" loop="false" crossorigin="anonymous"></video>
          <video id="escena-escena-1-video" src="/videos/escena-1.mp4" preload="auto" loop="false" crossorigin="anonymous"></video>
          <video id="escena-2-video" src="/videos/placeholder.mp4" preload="auto" loop="false" crossorigin="anonymous"></video>
          <video id="escena-3-video" src="/videos/placeholder.mp4" preload="auto" loop="false" crossorigin="anonymous"></video>
          <video id="escena-4-video" src="/videos/placeholder.mp4" preload="auto" loop="false" crossorigin="anonymous"></video>
          <video id="escena-5-video" src="/videos/placeholder.mp4" preload="auto" loop="false" crossorigin="anonymous"></video>
          <video id="escena-6-video" src="/videos/placeholder.mp4" preload="auto" loop="false" crossorigin="anonymous"></video>
          <video id="escena-7-video" src="/videos/placeholder.mp4" preload="auto" loop="false" crossorigin="anonymous"></video>
          <video id="escena-8-video" src="/videos/placeholder.mp4" preload="auto" loop="false" crossorigin="anonymous"></video>
          <!-- Audio assets -->
          <audio id="ambient-wind" src="/audio/ambient-wind.mp3" preload="auto" loop="true"></audio>
        </a-assets>
        
        <!-- Lighting -->
        <a-light id="ambient-light" type="ambient" color="#606060" intensity="0.6"></a-light>
        <a-light id="directional-light-1" type="directional" color="#ffffff" intensity="1.0" position="0 5 5"></a-light>
        <a-light id="directional-light-2" type="directional" color="#ffffff" intensity="0.5" position="0 -5 5"></a-light>
        <a-light id="screen-light" type="spot" color="#ffffff" intensity="0" position="0 135 328" target="#default-model-entity" angle="60" penumbra="0.5" visible="false"></a-light>
        
        <!-- Camera -->
        <a-camera 
          id="main-camera"
          look-controls="enabled: true;"
          wasd-controls="enabled: true; acceleration: 600; adAxis: x; adInverted: false; wsAxis: z; wsInverted: false; fly: true; easing: 20;"
          camera="active: true"
          position="0 120 0"
          rotation="0 0 0"
        >
        </a-camera>
        
        <!-- Default 3D Model (shown by default) -->
        <a-entity w
          id="default-model-entity"
          gltf-model="#default-model"
          position="0 2.0 -6"
          scale="0.8 0.8 0.8"
          rotation="0 0 0"
          visible="true"
        ></a-entity>
        
        <!-- Cinema Screen with Forest Image -->
        <a-plane 
          id="cinema-screen"
          src="#forest-screen"
          position="0 135 328"
          width="450"
          height="270"
          rotation="0 0 0"
          material="shader: flat; side: double"
          visible="true"
          cinema-screen
        ></a-plane>
        
        <!-- Video sphere for scenes (hidden by default) -->
        <a-video 
          id="video-sphere"
          src="#escena-1-video"
          position="0 0 0"
          radius="500"
          phi-start="0"
          phi-length="360"
          theta-start="0"
          theta-length="180"
          visible="false"
          material="side: back"
        ></a-video>
        
        <!-- Main sky sphere for 360 images (hidden by default) -->
    
        
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
    // this.currentSky = this.skyElement;
    this.nextSky = document.querySelector("#transition-sky");
    this.defaultModel = document.querySelector("#default-model-entity");
    this.videoElement = document.querySelector("#video-sphere");
    this.cinemaScreen = document.querySelector("#cinema-screen");
    this.ambientAudio = document.querySelector("#ambient-wind");

    // Get references to lights
    this.lights = {
      ambient: document.querySelector("#ambient-light"),
      directional1: document.querySelector("#directional-light-1"),
      directional2: document.querySelector("#directional-light-2"),
      screen: document.querySelector("#screen-light"),
    };

    // Setup scene event listeners
    this.setupSceneEvents();

    // Set default 3D model as initial view
    this.setDefaultModel();
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
    if (this.defaultModel) {
      this.defaultModel.setAttribute("visible", "true");
      logger.info("🎭 Modelo 3D por defecto establecido: theater_cinema.glb");
    }

    // Hide other elements
    if (this.videoElement) {
      this.videoElement.setAttribute("visible", "false");
    }
    if (this.skyElement) {
      this.skyElement.setAttribute("visible", "false");
    }

    // Configure initial camera position
    // this.configureInitialCamera();

    // Center camera on model after a short delay
    setTimeout(() => {
      this.resetCameraToModel();
    }, 500);
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

      // Enhanced WASD controls with faster movement
      AFRAME.registerComponent("enhanced-wasd-controls", {
        init(this: any) {
          this.moveSpeed = 1.5; // 3x faster movement speed (was 0.5)
          this.rotationSpeed = 0.3; // 3x faster rotation (was 0.1)
          this.keys = {};

          // Key event listeners
          document.addEventListener("keydown", (event) => {
            this.keys[event.code] = true;
          });

          document.addEventListener("keyup", (event) => {
            this.keys[event.code] = false;
          });

          // Movement update loop
          this.tick = this.tick.bind(this);
        },

        tick(this: any) {
          const position = this.el.getAttribute("position");
          const rotation = this.el.getAttribute("rotation");
          const yRad = (rotation.y * Math.PI) / 180;

          let moved = false;

          // Forward/Backward (W/S)
          if (this.keys["KeyW"]) {
            position.x -= Math.sin(yRad) * this.moveSpeed;
            position.z -= Math.cos(yRad) * this.moveSpeed;
            moved = true;
          }
          if (this.keys["KeyS"]) {
            position.x += Math.sin(yRad) * this.moveSpeed;
            position.z += Math.cos(yRad) * this.moveSpeed;
            moved = true;
          }

          // Left/Right (A/D)
          if (this.keys["KeyA"]) {
            position.x -= Math.cos(yRad) * this.moveSpeed;
            position.z += Math.sin(yRad) * this.moveSpeed;
            moved = true;
          }
          if (this.keys["KeyD"]) {
            position.x += Math.cos(yRad) * this.moveSpeed;
            position.z -= Math.sin(yRad) * this.moveSpeed;
            moved = true;
          }

          // Up/Down (Q/E) - Enhanced for flying mode
          if (this.keys["KeyQ"]) {
            position.y += this.moveSpeed * 1.2; // Slightly faster vertical movement
            moved = true;
          }
          if (this.keys["KeyE"]) {
            position.y -= this.moveSpeed * 1.2; // Slightly faster vertical movement
            moved = true;
          }

          // Rotation with mouse (hold right click)
          if (this.keys["Mouse2"]) {
            // Mouse rotation logic would go here
            // For now, we'll use the default look controls
          }

          if (moved) {
            this.el.setAttribute("position", position);
          }
        },
      });

      // Cinema screen component
      AFRAME.registerComponent("cinema-screen", {
        init(this: any) {
          this.currentImage = "#forest-screen";
          this.images = {
            forest: "#forest-screen",
            grass: "#grass-screen",
            escena1: "#escena1-screen",
          };

          this.changeImage = (imageName: string) => {
            if (this.images[imageName]) {
              this.currentImage = this.images[imageName];
              this.el.setAttribute("src", this.currentImage);
              console.log(`🎬 Pantalla cambiada a: ${imageName}`);
            }
          };

          // Expose methods globally for easy access
          (window as any).cinemaScreen = this;
        },
      });

      // Model centering component
      AFRAME.registerComponent("model-center", {
        init(this: any) {
          this.centerOnModel = () => {
            const model = document.querySelector("#default-model-entity");
            if (model) {
              const modelPos = model.getAttribute("position") as any;
              const cameraPos = this.el.getAttribute("position") as any;

              // Calculate direction to model
              const dirX = modelPos.x - cameraPos.x;
              const dirY = modelPos.y - cameraPos.y;
              const dirZ = modelPos.z - cameraPos.z;

              // Calculate rotation to look at model
              const angleY = Math.atan2(dirX, dirZ) * (180 / Math.PI);
              const distance = Math.sqrt(dirX * dirX + dirZ * dirZ);
              const angleX = -Math.atan2(dirY, distance) * (180 / Math.PI);

              // Apply rotation with a better downward tilt for higher viewing angle
              this.el.setAttribute("rotation", `${angleX - 10} ${angleY} 0`);
            }
          };

          // Center on model after a delay
          setTimeout(() => {
            this.centerOnModel();
          }, 1500);
        },
      });

      // Apply components to camera
      const camera = document.querySelector("#main-camera");
      if (camera) {
        camera.setAttribute("constrained-look-controls", "");
        camera.setAttribute("model-center", "");
        camera.setAttribute("enhanced-wasd-controls", "");
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

      // Load video scene
      await this.loadVideoScene(scene);

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

  private async loadVideoScene(scene: VRScene): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Check if this is "Escena 1: Riqueza Natural" to show video on cinema screen
        const isEscena1 =
          scene.id === "escena-1" || scene.title?.includes("Riqueza Natural");

        if (isEscena1) {
          // For Escena 1, show video on cinema screen instead of hiding it
          this.loadVideoOnCinemaScreen(scene);
        } else {
          // For other scenes, use the original video sphere method
          this.loadVideoOnSphere(scene);
        }

        resolve();
      } catch (error) {
        logger.error("❌ Error cargando video:", error);
        reject(error);
      }
    });
  }

  private loadVideoOnCinemaScreen(scene: VRScene): void {
    // Keep default model visible (cinema theater stays)
    if (this.defaultModel) {
      this.defaultModel.setAttribute("visible", "true");
    }

    // Hide sky elements
    if (this.skyElement) {
      this.skyElement.setAttribute("visible", "false");
    }
    if (this.nextSky) {
      this.nextSky.setAttribute("visible", "false");
    }

    // Hide video sphere
    if (this.videoElement) {
      this.videoElement.setAttribute("visible", "false");
    }

    // Reduce lighting for better cinema experience
    this.reduceLightingForScene();

    // Start ambient wind audio for Escena 1
    this.startAmbientAudio();

    // Show cinema screen with video
    if (this.cinemaScreen) {
      this.cinemaScreen.setAttribute("visible", "true");

      // Set video as source for cinema screen
      const videoSrc = `#${scene.id}-video`;
      this.cinemaScreen.setAttribute("src", videoSrc);

      // Start video playback
      const video = document.querySelector(videoSrc) as HTMLVideoElement;
      if (video) {
        video.currentTime = 0;
        video.play().catch((error) => {
          logger.warn(
            "⚠️ No se pudo reproducir video en pantalla del cine:",
            error
          );
        });
      } else {
        logger.warn("⚠️ Elemento de video no encontrado:", videoSrc);
      }
    }

    logger.info("🎬 Video cargado en pantalla del cine para:", scene.id);
  }

  private loadVideoOnSphere(scene: VRScene): void {
    // Hide default model
    if (this.defaultModel) {
      this.defaultModel.setAttribute("visible", "false");
    }

    // Hide sky elements
    if (this.skyElement) {
      this.skyElement.setAttribute("visible", "false");
    }
    if (this.nextSky) {
      this.nextSky.setAttribute("visible", "false");
    }

    // Hide cinema screen
    if (this.cinemaScreen) {
      this.cinemaScreen.setAttribute("visible", "false");
    }

    // Reduce lighting for immersive video experience
    this.reduceLightingForScene();

    // Show video sphere
    if (this.videoElement) {
      this.videoElement.setAttribute("visible", "true");

      // Set video source based on scene ID
      // Handle both "escena-1" and "1" formats
      let videoSrc;
      if (scene.id.startsWith("escena-")) {
        videoSrc = `#${scene.id}-video`;
      } else {
        videoSrc = `#escena-${scene.id}-video`;
      }

      this.videoElement.setAttribute("src", videoSrc);

      // Start video playback
      const video = document.querySelector(videoSrc) as HTMLVideoElement;
      if (video) {
        video.currentTime = 0;
        video.play().catch((error) => {
          logger.warn("⚠️ No se pudo reproducir video automáticamente:", error);
        });
      } else {
        logger.warn("⚠️ Elemento de video no encontrado:", videoSrc);
        // Try alternative video element
        const altVideo = document.querySelector(
          "#escena-1-video"
        ) as HTMLVideoElement;
        if (altVideo) {
          this.videoElement.setAttribute("src", "#escena-1-video");
          altVideo.currentTime = 0;
          altVideo.play().catch((error) => {
            logger.warn("⚠️ No se pudo reproducir video alternativo:", error);
          });
        }
      }
    } else {
      logger.error("❌ Elemento video-sphere no encontrado");
    }

    logger.info("🎥 Video cargado para escena:", scene.id);
  }

  // private applySkyTexture(
  //   textureUrl: string,
  //   fadeDuration: number = 1.0
  // ): void {
  //   if (!this.currentSky || !this.nextSky) {
  //     logger.error("❌ Sky elements no encontrados");
  //     return;
  //   }

  //   // Set texture on next sky
  //   this.nextSky.setAttribute(
  //     "material",
  //     `src: ${textureUrl}; transparent: true; opacity: 0`
  //   );
  //   this.nextSky.setAttribute("visible", "true");

  //   // Animate crossfade
  //   this.animateCrossfade(fadeDuration * 1000);
  // }

  // private animateCrossfade(durationMs: number): void {
  //   if (!this.currentSky || !this.nextSky) return;

  //   const startTime = performance.now();

  //   const animate = (currentTime: number) => {
  //     const elapsed = currentTime - startTime;
  //     const progress = Math.min(elapsed / durationMs, 1);

  //     // Smooth easing function
  //     const eased = progress * progress * (3 - 2 * progress);

  //     // Fade out current, fade in next
  //     this.currentSky.setAttribute("material", `opacity: ${1 - eased}`);
  //     this.nextSky.setAttribute("material", `opacity: ${eased}`);

  //     if (progress < 1) {
  //       requestAnimationFrame(animate);
  //     } else {
  //       // Swap sky references
  //       this.currentSky.setAttribute("visible", "false");
  //       [this.currentSky, this.nextSky] = [this.nextSky, this.currentSky];

  //       logger.debug("🔄 Crossfade completado");
  //     }
  //   };

  //   requestAnimationFrame(animate);
  // }

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
      // Cambiar la posición de la cámara en tiempo real
      camera.setAttribute("position", "0 5 0"); // Elevar más
      camera.setAttribute("position", "0 3 0"); // Bajar un poco

      // Cambiar la rotación
      camera.setAttribute("rotation", "0 0 0"); // Resetear
      camera.setAttribute("rotation", "0 45 0"); // Girar 45 grados

      logger.info("📹 Cámara reseteada con nueva configuración");
    }
  }

  public setCameraPosition(position: string): void {
    const camera = document.querySelector("#main-camera");
    if (camera) {
      camera.setAttribute("position", position);
      logger.info(`📹 Posición de cámara cambiada a: ${position}`);
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

  public setMovementSpeed(speed: number): void {
    const camera = document.querySelector("#main-camera");
    if (camera) {
      const enhancedControls = (camera as any).components[
        "enhanced-wasd-controls"
      ];
      if (enhancedControls) {
        enhancedControls.moveSpeed = speed;
        logger.info(`🏃 Velocidad de movimiento cambiada a: ${speed}`);
      } else {
        // Update the wasd-controls component speed
        camera.setAttribute(
          "wasd-controls",
          `acceleration: ${speed * 100}; easing: 20;`
        );
        logger.info(`🏃 Velocidad de wasd-controls cambiada a: ${speed * 100}`);
      }
    }
  }

  public enableSuperFastFlying(): void {
    const camera = document.querySelector("#main-camera");
    if (camera) {
      // Set maximum speed for flying mode
      camera.setAttribute(
        "wasd-controls",
        "enabled: true; acceleration: 1000; adAxis: x; adInverted: false; wsAxis: z; wsInverted: false; fly: true; easing: 10;"
      );

      // Update enhanced controls if available
      const enhancedControls = (camera as any).components[
        "enhanced-wasd-controls"
      ];
      if (enhancedControls) {
        enhancedControls.moveSpeed = 3.0; // Super fast
        enhancedControls.rotationSpeed = 0.5;
      }

      logger.info("🚀 Modo volar súper rápido activado!");
    }
  }

  private resetCameraToModel(): void {
    const camera = document.querySelector("#main-camera");
    if (camera) {
      // Cambiar la posición de la cámara en tiempo real
      camera.setAttribute("position", "0 5 0"); // Elevar más
      camera.setAttribute("position", "0 3 0"); // Bajar un poco

      // Cambiar la rotación
      camera.setAttribute("rotation", "0 0 0"); // Resetear
      camera.setAttribute("rotation", "0 45 0"); // Girar 45 grados

      // Trigger the model-center component to recalculate
      const modelCenterComponent = (camera as any).components["model-center"];
      if (modelCenterComponent && modelCenterComponent.centerOnModel) {
        setTimeout(() => {
          modelCenterComponent.centerOnModel();
        }, 200);
      }

      logger.info("📹 Cámara centrada en el modelo con nueva configuración");
    }
  }

  public returnToDefaultModel(): void {
    // Hide video sphere
    if (this.videoElement) {
      this.videoElement.setAttribute("visible", "false");

      // Stop video playback
      const video = this.videoElement.getAttribute("src");
      if (video) {
        const videoElement = document.querySelector(video) as any;
        if (videoElement) {
          videoElement.pause();
          videoElement.currentTime = 0;
        }
      }
    }

    // Hide sky elements
    if (this.skyElement) {
      this.skyElement.setAttribute("visible", "false");
    }
    if (this.nextSky) {
      this.nextSky.setAttribute("visible", "false");
    }

    // Show default model
    if (this.defaultModel) {
      this.defaultModel.setAttribute("visible", "true");
    }

    // Show cinema screen with default image
    if (this.cinemaScreen) {
      this.cinemaScreen.setAttribute("visible", "true");

      // Stop any video that might be playing on cinema screen
      const videoSrc = this.cinemaScreen.getAttribute("src");
      if (videoSrc && videoSrc.startsWith("#")) {
        const video = document.querySelector(
          videoSrc
        ) as unknown as HTMLVideoElement;
        if (video) {
          video.pause();
          video.currentTime = 0;
        }
      }

      // Reset to default forest image
      this.cinemaScreen.setAttribute("src", "#forest-screen");
    }

    // Stop ambient audio when returning to default model
    this.stopAmbientAudio();

    // Restore default lighting when returning to model
    this.restoreDefaultLighting();

    // Reset camera to center on model
    this.resetCameraToModel();

    // Clear current scene
    this.currentScene = null;
    useAppStore.getState().setCurrentScene(null);

    logger.info("🎭 Volviendo al modelo 3D por defecto con pantalla de cine");
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
    // this.currentSky = null;
    this.nextSky = null;
    this.currentScene = null;
    this.cinemaScreen = null;
    this.ambientAudio = null;
    this.lights = null;
  }

  // Cinema Screen Control Methods
  public showCinemaScreen(show: boolean = true): void {
    if (this.cinemaScreen) {
      this.cinemaScreen.setAttribute("visible", show.toString());
      logger.info(`🎬 Pantalla del cine ${show ? "mostrada" : "oculta"}`);
    }
  }

  public setCinemaScreenImage(imagePath: string): void {
    if (this.cinemaScreen) {
      this.cinemaScreen.setAttribute("src", imagePath);
      logger.info(`🖼️ Imagen de pantalla del cine cambiada a: ${imagePath}`);
    }
  }

  public setCinemaScreenSize(width: number, height: number): void {
    if (this.cinemaScreen) {
      this.cinemaScreen.setAttribute("width", width.toString());
      this.cinemaScreen.setAttribute("height", height.toString());
      logger.info(
        `📐 Tamaño de pantalla del cine cambiado a: ${width}x${height}`
      );
    }
  }

  public setCinemaScreenPosition(x: number, y: number, z: number): void {
    if (this.cinemaScreen) {
      this.cinemaScreen.setAttribute("position", `${x} ${y} ${z}`);
      logger.info(
        `📍 Posición de pantalla del cine cambiada a: ${x}, ${y}, ${z}`
      );
    }
  }

  public setCinemaScreenToDefault(): void {
    if (this.cinemaScreen) {
      this.cinemaScreen.setAttribute("position", "0 135 328");
      this.cinemaScreen.setAttribute("width", "450");
      this.cinemaScreen.setAttribute("height", "270");
      logger.info("🎬 Pantalla del cine configurada en posición por defecto");
    }
  }

  public getCinemaScreenInfo(): {
    visible: boolean;
    src: string;
    position: string;
    size: { width: number; height: number };
  } | null {
    if (this.cinemaScreen) {
      return {
        visible: this.cinemaScreen.getAttribute("visible") || false,
        src: this.cinemaScreen.getAttribute("src") || "",
        position: this.cinemaScreen.getAttribute("position") || "",
        size: {
          width: this.cinemaScreen.getAttribute("width") || 450,
          height: this.cinemaScreen.getAttribute("height") || 270,
        },
      };
    }
    return null;
  }

  public changeCinemaScreenImage(imageName: string): void {
    if (this.cinemaScreen) {
      const component = (this.cinemaScreen as any).components["cinema-screen"];
      if (component && component.changeImage) {
        component.changeImage(imageName);
        logger.info(`🎬 Imagen de pantalla del cine cambiada a: ${imageName}`);
      } else {
        // Fallback method
        const images: { [key: string]: string } = {
          forest: "#forest-screen",
          grass: "#grass-screen",
          escena1: "#escena1-screen",
        };

        if (images[imageName]) {
          this.cinemaScreen.setAttribute("src", images[imageName]);
          logger.info(
            `🎬 Imagen de pantalla del cine cambiada a: ${imageName}`
          );
        } else {
          logger.warn(`⚠️ Imagen no encontrada: ${imageName}`);
        }
      }
    }
  }

  public playVideoOnCinemaScreen(videoId: string): void {
    if (this.cinemaScreen) {
      // Show cinema screen
      this.cinemaScreen.setAttribute("visible", "true");

      // Set video as source
      const videoSrc = `#${videoId}`;
      this.cinemaScreen.setAttribute("src", videoSrc);

      // Start video playback
      const video = document.querySelector(videoSrc) as HTMLVideoElement;
      if (video) {
        video.currentTime = 0;
        video.play().catch((error) => {
          logger.warn(
            "⚠️ No se pudo reproducir video en pantalla del cine:",
            error
          );
        });
        logger.info(`🎬 Video ${videoId} reproduciéndose en pantalla del cine`);
      } else {
        logger.warn(`⚠️ Video no encontrado: ${videoId}`);
      }
    }
  }

  public stopCinemaScreenVideo(): void {
    if (this.cinemaScreen) {
      const videoSrc = this.cinemaScreen.getAttribute("src");
      if (videoSrc && videoSrc.startsWith("#")) {
        const video = document.querySelector(
          videoSrc
        ) as unknown as HTMLVideoElement;
        if (video) {
          video.pause();
          video.currentTime = 0;
          logger.info("⏹️ Video detenido en pantalla del cine");
        }
      }

      // Reset to default forest image
      this.cinemaScreen.setAttribute("src", "#forest-screen");
    }
  }

  // Lighting Control Methods
  public reduceLightingForScene(): void {
    if (!this.lights) {
      logger.warn("⚠️ Referencias de luces no disponibles");
      return;
    }

    try {
      // Reducir intensidad de luz ambiente a casi cero para ambiente muy oscuro
      if (this.lights.ambient) {
        this.lights.ambient.setAttribute("intensity", "0.05");
      }

      // Reducir intensidad de luces direccionales generales
      if (this.lights.directional1) {
        this.lights.directional1.setAttribute("intensity", "0.1");
      }
      if (this.lights.directional2) {
        this.lights.directional2.setAttribute("intensity", "0.1");
      }

      // Crear luz que emane de la pantalla del cine
      this.createScreenLighting();

      logger.info("🌙 Iluminación reducida para escena con efecto de pantalla");
    } catch (error) {
      logger.error("❌ Error reduciendo iluminación:", error);
    }
  }

  private createScreenLighting(): void {
    if (!this.lights?.screen) {
      logger.warn("⚠️ Referencia de luz de pantalla no disponible");
      return;
    }

    try {
      // Activar luz de pantalla con intensidad moderada
      this.lights.screen.setAttribute("intensity", "0.8");
      this.lights.screen.setAttribute("visible", "true");

      // Ajustar color para que sea más cálido, como luz de pantalla
      this.lights.screen.setAttribute("color", "#f0f0f0");

      // Posicionar la luz justo en la pantalla del cine
      this.lights.screen.setAttribute("position", "0 135 328");

      // Apuntar hacia el modelo 3D para iluminarlo desde la pantalla
      this.lights.screen.setAttribute("target", "#default-model-entity");

      // Configurar ángulo y penumbra para efecto más realista
      this.lights.screen.setAttribute("angle", "45");
      this.lights.screen.setAttribute("penumbra", "0.3");

      logger.info("🎬 Luz de pantalla activada para efecto cinematográfico");
    } catch (error) {
      logger.error("❌ Error creando iluminación de pantalla:", error);
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
        this.lights.ambient.setAttribute("intensity", "0.6");
      }

      // Restaurar intensidad original de luces direccionales
      if (this.lights.directional1) {
        this.lights.directional1.setAttribute("intensity", "1.0");
      }
      if (this.lights.directional2) {
        this.lights.directional2.setAttribute("intensity", "0.5");
      }

      // Desactivar luz de pantalla
      if (this.lights.screen) {
        this.lights.screen.setAttribute("intensity", "0");
        this.lights.screen.setAttribute("visible", "false");
      }

      logger.info("☀️ Iluminación restaurada a valores por defecto");
    } catch (error) {
      logger.error("❌ Error restaurando iluminación:", error);
    }
  }

  public setLightingIntensity(
    ambientIntensity: number,
    directional1Intensity: number,
    directional2Intensity: number,
    screenIntensity?: number
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
      if (this.lights.screen && screenIntensity !== undefined) {
        this.lights.screen.setAttribute(
          "intensity",
          clamp(screenIntensity).toString()
        );
        this.lights.screen.setAttribute(
          "visible",
          screenIntensity > 0 ? "true" : "false"
        );
      }

      logger.info(
        `💡 Iluminación ajustada - Ambiente: ${ambientIntensity}, Direccional1: ${directional1Intensity}, Direccional2: ${directional2Intensity}, Pantalla: ${screenIntensity || "N/A"}`
      );
    } catch (error) {
      logger.error("❌ Error ajustando iluminación:", error);
    }
  }

  public getLightingInfo(): {
    ambient: { intensity: number; color: string };
    directional1: { intensity: number; color: string; position: string };
    directional2: { intensity: number; color: string; position: string };
    screen: {
      intensity: number;
      color: string;
      position: string;
      visible: boolean;
    };
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
        screen: {
          intensity: parseFloat(
            this.lights.screen?.getAttribute("intensity") || "0"
          ),
          color: this.lights.screen?.getAttribute("color") || "#000000",
          position: this.lights.screen?.getAttribute("position") || "0 0 0",
          visible: this.lights.screen?.getAttribute("visible") === "true",
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
      // Set volume to a moderate level (0.3 = 30%)
      this.ambientAudio.volume = 0.3;

      // Start playing the ambient wind audio
      this.ambientAudio.currentTime = 0;
      this.ambientAudio.play().catch((error: any) => {
        logger.warn("⚠️ No se pudo reproducir audio ambiental:", error);
      });

      logger.info("🌬️ Audio ambiental de viento iniciado");
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
}
