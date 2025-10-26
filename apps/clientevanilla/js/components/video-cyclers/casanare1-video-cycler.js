/**
 * Casanare 1 - Video Cycler Component
 * A-Frame component for automatic video cycling in Casanare Scene 1
 */

export function registerCasanare1VideoCycler() {
  AFRAME.registerComponent("casanare1-video-cycler", {
    init() {
      this.isVisible = false;
      this.currentVideoIndex = 0;
      this.videos = [
        "#casanare1-1-video",
        "#casanare1-2-video",
        "#casanare1-3-video",
        "#casanare1-4-video",
        "#casanare1-5-video",
      ];
      this.cycleInterval = null;

      this.show = () => {
        console.log("🎬 Casanare1 Video Cycler: show() called");
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
        console.log("🎬 Casanare1 Video Cycler: showing video", videoSrc, "at index", this.currentVideoIndex);
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
      window.casanare1VideoCycler = this;
    },

    remove() {
      this.stopVideoCycling();
    },
  });
}
