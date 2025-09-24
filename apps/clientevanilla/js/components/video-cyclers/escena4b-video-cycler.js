/**
 * Escena 4B - Video Cycler Component (Single Video)
 * A-Frame component for single video playback in Scene 4B
 */

export function registerEscena4bVideoCycler() {
  AFRAME.registerComponent("escena4b-video-cycler", {
    init() {
      this.isVisible = false;
      this.currentVideo = null;

      this.show = () => {
        this.el.setAttribute("visible", "true");
        this.isVisible = true;
        // Small delay to ensure video is loaded
        setTimeout(() => {
          this.startVideoPlayback();
        }, 500);
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
        const videoSrc = "#escena4-3-video";
        this.el.setAttribute("src", videoSrc);

        // Get the video element
        this.currentVideo = document.querySelector(videoSrc);
        if (this.currentVideo) {
          // Start playing the video
          this.currentVideo.play();
        }
      };

      // Expose methods globally for easy access
      window.escena4BVideoCycler = this;
    },

    remove() {
      this.stopVideoPlayback();
    },
  });
}