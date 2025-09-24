/**
 * Scene Configuration for VR ClienteVanilla - Ecopetrol
 * Configuration with escena_1.png, escena_2.png, escena_3.png, escena_4.png, escena_5.png, escena_7.png, escena_8.png, escena_9.png, escena_10.png, and escena_11.png
 */
const SCENES_CONFIG = {
  "escena-1": {
    id: "escena-1",
    name: "Escena 1 - Energías Renovables",
    description: "Panorámica de instalaciones de energía solar y eólica",
    assets: {
      skybox: "images/escena_1.png",
      audio: "audio/toma_01_02.mp3",
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
      audio: "audio/toma_03.mp3",
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
      audio: "audio/toma_04.mp3",
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
      audio: "audio/toma_05.mp3",
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

  "escena-5": {
    id: "escena-5",
    name: "Escena 5 - Vista Panorámica",
    description: "Vista panorámica completa del entorno industrial y natural",
    assets: {
      skybox: "images/escena_5.png",
      audio: "audio/toma_06.mp3",
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

  "escena-6": {
    id: "escena-6",
    name: "Escena 6 - Operaciones Especializadas",
    description:
      "Vista panorámica de operaciones especializadas y tecnología avanzada",
    assets: {
      skybox: "images/escena_6.png",
      audio: "audio/toma_07.mp3",
      models: [],
    },
    lighting: {
      ambient: {
        color: "#ffffff",
        intensity: 0.85,
      },
      directional: {
        color: "#ffffff",
        intensity: 0.95,
        position: "0 1 1",
      },
    },
    timeOfDay: "day",
  },

  "escena-7": {
    id: "escena-7",
    name: "Escena 7 - Vista Industrial Avanzada",
    description:
      "Vista panorámica de instalaciones industriales avanzadas y tecnología moderna",
    assets: {
      skybox: "images/escena_7.png",
      audio: "audio/toma_08.mp3",
      models: [],
    },
    lighting: {
      ambient: {
        color: "#ffffff",
        intensity: 0.85,
      },
      directional: {
        color: "#ffffff",
        intensity: 0.95,
        position: "0 1 1",
      },
    },
    timeOfDay: "day",
  },

  "escena-8": {
    id: "escena-8",
    name: "Escena 8 - Operaciones Industriales",
    description:
      "Vista panorámica de operaciones industriales y equipos especializados",
    assets: {
      skybox: "images/escena_8.png",
      audio: "audio/toma_09.mp3",
      models: [],
    },
    lighting: {
      ambient: {
        color: "#ffffff",
        intensity: 0.87,
      },
      directional: {
        color: "#ffffff",
        intensity: 0.96,
        position: "0 1 1",
      },
    },
    timeOfDay: "day",
  },

  "escena-9": {
    id: "escena-9",
    name: "Escena 9 - Instalaciones Avanzadas",
    description:
      "Vista panorámica de instalaciones industriales avanzadas y tecnología moderna",
    assets: {
      skybox: "images/escena_9.png",
      audio: "audio/toma_10.mp3",
      models: [],
    },
    lighting: {
      ambient: {
        color: "#ffffff",
        intensity: 0.85,
      },
      directional: {
        color: "#ffffff",
        intensity: 0.95,
        position: "0 1 1",
      },
    },
    timeOfDay: "day",
  },

  "escena-10": {
    id: "escena-10",
    name: "Escena 10 - Operaciones Especializadas",
    description:
      "Vista panorámica de operaciones especializadas y equipos de alta tecnología",
    assets: {
      skybox: "images/escena_10.png",
      audio: "audio/toma_11.mp3",
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

  "escena-11": {
    id: "escena-11",
    name: "Escena 11 - Infraestructura Completa",
    description:
      "Vista panorámica completa de la infraestructura industrial y operacional",
    assets: {
      skybox: "images/escena_11.png",
      audio: "audio/ambient-industrial.mp3",
      models: [],
    },
    lighting: {
      ambient: {
        color: "#ffffff",
        intensity: 0.88,
      },
      directional: {
        color: "#ffffff",
        intensity: 0.98,
        position: "0 1 1",
      },
    },
    timeOfDay: "day",
  },

  base: {
    id: "base",
    name: "Escena Base",
    description:
      "Escena base por defecto cuando no hay escena específica cargada",
    assets: {
      skybox: "images/base.jpg",
      audio: "audio/ambient-base.mp3",
      models: [],
    },
    lighting: {
      ambient: {
        color: "#ffffff",
        intensity: 0.7,
      },
      directional: {
        color: "#ffffff",
        intensity: 0.8,
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
