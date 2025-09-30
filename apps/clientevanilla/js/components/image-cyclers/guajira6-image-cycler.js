/**
 * Guajira 6 - Image Cycler Component
 * A-Frame component for automatic image cycling in Guajira Scene 6
 */

export function registerGuajira6ImageCycler() {
  AFRAME.registerComponent("guajira6-image-cycler", {
    init() {
      this.isVisible = false;
      this.currentImageIndex = 0;
      this.images = [
        "#guajira6-1-image",
        "#guajira6-2-image",
        "#guajira6-3-image",
        "#guajira6-4-image",
        "#guajira6-5-image",
        "#guajira6-6-image",
      ];
      this.cycleInterval = null;

      this.show = () => {
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
        this.showCurrentImage();
        this.cycleInterval = setInterval(() => {
          this.nextImage();
        }, 3000); // Cambiar imagen cada 3 segundos
      };

      this.stopImageCycling = () => {
        if (this.cycleInterval) {
          clearInterval(this.cycleInterval);
          this.cycleInterval = null;
        }
      };

      this.showCurrentImage = () => {
        const imageSrc = this.images[this.currentImageIndex];
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
      window.guajira6ImageCycler = this;
    },

    remove() {
      this.stopImageCycling();
    },
  });
}
