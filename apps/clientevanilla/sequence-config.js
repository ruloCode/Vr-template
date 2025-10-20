/**
 * Sequence Configuration for Auto-Playback System - Ecopetrol VR
 * Defines automatic scene sequences with customizable durations
 */

const SEQUENCE_CONFIGS = {
  "guion-completo": {
    id: "guion-completo",
    name: "Guión Completo Ecopetrol (5:32)",
    description:
      "Secuencia completa optimizada de todas las escenas siguiendo el guión oficial",
    scenes: [
      {
        sceneId: "escena-1",
        duration: 10000, // 10 segundos - Energías Renovables
        name: "Energías Renovables",
        showScreens: true,
        screenDelay: 3000, // Mostrar pantallas después de 3s
      },
      {
        sceneId: "escena-2",
        duration: 20000, // 20 segundos - Operaciones Petroleras
        name: "Operaciones Petroleras",
        showScreens: true,
        screenDelay: 5000,
      },
      {
        sceneId: "escena-3",
        duration: 25000, // 25 segundos - Operaciones de Plataforma
        name: "Operaciones de Plataforma",
        showScreens: true,
        screenDelay: 6000,
      },
      {
        sceneId: "escena-4",
        duration: 20000, // 20 segundos - Entorno Natural
        name: "Entorno Natural",
        showScreens: true,
        screenDelay: 5000,
      },
      {
        sceneId: "escena-5",
        duration: 37000, // 37 segundos - Vista Panorámica
        name: "Vista Panorámica",
        showScreens: true,
        screenDelay: 8000,
      },
      {
        sceneId: "escena-6",
        duration: 22000, // 22 segundos - Operaciones Especializadas
        name: "Operaciones Especializadas",
        showScreens: true,
        screenDelay: 5000,
      },
      {
        sceneId: "escena-7",
        duration: 50000, // 50 segundos - Vista Industrial Avanzada
        name: "Vista Industrial Avanzada",
        showScreens: true,
        screenDelay: 10000,
      },
      {
        sceneId: "escena-8",
        duration: 26000, // 26 segundos - Operaciones Industriales
        name: "Operaciones Industriales",
        showScreens: true,
        screenDelay: 6000,
      },
      {
        sceneId: "escena-9",
        duration: 37000, // 37 segundos - Instalaciones Avanzadas
        name: "Instalaciones Avanzadas",
        showScreens: true,
        screenDelay: 8000,
      },
      {
        sceneId: "escena-10",
        duration: 25000, // 25 segundos - Operaciones Especializadas
        name: "Operaciones Especializadas",
        showScreens: true,
        screenDelay: 6000,
      },
      {
        sceneId: "escena-11",
        duration: 20000, // 20 segundos - Infraestructura Completa (final)
        name: "Infraestructura Completa",
        showScreens: true,
        screenDelay: 5000,
      },
    ],
    totalDuration: null, // Se calcula automáticamente
    autoLoop: false,
    showScreensAutomatically: true,
    transitions: {
      fadeOutTime: 1000, // 1 segundo de fade out
      loadTime: 2000, // 2 segundos para cargar escena
      fadeInTime: 1000, // 1 segundo de fade in
    },
  },

  "demo-corto": {
    id: "demo-corto",
    name: "Demo Corto (5 minutos)",
    description: "Secuencia reducida para demos rápidas",
    scenes: [
      {
        sceneId: "escena-1",
        duration: 30000, // 30 segundos
        name: "Energías Renovables",
        showScreens: true,
        screenDelay: 3000,
      },
      {
        sceneId: "escena-3",
        duration: 25000, // 25 segundos
        name: "Operaciones de Plataforma",
        showScreens: true,
        screenDelay: 5000,
      },
      {
        sceneId: "escena-7",
        duration: 35000, // 35 segundos
        name: "Vista Industrial",
        showScreens: true,
        screenDelay: 5000,
      },
      {
        sceneId: "escena-11",
        duration: 40000, // 40 segundos
        name: "Infraestructura Final",
        showScreens: true,
        screenDelay: 8000,
      },
    ],
    totalDuration: null,
    autoLoop: true, // Demo se puede repetir
    showScreensAutomatically: true,
    transitions: {
      fadeOutTime: 800,
      loadTime: 1500,
      fadeInTime: 800,
    },
  },

  personalizado: {
    id: "personalizado",
    name: "Secuencia Personalizable",
    description: "Secuencia que se puede editar desde el dashboard",
    scenes: [],
    totalDuration: null,
    autoLoop: false,
    showScreensAutomatically: true,
    transitions: {
      fadeOutTime: 1000,
      loadTime: 2000,
      fadeInTime: 1000,
    },
    editable: true, // Esta secuencia se puede modificar desde el dashboard
  },

  "cartagena-completo": {
    id: "cartagena-completo",
    name: "Secuencia Completa Cartagena",
    description: "Secuencia completa de todas las escenas de Cartagena",
    scenes: [
      {
        sceneId: "cartagena-1",
        duration: 15000, // 15 segundos - Escenario Base
        name: "Escenario Base",
        showScreens: false,
        screenDelay: 0,
      },
      {
        sceneId: "cartagena-2",
        duration: 25000, // 25 segundos - Instalaciones Portuarias
        name: "Instalaciones Portuarias",
        showScreens: true,
        screenDelay: 5000,
      },
      {
        sceneId: "cartagena-3",
        duration: 20000, // 20 segundos - Operaciones de Puerto
        name: "Operaciones de Puerto",
        showScreens: true,
        screenDelay: 4000,
      },
      {
        sceneId: "cartagena-4",
        duration: 22000, // 22 segundos - Infraestructura Portuaria
        name: "Infraestructura Portuaria",
        showScreens: true,
        screenDelay: 5000,
      },
      {
        sceneId: "cartagena-5",
        duration: 20000, // 20 segundos - Operaciones Marítimas
        name: "Operaciones Marítimas",
        showScreens: true,
        screenDelay: 4000,
      },
      {
        sceneId: "cartagena-6",
        duration: 25000, // 25 segundos - Terminal Portuario
        name: "Terminal Portuario",
        showScreens: true,
        screenDelay: 5000,
      },
      {
        sceneId: "cartagena-7",
        duration: 20000, // 20 segundos - Operaciones Logísticas
        name: "Operaciones Logísticas",
        showScreens: true,
        screenDelay: 4000,
      },
      {
        sceneId: "cartagena-8",
        duration: 30000, // 30 segundos - Vista Panorámica Final
        name: "Vista Panorámica Final",
        showScreens: false,
        screenDelay: 0,
      },
    ],
    totalDuration: 169000, // 2:49 minutos
    autoLoop: false,
    showScreensAutomatically: true,
    transitions: {
      fadeOutTime: 1000,
      loadTime: 2000,
      fadeInTime: 1000,
    },
    editable: true,
  },

  "meta-completo": {
    id: "meta-completo",
    name: "Secuencia Completa Meta",
    description: "Secuencia completa de todas las escenas de Meta",
    scenes: [
      {
        sceneId: "meta-1",
        duration: 15000, // 15 segundos - Escenario Base
        name: "Escenario Base",
        showScreens: false,
        screenDelay: 0,
      },
      {
        sceneId: "meta-2",
        duration: 25000, // 25 segundos - Instalaciones Industriales
        name: "Instalaciones Industriales",
        showScreens: true,
        screenDelay: 5000,
      },
      {
        sceneId: "meta-3",
        duration: 20000, // 20 segundos - Operaciones de Campo
        name: "Operaciones de Campo",
        showScreens: true,
        screenDelay: 4000,
      },
      {
        sceneId: "meta-4",
        duration: 22000, // 22 segundos - Tecnología Avanzada
        name: "Tecnología Avanzada",
        showScreens: true,
        screenDelay: 5000,
      },
      {
        sceneId: "meta-5",
        duration: 20000, // 20 segundos - Operaciones Especializadas
        name: "Operaciones Especializadas",
        showScreens: true,
        screenDelay: 4000,
      },
      {
        sceneId: "meta-6",
        duration: 25000, // 25 segundos - Infraestructura Moderna
        name: "Infraestructura Moderna",
        showScreens: true,
        screenDelay: 5000,
      },
      {
        sceneId: "meta-7",
        duration: 25000, // 25 segundos - Operaciones de Producción
        name: "Operaciones de Producción",
        showScreens: true,
        screenDelay: 5000,
      },
    ],
    totalDuration: 152000, // 2:32 minutos
    autoLoop: false,
    showScreensAutomatically: true,
    transitions: {
      fadeOutTime: 1000,
      loadTime: 2000,
      fadeInTime: 1000,
    },
    editable: true,
  },
};

// Scene duration limits for validation
const SCENE_DURATION_LIMITS = {
  min: 15000, // Mínimo 15 segundos
  max: 300000, // Máximo 5 minutos
  default: 45000, // Por defecto 45 segundos
};

// Transition timing constants
const TRANSITION_TIMING = {
  fadeOut: {
    min: 500,
    max: 3000,
    default: 1000,
  },
  loading: {
    min: 1000,
    max: 5000,
    default: 2000,
  },
  fadeIn: {
    min: 500,
    max: 3000,
    default: 1000,
  },
};

/**
 * Calculate total duration for a sequence
 */
function calculateSequenceDuration(sequence) {
  if (!sequence.scenes || sequence.scenes.length === 0) {
    return 0;
  }

  const scenesDuration = sequence.scenes.reduce(
    (total, scene) => total + scene.duration,
    0
  );
  const transitionsTime =
    (sequence.scenes.length - 1) *
    (sequence.transitions.fadeOutTime +
      sequence.transitions.loadTime +
      sequence.transitions.fadeInTime);

  return scenesDuration + transitionsTime;
}

/**
 * Validate sequence configuration
 */
function validateSequence(sequence) {
  const errors = [];

  if (!sequence.id || !sequence.name) {
    errors.push("Sequence must have id and name");
  }

  if (!sequence.scenes || sequence.scenes.length === 0) {
    errors.push("Sequence must have at least one scene");
  }

  sequence.scenes?.forEach((scene, index) => {
    if (!scene.sceneId) {
      errors.push(`Scene at index ${index} must have sceneId`);
    }

    if (
      !scene.duration ||
      scene.duration < SCENE_DURATION_LIMITS.min ||
      scene.duration > SCENE_DURATION_LIMITS.max
    ) {
      errors.push(
        `Scene ${scene.sceneId} duration must be between ${SCENE_DURATION_LIMITS.min}ms and ${SCENE_DURATION_LIMITS.max}ms`
      );
    }
  });

  return errors;
}

/**
 * Get available scenes for sequence building
 */
function getAvailableScenes() {
  return Object.keys(window.SCENES_CONFIG || SCENES_CONFIG).filter(
    (sceneId) => sceneId !== "base"
  );
}

/**
 * Create a custom sequence from scene list
 */
function createCustomSequence(
  sceneIds,
  baseDuration = SCENE_DURATION_LIMITS.default
) {
  const scenes = sceneIds.map((sceneId) => ({
    sceneId: sceneId,
    duration: baseDuration,
    name: window.SCENES_CONFIG?.[sceneId]?.name || sceneId,
    showScreens: true,
    screenDelay: Math.floor(baseDuration * 0.2), // 20% of scene duration
  }));

  return {
    id: "custom-" + Date.now(),
    name: "Secuencia Personalizada",
    description: "Secuencia creada dinámicamente",
    scenes: scenes,
    totalDuration: calculateSequenceDuration({
      scenes,
      transitions: TRANSITION_TIMING,
    }),
    autoLoop: false,
    showScreensAutomatically: true,
    transitions: {
      fadeOutTime: TRANSITION_TIMING.fadeOut.default,
      loadTime: TRANSITION_TIMING.loading.default,
      fadeInTime: TRANSITION_TIMING.fadeIn.default,
    },
    editable: true,
  };
}

// Calculate total durations for predefined sequences
Object.values(SEQUENCE_CONFIGS).forEach((sequence) => {
  sequence.totalDuration = calculateSequenceDuration(sequence);
});

// Export configuration
window.SEQUENCE_CONFIGS = SEQUENCE_CONFIGS;
window.SCENE_DURATION_LIMITS = SCENE_DURATION_LIMITS;
window.TRANSITION_TIMING = TRANSITION_TIMING;

// Export utility functions
window.SequenceUtils = {
  calculateSequenceDuration,
  validateSequence,
  getAvailableScenes,
  createCustomSequence,
};

console.log(
  "📋 Sequence configurations loaded:",
  Object.keys(SEQUENCE_CONFIGS)
);
console.log(
  "🎬 Total sequences available:",
  Object.keys(SEQUENCE_CONFIGS).length
);

// Log total durations for debugging
Object.entries(SEQUENCE_CONFIGS).forEach(([id, sequence]) => {
  const minutes = Math.floor(sequence.totalDuration / 60000);
  const seconds = Math.floor((sequence.totalDuration % 60000) / 1000);
  console.log(
    `⏱️ ${sequence.name}: ${minutes}:${seconds.toString().padStart(2, "0")} (${sequence.scenes.length} escenas)`
  );
});
