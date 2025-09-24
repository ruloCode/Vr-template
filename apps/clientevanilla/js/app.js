/**
 * VR ClienteVanilla - Main Application Entry Point
 * Initializes all systems and components for the VR experience
 */

// Import all modules
import { registerAllComponents } from './components/index.js';
import { VRSceneManager } from './managers/scene-manager.js';
import { enableAudio, setupAudioInteractionListeners } from './managers/audio-manager.js';
import { screenControls } from './controls/screen-controls.js';
import { cameraControls } from './controls/camera-controls.js';
import { initializeWebSocket, sendStateUpdate } from './websocket/websocket-handler.js';

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
  console.log('🚀 Initializing VR ClienteVanilla application...');

  // Wait for A-Frame to be loaded
  if (typeof AFRAME === 'undefined') {
    console.error('❌ A-Frame not loaded! Make sure aframe-v1.3.0.min.js is loaded before this script.');
    return;
  }

  // Register all A-Frame components
  registerAllComponents();

  // Initialize Scene Manager
  sceneManager = new VRSceneManager();

  // Initialize WebSocket connection
  initializeWebSocket(sceneManager);

  // Setup audio interaction listeners
  setupAudioInteractionListeners();

  // Set up global debug functions
  setupGlobalDebugFunctions();

  // Expose globals for compatibility
  exposeGlobalsForCompatibility();

  console.log('✅ VR ClienteVanilla application initialized successfully');
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
      } else {
        newScene = "base";
      }
      sceneManager.loadScene(newScene);
    }
  };

  // Debug helpers
  window.VR_DEBUG = {
    sceneManager: () => sceneManager,
    currentScene: () => currentSceneId,
    screenControls,
    cameraControls,
    loadScene: window.loadScene,
    toggleScene: window.toggleScene,
    sendStateUpdate,
    info: () => ({
      currentScene: currentSceneId,
      sceneManager: !!sceneManager,
      audioEnabled: window.audioEnabled,
      vrClientConnected: window.vrClient?.isConnected || false,
    }),
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
document.addEventListener('DOMContentLoaded', initializeApplication);

// Export for potential external use
export {
  initializeApplication,
  sceneManager,
  currentSceneId
};