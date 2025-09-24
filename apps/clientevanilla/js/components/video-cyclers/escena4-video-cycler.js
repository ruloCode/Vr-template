/**
 * Escena 4 - Video Cycler Component
 * A-Frame component for automatic video cycling in Scene 4
 */

export function registerEscena4VideoCycler() {
  AFRAME.registerComponent("escena4-video-cycler", {
    init() {
      this.isVisible = false;
      this.currentVideoIndex = 0;
      this.videos = ["#escena4-1-video", "#escena4-2-video"];
      this.currentVideo = null;

      this.show = () => {
        this.el.setAttribute("visible", "true");
        this.isVisible = true;
        // Small delay to ensure videos are loaded
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
        this.playCurrentVideo();
      };

      this.stopVideoPlayback = () => {
        if (this.currentVideo) {
          this.currentVideo.pause();
          this.currentVideo.currentTime = 0;
        }
      };

      this.playCurrentVideo = () => {
        const videoSrc = this.videos[this.currentVideoIndex];
        this.el.setAttribute("src", videoSrc);

        // Get the video element and set up event listeners
        this.currentVideo = document.querySelector(videoSrc);
        if (this.currentVideo) {
          // Remove any existing event listeners
          this.currentVideo.removeEventListener(
            "ended",
            this.onVideoEnded
          );

          // Add new event listener
          this.onVideoEnded = () => {
            this.nextVideo();
          };
          this.currentVideo.addEventListener("ended", this.onVideoEnded);

          // Start playing the video
          this.currentVideo.play();
        }
      };

      this.nextVideo = () => {
        this.currentVideoIndex =
          (this.currentVideoIndex + 1) % this.videos.length;
        this.playCurrentVideo();
      };

      // Expose methods globally for easy access
      window.escena4VideoCycler = this;
    },

    remove() {
      this.stopVideoPlayback();
    },
  });
}