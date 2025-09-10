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
  private parkScreen: any = null;
  private petroleoScreen: any = null;
  private plataformaScreen: any = null;
  private cpfScreen: any = null;
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
          <img id="escena-3-image" src="/photos/escena_3.jpg" crossorigin="anonymous"></img>
          <!-- Solar videos for floating screen -->
          <video id="solar-1-video" src="/videos/solar_1.MP4" preload="auto" loop="false" crossorigin="anonymous"></video>
          <video id="solar-2-video" src="/videos/solar_2.MP4" preload="auto" loop="false" crossorigin="anonymous"></video>
          <video id="solar-3-video" src="/videos/solar_3.MP4" preload="auto" loop="false" crossorigin="anonymous"></video>
          <!-- Petroleo images for floating screen -->
          <img id="petroleo-1-image" src="/panos/petroleo_1.jpg" crossorigin="anonymous"></img>
          <img id="petroleo-2-image" src="/panos/petroleo_2.jpg" crossorigin="anonymous"></img>
          <img id="petroleo-3-image" src="/panos/petroleo_3.jpg" crossorigin="anonymous"></img>
          <!-- Plataforma images for floating screen -->
          <img id="plataforma-1-image" src="/panos/plataforma_1.jpg" crossorigin="anonymous"></img>
          <img id="plataforma-2-image" src="/panos/plataforma_2.jpg" crossorigin="anonymous"></img>
          <img id="plataforma-3-image" src="/panos/plataforma_3.jpg" crossorigin="anonymous"></img>
          <!-- CPF images for floating screen -->
          <img id="cpf-cupiagua-image" src="/panos/cpf_cupiagua.jpg" crossorigin="anonymous"></img>
          <img id="cpf-cusiana-image" src="/panos/cpf_cusiana.jpg" crossorigin="anonymous"></img>
          <img id="cpf-florena-image" src="/panos/cpf_florena.jpg" crossorigin="anonymous"></img>
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
        
         <!-- Single floating screen that cycles through solar videos (Scene 1 only) -->
         <a-plane 
           id="park-screen"
           src="#solar-1-video"
           position="0 55 45"
           width="100"
           height="50"
           rotation="-40 0 2"
           material="shader: flat; side: double"
           visible="false"
           solar-video-cycler
         ></a-plane>
         
         <!-- Single floating screen that cycles through petroleo images (Scene 2 only) -->
         <a-plane 
           id="petroleo-screen"
           src="#petroleo-2-image"
           position="110 150 20"
           width="180"
           height="100"
           rotation="-30 90 2"
           material="shader: flat; side: double"
           visible="false"
           petroleo-image-cycler
         ></a-plane>
         
          <!-- Single floating screen that cycles through plataforma images (Scene 3 only) -->
          <a-plane 
            id="plataforma-screen"
            src="#plataforma-1-image"
            position="-100 150 50"
            width="180"
            height="100"
            rotation="-20 -50 0"
            material="shader: flat; side: double"
            visible="false"
            plataforma-image-cycler
          ></a-plane>
          
          <!-- Single floating screen that cycles through CPF images (Scene 3 only) -->
          <a-plane 
            id="cpf-screen"
            src="#cpf-cupiagua-image"
            position="100 150 50"
            width="180"
            height="100"
            rotation="-20 50 0"
            material="shader: flat; side: double"
            visible="false"
            cpf-image-cycler
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
    this.parkScreen = document.querySelector("#park-screen");
    this.petroleoScreen = document.querySelector("#petroleo-screen");
    this.plataformaScreen = document.querySelector("#plataforma-screen");
    this.cpfScreen = document.querySelector("#cpf-screen");
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

    // Expose solar video screen controls globally for debugging
    (window as any).solarScreen = {
      show: () => this.showParkScreen(),
      hide: () => this.hideParkScreen(),
      move: (x: number, y: number, z: number) => {
        if (this.parkScreen) {
          this.parkScreen.setAttribute("position", `${x} ${y} ${z}`);
          console.log(`☀️ Pantalla solar movida a posición: ${x}, ${y}, ${z}`);
        }
      },
      rotate: (x: number, y: number, z: number) => {
        if (this.parkScreen) {
          this.parkScreen.setAttribute("rotation", `${x} ${y} ${z}`);
          console.log(`☀️ Pantalla solar rotada a: ${x}, ${y}, ${z}`);
        }
      },
      resize: (width: number, height: number) => {
        if (this.parkScreen) {
          this.parkScreen.setAttribute("width", width.toString());
          this.parkScreen.setAttribute("height", height.toString());
          console.log(`☀️ Pantalla solar redimensionada a: ${width}x${height}`);
        }
      },
      nextVideo: () => {
        const cycler = (window as any).solarVideoCycler;
        if (cycler && cycler.nextVideo) {
          cycler.nextVideo();
        }
      },
      setVideo: (index: number) => {
        const cycler = (window as any).solarVideoCycler;
        if (cycler && cycler.setVideo) {
          cycler.setVideo(index);
        }
      },
      pause: () => {
        const cycler = (window as any).solarVideoCycler;
        if (cycler && cycler.currentVideo) {
          cycler.currentVideo.pause();
          console.log("⏸️ Video solar pausado");
        }
      },
      play: () => {
        const cycler = (window as any).solarVideoCycler;
        if (cycler && cycler.currentVideo) {
          cycler.currentVideo.play();
          console.log("▶️ Video solar reanudado");
        }
      },
      info: () => {
        if (!this.parkScreen) return null;
        const cycler = (window as any).solarVideoCycler;
        return {
          visible: this.parkScreen.getAttribute("visible") === "true",
          position: this.parkScreen.getAttribute("position"),
          rotation: this.parkScreen.getAttribute("rotation"),
          size: {
            width: this.parkScreen.getAttribute("width"),
            height: this.parkScreen.getAttribute("height"),
          },
          currentVideo: cycler ? cycler.currentVideoIndex + 1 : 0,
          totalVideos: cycler ? cycler.videos.length : 0,
          playing:
            cycler && cycler.currentVideo ? !cycler.currentVideo.paused : false,
          currentTime:
            cycler && cycler.currentVideo ? cycler.currentVideo.currentTime : 0,
          duration:
            cycler && cycler.currentVideo ? cycler.currentVideo.duration : 0,
        };
      },
    };

    // Expose petroleo screen controls globally for debugging
    (window as any).petroleoScreen = {
      show: () => this.showPetroleoScreen(),
      hide: () => this.hidePetroleoScreen(),
      move: (x: number, y: number, z: number) => {
        if (this.petroleoScreen) {
          this.petroleoScreen.setAttribute("position", `${x} ${y} ${z}`);
          console.log(
            `🛢️ Pantalla de petróleo movida a posición: ${x}, ${y}, ${z}`
          );
        }
      },
      rotate: (x: number, y: number, z: number) => {
        if (this.petroleoScreen) {
          this.petroleoScreen.setAttribute("rotation", `${x} ${y} ${z}`);
          console.log(`🛢️ Pantalla de petróleo rotada a: ${x}, ${y}, ${z}`);
        }
      },
      resize: (width: number, height: number) => {
        if (this.petroleoScreen) {
          this.petroleoScreen.setAttribute("width", width.toString());
          this.petroleoScreen.setAttribute("height", height.toString());
          console.log(
            `🛢️ Pantalla de petróleo redimensionada a: ${width}x${height}`
          );
        }
      },
      nextImage: () => {
        const cycler = (window as any).petroleoImageCycler;
        if (cycler && cycler.nextImage) {
          cycler.nextImage();
        }
      },
      setImage: (index: number) => {
        const cycler = (window as any).petroleoImageCycler;
        if (cycler && cycler.setImage) {
          cycler.setImage(index);
        }
      },
      info: () => {
        if (!this.petroleoScreen) return null;
        const cycler = (window as any).petroleoImageCycler;
        return {
          visible: this.petroleoScreen.getAttribute("visible") === "true",
          position: this.petroleoScreen.getAttribute("position"),
          rotation: this.petroleoScreen.getAttribute("rotation"),
          size: {
            width: this.petroleoScreen.getAttribute("width"),
            height: this.petroleoScreen.getAttribute("height"),
          },
          currentImage: cycler ? cycler.currentImageIndex + 1 : 0,
          totalImages: cycler ? cycler.images.length : 0,
          cycling: cycler ? !!cycler.intervalId : false,
        };
      },
    };

    // Expose plataforma screen controls globally for debugging
    (window as any).plataformaScreen = {
      show: () => this.showPlataformaScreen(),
      hide: () => this.hidePlataformaScreen(),
      move: (x: number, y: number, z: number) => {
        if (this.plataformaScreen) {
          this.plataformaScreen.setAttribute("position", `${x} ${y} ${z}`);
          console.log(
            `🏗️ Pantalla de plataformas movida a posición: ${x}, ${y}, ${z}`
          );
        }
      },
      rotate: (x: number, y: number, z: number) => {
        if (this.plataformaScreen) {
          this.plataformaScreen.setAttribute("rotation", `${x} ${y} ${z}`);
          console.log(`🏗️ Pantalla de plataformas rotada a: ${x}, ${y}, ${z}`);
        }
      },
      resize: (width: number, height: number) => {
        if (this.plataformaScreen) {
          this.plataformaScreen.setAttribute("width", width.toString());
          this.plataformaScreen.setAttribute("height", height.toString());
          console.log(
            `🏗️ Pantalla de plataformas redimensionada a: ${width}x${height}`
          );
        }
      },
      nextImage: () => {
        const cycler = (window as any).plataformaImageCycler;
        if (cycler && cycler.nextImage) {
          cycler.nextImage();
        }
      },
      setImage: (index: number) => {
        const cycler = (window as any).plataformaImageCycler;
        if (cycler && cycler.setImage) {
          cycler.setImage(index);
        }
      },
      info: () => {
        if (!this.plataformaScreen) return null;
        const cycler = (window as any).plataformaImageCycler;
        return {
          visible: this.plataformaScreen.getAttribute("visible") === "true",
          position: this.plataformaScreen.getAttribute("position"),
          rotation: this.plataformaScreen.getAttribute("rotation"),
          size: {
            width: this.plataformaScreen.getAttribute("width"),
            height: this.plataformaScreen.getAttribute("height"),
          },
          currentImage: cycler ? cycler.currentImageIndex + 1 : 0,
          totalImages: cycler ? cycler.images.length : 0,
          cycling: cycler ? !!cycler.intervalId : false,
        };
      },
    };

    // Expose CPF screen controls globally for debugging
    (window as any).cpfScreen = {
      show: () => this.showCpfScreen(),
      hide: () => this.hideCpfScreen(),
      move: (x: number, y: number, z: number) => {
        if (this.cpfScreen) {
          this.cpfScreen.setAttribute("position", `${x} ${y} ${z}`);
          console.log(`🏭 Pantalla de CPF movida a posición: ${x}, ${y}, ${z}`);
        }
      },
      rotate: (x: number, y: number, z: number) => {
        if (this.cpfScreen) {
          this.cpfScreen.setAttribute("rotation", `${x} ${y} ${z}`);
          console.log(`🏭 Pantalla de CPF rotada a: ${x}, ${y}, ${z}`);
        }
      },
      resize: (width: number, height: number) => {
        if (this.cpfScreen) {
          this.cpfScreen.setAttribute("width", width.toString());
          this.cpfScreen.setAttribute("height", height.toString());
          console.log(
            `🏭 Pantalla de CPF redimensionada a: ${width}x${height}`
          );
        }
      },
      nextImage: () => {
        const cycler = (window as any).cpfImageCycler;
        if (cycler && cycler.nextImage) {
          cycler.nextImage();
        }
      },
      setImage: (index: number) => {
        const cycler = (window as any).cpfImageCycler;
        if (cycler && cycler.setImage) {
          cycler.setImage(index);
        }
      },
      info: () => {
        if (!this.cpfScreen) return null;
        const cycler = (window as any).cpfImageCycler;
        return {
          visible: this.cpfScreen.getAttribute("visible") === "true",
          position: this.cpfScreen.getAttribute("position"),
          rotation: this.cpfScreen.getAttribute("rotation"),
          size: {
            width: this.cpfScreen.getAttribute("width"),
            height: this.cpfScreen.getAttribute("height"),
          },
          currentImage: cycler ? cycler.currentImageIndex + 1 : 0,
          totalImages: cycler ? cycler.images.length : 0,
          cycling: cycler ? !!cycler.intervalId : false,
        };
      },
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

      // Solar video cycler component for automatic video cycling
      AFRAME.registerComponent("solar-video-cycler", {
        init(this: any) {
          this.isVisible = false;
          this.currentVideoIndex = 0;
          this.videos = ["#solar-1-video", "#solar-2-video", "#solar-3-video"];
          this.currentVideo = null;

          this.show = () => {
            this.el.setAttribute("visible", "true");
            this.isVisible = true;
            this.startVideoPlayback();
            console.log(
              "☀️ Pantalla solar mostrada con reproducción automática"
            );
          };

          this.hide = () => {
            this.el.setAttribute("visible", "false");
            this.isVisible = false;
            this.stopVideoPlayback();
            console.log("☀️ Pantalla solar oculta");
          };

          this.startVideoPlayback = () => {
            this.playCurrentVideo();
          };

          this.stopVideoPlayback = () => {
            if (this.currentVideo) {
              this.currentVideo.pause();
              this.currentVideo.currentTime = 0;
            }
          };

          this.playCurrentVideo = () => {
            const videoSrc = this.videos[this.currentVideoIndex];
            this.el.setAttribute("src", videoSrc);

            // Get the video element and set up event listeners
            this.currentVideo = document.querySelector(videoSrc);
            if (this.currentVideo) {
              // Remove any existing event listeners
              this.currentVideo.removeEventListener("ended", this.onVideoEnded);

              // Add new event listener
              this.onVideoEnded = () => {
                this.nextVideo();
              };
              this.currentVideo.addEventListener("ended", this.onVideoEnded);

              // Start playing
              this.currentVideo.currentTime = 0;
              this.currentVideo.play().catch((error: any) => {
                console.warn("⚠️ No se pudo reproducir video solar:", error);
              });

              console.log(
                `☀️ Reproduciendo video solar ${this.currentVideoIndex + 1}/3`
              );
            }
          };

          this.nextVideo = () => {
            this.currentVideoIndex =
              (this.currentVideoIndex + 1) % this.videos.length;
            this.playCurrentVideo();
          };

          this.setVideo = (index: number) => {
            if (index >= 0 && index < this.videos.length) {
              this.currentVideoIndex = index;
              this.playCurrentVideo();
              console.log(`☀️ Video cambiado manualmente a ${index + 1}/3`);
            }
          };

          // Expose methods globally for easy access
          (window as any).solarVideoCycler = this;
        },

        remove() {
          const self = this as any;
          if (self.currentVideo && self.onVideoEnded) {
            self.currentVideo.removeEventListener("ended", self.onVideoEnded);
          }
        },
      });

      // Petroleo image cycler component for automatic image cycling
      AFRAME.registerComponent("petroleo-image-cycler", {
        init(this: any) {
          this.isVisible = false;
          this.currentImageIndex = 1; // Start with image 2 (petroleo-2-image)
          this.images = [
            "#petroleo-1-image",
            "#petroleo-2-image",
            "#petroleo-3-image",
          ];
          this.intervalId = null;

          this.show = () => {
            this.el.setAttribute("visible", "true");
            this.isVisible = true;
            this.startCycling();
            console.log(
              "🛢️ Pantalla de petróleo mostrada con ciclado automático"
            );
          };

          this.hide = () => {
            this.el.setAttribute("visible", "false");
            this.isVisible = false;
            this.stopCycling();
            console.log("🛢️ Pantalla de petróleo oculta");
          };

          this.startCycling = () => {
            if (this.intervalId) return; // Already cycling

            this.intervalId = setInterval(() => {
              this.nextImage();
            }, 15000); // 15 seconds
          };

          this.stopCycling = () => {
            if (this.intervalId) {
              clearInterval(this.intervalId);
              this.intervalId = null;
            }
          };

          this.nextImage = () => {
            this.currentImageIndex =
              (this.currentImageIndex + 1) % this.images.length;
            this.el.setAttribute("src", this.images[this.currentImageIndex]);
            console.log(
              `🛢️ Cambiando a imagen de petróleo ${this.currentImageIndex + 1}/3`
            );
          };

          this.setImage = (index: number) => {
            if (index >= 0 && index < this.images.length) {
              this.currentImageIndex = index;
              this.el.setAttribute("src", this.images[index]);
              console.log(
                `🛢️ Imagen de petróleo cambiada manualmente a ${index + 1}/3`
              );
            }
          };

          // Expose methods globally for easy access
          (window as any).petroleoImageCycler = this;
        },

        remove() {
          const self = this as any;
          if (self.intervalId) {
            clearInterval(self.intervalId);
            self.intervalId = null;
          }
        },
      });

      // Plataforma image cycler component for automatic image cycling
      AFRAME.registerComponent("plataforma-image-cycler", {
        init(this: any) {
          this.isVisible = false;
          this.currentImageIndex = 0; // Start with image 1 (plataforma-1-image)
          this.images = [
            "#plataforma-1-image",
            "#plataforma-2-image",
            "#plataforma-3-image",
          ];
          this.intervalId = null;

          this.show = () => {
            this.el.setAttribute("visible", "true");
            this.isVisible = true;
            this.startCycling();
            console.log(
              "🏗️ Pantalla de plataformas mostrada con ciclado automático"
            );
          };

          this.hide = () => {
            this.el.setAttribute("visible", "false");
            this.isVisible = false;
            this.stopCycling();
            console.log("🏗️ Pantalla de plataformas oculta");
          };

          this.startCycling = () => {
            if (this.intervalId) return; // Already cycling

            this.intervalId = setInterval(() => {
              this.nextImage();
            }, 15000); // 15 seconds
          };

          this.stopCycling = () => {
            if (this.intervalId) {
              clearInterval(this.intervalId);
              this.intervalId = null;
            }
          };

          this.nextImage = () => {
            this.currentImageIndex =
              (this.currentImageIndex + 1) % this.images.length;
            this.el.setAttribute("src", this.images[this.currentImageIndex]);
            console.log(
              `🏗️ Cambiando a imagen de plataforma ${this.currentImageIndex + 1}/3`
            );
          };

          this.setImage = (index: number) => {
            if (index >= 0 && index < this.images.length) {
              this.currentImageIndex = index;
              this.el.setAttribute("src", this.images[index]);
              console.log(
                `🏗️ Imagen de plataforma cambiada manualmente a ${index + 1}/3`
              );
            }
          };

          // Expose methods globally for easy access
          (window as any).plataformaImageCycler = this;
        },

        remove() {
          const self = this as any;
          if (self.intervalId) {
            clearInterval(self.intervalId);
            self.intervalId = null;
          }
        },
      });

      // CPF image cycler component for automatic image cycling
      AFRAME.registerComponent("cpf-image-cycler", {
        init(this: any) {
          this.isVisible = false;
          this.currentImageIndex = 0; // Start with image 1 (cpf-cupiagua-image)
          this.images = [
            "#cpf-cupiagua-image",
            "#cpf-cusiana-image",
            "#cpf-florena-image",
          ];
          this.intervalId = null;

          this.show = () => {
            this.el.setAttribute("visible", "true");
            this.isVisible = true;
            this.startCycling();
            console.log("🏭 Pantalla de CPF mostrada con ciclado automático");
          };

          this.hide = () => {
            this.el.setAttribute("visible", "false");
            this.isVisible = false;
            this.stopCycling();
            console.log("🏭 Pantalla de CPF oculta");
          };

          this.startCycling = () => {
            if (this.intervalId) return; // Already cycling

            this.intervalId = setInterval(() => {
              this.nextImage();
            }, 15000); // 15 seconds
          };

          this.stopCycling = () => {
            if (this.intervalId) {
              clearInterval(this.intervalId);
              this.intervalId = null;
            }
          };

          this.nextImage = () => {
            this.currentImageIndex =
              (this.currentImageIndex + 1) % this.images.length;
            this.el.setAttribute("src", this.images[this.currentImageIndex]);
            console.log(
              `🏭 Cambiando a imagen de CPF ${this.currentImageIndex + 1}/3`
            );
          };

          this.setImage = (index: number) => {
            if (index >= 0 && index < this.images.length) {
              this.currentImageIndex = index;
              this.el.setAttribute("src", this.images[index]);
              console.log(
                `🏭 Imagen de CPF cambiada manualmente a ${index + 1}/3`
              );
            }
          };

          // Expose methods globally for easy access
          (window as any).cpfImageCycler = this;
        },

        remove() {
          const self = this as any;
          if (self.intervalId) {
            clearInterval(self.intervalId);
            self.intervalId = null;
          }
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

          // Show appropriate screen based on scene
          if (scene.id === "escena-1") {
            this.showParkScreen();
            this.hidePetroleoScreen();
            this.hidePlataformaScreen();
            logger.info(
              "☀️ Mostrando pantalla solar con reproducción automática para escena 1"
            );
          } else if (scene.id === "escena-2") {
            this.hideParkScreen();
            this.showPetroleoScreen();
            this.hidePlataformaScreen();
            logger.info(
              "🛢️ Mostrando pantalla de petróleo con ciclado automático para escena 2"
            );
          } else if (scene.id === "escena-3") {
            this.hideParkScreen();
            this.hidePetroleoScreen();
            this.showPlataformaScreen();
            this.showCpfScreen();
            logger.info(
              "🏗️ Mostrando pantallas de plataformas y CPF con ciclado automático para escena 3"
            );
          } else {
            this.hideParkScreen();
            this.hidePetroleoScreen();
            this.hidePlataformaScreen();
            this.hideCpfScreen();
            logger.info("📺 Ocultando pantallas flotantes para otras escenas");
          }
        } else if (assetPath.endsWith(".mp4") || assetPath.endsWith(".webm")) {
          // Load as video on floating screen
          this.showFloatingScreen(`${scene.id}-video`);
          logger.info(`🎬 Cargando video en pantalla flotante: ${assetPath}`);

          // Hide all floating screens for video scenes
          this.hideParkScreen();
          this.hidePetroleoScreen();
          this.hidePlataformaScreen();
          this.hideCpfScreen();
          logger.info("📺 Ocultando pantallas flotantes para escenas de video");
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

    // Hide all floating screens
    this.hideParkScreen();
    this.hidePetroleoScreen();
    this.hidePlataformaScreen();
    this.hideCpfScreen();

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

    // Hide all floating screens when changing scenes
    this.hideParkScreen();
    this.hidePetroleoScreen();
    this.hidePlataformaScreen();
    this.hideCpfScreen();

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
    this.parkScreen = null;
    this.petroleoScreen = null;
    this.plataformaScreen = null;
    this.cpfScreen = null;
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

  // Solar Video Screen Control Methods
  public showParkScreen(): void {
    if (!this.parkScreen) {
      logger.warn("⚠️ Referencia de pantalla solar no disponible");
      return;
    }

    try {
      const component = (this.parkScreen as any).components[
        "solar-video-cycler"
      ];
      if (component && component.show) {
        component.show();
      } else {
        this.parkScreen.setAttribute("visible", "true");
      }

      logger.info("☀️ Pantalla solar mostrada con reproducción automática");
    } catch (error) {
      logger.error("❌ Error mostrando pantalla solar:", error);
    }
  }

  public hideParkScreen(): void {
    if (!this.parkScreen) {
      logger.warn("⚠️ Referencia de pantalla solar no disponible");
      return;
    }

    try {
      const component = (this.parkScreen as any).components[
        "solar-video-cycler"
      ];
      if (component && component.hide) {
        component.hide();
      } else {
        this.parkScreen.setAttribute("visible", "false");
      }

      logger.info("☀️ Pantalla solar oculta");
    } catch (error) {
      logger.error("❌ Error ocultando pantalla solar:", error);
    }
  }

  public isParkScreenVisible(): boolean {
    if (!this.parkScreen) return false;
    return this.parkScreen.getAttribute("visible") === "true";
  }

  // Petroleo Screen Control Methods
  public showPetroleoScreen(): void {
    if (!this.petroleoScreen) {
      logger.warn("⚠️ Referencia de pantalla de petróleo no disponible");
      return;
    }

    try {
      const component = (this.petroleoScreen as any).components[
        "petroleo-image-cycler"
      ];
      if (component && component.show) {
        component.show();
      } else {
        this.petroleoScreen.setAttribute("visible", "true");
      }

      logger.info("🛢️ Pantalla de petróleo mostrada con ciclado automático");
    } catch (error) {
      logger.error("❌ Error mostrando pantalla de petróleo:", error);
    }
  }

  public hidePetroleoScreen(): void {
    if (!this.petroleoScreen) {
      logger.warn("⚠️ Referencia de pantalla de petróleo no disponible");
      return;
    }

    try {
      const component = (this.petroleoScreen as any).components[
        "petroleo-image-cycler"
      ];
      if (component && component.hide) {
        component.hide();
      } else {
        this.petroleoScreen.setAttribute("visible", "false");
      }

      logger.info("🛢️ Pantalla de petróleo oculta");
    } catch (error) {
      logger.error("❌ Error ocultando pantalla de petróleo:", error);
    }
  }

  public isPetroleoScreenVisible(): boolean {
    if (!this.petroleoScreen) return false;
    return this.petroleoScreen.getAttribute("visible") === "true";
  }

  // Plataforma Screen Control Methods
  public showPlataformaScreen(): void {
    if (!this.plataformaScreen) {
      logger.warn("⚠️ Referencia de pantalla de plataformas no disponible");
      return;
    }

    try {
      const component = (this.plataformaScreen as any).components[
        "plataforma-image-cycler"
      ];
      if (component && component.show) {
        component.show();
      } else {
        this.plataformaScreen.setAttribute("visible", "true");
      }

      logger.info("🏗️ Pantalla de plataformas mostrada con ciclado automático");
    } catch (error) {
      logger.error("❌ Error mostrando pantalla de plataformas:", error);
    }
  }

  public hidePlataformaScreen(): void {
    if (!this.plataformaScreen) {
      logger.warn("⚠️ Referencia de pantalla de plataformas no disponible");
      return;
    }

    try {
      const component = (this.plataformaScreen as any).components[
        "plataforma-image-cycler"
      ];
      if (component && component.hide) {
        component.hide();
      } else {
        this.plataformaScreen.setAttribute("visible", "false");
      }

      logger.info("🏗️ Pantalla de plataformas oculta");
    } catch (error) {
      logger.error("❌ Error ocultando pantalla de plataformas:", error);
    }
  }

  public isPlataformaScreenVisible(): boolean {
    if (!this.plataformaScreen) return false;
    return this.plataformaScreen.getAttribute("visible") === "true";
  }

  // CPF Screen Control Methods
  public showCpfScreen(): void {
    if (!this.cpfScreen) {
      logger.warn("⚠️ Referencia de pantalla de CPF no disponible");
      return;
    }

    try {
      const component = (this.cpfScreen as any).components["cpf-image-cycler"];
      if (component && component.show) {
        component.show();
      } else {
        this.cpfScreen.setAttribute("visible", "true");
      }

      logger.info("🏭 Pantalla de CPF mostrada con ciclado automático");
    } catch (error) {
      logger.error("❌ Error mostrando pantalla de CPF:", error);
    }
  }

  public hideCpfScreen(): void {
    if (!this.cpfScreen) {
      logger.warn("⚠️ Referencia de pantalla de CPF no disponible");
      return;
    }

    try {
      const component = (this.cpfScreen as any).components["cpf-image-cycler"];
      if (component && component.hide) {
        component.hide();
      } else {
        this.cpfScreen.setAttribute("visible", "false");
      }

      logger.info("🏭 Pantalla de CPF oculta");
    } catch (error) {
      logger.error("❌ Error ocultando pantalla de CPF:", error);
    }
  }

  public isCpfScreenVisible(): boolean {
    if (!this.cpfScreen) return false;
    return this.cpfScreen.getAttribute("visible") === "true";
  }
}
