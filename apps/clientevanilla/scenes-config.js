/**
 * Scene Configuration for VR ClienteVanilla - Ecopetrol
 * Configuration with escena_1.png, escena_2.png, escena_3.png, and escena_4.png
 */
const SCENES_CONFIG = {
  "escena-1": {
    id: "escena-1",
    name: "Escena 1 - Energías Renovables",
    description: "Panorámica de instalaciones de energía solar y eólica",
    assets: {
      skybox: "images/escena_1.png",
      audio: "audio/ambient-wind.mp3",
      models: [],
    },
    lighting: {
      ambient: {
        color: "#ffffff",
        intensity: 0.9,
      },
      directional: {
        color: "#ffffff",
        intensity: 1.0,
        position: "0 1 1",
      },
    },
    timeOfDay: "day",
  },

  "escena-2": {
    id: "escena-2",
    name: "Escena 2 - Operaciones Petroleras",
    description: "Vista panorámica de operaciones petroleras industriales",
    assets: {
      skybox: "images/escena_2.png",
      audio: "audio/ambient-night.mp3",
      models: [],
    },
    lighting: {
      ambient: {
        color: "#ffeeaa",
        intensity: 0.7,
      },
      directional: {
        color: "#ffdd88",
        intensity: 0.8,
        position: "0 1 1",
      },
    },
    timeOfDay: "day",
  },

  "escena-3": {
    id: "escena-3",
    name: "Escena 3 - Operaciones de Plataforma",
    description: "Vista panorámica de plataformas petroleras y CPF",
    assets: {
      skybox: "images/escena_3.png",
      audio: "audio/ambient-wind.mp3",
      models: [],
    },
    lighting: {
      ambient: {
        color: "#ffffff",
        intensity: 0.8,
      },
      directional: {
        color: "#ffffff",
        intensity: 0.9,
        position: "0 1 1",
      },
    },
    timeOfDay: "day",
  },

  "escena-4": {
    id: "escena-4",
    name: "Escena 4 - Entorno Natural",
    description: "Vista panorámica del entorno natural y paisajes",
    assets: {
      skybox: "images/escena_4.png",
      audio: "audio/ambient-nature.mp3",
      models: [],
    },
    lighting: {
      ambient: {
        color: "#ffffff",
        intensity: 0.9,
      },
      directional: {
        color: "#ffffff",
        intensity: 1.0,
        position: "0 1 1",
      },
    },
    timeOfDay: "day",
  },
};

// Scene transition effects
const TRANSITION_CONFIG = {
  duration: 2000, // 2 seconds
  fadeColor: "#000000",
  audioFadeTime: 1000, // 1 second audio crossfade
};

// Export for use in other scripts
window.SCENES_CONFIG = SCENES_CONFIG;
window.TRANSITION_CONFIG = TRANSITION_CONFIG;

console.log("📋 Scenes configuration loaded:", Object.keys(SCENES_CONFIG));
