/**
 * Guajira 10 - Image Cycler Component
 * A-Frame component for automatic image cycling in Guajira Scene 10
 */

export function registerGuajira10ImageCycler() {
  AFRAME.registerComponent("guajira10-image-cycler", {
    init() {
      this.isVisible = false;
      this.currentImageIndex = 0;
      this.images = [
        "#guajira10-1-image",
        "#guajira10-2-image",
        "#guajira10-3-image",
        "#guajira10-4-image",
        "#guajira10-5-image",
        "#guajira10-6-image",
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
        }, 3500); // Cambiar imagen cada 3.5 segundos
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
      window.guajira10ImageCycler = this;
    },

    remove() {
      this.stopImageCycling();
    },
  });
}
