/**
 * Escena 2 - Petroleo Image Cycler Component - OPTIMIZED
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
        // OPTIMIZED: Use object3D.visible for faster rendering
        if (this.el.object3D) {
          this.el.object3D.visible = true;
        }
        this.el.setAttribute("visible", "true");
        this.isVisible = true;
        this.startImageCycling();
      };

      this.hide = () => {
        // OPTIMIZED: Stop cycling immediately
        this.stopImageCycling();

        // OPTIMIZED: Use object3D.visible for faster rendering
        if (this.el.object3D) {
          this.el.object3D.visible = false;
        }
        this.el.setAttribute("visible", "false");
        this.isVisible = false;
      };

      this.startImageCycling = () => {
        this.showCurrentImage();
        // OPTIMIZED: Reduced from 3s to 2.5s
        this.cycleInterval = setInterval(() => {
          this.nextImage();
        }, 2500);
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

        // OPTIMIZED: Force material update for immediate rendering
        if (this.el.getObject3D && this.el.getObject3D("mesh")) {
          const mesh = this.el.getObject3D("mesh");
          if (mesh.material) {
            mesh.material.needsUpdate = true;
          }
        }
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