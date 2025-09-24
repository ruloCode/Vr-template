/**
 * Audio Management System
 * Handles audio initialization and control for VR experience
 */

/**
 * Audio initialization function
 * Enables audio context for the application
 * @returns {Promise<void>}
 */
export function enableAudio() {
  if (window.audioEnabled) return Promise.resolve();

  return new Promise((resolve) => {
    try {
      const audioElement = document.querySelector("#current-audio");
      const soundComponent = document.querySelector("#scene-sound");

      if (audioElement && soundComponent) {
        // Try to play and immediately pause to unlock audio context
        audioElement
          .play()
          .then(() => {
            audioElement.pause();
            audioElement.currentTime = 0;
            window.audioEnabled = true;
            // Audio context enabled
            resolve();
          })
          .catch((error) => {
            // Could not enable audio
            window.audioEnabled = false;
            resolve(); // Still resolve to continue
          });
      } else {
        // Audio elements not found
        resolve();
      }
    } catch (error) {
      // Error enabling audio
      resolve();
    }
  });
}

/**
 * Set up audio event listeners for user interaction
 * This is required by browsers to enable audio playback
 */
export function setupAudioInteractionListeners() {
  const enableAudioOnInteraction = () => {
    if (!window.audioEnabled) {
      enableAudio().then(() => {
        if (window.audioEnabled && window.sceneManager && window.sceneManager.currentScene) {
          // Try to start audio for current scene
          window.sceneManager.updateAudio(window.sceneManager.currentScene);
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

// Initialize audioEnabled flag
window.audioEnabled = false;

// Export for global access (compatibility)
window.enableAudio = enableAudio;