/**
 * Escena 7B - Video Cycler Component
 * A-Frame component for automatic video cycling in Scene 7B
 */

export function registerEscena7bVideoCycler() {
  AFRAME.registerComponent("escena7b-video-cycler", {
    init() {
      this.isVisible = false;
      this.currentVideoIndex = 0;
      this.videos = ["#escena7-1-video", "#escena7-2-video"];
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

        // Get the video element and play it
        const videoElement = document.querySelector(videoSrc);
        if (videoElement) {
          this.currentVideo = videoElement;
          videoElement.play().catch(console.error);

          // When video ends, play next video
          videoElement.onended = () => {
            this.nextVideo();
          };
        }
      };

      this.nextVideo = () => {
        this.currentVideoIndex =
          (this.currentVideoIndex + 1) % this.videos.length;
        this.playCurrentVideo();
      };

      // Expose methods globally for easy access
      window.escena7BVideoCycler = this;
    },

    remove() {
      this.stopVideoPlayback();
    },
  });
}