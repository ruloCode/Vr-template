/**
 * Meta 7 - Video Cycler Component
 * A-Frame component for video display in Meta Scene 7
 */

export function registerMeta7VideoCycler() {
  AFRAME.registerComponent("meta7-video-cycler", {
    init() {
      this.isVisible = false;
      this.currentVideoIndex = 0;
      this.videos = [
        "#meta7-1-video",
      ];
      this.cycleInterval = null;

      this.show = () => {
        this.el.setAttribute("visible", "true");
        this.isVisible = true;
        this.showCurrentVideo();
      };

      this.hide = () => {
        this.el.setAttribute("visible", "false");
        this.isVisible = false;
      };

      this.showCurrentVideo = () => {
        const videoSrc = this.videos[this.currentVideoIndex];
        this.el.setAttribute("src", videoSrc);

        // Play the video with audio
        const videoElement = document.querySelector(videoSrc);
        if (videoElement) {
          videoElement.currentTime = 0;
          videoElement.muted = false;
          videoElement.volume = 1;
          videoElement.play().catch(console.error);
        }
      };

      // Expose methods globally for easy access
      window.meta7VideoCycler = this;
    },

    remove() {
      // No cycling for single video
    },
  });
}


