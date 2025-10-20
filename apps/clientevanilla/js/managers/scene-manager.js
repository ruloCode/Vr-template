/**
 * VR Scene Manager
 * Manages VR scene loading, transitions, and controls
 */

import { enableAudio } from "./audio-manager.js";
import { assetPreloader } from "../utils/asset-preloader.js";
import { cacheManager } from "../utils/cache-manager.js";

export class VRSceneManager {
  constructor() {
    this.currentScene = null;
    this.isLoading = false;
    this.elements = {};

    // Sequence automation properties
    this.sequenceMode = false;
    this.sequenceId = null;
    this.sequenceConfig = null;
    this.currentSequenceConfig = null;

    // Asset preloading properties
    this.preloadingEnabled = true;
    this.preloadProgress = { loaded: 0, total: 0, percentage: 0 };

    // Memory management properties for blob URLs
    this.currentAudioBlobUrl = null;
    this.currentSkyboxBlobUrl = null;
    this.previousTextures = new Set();

    this.initializeElements();
    this.initializePreloader();
  }

  initializeElements() {
    this.elements = {
      skybox: document.querySelector("#scene-skybox"),
      sound: document.querySelector("#scene-sound"),
      ambientLight: document.querySelector("#ambient-light"),
      directionalLight: document.querySelector("#directional-light"),
      models: document.querySelector("#scene-models"),
      overlay: document.querySelector("#scene-overlay"),
      escena1Screen: document.querySelector("#escena1-screen"),
      escena2Screen: document.querySelector("#escena2-screen"),
      escena3Screen: document.querySelector("#escena3-screen"),
      escena3BScreen: document.querySelector("#escena3B-screen"),
      escena4Screen: document.querySelector("#escena4-screen"),
      escena4BScreen: document.querySelector("#escena4B-screen"),
      escena5Screen: document.querySelector("#escena5-screen"),
      escena5BScreen: document.querySelector("#escena5B-screen"),
      escena6Screen: document.querySelector("#escena6-screen"),
      escena6BScreen: document.querySelector("#escena6B-screen"),
      escena7Screen: document.querySelector("#escena7-screen"),
      escena7BScreen: document.querySelector("#escena7B-screen"),
      escena8Screen: document.querySelector("#escena8-screen"),
      escena8BScreen: document.querySelector("#escena8B-screen"),
      escena9Screen: document.querySelector("#escena9-screen"),
      escena9BScreen: document.querySelector("#escena9B-screen"),
      escena10Screen: document.querySelector("#escena10-screen"),
      escena10BScreen: document.querySelector("#escena10B-screen"),
      escena11Screen: document.querySelector("#escena11-screen"),
      escena11BScreen: document.querySelector("#escena11B-screen"),
      // Guajira screens
      guajira1Screen: document.querySelector("#guajira1-screen"),
      guajira2Screen: document.querySelector("#guajira2-screen"),
      guajira2VideoScreen: document.querySelector("#guajira2-video-screen"),
      guajira3Screen: document.querySelector("#guajira3-screen"),
      guajira4Screen: document.querySelector("#guajira4-screen"),
      guajira5Screen: document.querySelector("#guajira5-screen"),
      guajira6Screen: document.querySelector("#guajira6-screen"),
      guajira7Screen: document.querySelector("#guajira7-screen"),
      guajira8Screen: document.querySelector("#guajira8-screen"),
      guajira9Screen: document.querySelector("#guajira9-screen"),
      guajira10Screen: document.querySelector("#guajira10-screen"),
      // Cartagena screens
      cartagena2Screen: document.querySelector("#cartagena2-screen"),
      cartagena3Screen: document.querySelector("#cartagena3-screen"),
      cartagena4Screen: document.querySelector("#cartagena4-screen"),
      cartagena5Screen: document.querySelector("#cartagena5-screen"),
      cartagena6Screen: document.querySelector("#cartagena6-screen"),
      cartagena6VideoScreen: document.querySelector("#cartagena6-video-screen"),
      cartagena7Screen: document.querySelector("#cartagena7-screen"),
      // Cartagena 1 y 8 no tienen pantallas adicionales
      // Meta screens
      meta2ImageScreen: document.querySelector("#meta2-image-screen"),
      meta2VideoScreen: document.querySelector("#meta2-video-screen"),
      meta3ImageScreen: document.querySelector("#meta3-image-screen"),
      meta3VideoScreen: document.querySelector("#meta3-video-screen"),
      meta4ImageScreen: document.querySelector("#meta4-image-screen"),
      meta4VideoScreen: document.querySelector("#meta4-video-screen"),
      meta5VideoScreen: document.querySelector("#meta5-video-screen"),
      meta6ImageScreen: document.querySelector("#meta6-image-screen"),
      meta6VideoScreen: document.querySelector("#meta6-video-screen"),
      meta7ImageScreen: document.querySelector("#meta7-image-screen"),
      meta7VideoScreen: document.querySelector("#meta7-video-screen"),
      // Meta 1 no tiene pantallas adicionales
      assets: {
        audio: document.querySelector("#current-audio"),
        skybox: document.querySelector("#current-skybox"),
      },
    };
  }

  /**
   * Initialize asset preloader with progress tracking
   */
  initializePreloader() {
    // Set up progress listener
    assetPreloader.onProgress((progress) => {
      this.preloadProgress = progress;
      this.updateLoadingUI(progress);

      // Emit progress event for external listeners
      if (window.vrClient && window.vrClient.isConnected) {
        // Ensure buffered percentage is between 0-100
        const bufferedPercentage = Math.min(
          100,
          Math.max(0, progress.percentage || 0)
        );
        window.vrClient.sendState(
          this.currentScene?.id || "loading",
          0,
          false,
          bufferedPercentage
        );
      }
    });

    console.log("🎯 Asset preloader initialized with scene manager");
  }

  /**
   * Update loading UI with progress
   */
  updateLoadingUI(progress) {
    const progressBar = document.getElementById("progress-bar");
    const loadingStatus = document.getElementById("loading-status");

    if (progressBar) {
      progressBar.style.width = `${progress.percentage}%`;
    }

    if (loadingStatus) {
      if (progress.currentAsset) {
        const assetName = progress.currentAsset.split("/").pop();
        loadingStatus.textContent = `Cargando: ${assetName} (${progress.loaded}/${progress.total})`;
      } else if (progress.isComplete) {
        loadingStatus.textContent = "Listo para comenzar";
      } else {
        loadingStatus.textContent = `${progress.loaded}/${progress.total} assets cargados`;
      }
    }
  }

  /**
   * Hide loading overlay once assets are ready
   */
  hideAppLoading() {
    const loadingOverlay = document.getElementById("app-loading");
    if (loadingOverlay) {
      loadingOverlay.classList.add("hidden");
      setTimeout(() => {
        loadingOverlay.style.display = "none";
      }, 300);
    }
  }

  /**
   * Clean up previous assets to prevent memory leaks
   */
  cleanupPreviousAssets() {
    // Revoke previous blob URLs to free memory
    if (this.currentAudioBlobUrl) {
      URL.revokeObjectURL(this.currentAudioBlobUrl);
      this.currentAudioBlobUrl = null;
    }

    if (this.currentSkyboxBlobUrl) {
      URL.revokeObjectURL(this.currentSkyboxBlobUrl);
      this.currentSkyboxBlobUrl = null;
    }

    // Clean up Three.js textures from previous scene
    this.cleanupThreeJSTextures();

    // Pause videos not needed for the current scene
    this.pauseAllVideos();

    console.log("🧹 Previous assets cleaned up for memory optimization");
  }

  /**
   * Clean up Three.js textures to prevent GPU memory leaks
   */
  cleanupThreeJSTextures() {
    try {
      // Clean up skybox texture
      const skyboxEl =
        this.elements.skybox || document.querySelector("#scene-skybox");
      if (skyboxEl && skyboxEl.getObject3D && skyboxEl.getObject3D("mesh")) {
        const mesh = skyboxEl.getObject3D("mesh");
        if (mesh.material && mesh.material.map) {
          mesh.material.map.dispose();
          this.previousTextures.add(mesh.material.map);
        }
      }

      // Clean up any image/video textures from floating screens
      const screens = document.querySelectorAll("a-plane[src], a-video");
      screens.forEach((screen) => {
        if (screen.getObject3D && screen.getObject3D("mesh")) {
          const mesh = screen.getObject3D("mesh");
          if (mesh.material && mesh.material.map) {
            mesh.material.map.dispose();
            this.previousTextures.add(mesh.material.map);
          }
        }
      });

      // Force garbage collection hint
      if (window.gc) {
        window.gc();
      }
    } catch (error) {
      console.warn("⚠️ Error during texture cleanup:", error);
    }
  }

  /**
   * Pause all video elements except those needed for current scene to free GPU resources
   */
  pauseAllVideos() {
    const videos = document.querySelectorAll("video");
    const currentSceneId = this.currentScene?.id;

    videos.forEach((video) => {
      // Only pause videos that are not needed for the current scene
      const videoId = video.id;
      const isCurrentSceneVideo =
        currentSceneId &&
        videoId.includes(currentSceneId.replace("escena-", "escena"));

      if (!isCurrentSceneVideo && !video.paused) {
        video.pause();
        video.currentTime = 0;
        // Remove from DOM rendering to free GPU memory
        video.style.display = "none";
      }
    });
  }

  /**
   * Resume videos needed for current scene
   */
  resumeSceneVideos(sceneId) {
    const sceneNumber = sceneId.replace("escena-", "");
    const sceneVideos = document.querySelectorAll(
      `video[id*="escena${sceneNumber}"]`
    );

    sceneVideos.forEach((video) => {
      // Make video available for rendering again
      video.style.display = "";
      // Note: We don't auto-play here as video cyclers handle that
    });
  }

  async loadScene(sceneId) {
    if (this.isLoading) {
      // Scene loading already in progress
      return false;
    }

    if (!window.SCENES_CONFIG[sceneId]) {
      // Scene not found
      return false;
    }

    console.log("🎬 Loading scene:", sceneId);

    // Loading scene
    this.isLoading = true;
    this.showLoadingOverlay(sceneId);

    // Clean up previous assets to prevent memory leaks
    this.cleanupPreviousAssets();

    const sceneConfig = window.SCENES_CONFIG[sceneId];

    try {
      // Enable audio if not already enabled
      await enableAudio();

      // Start intelligent preloading for current and nearby scenes
      if (this.preloadingEnabled) {
        await this.startIntelligentPreloading(sceneId);
      }

      // Ensure critical assets for this scene are preloaded
      await assetPreloader.preloadCriticalAssets(sceneId);

      // Update assets
      await this.updateAssets(sceneConfig);

      // Update scene elements
      this.updateSkybox(sceneConfig);
      this.updateLighting(sceneConfig);
      this.updateModels(sceneConfig);
      this.updateAudio(sceneConfig);
      this.updateFloatingScreens(sceneConfig);

      // Resume videos for the new scene
      this.resumeSceneVideos(sceneId);

      this.currentScene = sceneConfig;
      window.currentSceneId = sceneId;

      // Notify server we're ready
      if (window.vrClient && window.vrClient.isConnected) {
        window.vrClient.sendReady(sceneId);
      }

      // Hide app loading overlay if this is the first scene
      if (sceneId === "base" || !this.hasLoadedInitialScene) {
        this.hideAppLoading();
        this.hasLoadedInitialScene = true;
      }

      console.log("✅ Scene loaded successfully:", sceneId);
      return true;
    } catch (error) {
      console.error("❌ Error loading scene:", sceneId, error);
      return false;
    } finally {
      this.isLoading = false;
      // Reduced delay for faster transitions
      setTimeout(() => {
        this.hideLoadingOverlay();
      }, 100);
    }
  }

  /**
   * Start intelligent preloading for current and nearby scenes
   */
  async startIntelligentPreloading(currentSceneId) {
    try {
      // Preload current scene and nearby scenes
      await assetPreloader.preloadCurrentAndNearbyScenes(currentSceneId);

      console.log("🚀 Intelligent preloading started for:", currentSceneId);
    } catch (error) {
      console.error("❌ Error starting intelligent preloading:", error);
    }
  }

  async updateAssets(sceneConfig) {
    try {
      // Update audio asset with cache checking
      const audioElement = document.querySelector("#current-audio");
      if (audioElement && sceneConfig.assets.audio) {
        const cachedAudio = await cacheManager.getAsset(
          sceneConfig.assets.audio
        );

        if (cachedAudio) {
          console.log("🎵 Using cached audio:", sceneConfig.assets.audio);
          // Create blob URL from cached data and store it for cleanup
          this.currentAudioBlobUrl = URL.createObjectURL(cachedAudio.data);
          audioElement.src = this.currentAudioBlobUrl;
        } else {
          console.log(
            "🌐 Loading audio from network:",
            sceneConfig.assets.audio
          );
          audioElement.src = sceneConfig.assets.audio;
        }

        audioElement.load();
      }

      // Update skybox asset with cache checking
      const skyboxUrl = sceneConfig.assets.skybox;
      const cachedSkybox = await cacheManager.getAsset(skyboxUrl);

      if (cachedSkybox) {
        console.log("🖼️ Using cached skybox:", skyboxUrl);
        // Create blob URL from cached data and store it for cleanup
        this.currentSkyboxBlobUrl = URL.createObjectURL(cachedSkybox.data);
        this.elements.assets.skybox.setAttribute(
          "src",
          this.currentSkyboxBlobUrl
        );
      } else {
        console.log("🌐 Loading skybox from network:", skyboxUrl);
        this.elements.assets.skybox.setAttribute("src", skyboxUrl);
      }

      // Wait for assets to load
      await new Promise((resolve) => setTimeout(resolve, 300));

      console.log("✅ Assets updated for scene:", sceneConfig.id);
    } catch (error) {
      console.error("❌ Error updating assets:", error);

      // Fallback to direct loading if cache fails
      const audioElement = document.querySelector("#current-audio");
      if (audioElement && sceneConfig.assets.audio) {
        audioElement.src = sceneConfig.assets.audio;
        audioElement.load();
      }

      this.elements.assets.skybox.setAttribute(
        "src",
        sceneConfig.assets.skybox
      );

      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  updateSkybox(sceneConfig) {
    // Force A-Frame to reload the texture by temporarily removing and re-adding the src
    this.elements.skybox.removeAttribute("src");

    // Use a small delay to ensure the removal is processed
    setTimeout(() => {
      this.elements.skybox.setAttribute("src", "#current-skybox");
    }, 100);
  }

  updateLighting(sceneConfig) {
    const { ambient, directional } = sceneConfig.lighting;

    this.elements.ambientLight.setAttribute("light", {
      type: "ambient",
      color: ambient.color,
      intensity: ambient.intensity,
    });

    this.elements.directionalLight.setAttribute("light", {
      type: "directional",
      color: directional.color,
      intensity: directional.intensity,
    });
  }

  updateModels(sceneConfig) {
    // Clear existing models
    this.elements.models.innerHTML = "";

    // Add models from config if any
    if (sceneConfig.assets.models && sceneConfig.assets.models.length > 0) {
      sceneConfig.assets.models.forEach((model) => {
        const modelEntity = document.createElement("a-entity");
        modelEntity.setAttribute("id", model.id);
        if (model.gltfModel) {
          modelEntity.setAttribute("gltf-model", model.gltfModel);
        }
        modelEntity.setAttribute("position", model.position || "0 0 0");
        modelEntity.setAttribute("scale", model.scale || "1 1 1");
        this.elements.models.appendChild(modelEntity);
      });
    }
  }

  updateAudio(sceneConfig) {
    // Stop current audio if playing
    try {
      const soundComponent = this.elements.sound.components.sound;
      if (soundComponent) {
        soundComponent.stopSound();
      }
    } catch (error) {
      // Error stopping current sound
    }

    // Force A-Frame to reload the audio asset by removing and re-adding src (like skybox)
    this.elements.sound.removeAttribute("src");

    // Update the HTML audio element
    const audioElement = document.querySelector("#current-audio");
    if (audioElement && sceneConfig.assets.audio) {
      audioElement.pause();
      audioElement.currentTime = 0;
      audioElement.src = sceneConfig.assets.audio;
      audioElement.load(); // Force reload of the audio element
    }

    // Re-add the src attribute after a delay to force A-Frame to reload the asset
    setTimeout(() => {
      this.elements.sound.setAttribute("src", "#current-audio");

      // Only attempt to play if audio is enabled
      if (!window.audioEnabled) {
        // Audio not enabled yet
        return;
      }

      // Start playing the new audio after ensuring it's loaded
      setTimeout(() => {
        try {
          const newSoundComponent = this.elements.sound.components.sound;
          if (newSoundComponent) {
            newSoundComponent.playSound();
            // Audio started for scene: ${sceneConfig.id}
          } else {
            // Sound component not found, fallback to direct audio play
            try {
              if (audioElement) {
                audioElement.currentTime = 0;
                audioElement.play().catch((playError) => {
                  // Direct audio play failed
                });
              }
            } catch (fallbackError) {
              // Fallback audio play failed
            }
          }
        } catch (error) {
          // Error playing new audio
        }
      }, 300); // Increased delay to ensure A-Frame has processed the new asset
    }, 150); // Delay to ensure removal is processed before re-adding
  }

  updateFloatingScreens(sceneConfig) {
    // Hide all screens first
    this.hideEscena1Screen();
    this.hideEscena2Screen();
    this.hideEscena3Screen();
    this.hideEscena3BScreen();
    this.hideEscena4Screen();
    this.hideEscena4BScreen();
    this.hideEscena5Screen();
    this.hideEscena5BScreen();
    this.hideEscena6Screen();
    this.hideEscena6BScreen();
    this.hideEscena7Screen();
    this.hideEscena7BScreen();
    this.hideEscena8Screen();
    this.hideEscena8BScreen();
    this.hideEscena9Screen();
    // this.hideEscena9BScreen(); // Commented out - video not available
    this.hideEscena10Screen();
    this.hideEscena10BScreen();
    this.hideEscena11Screen();
    this.hideEscena11BScreen();
    // Hide Guajira screens
    this.hideGuajira1Screen();
    this.hideGuajira2Screen();
    this.hideGuajira3Screen();
    this.hideGuajira4Screen();
    this.hideGuajira5Screen();
    this.hideGuajira6Screen();
    this.hideGuajira7Screen();
    this.hideGuajira8Screen();
    this.hideGuajira9Screen();
    this.hideGuajira10Screen();
    // Hide Cartagena screens
    // Cartagena 1 y 8 no tienen pantallas adicionales
    this.hideCartagena2Screen();
    this.hideCartagena3Screen();
    this.hideCartagena4Screen();
    this.hideCartagena5Screen();
    this.hideCartagena6Screen();
    this.hideCartagena7Screen();
    // Hide Meta screens
    // Meta 1 no tiene pantallas adicionales
    this.hideMeta2Screen();
    this.hideMeta3Screen();
    this.hideMeta4Screen();
    this.hideMeta5Screen();
    this.hideMeta6Screen();
    this.hideMeta7Screen();

    // Show screens based on scene
    if (sceneConfig.id === "escena-1") {
      this.showEscena1Screen();
    } else if (sceneConfig.id === "escena-2") {
      this.showEscena2Screen();
    } else if (sceneConfig.id === "escena-3") {
      this.showEscena3Screen();
      this.showEscena3BScreen();
    } else if (sceneConfig.id === "escena-4") {
      this.showEscena4Screen();
      this.showEscena4BScreen();
    } else if (sceneConfig.id === "escena-5") {
      this.showEscena5Screen();
      this.showEscena5BScreen();
    } else if (sceneConfig.id === "escena-6") {
      // REMOVED: No screens for escena-6
      // this.showEscena6Screen();
      // this.showEscena6BScreen();
    } else if (sceneConfig.id === "escena-7") {
      this.showEscena7Screen();
      this.showEscena7BScreen();
    } else if (sceneConfig.id === "escena-8") {
      this.showEscena8Screen();
      this.showEscena8BScreen();
    } else if (sceneConfig.id === "escena-9") {
      this.showEscena9Screen();
      // this.showEscena9BScreen(); // Commented out - video not available
    } else if (sceneConfig.id === "escena-10") {
      this.showEscena10Screen();
      this.showEscena10BScreen();
    } else if (sceneConfig.id === "escena-11") {
      this.showEscena11Screen();
      this.showEscena11BScreen();
    } else if (sceneConfig.id === "guajira-1") {
      this.showGuajira1Screen();
    } else if (sceneConfig.id === "guajira-2") {
      this.showGuajira2Screen();
    } else if (sceneConfig.id === "guajira-3") {
      this.showGuajira3Screen();
    } else if (sceneConfig.id === "guajira-4") {
      this.showGuajira4Screen();
    } else if (sceneConfig.id === "guajira-5") {
      this.showGuajira5Screen();
    } else if (sceneConfig.id === "guajira-6") {
      this.showGuajira6Screen();
    } else if (sceneConfig.id === "guajira-7") {
      this.showGuajira7Screen();
    } else if (sceneConfig.id === "guajira-8") {
      this.showGuajira8Screen();
    } else if (sceneConfig.id === "guajira-9") {
      this.showGuajira9Screen();
    } else if (sceneConfig.id === "guajira-10") {
      this.showGuajira10Screen();
    } else if (sceneConfig.id === "cartagena-1") {
      // Cartagena 1 solo muestra el escenario base, sin pantallas adicionales
    } else if (sceneConfig.id === "cartagena-2") {
      this.showCartagena2Screen();
    } else if (sceneConfig.id === "cartagena-3") {
      this.showCartagena3Screen();
    } else if (sceneConfig.id === "cartagena-4") {
      this.showCartagena4Screen();
    } else if (sceneConfig.id === "cartagena-5") {
      this.showCartagena5Screen();
    } else if (sceneConfig.id === "cartagena-6") {
      this.showCartagena6Screen();
    } else if (sceneConfig.id === "cartagena-7") {
      this.showCartagena7Screen();
    } else if (sceneConfig.id === "cartagena-8") {
      // Cartagena 8 solo muestra el escenario con escena_11.png, sin pantallas adicionales
    } else if (sceneConfig.id === "meta-1") {
      // Meta 1 solo muestra el escenario base, sin pantallas adicionales
    } else if (sceneConfig.id === "meta-2") {
      this.showMeta2Screen();
    } else if (sceneConfig.id === "meta-3") {
      this.showMeta3Screen();
    } else if (sceneConfig.id === "meta-4") {
      this.showMeta4Screen();
    } else if (sceneConfig.id === "meta-5") {
      this.showMeta5Screen();
    } else if (sceneConfig.id === "meta-6") {
      this.showMeta6Screen();
    } else if (sceneConfig.id === "meta-7") {
      this.showMeta7Screen();
    }
  }

  // Screen control methods for all scenes
  showEscena1Screen() {
    if (!this.elements.escena1Screen) return;
    try {
      const component =
        this.elements.escena1Screen.components["solar-video-cycler"];
      if (component && component.show) {
        component.show();
      } else {
        this.elements.escena1Screen.setAttribute("visible", "true");
      }
    } catch (error) {
      // Error showing screen
    }
  }

  hideEscena1Screen() {
    if (!this.elements.escena1Screen) return;
    try {
      const component =
        this.elements.escena1Screen.components["solar-video-cycler"];
      if (component && component.hide) {
        component.hide();
      } else {
        this.elements.escena1Screen.setAttribute("visible", "false");
      }
    } catch (error) {
      // Error hiding screen
    }
  }

  showEscena2Screen() {
    if (!this.elements.escena2Screen) return;
    try {
      const component =
        this.elements.escena2Screen.components["escena2-image-cycler"];
      if (component && component.show) {
        component.show();
      } else {
        this.elements.escena2Screen.setAttribute("visible", "true");
      }
    } catch (error) {
      // Error showing screen
    }
  }

  hideEscena2Screen() {
    if (!this.elements.escena2Screen) return;
    try {
      const component =
        this.elements.escena2Screen.components["escena2-image-cycler"];
      if (component && component.hide) {
        component.hide();
      } else {
        this.elements.escena2Screen.setAttribute("visible", "false");
      }
    } catch (error) {
      // Error hiding screen
    }
  }

  // Screen control methods - All screen show/hide methods follow the same pattern
  showEscena3Screen() {
    if (!this.elements.escena3Screen) return;
    try {
      const component =
        this.elements.escena3Screen.components["escena3a-image-cycler"];
      component?.show
        ? component.show()
        : this.elements.escena3Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena3Screen() {
    if (!this.elements.escena3Screen) return;
    try {
      const component =
        this.elements.escena3Screen.components["escena3a-image-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.escena3Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena3BScreen() {
    if (!this.elements.escena3BScreen) return;
    try {
      const component =
        this.elements.escena3BScreen.components["escena3b-image-cycler"];
      component?.show
        ? component.show()
        : this.elements.escena3BScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena3BScreen() {
    if (!this.elements.escena3BScreen) return;
    try {
      const component =
        this.elements.escena3BScreen.components["escena3b-image-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.escena3BScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena4Screen() {
    if (!this.elements.escena4Screen) return;
    try {
      const component =
        this.elements.escena4Screen.components["escena4-video-cycler"];
      component?.show
        ? component.show()
        : this.elements.escena4Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena4Screen() {
    if (!this.elements.escena4Screen) return;
    try {
      const component =
        this.elements.escena4Screen.components["escena4-video-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.escena4Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena4BScreen() {
    if (!this.elements.escena4BScreen) return;
    try {
      const component =
        this.elements.escena4BScreen.components["escena4b-video-cycler"];
      component?.show
        ? component.show()
        : this.elements.escena4BScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena4BScreen() {
    if (!this.elements.escena4BScreen) return;
    try {
      const component =
        this.elements.escena4BScreen.components["escena4b-video-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.escena4BScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena5Screen() {
    if (!this.elements.escena5Screen) return;
    try {
      const component =
        this.elements.escena5Screen.components["escena5-image-cycler"];
      component?.show
        ? component.show()
        : this.elements.escena5Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena5Screen() {
    if (!this.elements.escena5Screen) return;
    try {
      const component =
        this.elements.escena5Screen.components["escena5-image-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.escena5Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena5BScreen() {
    if (!this.elements.escena5BScreen) return;
    try {
      const component =
        this.elements.escena5BScreen.components["escena5b-image-cycler"];
      component?.show
        ? component.show()
        : this.elements.escena5BScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena5BScreen() {
    if (!this.elements.escena5BScreen) return;
    try {
      const component =
        this.elements.escena5BScreen.components["escena5b-image-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.escena5BScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena6Screen() {
    if (!this.elements.escena6Screen) return;
    try {
      const component =
        this.elements.escena6Screen.components["escena6-image-cycler"];
      component?.show
        ? component.show()
        : this.elements.escena6Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena6Screen() {
    if (!this.elements.escena6Screen) return;
    try {
      const component =
        this.elements.escena6Screen.components["escena6-image-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.escena6Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena6BScreen() {
    if (!this.elements.escena6BScreen) return;
    try {
      const component =
        this.elements.escena6BScreen.components["escena6b-video-cycler"];
      component?.show
        ? component.show()
        : this.elements.escena6BScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena6BScreen() {
    if (!this.elements.escena6BScreen) return;
    try {
      const component =
        this.elements.escena6BScreen.components["escena6b-video-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.escena6BScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena7Screen() {
    if (!this.elements.escena7Screen) return;
    try {
      const component =
        this.elements.escena7Screen.components["escena7-image-cycler"];
      component?.show
        ? component.show()
        : this.elements.escena7Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena7Screen() {
    if (!this.elements.escena7Screen) return;
    try {
      const component =
        this.elements.escena7Screen.components["escena7-image-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.escena7Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena7BScreen() {
    if (!this.elements.escena7BScreen) return;
    try {
      const component =
        this.elements.escena7BScreen.components["escena7b-video-cycler"];
      component?.show
        ? component.show()
        : this.elements.escena7BScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena7BScreen() {
    if (!this.elements.escena7BScreen) return;
    try {
      const component =
        this.elements.escena7BScreen.components["escena7b-video-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.escena7BScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena8Screen() {
    if (!this.elements.escena8Screen) return;
    try {
      const component =
        this.elements.escena8Screen.components["escena8-image-cycler"];
      component?.show
        ? component.show()
        : this.elements.escena8Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena8Screen() {
    if (!this.elements.escena8Screen) return;
    try {
      const component =
        this.elements.escena8Screen.components["escena8-image-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.escena8Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena8BScreen() {
    if (!this.elements.escena8BScreen) return;
    try {
      const component =
        this.elements.escena8BScreen.components["escena8b-image-cycler"];
      component?.show
        ? component.show()
        : this.elements.escena8BScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena8BScreen() {
    if (!this.elements.escena8BScreen) return;
    try {
      const component =
        this.elements.escena8BScreen.components["escena8b-image-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.escena8BScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena9Screen() {
    if (!this.elements.escena9Screen) return;
    try {
      const component =
        this.elements.escena9Screen.components["escena9-image-cycler"];
      component?.show
        ? component.show()
        : this.elements.escena9Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena9Screen() {
    if (!this.elements.escena9Screen) return;
    try {
      const component =
        this.elements.escena9Screen.components["escena9-image-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.escena9Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena9BScreen() {
    if (!this.elements.escena9BScreen) return;
    try {
      const component =
        this.elements.escena9BScreen.components["escena9b-video-cycler"];
      component?.show
        ? component.show()
        : this.elements.escena9BScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena9BScreen() {
    if (!this.elements.escena9BScreen) return;
    try {
      const component =
        this.elements.escena9BScreen.components["escena9b-video-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.escena9BScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena10Screen() {
    if (!this.elements.escena10Screen) return;
    try {
      const component =
        this.elements.escena10Screen.components["escena10-image-cycler"];
      component?.show
        ? component.show()
        : this.elements.escena10Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena10Screen() {
    if (!this.elements.escena10Screen) return;
    try {
      const component =
        this.elements.escena10Screen.components["escena10-image-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.escena10Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena10BScreen() {
    if (!this.elements.escena10BScreen) return;
    try {
      const component =
        this.elements.escena10BScreen.components["escena10b-image-cycler"];
      component?.show
        ? component.show()
        : this.elements.escena10BScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena10BScreen() {
    if (!this.elements.escena10BScreen) return;
    try {
      const component =
        this.elements.escena10BScreen.components["escena10b-image-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.escena10BScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena11Screen() {
    if (!this.elements.escena11Screen) return;
    try {
      const component =
        this.elements.escena11Screen.components["escena11-image-cycler"];
      component?.show
        ? component.show()
        : this.elements.escena11Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena11Screen() {
    if (!this.elements.escena11Screen) return;
    try {
      const component =
        this.elements.escena11Screen.components["escena11-image-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.escena11Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena11BScreen() {
    if (!this.elements.escena11BScreen) return;
    try {
      const component =
        this.elements.escena11BScreen.components["escena11b-video-cycler"];
      component?.show
        ? component.show()
        : this.elements.escena11BScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena11BScreen() {
    if (!this.elements.escena11BScreen) return;
    try {
      const component =
        this.elements.escena11BScreen.components["escena11b-video-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.escena11BScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  // Guajira screen control methods
  showGuajira1Screen() {
    if (!this.elements.guajira1Screen) return;
    try {
      const component =
        this.elements.guajira1Screen.components["guajira1-video-cycler"];
      component?.show
        ? component.show()
        : this.elements.guajira1Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideGuajira1Screen() {
    if (!this.elements.guajira1Screen) return;
    try {
      const component =
        this.elements.guajira1Screen.components["guajira1-video-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.guajira1Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showGuajira2Screen() {
    if (!this.elements.guajira2Screen) return;
    try {
      const component =
        this.elements.guajira2Screen.components["guajira2-image-cycler"];
      component?.show
        ? component.show()
        : this.elements.guajira2Screen.setAttribute("visible", "true");
    } catch (error) {}

    // Show video screen
    if (!this.elements.guajira2VideoScreen) return;
    try {
      const videoComponent =
        this.elements.guajira2VideoScreen.components["guajira2-video-cycler"];
      videoComponent?.show
        ? videoComponent.show()
        : this.elements.guajira2VideoScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideGuajira2Screen() {
    if (!this.elements.guajira2Screen) return;
    try {
      const component =
        this.elements.guajira2Screen.components["guajira2-image-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.guajira2Screen.setAttribute("visible", "false");
    } catch (error) {}

    // Hide video screen
    if (!this.elements.guajira2VideoScreen) return;
    try {
      const videoComponent =
        this.elements.guajira2VideoScreen.components["guajira2-video-cycler"];
      videoComponent?.hide
        ? videoComponent.hide()
        : this.elements.guajira2VideoScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showGuajira3Screen() {
    if (!this.elements.guajira3Screen) return;
    try {
      const component =
        this.elements.guajira3Screen.components["guajira3-video-cycler"];
      component?.show
        ? component.show()
        : this.elements.guajira3Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideGuajira3Screen() {
    if (!this.elements.guajira3Screen) return;
    try {
      const component =
        this.elements.guajira3Screen.components["guajira3-video-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.guajira3Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showGuajira4Screen() {
    if (!this.elements.guajira4Screen) return;
    try {
      const component =
        this.elements.guajira4Screen.components["guajira4-image-cycler"];
      component?.show
        ? component.show()
        : this.elements.guajira4Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideGuajira4Screen() {
    if (!this.elements.guajira4Screen) return;
    try {
      const component =
        this.elements.guajira4Screen.components["guajira4-image-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.guajira4Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showGuajira5Screen() {
    if (!this.elements.guajira5Screen) return;
    try {
      const component =
        this.elements.guajira5Screen.components["guajira5-video-cycler"];
      component?.show
        ? component.show()
        : this.elements.guajira5Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideGuajira5Screen() {
    if (!this.elements.guajira5Screen) return;
    try {
      const component =
        this.elements.guajira5Screen.components["guajira5-video-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.guajira5Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showGuajira6Screen() {
    if (!this.elements.guajira6Screen) return;
    try {
      const component =
        this.elements.guajira6Screen.components["guajira6-image-cycler"];
      component?.show
        ? component.show()
        : this.elements.guajira6Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideGuajira6Screen() {
    if (!this.elements.guajira6Screen) return;
    try {
      const component =
        this.elements.guajira6Screen.components["guajira6-image-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.guajira6Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showGuajira7Screen() {
    if (!this.elements.guajira7Screen) return;
    try {
      const component =
        this.elements.guajira7Screen.components["guajira7-image-cycler"];
      component?.show
        ? component.show()
        : this.elements.guajira7Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideGuajira7Screen() {
    if (!this.elements.guajira7Screen) return;
    try {
      const component =
        this.elements.guajira7Screen.components["guajira7-image-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.guajira7Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showGuajira8Screen() {
    if (!this.elements.guajira8Screen) return;
    try {
      const component =
        this.elements.guajira8Screen.components["guajira8-image-cycler"];
      component?.show
        ? component.show()
        : this.elements.guajira8Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideGuajira8Screen() {
    if (!this.elements.guajira8Screen) return;
    try {
      const component =
        this.elements.guajira8Screen.components["guajira8-image-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.guajira8Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showGuajira9Screen() {
    if (!this.elements.guajira9Screen) return;
    try {
      const component =
        this.elements.guajira9Screen.components["guajira9-video-cycler"];
      component?.show
        ? component.show()
        : this.elements.guajira9Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideGuajira9Screen() {
    if (!this.elements.guajira9Screen) return;
    try {
      const component =
        this.elements.guajira9Screen.components["guajira9-video-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.guajira9Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showGuajira10Screen() {
    if (!this.elements.guajira10Screen) return;
    try {
      const component =
        this.elements.guajira10Screen.components["guajira10-image-cycler"];
      component?.show
        ? component.show()
        : this.elements.guajira10Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideGuajira10Screen() {
    if (!this.elements.guajira10Screen) return;
    try {
      const component =
        this.elements.guajira10Screen.components["guajira10-image-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.guajira10Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  // Cartagena screen control methods
  showCartagena2Screen() {
    if (!this.elements.cartagena2Screen) return;
    try {
      const component =
        this.elements.cartagena2Screen.components["cartagena2-video-cycler"];
      component?.show
        ? component.show()
        : this.elements.cartagena2Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideCartagena2Screen() {
    if (!this.elements.cartagena2Screen) return;
    try {
      const component =
        this.elements.cartagena2Screen.components["cartagena2-video-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.cartagena2Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showCartagena3Screen() {
    if (!this.elements.cartagena3Screen) return;
    try {
      const component =
        this.elements.cartagena3Screen.components["cartagena3-video-cycler"];
      component?.show
        ? component.show()
        : this.elements.cartagena3Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideCartagena3Screen() {
    if (!this.elements.cartagena3Screen) return;
    try {
      const component =
        this.elements.cartagena3Screen.components["cartagena3-video-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.cartagena3Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showCartagena4Screen() {
    if (!this.elements.cartagena4Screen) return;
    try {
      const component =
        this.elements.cartagena4Screen.components["cartagena4-video-cycler"];
      component?.show
        ? component.show()
        : this.elements.cartagena4Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideCartagena4Screen() {
    if (!this.elements.cartagena4Screen) return;
    try {
      const component =
        this.elements.cartagena4Screen.components["cartagena4-video-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.cartagena4Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showCartagena5Screen() {
    if (!this.elements.cartagena5Screen) return;
    try {
      const component =
        this.elements.cartagena5Screen.components["cartagena5-video-cycler"];
      component?.show
        ? component.show()
        : this.elements.cartagena5Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideCartagena5Screen() {
    if (!this.elements.cartagena5Screen) return;
    try {
      const component =
        this.elements.cartagena5Screen.components["cartagena5-video-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.cartagena5Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showCartagena6Screen() {
    if (!this.elements.cartagena6Screen) return;
    try {
      const component =
        this.elements.cartagena6Screen.components["cartagena6-image-cycler"];
      component?.show
        ? component.show()
        : this.elements.cartagena6Screen.setAttribute("visible", "true");
    } catch (error) {}
    // Show video screen as well
    if (!this.elements.cartagena6VideoScreen) return;
    try {
      const component =
        this.elements.cartagena6VideoScreen.components[
          "cartagena6-video-cycler"
        ];
      component?.show
        ? component.show()
        : this.elements.cartagena6VideoScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideCartagena6Screen() {
    if (!this.elements.cartagena6Screen) return;
    try {
      const component =
        this.elements.cartagena6Screen.components["cartagena6-image-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.cartagena6Screen.setAttribute("visible", "false");
    } catch (error) {}
    // Hide video screen as well
    if (!this.elements.cartagena6VideoScreen) return;
    try {
      const component =
        this.elements.cartagena6VideoScreen.components[
          "cartagena6-video-cycler"
        ];
      component?.hide
        ? component.hide()
        : this.elements.cartagena6VideoScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showCartagena7Screen() {
    if (!this.elements.cartagena7Screen) return;
    try {
      const component =
        this.elements.cartagena7Screen.components["cartagena7-video-cycler"];
      component?.show
        ? component.show()
        : this.elements.cartagena7Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideCartagena7Screen() {
    if (!this.elements.cartagena7Screen) return;
    try {
      const component =
        this.elements.cartagena7Screen.components["cartagena7-video-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.cartagena7Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  // Meta screen control methods
  showMeta2Screen() {
    if (!this.elements.meta2ImageScreen) return;
    try {
      const component =
        this.elements.meta2ImageScreen.components["meta2-image-cycler"];
      component?.show
        ? component.show()
        : this.elements.meta2ImageScreen.setAttribute("visible", "true");
    } catch (error) {}

    // Show video screen
    if (!this.elements.meta2VideoScreen) return;
    try {
      const videoComponent =
        this.elements.meta2VideoScreen.components["meta2-video-cycler"];
      videoComponent?.show
        ? videoComponent.show()
        : this.elements.meta2VideoScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideMeta2Screen() {
    if (!this.elements.meta2ImageScreen) return;
    try {
      const component =
        this.elements.meta2ImageScreen.components["meta2-image-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.meta2ImageScreen.setAttribute("visible", "false");
    } catch (error) {}

    // Hide video screen
    if (!this.elements.meta2VideoScreen) return;
    try {
      const videoComponent =
        this.elements.meta2VideoScreen.components["meta2-video-cycler"];
      videoComponent?.hide
        ? videoComponent.hide()
        : this.elements.meta2VideoScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showMeta3Screen() {
    if (!this.elements.meta3VideoScreen) return;
    try {
      const component =
        this.elements.meta3VideoScreen.components["meta3-video-cycler"];
      component?.show
        ? component.show()
        : this.elements.meta3VideoScreen.setAttribute("visible", "true");
    } catch (error) {}

    // Show image screen
    if (!this.elements.meta3ImageScreen) return;
    try {
      const imageComponent =
        this.elements.meta3ImageScreen.components["meta3-image-cycler"];
      imageComponent?.show
        ? imageComponent.show()
        : this.elements.meta3ImageScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideMeta3Screen() {
    if (!this.elements.meta3VideoScreen) return;
    try {
      const component =
        this.elements.meta3VideoScreen.components["meta3-video-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.meta3VideoScreen.setAttribute("visible", "false");
    } catch (error) {}

    // Hide image screen
    if (!this.elements.meta3ImageScreen) return;
    try {
      const imageComponent =
        this.elements.meta3ImageScreen.components["meta3-image-cycler"];
      imageComponent?.hide
        ? imageComponent.hide()
        : this.elements.meta3ImageScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showMeta4Screen() {
    if (!this.elements.meta4ImageScreen) return;
    try {
      const component =
        this.elements.meta4ImageScreen.components["meta4-image-cycler"];
      component?.show
        ? component.show()
        : this.elements.meta4ImageScreen.setAttribute("visible", "true");
    } catch (error) {}

    // Show video screen
    if (!this.elements.meta4VideoScreen) return;
    try {
      const videoComponent =
        this.elements.meta4VideoScreen.components["meta4-video-cycler"];
      videoComponent?.show
        ? videoComponent.show()
        : this.elements.meta4VideoScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideMeta4Screen() {
    if (!this.elements.meta4ImageScreen) return;
    try {
      const component =
        this.elements.meta4ImageScreen.components["meta4-image-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.meta4ImageScreen.setAttribute("visible", "false");
    } catch (error) {}

    // Hide video screen
    if (!this.elements.meta4VideoScreen) return;
    try {
      const videoComponent =
        this.elements.meta4VideoScreen.components["meta4-video-cycler"];
      videoComponent?.hide
        ? videoComponent.hide()
        : this.elements.meta4VideoScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showMeta5Screen() {
    if (!this.elements.meta5VideoScreen) return;
    try {
      const component =
        this.elements.meta5VideoScreen.components["meta5-video-cycler"];
      component?.show
        ? component.show()
        : this.elements.meta5VideoScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideMeta5Screen() {
    if (!this.elements.meta5VideoScreen) return;
    try {
      const component =
        this.elements.meta5VideoScreen.components["meta5-video-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.meta5VideoScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showMeta6Screen() {
    if (!this.elements.meta6VideoScreen) return;
    try {
      const component =
        this.elements.meta6VideoScreen.components["meta6-video-cycler"];
      component?.show
        ? component.show()
        : this.elements.meta6VideoScreen.setAttribute("visible", "true");
    } catch (error) {}

    // Show image screen
    if (!this.elements.meta6ImageScreen) return;
    try {
      const imageComponent =
        this.elements.meta6ImageScreen.components["meta6-image-cycler"];
      imageComponent?.show
        ? imageComponent.show()
        : this.elements.meta6ImageScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideMeta6Screen() {
    if (!this.elements.meta6VideoScreen) return;
    try {
      const component =
        this.elements.meta6VideoScreen.components["meta6-video-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.meta6VideoScreen.setAttribute("visible", "false");
    } catch (error) {}

    // Hide image screen
    if (!this.elements.meta6ImageScreen) return;
    try {
      const imageComponent =
        this.elements.meta6ImageScreen.components["meta6-image-cycler"];
      imageComponent?.hide
        ? imageComponent.hide()
        : this.elements.meta6ImageScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showMeta7Screen() {
    if (!this.elements.meta7VideoScreen) return;
    try {
      const component =
        this.elements.meta7VideoScreen.components["meta7-video-cycler"];
      component?.show
        ? component.show()
        : this.elements.meta7VideoScreen.setAttribute("visible", "true");
    } catch (error) {}

    // Show image screen
    if (!this.elements.meta7ImageScreen) return;
    try {
      const imageComponent =
        this.elements.meta7ImageScreen.components["meta7-image-cycler"];
      imageComponent?.show
        ? imageComponent.show()
        : this.elements.meta7ImageScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideMeta7Screen() {
    if (!this.elements.meta7VideoScreen) return;
    try {
      const component =
        this.elements.meta7VideoScreen.components["meta7-video-cycler"];
      component?.hide
        ? component.hide()
        : this.elements.meta7VideoScreen.setAttribute("visible", "false");
    } catch (error) {}

    // Hide image screen
    if (!this.elements.meta7ImageScreen) return;
    try {
      const imageComponent =
        this.elements.meta7ImageScreen.components["meta7-image-cycler"];
      imageComponent?.hide
        ? imageComponent.hide()
        : this.elements.meta7ImageScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  // Loading overlay methods
  showLoadingOverlay(sceneId = null) {
    this.elements.overlay.setAttribute("visible", "true");

    // Faster fade in animation with lower max opacity for subtlety
    let opacity = 0;
    const fadeInInterval = setInterval(() => {
      opacity += 0.1; // Faster fade
      this.elements.overlay.setAttribute("material", "opacity", opacity);

      if (opacity >= 0.6) {
        // Lower max opacity for subtler transition
        clearInterval(fadeInInterval);
        this.elements.overlay.setAttribute("material", "opacity", 0.6);
      }
    }, 15); // Faster interval
  }

  hideLoadingOverlay() {
    // Get current opacity
    const currentMaterial = this.elements.overlay.getAttribute("material");
    let opacity =
      currentMaterial && currentMaterial.opacity
        ? currentMaterial.opacity
        : 0.6;

    // Faster fade out animation
    const fadeOutInterval = setInterval(() => {
      opacity -= 0.1; // Faster fade
      this.elements.overlay.setAttribute("material", "opacity", opacity);

      if (opacity <= 0) {
        clearInterval(fadeOutInterval);
        this.elements.overlay.setAttribute("material", "opacity", 0);
        this.elements.overlay.setAttribute("visible", "false");
      }
    }, 15); // Faster interval
  }

  // ===== SEQUENCE AUTOMATION METHODS =====

  enableSequenceMode(sequenceId, config) {
    console.log("🎭 Enabling sequence mode:", sequenceId, config);

    this.sequenceMode = true;
    this.sequenceId = sequenceId;
    this.sequenceConfig = config || {};

    // Load sequence configuration if available
    if (window.SEQUENCE_CONFIGS && window.SEQUENCE_CONFIGS[sequenceId]) {
      this.currentSequenceConfig = window.SEQUENCE_CONFIGS[sequenceId];
      console.log(
        "📋 Loaded sequence config:",
        this.currentSequenceConfig.name
      );
    }
  }

  disableSequenceMode() {
    console.log("🎭 Disabling sequence mode");

    this.sequenceMode = false;
    this.sequenceId = null;
    this.sequenceConfig = null;
    this.currentSequenceConfig = null;
  }

  onSequencePaused() {
    console.log("⏸️ Sequence paused - Client side handling");
    // Additional client-side handling for sequence pause
  }

  onSequenceResumed() {
    console.log("▶️ Sequence resumed - Client side handling");
    // Additional client-side handling for sequence resume
  }

  onSequenceNextScene() {
    console.log("⏭️ Next scene - Client side handling");
    // The server handles the actual scene change via LOAD command
  }

  onSequencePreviousScene() {
    console.log("⏮️ Previous scene - Client side handling");
    // The server handles the actual scene change via LOAD command
  }

  onSequenceJumpToScene(sceneIndex) {
    console.log("⏯️ Jump to scene:", sceneIndex, "- Client side handling");
    // The server handles the actual scene change via LOAD command
  }

  // Enhanced loadScene method for sequence mode
  async loadSceneForSequence(sceneId, sequenceContext) {
    console.log("🎬 Loading scene for sequence:", sceneId, sequenceContext);

    // Use the existing loadScene method but with sequence awareness
    const result = await this.loadScene(sceneId);

    if (result && sequenceContext) {
      // Additional sequence-specific handling
      if (
        sequenceContext.showScreensAutomatically &&
        sequenceContext.screenDelay
      ) {
        // Auto-show screens after delay (handled by server)
        console.log(
          "📺 Screens will auto-show in",
          sequenceContext.screenDelay,
          "ms"
        );
      }
    }

    return result;
  }

  // Get current sequence info
  getSequenceInfo() {
    return {
      isSequenceMode: this.sequenceMode,
      sequenceId: this.sequenceId,
      sequenceConfig: this.sequenceConfig,
      currentSequenceConfig: this.currentSequenceConfig,
    };
  }
}

// Export for global access
window.VRSceneManager = VRSceneManager;
