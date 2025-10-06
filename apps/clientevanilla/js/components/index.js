/**
 * A-Frame Components Registration
 * Main entry point for all custom A-Frame components
 */

// Import all image cycler components
import { registerEscena2ImageCycler } from "./image-cyclers/escena2-image-cycler.js";
import { registerEscena3aImageCycler } from "./image-cyclers/escena3a-image-cycler.js";
import { registerEscena3bImageCycler } from "./image-cyclers/escena3b-image-cycler.js";
import { registerEscena5ImageCycler } from "./image-cyclers/escena5-image-cycler.js";
import { registerEscena5bImageCycler } from "./image-cyclers/escena5b-image-cycler.js";
import { registerEscena6ImageCycler } from "./image-cyclers/escena6-image-cycler.js";
import { registerEscena7ImageCycler } from "./image-cyclers/escena7-image-cycler.js";
import { registerEscena8ImageCycler } from "./image-cyclers/escena8-image-cycler.js";
import { registerEscena8bImageCycler } from "./image-cyclers/escena8b-image-cycler.js";
import { registerEscena9ImageCycler } from "./image-cyclers/escena9-image-cycler.js";
import { registerEscena10ImageCycler } from "./image-cyclers/escena10-image-cycler.js";
import { registerEscena10bImageCycler } from "./image-cyclers/escena10b-image-cycler.js";
import { registerEscena11ImageCycler } from "./image-cyclers/escena11-image-cycler.js";

// Import Guajira image cycler components
import { registerGuajira2ImageCycler } from "./image-cyclers/guajira2-image-cycler.js";
import { registerGuajira4ImageCycler } from "./image-cyclers/guajira4-image-cycler.js";
import { registerGuajira6ImageCycler } from "./image-cyclers/guajira6-image-cycler.js";
import { registerGuajira7ImageCycler } from "./image-cyclers/guajira7-image-cycler.js";
import { registerGuajira8ImageCycler } from "./image-cyclers/guajira8-image-cycler.js";
import { registerGuajira10ImageCycler } from "./image-cyclers/guajira10-image-cycler.js";

// Import Cartagena image cycler components
import { registerCartagena6ImageCycler } from "./image-cyclers/cartagena6-image-cycler.js";

// Import all video cycler components
import { registerSolarVideoCycler } from "./video-cyclers/solar-video-cycler.js";
// import { registerEscena4VideoCycler } from './video-cyclers/escena4-video-cycler.js';
import { registerEscena4bVideoCycler } from "./video-cyclers/escena4b-video-cycler.js";
// import { registerEscena6bVideoCycler } from './video-cyclers/escena6b-video-cycler.js';
import { registerEscena7bVideoCycler } from "./video-cyclers/escena7b-video-cycler.js";
import { registerEscena9bVideoCycler } from "./video-cyclers/escena9b-video-cycler.js";
import { registerEscena11bVideoCycler } from "./video-cyclers/escena11b-video-cycler.js";

// Import Guajira video cycler components
import { registerGuajira1VideoCycler } from "./video-cyclers/guajira1-video-cycler.js";
import { registerGuajira2VideoCycler } from "./video-cyclers/guajira2-video-cycler.js";
import { registerGuajira3VideoCycler } from "./video-cyclers/guajira3-video-cycler.js";
import { registerGuajira5VideoCycler } from "./video-cyclers/guajira5-video-cycler.js";
import { registerGuajira9VideoCycler } from "./video-cyclers/guajira9-video-cycler.js";

// Import Cartagena video cycler components
import { registerCartagena2VideoCycler } from "./video-cyclers/cartagena2-video-cycler.js";
import { registerCartagena3VideoCycler } from "./video-cyclers/cartagena3-video-cycler.js";
import { registerCartagena4VideoCycler } from "./video-cyclers/cartagena4-video-cycler.js";
import { registerCartagena5VideoCycler } from "./video-cyclers/cartagena5-video-cycler.js";
import { registerCartagena6VideoCycler } from "./video-cyclers/cartagena6-video-cycler.js";
import { registerCartagena7VideoCycler } from "./video-cyclers/cartagena7-video-cycler.js";

/**
 * Register all A-Frame components
 * This function should be called after A-Frame is loaded but before the scene is initialized
 */
export function registerAllComponents() {
  console.log("🔧 Registering A-Frame components...");

  // Register image cyclers
  registerEscena2ImageCycler();
  registerEscena3aImageCycler();
  registerEscena3bImageCycler();
  registerEscena5ImageCycler();
  registerEscena5bImageCycler();
  registerEscena6ImageCycler();
  registerEscena7ImageCycler();
  registerEscena8ImageCycler();
  registerEscena8bImageCycler();
  registerEscena9ImageCycler();
  registerEscena10ImageCycler();
  registerEscena10bImageCycler();
  registerEscena11ImageCycler();

  // Register Guajira image cyclers
  registerGuajira2ImageCycler();
  registerGuajira4ImageCycler();
  registerGuajira6ImageCycler();
  registerGuajira7ImageCycler();
  registerGuajira8ImageCycler();
  registerGuajira10ImageCycler();

  // Register Cartagena image cyclers
  registerCartagena6ImageCycler();

  // Register video cyclers
  registerSolarVideoCycler();
  // registerEscena4VideoCycler();
  registerEscena4bVideoCycler();
  // registerEscena6bVideoCycler();
  registerEscena7bVideoCycler();
  registerEscena9bVideoCycler();
  registerEscena11bVideoCycler();

  // Register Guajira video cyclers
  registerGuajira1VideoCycler();
  registerGuajira2VideoCycler();
  registerGuajira3VideoCycler();
  registerGuajira5VideoCycler();
  registerGuajira9VideoCycler();

  // Register Cartagena video cyclers
  registerCartagena2VideoCycler();
  registerCartagena3VideoCycler();
  registerCartagena4VideoCycler();
  registerCartagena5VideoCycler();
  registerCartagena6VideoCycler();
  registerCartagena7VideoCycler();

  console.log("✅ All A-Frame components registered successfully");
}

// Export for global access (compatibility)
window.registerAllComponents = registerAllComponents;
