/**
 * Universal Camera Controls System
 * Provides unified API for controlling the VR camera across all scenes
 */

export const cameraControls = {
  // Get camera element
  getCamera: () => {
    return (
      document.querySelector("#main-camera") ||
      document.querySelector("a-entity[camera][look-controls]") ||
      document.querySelector("a-camera")
    );
  },

  // Get current position
  getPosition: () => {
    const camera = cameraControls.getCamera();
    if (!camera) return null;
    const pos = camera.getAttribute("position");
    return {
      x: parseFloat(pos.x),
      y: parseFloat(pos.y),
      z: parseFloat(pos.z),
    };
  },

  // Get current rotation
  getRotation: () => {
    const camera = cameraControls.getCamera();
    if (!camera) return null;
    const rot = camera.getAttribute("rotation");
    return {
      x: parseFloat(rot.x),
      y: parseFloat(rot.y),
      z: parseFloat(rot.z),
    };
  },

  // Set position
  setPosition: (x, y, z) => {
    const camera = cameraControls.getCamera();
    if (camera) {
      camera.setAttribute("position", `${x} ${y} ${z}`);
      console.log(`📍 Cámara movida a: ${x}, ${y}, ${z}`);
    }
  },

  // Set rotation
  setRotation: (x, y, z) => {
    const camera = cameraControls.getCamera();
    if (camera) {
      camera.setAttribute("rotation", `${x} ${y} ${z}`);
      console.log(`🔄 Cámara rotada a: ${x}°, ${y}°, ${z}°`);
    }
  },

  // Move camera relative to current position
  move: (deltaX, deltaY, deltaZ) => {
    const pos = cameraControls.getPosition();
    if (pos) {
      cameraControls.setPosition(
        pos.x + deltaX,
        pos.y + deltaY,
        pos.z + deltaZ
      );
    }
  },

  // Rotate camera relative to current rotation
  rotate: (deltaX, deltaY, deltaZ) => {
    const rot = cameraControls.getRotation();
    if (rot) {
      cameraControls.setRotation(
        rot.x + deltaX,
        rot.y + deltaY,
        rot.z + deltaZ
      );
    }
  },

  // Get complete camera info
  info: () => {
    const camera = cameraControls.getCamera();
    if (!camera) return null;

    const pos = cameraControls.getPosition();
    const rot = cameraControls.getRotation();

    return {
      element: camera,
      position: pos,
      rotation: rot,
      scale: camera.getAttribute("scale"),
      visible: camera.getAttribute("visible"),
      active: camera.getAttribute("camera")?.active !== false,
      lookControls: camera.getAttribute("look-controls"),
      wasdControls: camera.getAttribute("wasd-controls"),
    };
  },

  // Debug info
  debug: () => {
    const info = cameraControls.info();
    if (!info) return null;

    return {
      position: `${info.position.x}, ${info.position.y}, ${info.position.z}`,
      rotation: `${info.rotation.x}°, ${info.rotation.y}°, ${info.rotation.z}°`,
      active: info.active,
      visible: info.visible,
      hasLookControls: !!info.lookControls,
      hasWasdControls: !!info.wasdControls,
    };
  },

  // Reset to default position
  reset: () => {
    cameraControls.setPosition(0, 0, 0);
    cameraControls.setRotation(0, 0, 0);
    console.log("🔄 Cámara reseteada a posición por defecto");
  },

  // Common camera positions
  positions: {
    front: () => cameraControls.setPosition(0, 0, 0),
    back: () => cameraControls.setPosition(0, 0, -10),
    left: () => cameraControls.setPosition(-5, 0, 0),
    right: () => cameraControls.setPosition(5, 0, 0),
    up: () => cameraControls.setPosition(0, 5, 0),
    down: () => cameraControls.setPosition(0, -5, 0),
    center: () => cameraControls.setPosition(0, 0, 0),
  },

  // Common camera rotations
  rotations: {
    front: () => cameraControls.setRotation(0, 0, 0),
    back: () => cameraControls.setRotation(0, 180, 0),
    left: () => cameraControls.setRotation(0, -90, 0),
    right: () => cameraControls.setRotation(0, 90, 0),
    up: () => cameraControls.setRotation(-90, 0, 0),
    down: () => cameraControls.setRotation(90, 0, 0),
  },

  // Copy position/rotation to clipboard
  copy: () => {
    const pos = cameraControls.getPosition();
    const rot = cameraControls.getRotation();
    if (pos && rot) {
      const copyText = `position="${pos.x} ${pos.y} ${pos.z}" rotation="${rot.x} ${rot.y} ${rot.z}"`;
      navigator.clipboard
        .writeText(copyText)
        .then(() => {
          console.log("✅ Copiado al portapapeles:", copyText);
        })
        .catch(() => {
          console.log("📋 Copia manual:", copyText);
        });
      return copyText;
    }
    return null;
  },

  // Monitor camera changes in real time
  monitor: (interval = 1000) => {
    return setInterval(() => {
      const pos = cameraControls.getPosition();
      const rot = cameraControls.getRotation();
      if (pos && rot) {
        console.log(
          `📍 Pos: ${pos.x}, ${pos.y}, ${pos.z} | 🔄 Rot: ${rot.x}°, ${rot.y}°, ${rot.z}°`
        );
      }
    }, interval);
  },

  // Stop monitoring
  stopMonitor: (intervalId) => {
    if (intervalId) {
      clearInterval(intervalId);
      console.log("⏹️ Monitoreo de cámara detenido");
    }
  },
};

// Export for global access (compatibility)
window.cameraControls = cameraControls;