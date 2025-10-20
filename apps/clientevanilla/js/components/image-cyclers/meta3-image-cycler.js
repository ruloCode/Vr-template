/**
 * Meta 3 - Image Cycler Component
 * A-Frame component for image display in Meta Scene 3
 */

export function registerMeta3ImageCycler() {
  AFRAME.registerComponent("meta3-image-cycler", {
    init() {
      this.isVisible = false;
      this.currentImageIndex = 0;
      this.images = [
        "#meta3-3-image",
      ];
      this.cycleInterval = null;

      this.show = () => {
        this.el.setAttribute("visible", "true");
        this.isVisible = true;
        this.showCurrentImage();
      };

      this.hide = () => {
        this.el.setAttribute("visible", "false");
        this.isVisible = false;
      };

      this.showCurrentImage = () => {
        const imageSrc = this.images[this.currentImageIndex];
        this.el.setAttribute("src", imageSrc);
      };

      // Expose methods globally for easy access
      window.meta3ImageCycler = this;
    },

    remove() {
      // No cycling for single image
    },
  });
}


