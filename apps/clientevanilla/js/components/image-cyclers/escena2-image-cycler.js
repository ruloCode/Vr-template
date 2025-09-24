/**
 * Escena 2 - Petroleo Image Cycler Component
 * A-Frame component for automatic image cycling in Scene 2
 */

export function registerEscena2ImageCycler() {
  AFRAME.registerComponent("escena2-image-cycler", {
    init() {
      this.isVisible = false;
      this.currentImageIndex = 0;
      this.images = [
        "#escena_2.1-image",
        "#escena_2.2-image",
        "#escena_2.3-image",
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
      window.petroleoImageCycler = this;
    },

    remove() {
      this.stopImageCycling();
    },
  });
}