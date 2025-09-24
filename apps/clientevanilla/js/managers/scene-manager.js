/**
 * VR Scene Manager
 * Manages VR scene loading, transitions, and controls
 */

import { enableAudio } from './audio-manager.js';

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
    
    this.initializeElements();
  }

  initializeElements() {
    this.elements = {
      skybox: document.querySelector("#scene-skybox"),
      sound: document.querySelector("#scene-sound"),
      ambientLight: document.querySelector("#ambient-light"),
      directionalLight: document.querySelector("#directional-light"),
      models: document.querySelector("#scene-models"),
      overlay: document.querySelector("#scene-overlay"),
      loadingTextFront: document.querySelector("#loading-text-front"),
      loadingTextBack: document.querySelector("#loading-text-back"),
      loadingTextLeft: document.querySelector("#loading-text-left"),
      loadingTextRight: document.querySelector("#loading-text-right"),
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
      assets: {
        audio: document.querySelector("#current-audio"),
        skybox: document.querySelector("#current-skybox"),
      },
    };
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

    // Loading scene
    this.isLoading = true;
    this.showLoadingOverlay(sceneId);

    const sceneConfig = window.SCENES_CONFIG[sceneId];

    try {
      // Enable audio if not already enabled
      await enableAudio();

      // Update assets
      await this.updateAssets(sceneConfig);

      // Update scene elements
      this.updateSkybox(sceneConfig);
      this.updateLighting(sceneConfig);
      this.updateModels(sceneConfig);
      this.updateAudio(sceneConfig);
      this.updateFloatingScreens(sceneConfig);

      this.currentScene = sceneConfig;
      window.currentSceneId = sceneId;

      // Notify server we're ready
      if (window.vrClient && window.vrClient.isConnected) {
        window.vrClient.sendReady(sceneId);
      }

      return true;
    } catch (error) {
      // Error loading scene
      return false;
    } finally {
      this.isLoading = false;
      // Add a small delay before hiding overlay to ensure scene is fully loaded
      setTimeout(() => {
        this.hideLoadingOverlay();
      }, 300);
    }
  }

  async updateAssets(sceneConfig) {
    // Update audio asset using the same approach as updateAudio
    const audioElement = document.querySelector("#current-audio");
    if (audioElement && sceneConfig.assets.audio) {
      audioElement.src = sceneConfig.assets.audio;
      audioElement.load();
    }

    // Update skybox asset
    this.elements.assets.skybox.setAttribute(
      "src",
      sceneConfig.assets.skybox
    );

    // Wait for assets to load
    return new Promise((resolve) => setTimeout(resolve, 500));
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
    if (
      sceneConfig.assets.models &&
      sceneConfig.assets.models.length > 0
    ) {
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
      this.showEscena6Screen();
      this.showEscena6BScreen();
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
    }
  }

  // Screen control methods for all scenes
  showEscena1Screen() {
    if (!this.elements.escena1Screen) return;
    try {
      const component = this.elements.escena1Screen.components["solar-video-cycler"];
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
      const component = this.elements.escena1Screen.components["solar-video-cycler"];
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
      const component = this.elements.escena2Screen.components["escena2-image-cycler"];
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
      const component = this.elements.escena2Screen.components["escena2-image-cycler"];
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
      const component = this.elements.escena3Screen.components["escena3a-image-cycler"];
      component?.show ? component.show() : this.elements.escena3Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena3Screen() {
    if (!this.elements.escena3Screen) return;
    try {
      const component = this.elements.escena3Screen.components["escena3a-image-cycler"];
      component?.hide ? component.hide() : this.elements.escena3Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena3BScreen() {
    if (!this.elements.escena3BScreen) return;
    try {
      const component = this.elements.escena3BScreen.components["escena3b-image-cycler"];
      component?.show ? component.show() : this.elements.escena3BScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena3BScreen() {
    if (!this.elements.escena3BScreen) return;
    try {
      const component = this.elements.escena3BScreen.components["escena3b-image-cycler"];
      component?.hide ? component.hide() : this.elements.escena3BScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena4Screen() {
    if (!this.elements.escena4Screen) return;
    try {
      const component = this.elements.escena4Screen.components["escena4-video-cycler"];
      component?.show ? component.show() : this.elements.escena4Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena4Screen() {
    if (!this.elements.escena4Screen) return;
    try {
      const component = this.elements.escena4Screen.components["escena4-video-cycler"];
      component?.hide ? component.hide() : this.elements.escena4Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena4BScreen() {
    if (!this.elements.escena4BScreen) return;
    try {
      const component = this.elements.escena4BScreen.components["escena4b-video-cycler"];
      component?.show ? component.show() : this.elements.escena4BScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena4BScreen() {
    if (!this.elements.escena4BScreen) return;
    try {
      const component = this.elements.escena4BScreen.components["escena4b-video-cycler"];
      component?.hide ? component.hide() : this.elements.escena4BScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena5Screen() {
    if (!this.elements.escena5Screen) return;
    try {
      const component = this.elements.escena5Screen.components["escena5-image-cycler"];
      component?.show ? component.show() : this.elements.escena5Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena5Screen() {
    if (!this.elements.escena5Screen) return;
    try {
      const component = this.elements.escena5Screen.components["escena5-image-cycler"];
      component?.hide ? component.hide() : this.elements.escena5Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena5BScreen() {
    if (!this.elements.escena5BScreen) return;
    try {
      const component = this.elements.escena5BScreen.components["escena5b-image-cycler"];
      component?.show ? component.show() : this.elements.escena5BScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena5BScreen() {
    if (!this.elements.escena5BScreen) return;
    try {
      const component = this.elements.escena5BScreen.components["escena5b-image-cycler"];
      component?.hide ? component.hide() : this.elements.escena5BScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena6Screen() {
    if (!this.elements.escena6Screen) return;
    try {
      const component = this.elements.escena6Screen.components["escena6-image-cycler"];
      component?.show ? component.show() : this.elements.escena6Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena6Screen() {
    if (!this.elements.escena6Screen) return;
    try {
      const component = this.elements.escena6Screen.components["escena6-image-cycler"];
      component?.hide ? component.hide() : this.elements.escena6Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena6BScreen() {
    if (!this.elements.escena6BScreen) return;
    try {
      const component = this.elements.escena6BScreen.components["escena6b-video-cycler"];
      component?.show ? component.show() : this.elements.escena6BScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena6BScreen() {
    if (!this.elements.escena6BScreen) return;
    try {
      const component = this.elements.escena6BScreen.components["escena6b-video-cycler"];
      component?.hide ? component.hide() : this.elements.escena6BScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena7Screen() {
    if (!this.elements.escena7Screen) return;
    try {
      const component = this.elements.escena7Screen.components["escena7-image-cycler"];
      component?.show ? component.show() : this.elements.escena7Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena7Screen() {
    if (!this.elements.escena7Screen) return;
    try {
      const component = this.elements.escena7Screen.components["escena7-image-cycler"];
      component?.hide ? component.hide() : this.elements.escena7Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena7BScreen() {
    if (!this.elements.escena7BScreen) return;
    try {
      const component = this.elements.escena7BScreen.components["escena7b-video-cycler"];
      component?.show ? component.show() : this.elements.escena7BScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena7BScreen() {
    if (!this.elements.escena7BScreen) return;
    try {
      const component = this.elements.escena7BScreen.components["escena7b-video-cycler"];
      component?.hide ? component.hide() : this.elements.escena7BScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena8Screen() {
    if (!this.elements.escena8Screen) return;
    try {
      const component = this.elements.escena8Screen.components["escena8-image-cycler"];
      component?.show ? component.show() : this.elements.escena8Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena8Screen() {
    if (!this.elements.escena8Screen) return;
    try {
      const component = this.elements.escena8Screen.components["escena8-image-cycler"];
      component?.hide ? component.hide() : this.elements.escena8Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena8BScreen() {
    if (!this.elements.escena8BScreen) return;
    try {
      const component = this.elements.escena8BScreen.components["escena8b-image-cycler"];
      component?.show ? component.show() : this.elements.escena8BScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena8BScreen() {
    if (!this.elements.escena8BScreen) return;
    try {
      const component = this.elements.escena8BScreen.components["escena8b-image-cycler"];
      component?.hide ? component.hide() : this.elements.escena8BScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena9Screen() {
    if (!this.elements.escena9Screen) return;
    try {
      const component = this.elements.escena9Screen.components["escena9-image-cycler"];
      component?.show ? component.show() : this.elements.escena9Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena9Screen() {
    if (!this.elements.escena9Screen) return;
    try {
      const component = this.elements.escena9Screen.components["escena9-image-cycler"];
      component?.hide ? component.hide() : this.elements.escena9Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena9BScreen() {
    if (!this.elements.escena9BScreen) return;
    try {
      const component = this.elements.escena9BScreen.components["escena9b-video-cycler"];
      component?.show ? component.show() : this.elements.escena9BScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena9BScreen() {
    if (!this.elements.escena9BScreen) return;
    try {
      const component = this.elements.escena9BScreen.components["escena9b-video-cycler"];
      component?.hide ? component.hide() : this.elements.escena9BScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena10Screen() {
    if (!this.elements.escena10Screen) return;
    try {
      const component = this.elements.escena10Screen.components["escena10-image-cycler"];
      component?.show ? component.show() : this.elements.escena10Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena10Screen() {
    if (!this.elements.escena10Screen) return;
    try {
      const component = this.elements.escena10Screen.components["escena10-image-cycler"];
      component?.hide ? component.hide() : this.elements.escena10Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena10BScreen() {
    if (!this.elements.escena10BScreen) return;
    try {
      const component = this.elements.escena10BScreen.components["escena10b-image-cycler"];
      component?.show ? component.show() : this.elements.escena10BScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena10BScreen() {
    if (!this.elements.escena10BScreen) return;
    try {
      const component = this.elements.escena10BScreen.components["escena10b-image-cycler"];
      component?.hide ? component.hide() : this.elements.escena10BScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena11Screen() {
    if (!this.elements.escena11Screen) return;
    try {
      const component = this.elements.escena11Screen.components["escena11-image-cycler"];
      component?.show ? component.show() : this.elements.escena11Screen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena11Screen() {
    if (!this.elements.escena11Screen) return;
    try {
      const component = this.elements.escena11Screen.components["escena11-image-cycler"];
      component?.hide ? component.hide() : this.elements.escena11Screen.setAttribute("visible", "false");
    } catch (error) {}
  }

  showEscena11BScreen() {
    if (!this.elements.escena11BScreen) return;
    try {
      const component = this.elements.escena11BScreen.components["escena11b-video-cycler"];
      component?.show ? component.show() : this.elements.escena11BScreen.setAttribute("visible", "true");
    } catch (error) {}
  }

  hideEscena11BScreen() {
    if (!this.elements.escena11BScreen) return;
    try {
      const component = this.elements.escena11BScreen.components["escena11b-video-cycler"];
      component?.hide ? component.hide() : this.elements.escena11BScreen.setAttribute("visible", "false");
    } catch (error) {}
  }

  // Loading overlay methods
  showLoadingOverlay(sceneId = null) {
    this.elements.overlay.setAttribute("visible", "true");

    // Update loading text with scene name for all directions
    let loadingMessage = "Cargando Escena...";
    if (sceneId && window.SCENES_CONFIG[sceneId]) {
      const sceneName = window.SCENES_CONFIG[sceneId].name || sceneId;
      loadingMessage = `Cargando ${sceneName}...`;
    }

    // Update all text elements
    this.elements.loadingTextFront.setAttribute("value", loadingMessage);
    this.elements.loadingTextBack.setAttribute("value", loadingMessage);
    this.elements.loadingTextLeft.setAttribute("value", loadingMessage);
    this.elements.loadingTextRight.setAttribute("value", loadingMessage);

    // Fade in animation
    let opacity = 0;
    const fadeInInterval = setInterval(() => {
      opacity += 0.05;
      this.elements.overlay.setAttribute("material", "opacity", opacity);

      if (opacity >= 1.0) {
        clearInterval(fadeInInterval);
        this.elements.overlay.setAttribute("material", "opacity", 1.0);
      }
    }, 20);
  }

  hideLoadingOverlay() {
    // Fade out animation
    let opacity = 1.0;
    const fadeOutInterval = setInterval(() => {
      opacity -= 0.05;
      this.elements.overlay.setAttribute("material", "opacity", opacity);

      if (opacity <= 0) {
        clearInterval(fadeOutInterval);
        this.elements.overlay.setAttribute("material", "opacity", 0);
        this.elements.overlay.setAttribute("visible", "false");
      }
    }, 20);
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
      console.log("📋 Loaded sequence config:", this.currentSequenceConfig.name);
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
      if (sequenceContext.showScreensAutomatically && sequenceContext.screenDelay) {
        // Auto-show screens after delay (handled by server)
        console.log("📺 Screens will auto-show in", sequenceContext.screenDelay, "ms");
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
      currentSequenceConfig: this.currentSequenceConfig
    };
  }
}

// Export for global access
window.VRSceneManager = VRSceneManager;