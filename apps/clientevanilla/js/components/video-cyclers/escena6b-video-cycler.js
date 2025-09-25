/**
 * Escena 6B - Video Cycler Component
 * A-Frame component for automatic video cycling in Scene 6B
 */

export function registerEscena6bVideoCycler() {
  AFRAME.registerComponent("escena6b-video-cycler", {
    init() {
      this.isVisible = false;
      this.currentVideoIndex = 0;
      this.videos = ["#escena6-1-video", "#escena6-2-video"];
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

          // Ensure video is muted for autoplay
          videoElement.muted = true;
          videoElement.volume = 0;

          // When video ends, play next video
          videoElement.onended = () => {
            this.nextVideo();
          };

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

      this.nextVideo = () => {
        this.currentVideoIndex =
          (this.currentVideoIndex + 1) % this.videos.length;
        this.playCurrentVideo();
      };

      // Expose methods globally for easy access
      window.escena6BVideoCycler = this;
    },

    remove() {
      this.stopVideoPlayback();
    },
  });
}