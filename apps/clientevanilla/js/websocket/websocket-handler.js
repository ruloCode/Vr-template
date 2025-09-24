/**
 * WebSocket Handler for VR Client
 * Manages WebSocket communication with the server and handles all incoming commands
 */

import { VRSceneManager } from '../managers/scene-manager.js';
import { enableAudio } from '../managers/audio-manager.js';

let vrClient = null;
let sceneManager = null;

/**
 * Initialize WebSocket connection and handlers
 * @param {VRSceneManager} sceneManagerInstance - The scene manager instance
 */
export async function initializeWebSocket(sceneManagerInstance) {
  sceneManager = sceneManagerInstance;

  console.log("🔍 Obteniendo configuración de red del servidor...");

  try {
    // Get dynamic network configuration from server
    const networkConfig = await getNetworkConfig();
    const serverUrl = networkConfig.urls.websocket;
    
    console.log("🌐 Configuración de red obtenida:");
    console.log("📡 Server IP:", networkConfig.network.serverIP);
    console.log("🔌 WebSocket URL:", serverUrl);
    console.log("👤 Cliente IP:", networkConfig.network.clientIP);
    console.log("🏠 Es conexión local:", networkConfig.network.isLocal);
    
    await connectWithConfig(serverUrl, networkConfig);
    
  } catch (error) {
    console.warn("⚠️ Error obteniendo configuración dinámica, usando fallback:");
    console.error(error);
    
    // Fallback to manual detection
    const currentHost = window.location.hostname;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const serverPort = determineWebSocketPort();
    const serverUrl = `${protocol}//${currentHost}:${serverPort}/ws`;
    
    console.log("🔗 Conectando con configuración fallback:", serverUrl);
    await connectWithConfig(serverUrl, null);
  }
}

/**
 * Get network configuration from server
 */
async function getNetworkConfig() {
  const configUrl = `${window.location.origin}/api/config`;
  console.log("🔍 Consultando configuración en:", configUrl);
  
  const response = await fetch(configUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Determine WebSocket port dynamically
 */
function determineWebSocketPort() {
  // Try to get from server config first, fallback to +1 pattern
  const currentPort = window.location.port || (window.location.protocol === "https:" ? "443" : "80");
  return currentPort === "80" ? "8081" : (parseInt(currentPort) + 1).toString();
}

/**
 * Connect with determined configuration
 */
async function connectWithConfig(serverUrl, networkConfig) {
  // Initialize WebSocket client
  vrClient = new VRWebSocketClient({
    serverUrl: serverUrl,
    deviceId: `clientevanilla-${Date.now()}`,
    onConnect: () => {
      console.log("🎮 VR Client connected to server");
      console.log("🔍 Current scene ID on connect:", window.currentSceneId);
      // Send ready signal for current scene
      setTimeout(() => {
        console.log(
          "📤 Sending READY signal for scene:",
          window.currentSceneId
        );
        vrClient.sendReady(window.currentSceneId);
      }, 1000);
    },
    onDisconnect: () => {
      console.log("🔌 VR Client disconnected from server");
    },
    onCommand: (command) => {
      console.log("📨 Received command from server:", command);
      handleServerCommand(command);
    },
    onError: (error) => {
      console.error("🚨 VR Client error:", error);
    },
  });

  // Connect to server
  vrClient.connect();

  // Setup audio interaction listeners
  setupAudioInteractionListeners();

  // Expose client globally for compatibility
  window.vrClient = vrClient;
}

/**
 * Set up audio event listeners for user interaction
 */
function setupAudioInteractionListeners() {
  const enableAudioOnInteraction = () => {
    if (!window.audioEnabled) {
      enableAudio().then(() => {
        if (window.audioEnabled && sceneManager && sceneManager.currentScene) {
          // Try to start audio for current scene
          sceneManager.updateAudio(sceneManager.currentScene);
        }
      });
    }
  };

  // Listen for various user interactions
  document.addEventListener("click", enableAudioOnInteraction, {
    once: true,
  });
  document.addEventListener("touchstart", enableAudioOnInteraction, {
    once: true,
  });
  document.addEventListener("keydown", enableAudioOnInteraction, {
    once: true,
  });
}

/**
 * Send state update to server
 */
export function sendStateUpdate() {
  if (vrClient && vrClient.isConnected) {
    vrClient.sendState(window.currentSceneId, 0, true, 100);
  }
}

/**
 * Main server command handler
 * @param {Object} command - The command received from server
 */
function handleServerCommand(command) {
  switch (command.commandType) {
    case "LOAD":
      const newSceneId = command.sceneId;
      console.log("🎬 Cargando escena desde servidor:", newSceneId);

      // Load the scene using scene manager
      if (sceneManager) {
        sceneManager
          .loadScene(newSceneId)
          .then((success) => {
            if (success) {
              console.log("✅ Escena cargada desde dashboard");
            } else {
              console.error("❌ Failed to load scene from dashboard");
            }
          })
          .catch((error) => {
            console.error("💥 Error in loadScene promise:", error);
          });
      } else {
        console.error("❌ Scene manager not initialized");
      }
      break;

    case "START_AT":
      console.log("▶️ Iniciando experiencia VR");
      // Start the experience
      break;

    case "PAUSE":
      console.log("⏸️ Pausando experiencia VR");
      // Pause audio and timeline
      const audioEl = document.querySelector("#scene-sound");
      if (audioEl) {
        audioEl.components.sound.pauseSound();
      }
      break;

    case "RESUME":
      console.log("▶️ Reanudando experiencia VR");
      // Resume audio and timeline
      const resumeAudioEl = document.querySelector("#scene-sound");
      if (resumeAudioEl) {
        resumeAudioEl.components.sound.playSound();
      }
      break;

    case "SEEK":
      console.log("⏭️ Seeking command received");
      // No timeline to seek anymore
      break;

    case "SHOW_SCREEN":
      handleShowScreenCommand(command.screenType);
      break;

    case "HIDE_SCREEN":
      handleHideScreenCommand(command.screenType);
      break;

    case "HIDE_ALL_SCREENS":
      handleHideAllScreensCommand();
      break;

    case "SHOW_ALL_SCREENS":
      handleShowAllScreensCommand();
      break;

    case "TOGGLE_SCREEN":
      handleToggleScreenCommand(command.screenType);
      break;

    // Sequence automation commands
    case "START_SEQUENCE":
      handleStartSequenceCommand(command);
      break;

    case "STOP_SEQUENCE":
      handleStopSequenceCommand();
      break;

    case "PAUSE_SEQUENCE":
      handlePauseSequenceCommand();
      break;

    case "RESUME_SEQUENCE":
      handleResumeSequenceCommand();
      break;

    case "NEXT_SCENE":
      handleNextSceneCommand();
      break;

    case "PREVIOUS_SCENE":
      handlePreviousSceneCommand();
      break;

    case "JUMP_TO_SCENE":
      handleJumpToSceneCommand(command.sceneIndex);
      break;

    default:
      console.log("🤷 Unknown command:", command.commandType);
  }
}

/**
 * Handle show screen commands
 * @param {string} screenType - The type of screen to show
 */
function handleShowScreenCommand(screenType) {
  if (!sceneManager) {
    console.warn("⚠️ SceneManager no disponible");
    return;
  }

  const screenMethods = {
    "escena1": () => sceneManager.showEscena1Screen(),
    "escena2": () => sceneManager.showEscena2Screen(),
    "escena3": () => sceneManager.showEscena3Screen(),
    "escena3B": () => sceneManager.showEscena3BScreen(),
    "escena4": () => sceneManager.showEscena4Screen(),
    "escena4B": () => sceneManager.showEscena4BScreen(),
    "escena5": () => sceneManager.showEscena5Screen(),
    "escena5B": () => sceneManager.showEscena5BScreen(),
    "escena6": () => sceneManager.showEscena6Screen(),
    "escena6B": () => sceneManager.showEscena6BScreen(),
    "escena7": () => sceneManager.showEscena7Screen(),
    "escena7B": () => sceneManager.showEscena7BScreen(),
    "escena8": () => sceneManager.showEscena8Screen(),
    "escena8B": () => sceneManager.showEscena8BScreen(),
    "escena9": () => sceneManager.showEscena9Screen(),
    "escena9B": () => sceneManager.showEscena9BScreen(),
    "escena10": () => sceneManager.showEscena10Screen(),
    "escena10B": () => sceneManager.showEscena10BScreen(),
    "escena11": () => sceneManager.showEscena11Screen(),
    "escena11B": () => sceneManager.showEscena11BScreen(),
  };

  const method = screenMethods[screenType];
  if (method) {
    method();
  } else {
    console.warn("⚠️ Tipo de pantalla no reconocido:", screenType);
  }
}

/**
 * Handle hide screen commands
 * @param {string} screenType - The type of screen to hide
 */
function handleHideScreenCommand(screenType) {
  if (!sceneManager) {
    console.warn("⚠️ SceneManager no disponible");
    return;
  }

  const screenMethods = {
    "escena1": () => sceneManager.hideEscena1Screen(),
    "escena2": () => sceneManager.hideEscena2Screen(),
    "escena3": () => sceneManager.hideEscena3Screen(),
    "escena3B": () => sceneManager.hideEscena3BScreen(),
    "escena4": () => sceneManager.hideEscena4Screen(),
    "escena4B": () => sceneManager.hideEscena4BScreen(),
    "escena5": () => sceneManager.hideEscena5Screen(),
    "escena5B": () => sceneManager.hideEscena5BScreen(),
    "escena6": () => sceneManager.hideEscena6Screen(),
    "escena6B": () => sceneManager.hideEscena6BScreen(),
    "escena7": () => sceneManager.hideEscena7Screen(),
    "escena7B": () => sceneManager.hideEscena7BScreen(),
    "escena8": () => sceneManager.hideEscena8Screen(),
    "escena8B": () => sceneManager.hideEscena8BScreen(),
    "escena9": () => sceneManager.hideEscena9Screen(),
    "escena9B": () => sceneManager.hideEscena9BScreen(),
    "escena10": () => sceneManager.hideEscena10Screen(),
    "escena10B": () => sceneManager.hideEscena10BScreen(),
    "escena11": () => sceneManager.hideEscena11Screen(),
    "escena11B": () => sceneManager.hideEscena11BScreen(),
  };

  const method = screenMethods[screenType];
  if (method) {
    method();
  } else {
    console.warn("⚠️ Tipo de pantalla no reconocido:", screenType);
  }
}

/**
 * Handle hide all screens command
 */
function handleHideAllScreensCommand() {
  if (!sceneManager) {
    console.warn("⚠️ SceneManager no disponible");
    return;
  }

  // Hide all screens
  sceneManager.hideEscena1Screen();
  sceneManager.hideEscena2Screen();
  sceneManager.hideEscena3Screen();
  sceneManager.hideEscena3BScreen();
  sceneManager.hideEscena4Screen();
  sceneManager.hideEscena4BScreen();
  sceneManager.hideEscena5Screen();
  sceneManager.hideEscena5BScreen();
  sceneManager.hideEscena6Screen();
  sceneManager.hideEscena6BScreen();
  sceneManager.hideEscena7Screen();
  sceneManager.hideEscena7BScreen();
  sceneManager.hideEscena8Screen();
  sceneManager.hideEscena8BScreen();
  sceneManager.hideEscena9Screen();
  sceneManager.hideEscena9BScreen();
  sceneManager.hideEscena10Screen();
  sceneManager.hideEscena10BScreen();
  sceneManager.hideEscena11Screen();
  sceneManager.hideEscena11BScreen();
}

/**
 * Handle show all screens command
 */
function handleShowAllScreensCommand() {
  if (!sceneManager) {
    console.warn("⚠️ SceneManager no disponible");
    return;
  }

  // Show only screens corresponding to the current scene
  switch (window.currentSceneId) {
    case "escena-1":
      sceneManager.showEscena1Screen();
      break;
    case "escena-2":
      sceneManager.showEscena2Screen();
      break;
    case "escena-3":
      sceneManager.showEscena3Screen();
      sceneManager.showEscena3BScreen();
      break;
    case "escena-4":
      sceneManager.showEscena4Screen();
      sceneManager.showEscena4BScreen();
      break;
    case "escena-5":
      sceneManager.showEscena5Screen();
      sceneManager.showEscena5BScreen();
      break;
    case "escena-6":
      sceneManager.showEscena6Screen();
      sceneManager.showEscena6BScreen();
      break;
    case "escena-7":
      sceneManager.showEscena7Screen();
      sceneManager.showEscena7BScreen();
      break;
    case "escena-8":
      sceneManager.showEscena8Screen();
      sceneManager.showEscena8BScreen();
      break;
    case "escena-9":
      sceneManager.showEscena9Screen();
      sceneManager.showEscena9BScreen();
      break;
    case "escena-10":
      sceneManager.showEscena10Screen();
      sceneManager.showEscena10BScreen();
      break;
    case "escena-11":
      sceneManager.showEscena11Screen();
      sceneManager.showEscena11BScreen();
      break;
    default:
      // No screens to show for base or unknown scenes
      break;
  }
}

/**
 * Handle toggle screen commands
 * @param {string} screenType - The type of screen to toggle
 */
function handleToggleScreenCommand(screenType) {
  if (!sceneManager) {
    console.warn("⚠️ SceneManager no disponible");
    return;
  }

  // Helper function to toggle screen visibility
  const toggleScreen = (screenId, showMethod, hideMethod) => {
    const screen = document.querySelector(`#${screenId}`);
    if (screen && screen.getAttribute("visible") === "true") {
      hideMethod();
    } else {
      showMethod();
    }
  };

  const screenToggleMethods = {
    "escena1": () => toggleScreen("escena1-screen", () => sceneManager.showEscena1Screen(), () => sceneManager.hideEscena1Screen()),
    "escena2": () => toggleScreen("escena2-screen", () => sceneManager.showEscena2Screen(), () => sceneManager.hideEscena2Screen()),
    "escena3": () => toggleScreen("escena3-screen", () => sceneManager.showEscena3Screen(), () => sceneManager.hideEscena3Screen()),
    "escena3B": () => toggleScreen("escena3B-screen", () => sceneManager.showEscena3BScreen(), () => sceneManager.hideEscena3BScreen()),
    "escena4": () => toggleScreen("escena4-screen", () => sceneManager.showEscena4Screen(), () => sceneManager.hideEscena4Screen()),
    "escena4B": () => toggleScreen("escena4B-screen", () => sceneManager.showEscena4BScreen(), () => sceneManager.hideEscena4BScreen()),
    "escena5": () => toggleScreen("escena5-screen", () => sceneManager.showEscena5Screen(), () => sceneManager.hideEscena5Screen()),
    "escena5B": () => toggleScreen("escena5B-screen", () => sceneManager.showEscena5BScreen(), () => sceneManager.hideEscena5BScreen()),
    "escena6": () => toggleScreen("escena6-screen", () => sceneManager.showEscena6Screen(), () => sceneManager.hideEscena6Screen()),
    "escena6B": () => toggleScreen("escena6B-screen", () => sceneManager.showEscena6BScreen(), () => sceneManager.hideEscena6BScreen()),
    "escena7": () => toggleScreen("escena7-screen", () => sceneManager.showEscena7Screen(), () => sceneManager.hideEscena7Screen()),
    "escena7B": () => toggleScreen("escena7B-screen", () => sceneManager.showEscena7BScreen(), () => sceneManager.hideEscena7BScreen()),
    "escena8": () => toggleScreen("escena8-screen", () => sceneManager.showEscena8Screen(), () => sceneManager.hideEscena8Screen()),
    "escena8B": () => toggleScreen("escena8B-screen", () => sceneManager.showEscena8BScreen(), () => sceneManager.hideEscena8BScreen()),
    "escena9": () => toggleScreen("escena9-screen", () => sceneManager.showEscena9Screen(), () => sceneManager.hideEscena9Screen()),
    "escena9B": () => toggleScreen("escena9B-screen", () => sceneManager.showEscena9BScreen(), () => sceneManager.hideEscena9BScreen()),
    "escena10": () => toggleScreen("escena10-screen", () => sceneManager.showEscena10Screen(), () => sceneManager.hideEscena10Screen()),
    "escena10B": () => toggleScreen("escena10B-screen", () => sceneManager.showEscena10BScreen(), () => sceneManager.hideEscena10BScreen()),
    "escena11": () => toggleScreen("escena11-screen", () => sceneManager.showEscena11Screen(), () => sceneManager.hideEscena11Screen()),
    "escena11B": () => toggleScreen("escena11B-screen", () => sceneManager.showEscena11BScreen(), () => sceneManager.hideEscena11BScreen()),
  };

  const method = screenToggleMethods[screenType];
  if (method) {
    method();
  } else {
    console.warn("⚠️ Tipo de pantalla no reconocido para toggle:", screenType);
  }
}

/**
 * Handle sequence automation commands
 */
function handleStartSequenceCommand(command) {
  console.log("🎬 Starting sequence:", command.sequenceId);
  
  if (sceneManager) {
    // Enable sequence mode in scene manager
    sceneManager.enableSequenceMode(command.sequenceId, command.config);
  }
}

function handleStopSequenceCommand() {
  console.log("⏹️ Stopping sequence");
  
  if (sceneManager) {
    sceneManager.disableSequenceMode();
  }
}

function handlePauseSequenceCommand() {
  console.log("⏸️ Pausing sequence");
  
  // Pause current audio
  const audioEl = document.querySelector("#scene-sound");
  if (audioEl && audioEl.components.sound) {
    audioEl.components.sound.pauseSound();
  }
  
  if (sceneManager) {
    sceneManager.onSequencePaused();
  }
}

function handleResumeSequenceCommand() {
  console.log("▶️ Resuming sequence");
  
  // Resume current audio
  const audioEl = document.querySelector("#scene-sound");
  if (audioEl && audioEl.components.sound) {
    audioEl.components.sound.playSound();
  }
  
  if (sceneManager) {
    sceneManager.onSequenceResumed();
  }
}

function handleNextSceneCommand() {
  console.log("⏭️ Next scene command received");
  
  if (sceneManager) {
    sceneManager.onSequenceNextScene();
  }
}

function handlePreviousSceneCommand() {
  console.log("⏮️ Previous scene command received");
  
  if (sceneManager) {
    sceneManager.onSequencePreviousScene();
  }
}

function handleJumpToSceneCommand(sceneIndex) {
  console.log("⏯️ Jump to scene command received:", sceneIndex);
  
  if (sceneManager) {
    sceneManager.onSequenceJumpToScene(sceneIndex);
  }
}

// Export WebSocket client getter for global access
export function getVRClient() {
  return vrClient;
}