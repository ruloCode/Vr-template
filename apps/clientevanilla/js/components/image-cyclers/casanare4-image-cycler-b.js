/**
 * Casanare 4 - Image Cycler B Component
 * A-Frame component for automatic image cycling in Casanare Scene 4 - Screen B
 */

export function registerCasanare4ImageCyclerB() {
  AFRAME.registerComponent("casanare4-image-cycler-b", {
    init() {
      this.isVisible = false;
      this.currentImageIndex = 0;
      this.images = [
        "#casanare4-4-image",
        "#casanare4-5-image",
        "#casanare4-6-image",
      ];
      this.cycleInterval = null;

      this.show = () => {
        console.log("🖼️ Casanare4 Image Cycler B: show() called");
        this.el.setAttribute("visible", "true");
        this.isVisible = true;
        this.startImageCycling();
      };

      this.hide = () => {
        this.el.setAttribute("visible", "false");
        this.isVisible = false;
        this.stopImageCycling();
      };

      this.startImageCycling = () => {
        console.log("🖼️ Casanare4 Image Cycler B: startImageCycling() called");
        this.showCurrentImage();
        this.cycleInterval = setInterval(() => {
          this.nextImage();
        }, 8000); // Cambiar imagen cada 8 segundos
      };

      this.stopImageCycling = () => {
        if (this.cycleInterval) {
          clearInterval(this.cycleInterval);
          this.cycleInterval = null;
        }
      };

      this.showCurrentImage = () => {
        const imageSrc = this.images[this.currentImageIndex];
        console.log("🖼️ Casanare4 Image Cycler B: showing image", imageSrc, "at index", this.currentImageIndex);
        this.el.setAttribute("src", imageSrc);
      };

      this.nextImage = () => {
        this.currentImageIndex =
          (this.currentImageIndex + 1) % this.images.length;
        this.showCurrentImage();
      };

      this.setImage = (index) => {
        if (index >= 0 && index < this.images.length) {
          this.currentImageIndex = index;
          this.showCurrentImage();
        }
      };

      // Expose methods globally for easy access
      window.casanare4ImageCyclerB = this;
    },

    remove() {
      this.stopImageCycling();
    },
  });
}
