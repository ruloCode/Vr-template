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
   * Clean up Three.js textures to prevent GPU memory leaks - OPTIMIZED
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
          // Also dispose geometry if exists
          if (mesh.geometry) {
            mesh.geometry.dispose();
          }
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
            // Dispose material and geometry
            if (mesh.material) mesh.material.dispose();
            if (mesh.geometry) mesh.geometry.dispose();
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
   * Pause all video elements except those needed for current scene to free GPU resources - OPTIMIZED
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
        // AGGRESSIVE: Unload video to free memory completely
        const originalSrc = video.src;
        video.removeAttribute('src');
        video.load(); // Force unload
        video.dataset.originalSrc = originalSrc; // Store for potential reload
        // Remove from DOM rendering to free GPU memory
        video.style.display = "none";
      }
    });
  }

  /**
   * Resume videos needed for current scene - OPTIMIZED
   */
  resumeSceneVideos(sceneId) {
    const sceneNumber = sceneId.replace("escena-", "").replace("guajira-", "guajira");
    const sceneVideos = document.querySelectorAll(
      `video[id*="${sceneNumber}"]`
    );

    sceneVideos.forEach((video) => {
      // Restore video src if it was unloaded
      if (video.dataset.originalSrc && !video.src) {
        video.src = video.dataset.originalSrc;
        video.load();
      }
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
      // OPTIMIZED: Minimal delay for fastest transitions
      setTimeout(() => {
        this.hideLoadingOverlay();
      }, 30);
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
      console.log("📦 updateAssets called for scene:", sceneConfig.id);

      // Update audio asset with cache checking
      const audioElement = document.querySelector("#current-audio");
      if (audioElement && sceneConfig.assets.audio) {
        console.log("🎵 Updating audio asset:", sceneConfig.assets.audio);

        const cachedAudio = await cacheManager.getAsset(
          sceneConfig.assets.audio
        );

        if (cachedAudio) {
          console.log("✅ Using cached audio:", sceneConfig.assets.audio);
          // Create blob URL from cached data and store it for cleanup
          this.currentAudioBlobUrl = URL.createObjectURL(cachedAudio.data);
          audioElement.src = this.currentAudioBlobUrl;
          console.log("🎵 Audio src set to blob URL:", this.currentAudioBlobUrl.substring(0, 50) + "...");
        } else {
          console.log(
            "🌐 Loading audio from network:",
            sceneConfig.assets.audio
          );
          audioElement.src = sceneConfig.assets.audio;
          console.log("🎵 Audio src set to path:", sceneConfig.assets.audio);
        }

        audioElement.load();
        console.log("🎵 Audio element load() called");
      } else {
        console.warn("⚠️ Audio element or audio config missing");
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

      // OPTIMIZED: Minimal wait for assets to load
      await new Promise((resolve) => setTimeout(resolve, 50));

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

      // OPTIMIZED: Reduced fallback delay
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  updateSkybox(sceneConfig) {
    // OPTIMIZED: Direct update without remove/readd cycle
    // Just update the src attribute directly - A-Frame will handle the texture change
    this.elements.skybox.setAttribute("src", "#current-skybox");

    // Force material update for immediate visual change
    if (this.elements.skybox.getObject3D && this.elements.skybox.getObject3D("mesh")) {
      const mesh = this.elements.skybox.getObject3D("mesh");
      if (mesh.material) {
        mesh.material.needsUpdate = true;
      }
    }
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
    console.log("🎵 updateAudio called for scene:", sceneConfig.id);
    console.log("🎵 Audio path:", sceneConfig.assets.audio);

    // Stop current audio if playing
    try {
      const soundComponent = this.elements.sound.components.sound;
      if (soundComponent) {
        soundComponent.stopSound();
      }
    } catch (error) {
      console.warn("⚠️ Error stopping current sound:", error);
    }

    // If scene has no audio (e.g., base scene), just stop and return
    if (!sceneConfig.assets.audio) {
      console.log("🔇 Scene has no audio, keeping sound stopped");
      const audioElement = document.querySelector("#current-audio");
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      return;
    }

    // FIXED: Don't update audio src here - updateAssets() already did it
    // This prevents overwriting cached blob URLs and eliminates duplication
    const audioElement = document.querySelector("#current-audio");
    if (audioElement) {
      console.log("🎵 Current audio element src:", audioElement.src);
      console.log("🎵 Audio enabled:", window.audioEnabled);
    } else {
      console.error("❌ Audio element not found!");
      return;
    }

    // Force A-Frame to detect the audio change by removing and re-adding src
    this.elements.sound.removeAttribute("src");

    // Small delay to ensure A-Frame processes the removal
    setTimeout(() => {
      this.elements.sound.setAttribute("src", "#current-audio");
      console.log("🎵 A-Frame sound component updated");

      // OPTIMIZED: Balanced delay for audio playback (safe loading time)
      setTimeout(() => {
        // Only attempt to play if audio is enabled
        if (!window.audioEnabled) {
          console.warn("⚠️ Audio not enabled, skipping playback");
          return;
        }

        console.log("🎵 Attempting to play audio for scene:", sceneConfig.id);

        // Start playing the new audio
        try {
          const newSoundComponent = this.elements.sound.components.sound;
          if (newSoundComponent) {
            newSoundComponent.playSound();
            console.log("✅ Audio playback started via sound component");
          } else {
            // Fallback to direct audio play
            console.warn("⚠️ Sound component not found, using fallback");
            if (audioElement) {
              audioElement.currentTime = 0;
              audioElement.play()
                .then(() => console.log("✅ Audio playback started via direct play"))
                .catch((error) => console.error("❌ Audio play failed:", error));
            }
          }
        } catch (error) {
          console.error("❌ Error playing new audio:", error);
        }
      }, 300); // OPTIMIZED: 300ms - balanced between speed and reliability
    }, 50); // Small delay to ensure removal is processed
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

  // Loading overlay methods - OPTIMIZED with requestAnimationFrame
  showLoadingOverlay(sceneId = null) {
    this.elements.overlay.setAttribute("visible", "true");

    // OPTIMIZED: Use requestAnimationFrame for smoother, faster fade
    let startTime = null;
    const duration = 150; // 150ms fade in
    const maxOpacity = 0.5; // Lower opacity for subtler transition

    const fadeIn = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const opacity = progress * maxOpacity;
      this.elements.overlay.setAttribute("material", "opacity", opacity);

      if (progress < 1) {
        requestAnimationFrame(fadeIn);
      }
    };

    requestAnimationFrame(fadeIn);
  }

  hideLoadingOverlay() {
    // OPTIMIZED: Use requestAnimationFrame for smoother, faster fade
    const currentMaterial = this.elements.overlay.getAttribute("material");
    const startOpacity = currentMaterial?.opacity || 0.5;

    let startTime = null;
    const duration = 150; // 150ms fade out

    const fadeOut = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const opacity = startOpacity * (1 - progress);
      this.elements.overlay.setAttribute("material", "opacity", opacity);

      if (progress < 1) {
        requestAnimationFrame(fadeOut);
      } else {
        this.elements.overlay.setAttribute("material", "opacity", 0);
        this.elements.overlay.setAttribute("visible", "false");
      }
    };

    requestAnimationFrame(fadeOut);
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
