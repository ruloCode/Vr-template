/**
 * Casanare 2 - Image Cycler Component
 * A-Frame component for automatic image cycling in Casanare Scene 2
 */

export function registerCasanare2ImageCycler() {
  AFRAME.registerComponent("casanare2-image-cycler", {
    init() {
      this.isVisible = false;
      this.currentImageIndex = 0;
      this.images = [
        "#casanare2-1-image",
        "#casanare2-2-image",
        "#casanare2-3-image",
      ];
      this.cycleInterval = null;

      this.show = () => {
        console.log("🖼️ Casanare2 Image Cycler: show() called");
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
        console.log("🖼️ Casanare2 Image Cycler: startImageCycling() called");
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
        console.log("🖼️ Casanare2 Image Cycler: showing image", imageSrc, "at index", this.currentImageIndex);
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
      window.casanare2ImageCycler = this;
    },

    remove() {
      this.stopImageCycling();
    },
  });
}
