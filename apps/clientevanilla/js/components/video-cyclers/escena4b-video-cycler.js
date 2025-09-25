/**
 * Escena 4B - Video Cycler Component (Multiple Videos)
 * A-Frame component for video cycling in Scene 4B, including videos from Scene 4
 */

export function registerEscena4bVideoCycler() {
  AFRAME.registerComponent("escena4b-video-cycler", {
    init() {
      this.isVisible = false;
      this.currentVideoIndex = 0;
      this.videos = [
        "#escena4-3-video",
        "#escena4-1-video",
        "#escena4-2-video",
      ];
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
          this.currentVideo.removeEventListener("ended", this.onVideoEnded);

          // Add new event listener
          this.onVideoEnded = () => {
            this.nextVideo();
          };
          this.currentVideo.addEventListener("ended", this.onVideoEnded);

          // Ensure video is muted for autoplay
          this.currentVideo.muted = true;
          this.currentVideo.volume = 0;

          // Wait for video to be ready before playing
          const playVideo = () => {
            this.currentVideo.currentTime = 0;
            this.currentVideo.play().catch((error) => {
              console.warn("Video playback failed, retrying:", error);
              // Retry with delay
              setTimeout(() => {
                this.currentVideo.muted = true;
                this.currentVideo.play().catch((retryError) => {
                  console.error(
                    "Second video play attempt failed:",
                    retryError
                  );
                });
              }, 1000);
            });
          };

          // Check if video is ready
          if (this.currentVideo.readyState >= 2) {
            playVideo();
          } else {
            this.currentVideo.addEventListener("loadeddata", playVideo, {
              once: true,
            });
            this.currentVideo.load();
          }
        }
      };

      this.nextVideo = () => {
        this.currentVideoIndex =
          (this.currentVideoIndex + 1) % this.videos.length;
        this.playCurrentVideo();
      };

      // Expose methods globally for easy access
      window.escena4BVideoCycler = this;
    },

    remove() {
      this.stopVideoPlayback();
    },
  });
}
