/**
 * Escena 11B - Video Cycler Component (Single Video)
 * A-Frame component for single video playback in Scene 11B
 */

export function registerEscena11bVideoCycler() {
  AFRAME.registerComponent("escena11b-video-cycler", {
    init() {
      this.isVisible = false;
      this.currentVideo = null;

      this.show = () => {
        this.el.setAttribute("visible", "true");
        this.isVisible = true;
        this.startVideoPlayback();
      };

      this.hide = () => {
        this.el.setAttribute("visible", "false");
        this.isVisible = false;
        this.stopVideoPlayback();
      };

      this.startVideoPlayback = () => {
        this.playVideo();
      };

      this.stopVideoPlayback = () => {
        if (this.currentVideo) {
          this.currentVideo.pause();
          this.currentVideo.currentTime = 0;
        }
      };

      this.playVideo = () => {
        const videoSrc = "#escena11-1-video";
        this.el.setAttribute("src", videoSrc);

        // Get the video element and play it
        const videoElement = document.querySelector(videoSrc);
        if (videoElement) {
          this.currentVideo = videoElement;

          // Ensure video is muted for autoplay
          videoElement.muted = true;
          videoElement.volume = 0;

          // Wait for video to be ready before playing
          const playVideo = () => {
            videoElement.currentTime = 0;
            videoElement.play().catch((error) => {
              console.warn("Video playback failed, retrying:", error);
              // Retry with delay
              setTimeout(() => {
                videoElement.muted = true;
                videoElement.play().catch((retryError) => {
                  console.error("Second video play attempt failed:", retryError);
                });
              }, 1000);
            });
          };

          // Check if video is ready
          if (videoElement.readyState >= 2) {
            playVideo();
          } else {
            videoElement.addEventListener("loadeddata", playVideo, {
              once: true,
            });
            videoElement.load();
          }
        }
      };

      // Expose methods globally for easy access
      window.escena11BVideoCycler = this;
    },

    remove() {
      this.stopVideoPlayback();
    },
  });
}