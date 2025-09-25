/**
 * Solar Video Cycler Component (Escena 1)
 * A-Frame component for automatic video cycling in Scene 1
 */

export function registerSolarVideoCycler() {
  AFRAME.registerComponent("solar-video-cycler", {
    init() {
      this.isVisible = false;
      this.currentVideoIndex = 0;
      this.videos = [
        "#solar-1-video",
        "#solar-2-video",
        "#solar-3-video",
      ];
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
          // Ensure video is muted for autoplay
          this.currentVideo.muted = true;
          this.currentVideo.volume = 0;

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

          // Wait for video to be ready before playing
          const playVideo = () => {
            this.currentVideo.currentTime = 0;
            this.currentVideo.play().catch((error) => {
              console.warn("Video playback failed, retrying:", error);
              // Try to load the video again
              this.currentVideo.load();
              setTimeout(() => {
                this.currentVideo.muted = true;
                this.currentVideo.play().catch((retryError) => {
                  console.error("Second video play attempt failed:", retryError);
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
        } else {
          console.error("Video element not found:", videoSrc);
        }
      };

      this.nextVideo = () => {
        this.currentVideoIndex =
          (this.currentVideoIndex + 1) % this.videos.length;
        this.playCurrentVideo();
      };

      this.setVideo = (index) => {
        if (index >= 0 && index < this.videos.length) {
          this.currentVideoIndex = index;
          this.playCurrentVideo();
        }
      };

      // Expose methods globally for easy access
      window.solarVideoCycler = this;
    },

    remove() {
      if (this.currentVideo && this.onVideoEnded) {
        this.currentVideo.removeEventListener("ended", this.onVideoEnded);
      }
    },
  });
}