/**
 * Guajira 1 - Video Cycler Component - OPTIMIZED
 * A-Frame component for automatic video cycling in Guajira Scene 1
 */

export function registerGuajira1VideoCycler() {
  AFRAME.registerComponent("guajira1-video-cycler", {
    init() {
      this.isVisible = false;
      this.currentVideoIndex = 0;
      this.videos = ["#guajira1-1-video"];
      this.cycleInterval = null;

      this.show = () => {
        // OPTIMIZED: Use object3D.visible for faster rendering
        if (this.el.object3D) {
          this.el.object3D.visible = true;
        }
        this.el.setAttribute("visible", "true");
        this.isVisible = true;
        this.startVideoCycling();
      };

      this.hide = () => {
        // OPTIMIZED: Aggressive cleanup
        this.stopVideoCycling();

        // Pause and unload all videos
        this.videos.forEach(videoSrc => {
          const videoElement = document.querySelector(videoSrc);
          if (videoElement && !videoElement.paused) {
            videoElement.pause();
            videoElement.currentTime = 0;
            // OPTIMIZED: Unload video to free memory
            const originalSrc = videoElement.src;
            videoElement.removeAttribute('src');
            videoElement.load();
            videoElement.dataset.unloadedSrc = originalSrc;
          }
        });

        // OPTIMIZED: Use object3D.visible for faster rendering
        if (this.el.object3D) {
          this.el.object3D.visible = false;
        }
        this.el.setAttribute("visible", "false");
        this.isVisible = false;
      };

      this.startVideoCycling = () => {
        this.showCurrentVideo();
        // OPTIMIZED: Reduced from 10s to 8s
        this.cycleInterval = setInterval(() => {
          this.nextVideo();
        }, 8000);
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

        // Play the video muted (only narration audio should play)
        const videoElement = document.querySelector(videoSrc);
        if (videoElement) {
          // OPTIMIZED: Restore video if unloaded
          if (videoElement.dataset.unloadedSrc && !videoElement.src) {
            videoElement.src = videoElement.dataset.unloadedSrc;
            videoElement.load();
          }

          videoElement.currentTime = 5; // Start at 5 seconds (0:05)
          videoElement.muted = true; // Mute video audio
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
      window.guajira1VideoCycler = this;
    },

    remove() {
      this.stopVideoCycling();
      // OPTIMIZED: Full cleanup on remove
      this.videos.forEach(videoSrc => {
        const videoElement = document.querySelector(videoSrc);
        if (videoElement) {
          videoElement.pause();
          videoElement.removeAttribute('src');
          videoElement.load();
        }
      });
    },
  });
}
