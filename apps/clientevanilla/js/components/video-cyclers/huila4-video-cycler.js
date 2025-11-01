/**
 * Huila 4 - Video Cycler Component (A)
 * A-Frame component for automatic video cycling in Huila Scene 4 (3 videos)
 */

export function registerHuila4VideoCycler() {
  AFRAME.registerComponent("huila4-video-cycler", {
    init() {
      this.isVisible = false;
      this.currentVideoIndex = 0;
      this.videos = [
        "#huila4-1-video",
        "#huila4-2-video",
        "#huila4-3-video",
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

      window.huila4VideoCycler = this;
    },

    remove() {
      this.stopVideoCycling();
    },
  });
}

