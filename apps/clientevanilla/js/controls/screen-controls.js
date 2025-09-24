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
        ? (cycler.currentImageIndex ||
            cycler.currentVideoIndex ||
            0) + 1
        : 0,
      totalItems: cycler
        ? cycler.images?.length || cycler.videos?.length || 0
        : 0,
      type: isVideo ? "video" : isImage ? "image" : "unknown",
      playing:
        cycler && cycler.currentVideo
          ? !cycler.currentVideo.paused
          : false,
      currentTime:
        cycler && cycler.currentVideo
          ? cycler.currentVideo.currentTime
          : 0,
      duration:
        cycler && cycler.currentVideo
          ? cycler.currentVideo.duration
          : 0,
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