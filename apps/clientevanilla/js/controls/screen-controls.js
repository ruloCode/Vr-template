/**
 * Universal Screen Controls System for all scenes (1-11)
 * Provides a unified API for controlling screen elements across all VR scenes
 */

export const screenControls = {
  // Get screen element by scene and screen type
  getScreen: (sceneNumber, screenType = "A") => {
    const screenId =
      screenType === "A"
        ? `escena${sceneNumber}-screen`
        : `escena${sceneNumber}${screenType}-screen`;
    return document.querySelector(`#${screenId}`);
  },

  // Get cycler component by scene and screen type
  getCycler: (sceneNumber, screenType = "A") => {
    const cyclerName =
      screenType === "A"
        ? `escena${sceneNumber}ImageCycler`
        : `escena${sceneNumber}${screenType}ImageCycler`;
    return window[cyclerName];
  },

  // Show screen
  show: (sceneNumber, screenType = "A") => {
    const methodName =
      screenType === "A"
        ? `showEscena${sceneNumber}Screen`
        : `showEscena${sceneNumber}${screenType}Screen`;
    if (window.sceneManager && window.sceneManager[methodName]) {
      window.sceneManager[methodName]();
    }
  },

  // Hide screen
  hide: (sceneNumber, screenType = "A") => {
    const methodName =
      screenType === "A"
        ? `hideEscena${sceneNumber}Screen`
        : `hideEscena${sceneNumber}${screenType}Screen`;
    if (window.sceneManager && window.sceneManager[methodName]) {
      window.sceneManager[methodName]();
    }
  },

  // Move screen
  move: (sceneNumber, x, y, z, screenType = "A") => {
    const screen = screenControls.getScreen(sceneNumber, screenType);
    if (screen) {
      screen.setAttribute("position", `${x} ${y} ${z}`);
    }
  },

  // Rotate screen
  rotate: (sceneNumber, x, y, z, screenType = "A") => {
    const screen = screenControls.getScreen(sceneNumber, screenType);
    if (screen) {
      screen.setAttribute("rotation", `${x} ${y} ${z}`);
    }
  },

  // Resize screen
  resize: (sceneNumber, width, height, screenType = "A") => {
    const screen = screenControls.getScreen(sceneNumber, screenType);
    if (screen) {
      screen.setAttribute("width", width.toString());
      screen.setAttribute("height", height.toString());
    }
  },

  // Next image/video
  next: (sceneNumber, screenType = "A") => {
    const cycler = screenControls.getCycler(sceneNumber, screenType);
    if (cycler && cycler.nextImage) {
      cycler.nextImage();
    } else if (cycler && cycler.nextVideo) {
      cycler.nextVideo();
    }
  },

  // Set specific image/video
  set: (sceneNumber, index, screenType = "A") => {
    const cycler = screenControls.getCycler(sceneNumber, screenType);
    if (cycler && cycler.setImage) {
      cycler.setImage(index);
    } else if (cycler && cycler.setVideo) {
      cycler.setVideo(index);
    }
  },

  // Play/pause for video screens
  play: (sceneNumber, screenType = "A") => {
    const cycler = screenControls.getCycler(sceneNumber, screenType);
    if (cycler && cycler.currentVideo) {
      cycler.currentVideo.play();
    }
  },

  pause: (sceneNumber, screenType = "A") => {
    const cycler = screenControls.getCycler(sceneNumber, screenType);
    if (cycler && cycler.currentVideo) {
      cycler.currentVideo.pause();
    }
  },

  // Get screen info
  info: (sceneNumber, screenType = "A") => {
    const screen = screenControls.getScreen(sceneNumber, screenType);
    if (!screen) return null;

    const cycler = screenControls.getCycler(sceneNumber, screenType);
    const isVideo = cycler && cycler.videos;
    const isImage = cycler && cycler.images;

    return {
      scene: sceneNumber,
      screen: screenType,
      visible: screen.getAttribute("visible") === "true",
      position: screen.getAttribute("position"),
      rotation: screen.getAttribute("rotation"),
      size: {
        width: screen.getAttribute("width"),
        height: screen.getAttribute("height"),
      },
      currentIndex: cycler
        ? (cycler.currentImageIndex || cycler.currentVideoIndex || 0) + 1
        : 0,
      totalItems: cycler
        ? cycler.images?.length || cycler.videos?.length || 0
        : 0,
      type: isVideo ? "video" : isImage ? "image" : "unknown",
      playing:
        cycler && cycler.currentVideo ? !cycler.currentVideo.paused : false,
      currentTime:
        cycler && cycler.currentVideo ? cycler.currentVideo.currentTime : 0,
      duration:
        cycler && cycler.currentVideo ? cycler.currentVideo.duration : 0,
    };
  },

  // Debug info
  debug: (sceneNumber, screenType = "A") => {
    const info = screenControls.info(sceneNumber, screenType);
    if (!info) return null;

    return {
      scene: `${sceneNumber}${screenType}`,
      visible: info.visible,
      position: info.position,
      rotation: info.rotation,
      size: `${info.size.width}x${info.size.height}`,
      current: `${info.currentIndex}/${info.totalItems}`,
      type: info.type,
      playing: info.playing,
    };
  },

  // List all available screens
  list: () => {
    const screens = [];

    // Escenas normales (1-11)
    for (let scene = 1; scene <= 11; scene++) {
      if (scene === 1) {
        screens.push({
          scene: 1,
          screen: "A",
          id: "escena1-screen",
          type: "video",
        });
      } else if (scene === 2) {
        screens.push({
          scene: 2,
          screen: "A",
          id: "escena2-screen",
          type: "image",
        });
      } else if (scene === 3) {
        screens.push({
          scene: 3,
          screen: "A",
          id: "escena3-screen",
          type: "image",
        });
        screens.push({
          scene: 3,
          screen: "B",
          id: "escena3B-screen",
          type: "image",
        });
      } else {
        screens.push({
          scene: scene,
          screen: "A",
          id: `escena${scene}-screen`,
          type: "image",
        });
        screens.push({
          scene: scene,
          screen: "B",
          id: `escena${scene}B-screen`,
          type: "image",
        });
      }
    }

    // Escenas de Guajira (1-10)
    for (let scene = 1; scene <= 10; scene++) {
      let type = "image";
      if (scene === 1 || scene === 3 || scene === 5 || scene === 9) {
        type = "video";
      }

      screens.push({
        scene: `guajira-${scene}`,
        screen: "A",
        id: `guajira${scene}-screen`,
        type: type,
      });
    }

    // Escenas de Cartagena (1-8)
    for (let scene = 1; scene <= 8; scene++) {
      // Cartagena 1 y 8 no tienen pantallas adicionales
      if (scene === 1 || scene === 8) {
        continue;
      }

      let type = "video";
      if (scene === 6) {
        type = "image";
      }

      screens.push({
        scene: `cartagena-${scene}`,
        screen: "A",
        id: `cartagena${scene}-screen`,
        type: type,
      });

      // Cartagena 6 tiene una pantalla adicional de video
      if (scene === 6) {
        screens.push({
          scene: `cartagena-${scene}`,
          screen: "B",
          id: `cartagena${scene}-video-screen`,
          type: "video",
        });
      }
    }

    // Escenas de Meta (1-7)
    for (let scene = 1; scene <= 7; scene++) {
      // Meta 1 no tiene pantallas adicionales
      if (scene === 1) {
        continue;
      }

      // Meta 2, 3, 4, 6 y 7 tienen pantallas de imágenes
      if (scene === 2 || scene === 3 || scene === 4 || scene === 6 || scene === 7) {
        screens.push({
          scene: `meta-${scene}`,
          screen: "A",
          id: `meta${scene}-image-screen`,
          type: "image",
        });
      }

      // Meta 2, 3, 4, 5, 6 y 7 tienen pantallas de videos
      if (scene === 2 || scene === 3 || scene === 4 || scene === 5 || scene === 6 || scene === 7) {
        screens.push({
          scene: `meta-${scene}`,
          screen: "B",
          id: `meta${scene}-video-screen`,
          type: "video",
        });
      }
    }

    // Escenas de Barrancabermeja (1-7)
    for (let scene = 1; scene <= 7; scene++) {
      // Barranca 1, 4 y 7 tienen una sola pantalla de video
      if (scene === 1 || scene === 4 || scene === 7) {
        screens.push({
          scene: `barranca-${scene}`,
          screen: "A",
          id: `barranca${scene}-screen`,
          type: "video",
        });
      }
      
      // Barranca 2 y 6 tienen dos pantallas de video
      if (scene === 2 || scene === 6) {
        screens.push({
          scene: `barranca-${scene}`,
          screen: "A",
          id: `barranca${scene}-screen`,
          type: "video",
        });
        screens.push({
          scene: `barranca-${scene}`,
          screen: "B",
          id: `barranca${scene}B-screen`,
          type: "video",
        });
      }
      
      // Barranca 3 y 5 tienen tres videos (2 en un lado, 1 en otro)
      if (scene === 3 || scene === 5) {
        screens.push({
          scene: `barranca-${scene}`,
          screen: "A",
          id: `barranca${scene}-screen`,
          type: "video",
        });
        screens.push({
          scene: `barranca-${scene}`,
          screen: "B",
          id: `barranca${scene}B-screen`,
          type: "video",
        });
      }
    }

    // Escenas de Casanare (1-6)
    for (let scene = 1; scene <= 6; scene++) {
      // Casanare 1 no tiene pantallas adicionales
      if (scene === 1) {
        continue;
      }

        // Casanare 2 tiene pantallas de imágenes y videos
        if (scene === 2) {
          screens.push({
            scene: `casanare-${scene}`,
            screen: "A",
            id: `casanare${scene}-image-screen`,
            type: "image",
          });
          screens.push({
            scene: `casanare-${scene}`,
            screen: "B",
            id: `casanare${scene}-video-screen`,
            type: "video",
          });
        }

        // Casanare 3 tiene pantallas de imágenes A y B, y pantalla de videos
        if (scene === 3) {
          screens.push({
            scene: `casanare-${scene}`,
            screen: "A",
            id: `casanare${scene}-image-screen`,
            type: "image",
          });
          screens.push({
            scene: `casanare-${scene}`,
            screen: "B",
            id: `casanare${scene}-image-screen-b`,
            type: "image",
          });
          screens.push({
            scene: `casanare-${scene}`,
            screen: "C",
            id: `casanare${scene}-video-screen`,
            type: "video",
          });
        }

        // Casanare 4 tiene pantallas de imágenes A y B
        if (scene === 4) {
          screens.push({
            scene: `casanare-${scene}`,
            screen: "A",
            id: `casanare${scene}-image-screen`,
            type: "image",
          });
          screens.push({
            scene: `casanare-${scene}`,
            screen: "B",
            id: `casanare${scene}-image-screen-b`,
            type: "image",
          });
        }

        // Casanare 5 tiene pantallas de imágenes A y B, y pantalla de videos
        if (scene === 5) {
          screens.push({
            scene: `casanare-${scene}`,
            screen: "A",
            id: `casanare${scene}-image-screen`,
            type: "image",
          });
          screens.push({
            scene: `casanare-${scene}`,
            screen: "B",
            id: `casanare${scene}-image-screen-b`,
            type: "image",
          });
          screens.push({
            scene: `casanare-${scene}`,
            screen: "C",
            id: `casanare${scene}-video-screen`,
            type: "video",
          });
        }

        // Casanare 6 tiene pantallas de imágenes A y B, y pantalla de videos
        if (scene === 6) {
          screens.push({
            scene: `casanare-${scene}`,
            screen: "A",
            id: `casanare${scene}-image-screen`,
            type: "image",
          });
          screens.push({
            scene: `casanare-${scene}`,
            screen: "B",
            id: `casanare${scene}-image-screen-b`,
            type: "image",
          });
          screens.push({
            scene: `casanare-${scene}`,
            screen: "C",
            id: `casanare${scene}-video-screen`,
            type: "video",
          });
        }
    }

    return screens;
  },

  // Show all screens for a scene
  showScene: (sceneNumber) => {
    if (sceneNumber === 1) {
      screenControls.show(1, "A");
    } else if (sceneNumber === 2) {
      screenControls.show(2, "A");
    } else if (sceneNumber === 3) {
      screenControls.show(3, "A");
      screenControls.show(3, "B");
    } else {
      screenControls.show(sceneNumber, "A");
      screenControls.show(sceneNumber, "B");
    }
  },

  // Hide all screens for a scene
  hideScene: (sceneNumber) => {
    if (sceneNumber === 1) {
      screenControls.hide(1, "A");
    } else if (sceneNumber === 2) {
      screenControls.hide(2, "A");
    } else if (sceneNumber === 3) {
      screenControls.hide(3, "A");
      screenControls.hide(3, "B");
    } else {
      screenControls.hide(sceneNumber, "A");
      screenControls.hide(sceneNumber, "B");
    }
  },
};

// Export for global access (compatibility)
window.screenControls = screenControls;
