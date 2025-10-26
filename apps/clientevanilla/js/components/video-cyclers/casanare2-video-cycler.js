/**
 * Casanare 2 - Video Cycler Component
 * A-Frame component for automatic video cycling in Casanare Scene 2
 */

export function registerCasanare2VideoCycler() {
  AFRAME.registerComponent("casanare2-video-cycler", {
    init() {
      this.isVisible = false;
      this.currentVideoIndex = 0;
      this.videos = [
        "#casanare2-4-video",
        "#casanare2-5-video",
        "#casanare2-6-video",
      ];
      this.cycleInterval = null;

      this.show = () => {
        this.el.setAttribute("visible", "true");
        this.isVisible = true;
        this.startVideoCycling();
      };

      this.hide = () => {
        this.el.setAttribute("visible", "false");
        this.isVisible = false;
        this.stopVideoCycling();
      };

      this.startVideoCycling = () => {
        this.showCurrentVideo();
        this.cycleInterval = setInterval(() => {
          this.nextVideo();
        }, 10000); // Cambiar video cada 10 segundos
      };

      this.stopVideoCycling = () => {
        if (this.cycleInterval) {
          clearInterval(this.cycleInterval);
          this.cycleInterval = null;
        }
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

      this.nextVideo = () => {
        this.currentVideoIndex =
          (this.currentVideoIndex + 1) % this.videos.length;
        this.showCurrentVideo();
      };

      this.setVideo = (index) => {
        if (index >= 0 && index < this.videos.length) {
          this.currentVideoIndex = index;
          this.showCurrentVideo();
        }
      };

      // Expose methods globally for easy access
      window.casanare2VideoCycler = this;
    },

    remove() {
      this.stopVideoCycling();
    },
  });
}
