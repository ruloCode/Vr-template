/**
 * Huila 5 - Video Cycler Component (B)
 * A-Frame component for automatic video cycling in Huila Scene 5 (1 video)
 */

export function registerHuila5VideoCyclerB() {
  AFRAME.registerComponent("huila5-video-cycler-b", {
    init() {
      this.isVisible = false;
      this.currentVideoIndex = 0;
      this.videos = ["#huila5-4-video"];
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
        }, 10000);
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

        const videoElement = document.querySelector(videoSrc);
        if (videoElement) {
          videoElement.currentTime = 5;
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

      window.huila5VideoCyclerB = this;
    },

    remove() {
      this.stopVideoCycling();
    },
  });
}

