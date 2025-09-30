/**
 * VR ClienteVanilla - Main Application Entry Point
 * Initializes all systems and components for the VR experience
 */

// Import all modules
import { registerAllComponents } from "./components/index.js";
import { VRSceneManager } from "./managers/scene-manager.js";
import {
  enableAudio,
  setupAudioInteractionListeners,
} from "./managers/audio-manager.js";
import { screenControls } from "./controls/screen-controls.js";
import { cameraControls } from "./controls/camera-controls.js";
import {
  initializeWebSocket,
  sendStateUpdate,
} from "./websocket/websocket-handler.js";
import { appInitializer } from "./utils/app-initializer.js";

// Global variables
let sceneManager = null;
let currentSceneId = "base"; // Default scene

// Update currentSceneId when it changes
export function updateCurrentSceneId(newSceneId) {
  currentSceneId = newSceneId;
  window.currentSceneId = newSceneId;
}

/**
 * Main application initialization
 */
async function initializeApplication() {
  console.log("🚀 Initializing VR ClienteVanilla application...");

  try {
    // Initialize app systems first (Service Worker, preloading, etc.)
    await appInitializer.initialize();

    // Wait for A-Frame to be loaded
    if (typeof AFRAME === "undefined") {
      console.error(
        "❌ A-Frame not loaded! Make sure aframe-v1.3.0.min.js is loaded before this script."
      );
      return;
    }

    // Register all A-Frame components
    registerAllComponents();

    // Initialize Scene Manager (now with preloading support)
    sceneManager = new VRSceneManager();

    // Initialize WebSocket connection
    try {
      await initializeWebSocket(sceneManager);
      console.log("✅ WebSocket connection initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing WebSocket:", error);
    }

    // Setup audio interaction listeners
    setupAudioInteractionListeners();

    // Set up global debug functions
    setupGlobalDebugFunctions();

    // Expose globals for compatibility
    exposeGlobalsForCompatibility();

    // Load initial scene
    await loadInitialScene();

    console.log("✅ VR ClienteVanilla application initialized successfully");
  } catch (error) {
    console.error("❌ Application initialization failed:", error);
    showInitializationError(error);
  }
}

/**
 * Load the initial scene
 */
async function loadInitialScene() {
  if (sceneManager) {
    try {
      // Load the base scene first
      await sceneManager.loadScene("base");
      console.log("✅ Initial scene loaded");
    } catch (error) {
      console.error("❌ Error loading initial scene:", error);
    }
  }
}

/**
 * Show initialization error to user
 */
function showInitializationError(error) {
  const loadingOverlay = document.getElementById("app-loading");
  if (loadingOverlay) {
    const spinner = loadingOverlay.querySelector(".loading-spinner");
    const status = loadingOverlay.querySelector(".loading-status");

    if (spinner) spinner.style.display = "none";
    if (status) {
      status.innerHTML = `
        <div style="color: #ff6b6b; margin-bottom: 10px;">❌ Error de inicialización</div>
        <div style="font-size: 12px; opacity: 0.8;">${error.message || "Error desconocido"}</div>
        <button onclick="window.location.reload()" style="
          margin-top: 20px;
          padding: 10px 20px;
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          border-radius: 4px;
          cursor: pointer;
        ">Reintentar</button>
      `;
    }
  }
}

/**
 * Set up global debug and utility functions
 */
function setupGlobalDebugFunctions() {
  // Test scene loading functions for development
  window.loadScene = (sceneId) => {
    if (sceneManager) {
      return sceneManager.loadScene(sceneId);
    } else {
      console.error("Scene manager not initialized");
      return false;
    }
  };

  // Add a simple scene toggle function
  window.toggleScene = () => {
    if (sceneManager) {
      let newScene;
      if (currentSceneId === "base") {
        newScene = "escena-1";
      } else if (currentSceneId === "escena-1") {
        newScene = "escena-2";
      } else if (currentSceneId === "escena-2") {
        newScene = "escena-3";
      } else if (currentSceneId === "escena-3") {
        newScene = "escena-4";
      } else if (currentSceneId === "escena-4") {
        newScene = "escena-5";
      } else if (currentSceneId === "escena-5") {
        newScene = "escena-7";
      } else if (currentSceneId === "escena-7") {
        newScene = "escena-8";
      } else if (currentSceneId === "escena-8") {
        newScene = "escena-9";
      } else if (currentSceneId === "escena-9") {
        newScene = "escena-10";
      } else if (currentSceneId === "escena-10") {
        newScene = "escena-11";
      } else if (currentSceneId === "escena-11") {
        newScene = "guajira-1";
      } else if (currentSceneId === "guajira-1") {
        newScene = "guajira-2";
      } else if (currentSceneId === "guajira-2") {
        newScene = "guajira-3";
      } else if (currentSceneId === "guajira-3") {
        newScene = "guajira-4";
      } else if (currentSceneId === "guajira-4") {
        newScene = "guajira-5";
      } else if (currentSceneId === "guajira-5") {
        newScene = "guajira-6";
      } else if (currentSceneId === "guajira-6") {
        newScene = "guajira-7";
      } else if (currentSceneId === "guajira-7") {
        newScene = "guajira-8";
      } else if (currentSceneId === "guajira-8") {
        newScene = "guajira-9";
      } else if (currentSceneId === "guajira-9") {
        newScene = "guajira-10";
      } else {
        newScene = "base";
      }
      sceneManager.loadScene(newScene);
    }
  };

  // Debug helpers - Enhanced for optimization systems
  window.VR_DEBUG = {
    sceneManager: () => sceneManager,
    currentScene: () => currentSceneId,
    screenControls,
    cameraControls,
    loadScene: window.loadScene,
    toggleScene: window.toggleScene,
    sendStateUpdate,

    // New optimization debug functions
    appInitializer: () => window.appInitializer,
    assetPreloader: () => window.assetPreloader,
    cacheManager: () => window.cacheManager,

    // System information
    info: () => ({
      currentScene: currentSceneId,
      sceneManager: !!sceneManager,
      audioEnabled: window.audioEnabled,
      vrClientConnected: window.vrClient?.isConnected || false,
      appInitialized: window.appInitialized || false,
      assetsReady: window.assetsReady || false,
      serviceWorkerActive: !!navigator.serviceWorker?.controller,
    }),

    // Performance utilities
    getInitStatus: () => window.appInitializer?.getStatus(),
    getCacheStats: () => window.appInitializer?.getCacheStats(),
    clearCaches: () => window.appInitializer?.clearAllCaches(),
    getPreloadStats: () => window.assetPreloader?.getStats(),

    // Force operations for testing
    forcePreloadScene: (sceneId) =>
      window.assetPreloader?.queueSceneAssets(sceneId, 1),
    pausePreloading: () => window.assetPreloader?.pausePreloading(),
    resumePreloading: () => window.assetPreloader?.resumePreloading(),
  };
}

/**
 * Expose globals for backwards compatibility
 */
function exposeGlobalsForCompatibility() {
  // Expose main objects globally
  window.sceneManager = sceneManager;
  window.currentSceneId = currentSceneId;

  // Controls are already exposed in their respective modules
  // window.screenControls and window.cameraControls

  // VRSceneManager class is already exposed in scene-manager.js
  // window.VRSceneManager
}

/**
 * Initialize application when DOM is ready
 */
document.addEventListener("DOMContentLoaded", initializeApplication);

// Export for potential external use
export { initializeApplication, sceneManager, currentSceneId };
