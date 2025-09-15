/**
 * Scene Configuration for VR ClienteVanilla - Ecopetrol
 * Maps scene IDs to their corresponding assets
 */
const SCENES_CONFIG = {
  'escena1': {
    id: 'escena1',
    name: 'Día - Centro de Procesamiento CPF',
    description: 'Centro de Procesamiento de Fluidos diurno con ambiente industrial',
    assets: {
      skybox: 'panos/cpf_florena.jpg',
      audio: 'audio/ambient-wind.mp3',
      ground: 'images/grass.jpg',
      models: [
        {
          id: 'oak-tree',
          src: 'models/OakTree.gltf',
          position: '0 0 -5',
          scale: '2 2 2'
        }
      ]
    },
    lighting: {
      ambient: {
        color: '#ffffee',
        intensity: 0.9
      },
      directional: {
        color: '#ffffff',
        intensity: 1.0,
        position: '0 1 1'
      }
    },
    timeOfDay: 'day'
  },

  'escena-1': {
    id: 'escena-1',
    name: 'Día - Centro de Procesamiento CPF',
    description: 'Centro de Procesamiento de Fluidos diurno con ambiente industrial',
    assets: {
      skybox: 'panos/cpf_florena.jpg',
      audio: 'audio/ambient-wind.mp3',
      ground: 'images/grass.jpg',
      models: [
        {
          id: 'oak-tree',
          src: 'models/OakTree.gltf',
          position: '0 0 -5',
          scale: '2 2 2'
        }
      ]
    },
    lighting: {
      ambient: {
        color: '#ffffee',
        intensity: 0.9
      },
      directional: {
        color: '#ffffff',
        intensity: 1.0,
        position: '0 1 1'
      }
    },
    timeOfDay: 'day'
  },

  'escena2': {
    id: 'escena2',
    name: 'Noche - Extracción Petrolera',
    description: 'Operaciones petroleras nocturnas con ambiente industrial intenso',
    assets: {
      skybox: 'panos/petroleo_3.jpg',
      audio: 'audio/ambient-night.mp3',
      ground: 'images/grass.jpg',
      models: [
        {
          id: 'oak-tree',
          src: 'models/OakTree.gltf',
          position: '0 0 -5',
          scale: '2 2 2'
        }
      ]
    },
    lighting: {
      ambient: {
        color: '#332211',
        intensity: 0.3
      },
      directional: {
        color: '#663311',
        intensity: 0.4,
        position: '0 1 1'
      }
    },
    timeOfDay: 'night'
  },

  'escena-2': {
    id: 'escena-2',
    name: 'Noche - Extracción Petrolera',
    description: 'Operaciones petroleras nocturnas con ambiente industrial intenso',
    assets: {
      skybox: 'panos/petroleo_3.jpg',
      audio: 'audio/ambient-night.mp3',
      ground: 'images/grass.jpg',
      models: [
        {
          id: 'oak-tree',
          src: 'models/OakTree.gltf',
          position: '0 0 -5',
          scale: '2 2 2'
        }
      ]
    },
    lighting: {
      ambient: {
        color: '#332211',
        intensity: 0.3
      },
      directional: {
        color: '#663311',
        intensity: 0.4,
        position: '0 1 1'
      }
    },
    timeOfDay: 'night'
  },

  'escena3': {
    id: 'escena3',
    name: 'Centro de Procesamiento CPF',
    description: 'Centro de Procesamiento de Fluidos de Ecopetrol',
    assets: {
      skybox: 'panos/cpf_cupiagua.jpg',
      audio: 'audio/ambient-wind.mp3',
      ground: 'images/grass.jpg',
      models: []
    },
    lighting: {
      ambient: {
        color: '#eeffdd',
        intensity: 0.8
      },
      directional: {
        color: '#ddeecc',
        intensity: 0.9,
        position: '1 1 0'
      }
    },
    timeOfDay: 'day'
  },

  'escena-3': {
    id: 'escena-3',
    name: 'Centro de Procesamiento CPF',
    description: 'Centro de Procesamiento de Fluidos de Ecopetrol',
    assets: {
      skybox: 'panos/cpf_cupiagua.jpg',
      audio: 'audio/ambient-wind.mp3',
      ground: 'images/grass.jpg',
      models: []
    },
    lighting: {
      ambient: {
        color: '#eeffdd',
        intensity: 0.8
      },
      directional: {
        color: '#ddeecc',
        intensity: 0.9,
        position: '1 1 0'
      }
    },
    timeOfDay: 'day'
  },

  // Additional scenes with different Ecopetrol locations
  'petroleo-2': {
    id: 'petroleo-2',
    name: 'Extracción Avanzada',
    description: 'Tecnología avanzada de extracción petrolera',
    assets: {
      skybox: 'panos/petroleo_2.jpg',
      audio: 'audio/ambient-wind.mp3',
      ground: 'images/grass.jpg',
      models: []
    },
    lighting: {
      ambient: {
        color: '#ffddbb',
        intensity: 0.7
      },
      directional: {
        color: '#ffcc99',
        intensity: 0.8,
        position: '0 1 1'
      }
    },
    timeOfDay: 'day'
  },

  'petroleo-3': {
    id: 'petroleo-3',
    name: 'Operaciones Petroleras',
    description: 'Vista panorámica de operaciones petroleras',
    assets: {
      skybox: 'panos/petroleo_3.jpg',
      audio: 'audio/ambient-night.mp3',
      ground: 'images/grass.jpg',
      models: []
    },
    lighting: {
      ambient: {
        color: '#ffeeaa',
        intensity: 0.6
      },
      directional: {
        color: '#ffdd88',
        intensity: 0.7,
        position: '0 1 1'
      }
    },
    timeOfDay: 'evening'
  },

  'cpf-cusiana': {
    id: 'cpf-cusiana',
    name: 'CPF Cusiana',
    description: 'Centro de Procesamiento de Fluidos Cusiana',
    assets: {
      skybox: 'panos/cpf_cusiana.jpg',
      audio: 'audio/ambient-wind.mp3',
      ground: 'images/grass.jpg',
      models: []
    },
    lighting: {
      ambient: {
        color: '#ddeeff',
        intensity: 0.8
      },
      directional: {
        color: '#ccddee',
        intensity: 0.9,
        position: '1 1 1'
      }
    },
    timeOfDay: 'day'
  },

  'cpf-florena': {
    id: 'cpf-florena',
    name: 'CPF Florena',
    description: 'Centro de Procesamiento de Fluidos Florena',
    assets: {
      skybox: 'panos/cpf_florena.jpg',
      audio: 'audio/ambient-wind.mp3',
      ground: 'images/grass.jpg',
      models: []
    },
    lighting: {
      ambient: {
        color: '#eeffcc',
        intensity: 0.8
      },
      directional: {
        color: '#ddeeaa',
        intensity: 0.9,
        position: '1 1 1'
      }
    },
    timeOfDay: 'day'
  }
};

// Scene transition effects
const TRANSITION_CONFIG = {
  duration: 2000, // 2 seconds
  fadeColor: '#000000',
  audioFadeTime: 1000 // 1 second audio crossfade
};

// Export for use in other scripts
window.SCENES_CONFIG = SCENES_CONFIG;
window.TRANSITION_CONFIG = TRANSITION_CONFIG;

console.log('📋 Scenes configuration loaded:', Object.keys(SCENES_CONFIG));