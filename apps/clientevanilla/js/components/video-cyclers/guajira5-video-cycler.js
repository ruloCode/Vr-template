/**
 * Guajira 5 - Video Cycler Component
 * A-Frame component for automatic video cycling in Guajira Scene 5
 */

export function registerGuajira5VideoCycler() {
  AFRAME.registerComponent("guajira5-video-cycler", {
    init() {
      this.isVisible = false;
      this.currentVideoIndex = 0;
      this.videos = [
        "#guajira5-1-video",
        "#guajira5-2-video",
        "#guajira5-3-video",
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
        }, 12000); // Cambiar video cada 12 segundos
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

        // Play the video
        const videoElement = document.querySelector(videoSrc);
        if (videoElement) {
          videoElement.currentTime = 0;
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
      window.guajira5VideoCycler = this;
    },

    remove() {
      this.stopVideoCycling();
    },
  });
}
