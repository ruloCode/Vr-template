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

// Import Meta image cycler components
import { registerMeta2ImageCycler } from "./image-cyclers/meta2-image-cycler.js";
import { registerMeta3ImageCycler } from "./image-cyclers/meta3-image-cycler.js";
import { registerMeta4ImageCycler } from "./image-cyclers/meta4-image-cycler.js";
import { registerMeta6ImageCycler } from "./image-cyclers/meta6-image-cycler.js";
import { registerMeta7ImageCycler } from "./image-cyclers/meta7-image-cycler.js";

// Import Casanare image cycler components
import { registerCasanare2ImageCycler } from "./image-cyclers/casanare2-image-cycler.js";
import { registerCasanare3ImageCycler } from "./image-cyclers/casanare3-image-cycler.js";
import { registerCasanare3ImageCyclerB } from "./image-cyclers/casanare3-image-cycler-b.js";
import { registerCasanare4ImageCycler } from "./image-cyclers/casanare4-image-cycler.js";
import { registerCasanare4ImageCyclerB } from "./image-cyclers/casanare4-image-cycler-b.js";
import { registerCasanare5ImageCycler } from "./image-cyclers/casanare5-image-cycler.js";
import { registerCasanare5ImageCyclerB } from "./image-cyclers/casanare5-image-cycler-b.js";
import { registerCasanare6ImageCycler } from "./image-cyclers/casanare6-image-cycler.js";
import { registerCasanare6ImageCyclerB } from "./image-cyclers/casanare6-image-cycler-b.js";

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

// Import Meta video cycler components
import { registerMeta2VideoCycler } from "./video-cyclers/meta2-video-cycler.js";
import { registerMeta3VideoCycler } from "./video-cyclers/meta3-video-cycler.js";
import { registerMeta4VideoCycler } from "./video-cyclers/meta4-video-cycler.js";
import { registerMeta5VideoCycler } from "./video-cyclers/meta5-video-cycler.js";
import { registerMeta6VideoCycler } from "./video-cyclers/meta6-video-cycler.js";
import { registerMeta7VideoCycler } from "./video-cyclers/meta7-video-cycler.js";

// Import Barrancabermeja video cycler components
import { registerBarranca1VideoCycler } from "./video-cyclers/barranca1-video-cycler.js";
import { registerBarranca2VideoCycler } from "./video-cyclers/barranca2-video-cycler.js";
import { registerBarranca2BVideoCycler } from "./video-cyclers/barranca2B-video-cycler.js";
import { registerBarranca3VideoCycler } from "./video-cyclers/barranca3-video-cycler.js";
import { registerBarranca3BVideoCycler } from "./video-cyclers/barranca3B-video-cycler.js";
import { registerBarranca4VideoCycler } from "./video-cyclers/barranca4-video-cycler.js";
import { registerBarranca5VideoCycler } from "./video-cyclers/barranca5-video-cycler.js";
import { registerBarranca5BVideoCycler } from "./video-cyclers/barranca5B-video-cycler.js";
import { registerBarranca6VideoCycler } from "./video-cyclers/barranca6-video-cycler.js";
import { registerBarranca6BVideoCycler } from "./video-cyclers/barranca6B-video-cycler.js";
import { registerBarranca7VideoCycler } from "./video-cyclers/barranca7-video-cycler.js";

// Import Casanare video cycler components
import { registerCasanare1VideoCycler } from "./video-cyclers/casanare1-video-cycler.js";
import { registerCasanare2VideoCycler } from "./video-cyclers/casanare2-video-cycler.js";
import { registerCasanare3VideoCycler } from "./video-cyclers/casanare3-video-cycler.js";
import { registerCasanare5VideoCycler } from "./video-cyclers/casanare5-video-cycler.js";
import { registerCasanare6VideoCycler } from "./video-cyclers/casanare6-video-cycler.js";

// Import Huila video cycler components
import { registerHuila2VideoCycler } from "./video-cyclers/huila2-video-cycler.js";
import { registerHuila3VideoCycler } from "./video-cyclers/huila3-video-cycler.js";
import { registerHuila3VideoCyclerB } from "./video-cyclers/huila3-video-cycler-b.js";
import { registerHuila4VideoCycler } from "./video-cyclers/huila4-video-cycler.js";
import { registerHuila4VideoCyclerB } from "./video-cyclers/huila4-video-cycler-b.js";
import { registerHuila5VideoCycler } from "./video-cyclers/huila5-video-cycler.js";
import { registerHuila5VideoCyclerB } from "./video-cyclers/huila5-video-cycler-b.js";
import { registerHuila6VideoCycler } from "./video-cyclers/huila6-video-cycler.js";
import { registerHuila7VideoCycler } from "./video-cyclers/huila7-video-cycler.js";

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

  // Register Meta image cyclers
  registerMeta2ImageCycler();
  registerMeta3ImageCycler();
  registerMeta4ImageCycler();
  registerMeta6ImageCycler();
  registerMeta7ImageCycler();

  // Register Casanare image cyclers
  registerCasanare2ImageCycler();
  registerCasanare3ImageCycler();
  registerCasanare3ImageCyclerB();
  registerCasanare4ImageCycler();
  registerCasanare4ImageCyclerB();
  registerCasanare5ImageCycler();
  registerCasanare5ImageCyclerB();
  registerCasanare6ImageCycler();
  registerCasanare6ImageCyclerB();

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

  // Register Meta video cyclers
  registerMeta2VideoCycler();
  registerMeta3VideoCycler();
  registerMeta4VideoCycler();
  registerMeta5VideoCycler();
  registerMeta6VideoCycler();
  registerMeta7VideoCycler();

  // Register Barrancabermeja video cyclers
  registerBarranca1VideoCycler();
  registerBarranca2VideoCycler();
  registerBarranca2BVideoCycler();
  registerBarranca3VideoCycler();
  registerBarranca3BVideoCycler();
  registerBarranca4VideoCycler();
  registerBarranca5VideoCycler();
  registerBarranca5BVideoCycler();
  registerBarranca6VideoCycler();
  registerBarranca6BVideoCycler();
  registerBarranca7VideoCycler();

  // Register Casanare video cyclers
  registerCasanare1VideoCycler();
  registerCasanare2VideoCycler();
  registerCasanare3VideoCycler();
  registerCasanare5VideoCycler();
  registerCasanare6VideoCycler();

  // Register Huila video cyclers
  registerHuila2VideoCycler();
  registerHuila3VideoCycler();
  registerHuila3VideoCyclerB();
  registerHuila4VideoCycler();
  registerHuila4VideoCyclerB();
  registerHuila5VideoCycler();
  registerHuila5VideoCyclerB();
  registerHuila6VideoCycler();
  registerHuila7VideoCycler();

  console.log("✅ All A-Frame components registered successfully");
}

// Export for global access (compatibility)
window.registerAllComponents = registerAllComponents;
