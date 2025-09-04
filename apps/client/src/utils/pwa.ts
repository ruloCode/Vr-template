import { logger } from "./logger";

export class PWAManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;

  constructor() {
    this.setupServiceWorker();
    this.setupInstallPrompt();
  }

  private async setupServiceWorker(): Promise<void> {
    if (!("serviceWorker" in navigator)) {
      logger.warn("⚠️ Service Worker no soportado");
      return;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      logger.info("✅ Service Worker registrado");

      // Check for updates
      this.registration.addEventListener("updatefound", () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              this.updateAvailable = true;
              this.notifyUpdateAvailable();
            }
          });
        }
      });

      // Listen for waiting service worker
      if (this.registration.waiting) {
        this.updateAvailable = true;
        this.notifyUpdateAvailable();
      }

      // Listen for controlling service worker change
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        logger.info("🔄 Nueva versión del Service Worker activa");
        // Don't auto-reload, let user decide when to update
        this.notifyUpdateAvailable();
      });

      // Periodic update check (less frequent to avoid constant reloads)
      setInterval(() => {
        this.checkForUpdates();
      }, 300000); // Check every 5 minutes instead of every minute
    } catch (error) {
      logger.error("❌ Error registrando Service Worker:", error);
    }
  }

  private setupInstallPrompt(): void {
    let deferredPrompt: any = null;

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      logger.info("📱 PWA installation prompt available");
      this.showInstallBanner();
    });

    window.addEventListener("appinstalled", () => {
      logger.info("📱 PWA instalada exitosamente");
      deferredPrompt = null;
      this.hideInstallBanner();
    });

    // Expose install function globally
    (window as any).installPWA = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === "accepted") {
            logger.info("👍 Usuario aceptó instalar PWA");
          } else {
            logger.info("👎 Usuario rechazó instalar PWA");
          }
          deferredPrompt = null;
        });
      }
    };
  }

  private async checkForUpdates(): Promise<void> {
    if (this.registration && !this.updateAvailable) {
      try {
        await this.registration.update();
        logger.debug("🔄 Verificando actualizaciones...");
      } catch (error) {
        logger.debug("🔄 No hay actualizaciones disponibles");
      }
    }
  }

  private notifyUpdateAvailable(): void {
    logger.info("🆕 Actualización disponible");

    // Create update notification
    const notification = document.createElement("div");
    notification.id = "pwa-update-notification";
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #007bff;
        color: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10001;
        max-width: 300px;
        font-family: system-ui, sans-serif;
      ">
        <div style="margin-bottom: 0.5rem; font-weight: bold;">
          🆕 Actualización Disponible
        </div>
        <div style="margin-bottom: 1rem; font-size: 0.9rem;">
          Una nueva versión está lista. Reinicia para aplicar.
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button onclick="window.applyPWAUpdate()" style="
            background: white;
            color: #007bff;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: bold;
          ">
            Actualizar
          </button>
          <button onclick="window.dismissPWAUpdate()" style="
            background: transparent;
            color: white;
            border: 1px solid white;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
          ">
            Después
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Expose update functions
    (window as any).applyPWAUpdate = () => {
      this.applyUpdate();
    };

    (window as any).dismissPWAUpdate = () => {
      notification.remove();
    };

    // Auto-dismiss after 30 seconds
    setTimeout(() => {
      if (document.getElementById("pwa-update-notification")) {
        notification.remove();
      }
    }, 30000);
  }

  private showInstallBanner(): void {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    const banner = document.createElement("div");
    banner.id = "pwa-install-banner";
    banner.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 10001;
        display: flex;
        align-items: center;
        gap: 1rem;
        font-family: system-ui, sans-serif;
      ">
        <div style="font-size: 2rem;">📱</div>
        <div style="flex: 1;">
          <div style="font-weight: bold; margin-bottom: 0.25rem;">
            Instalar VR Ecopetrol
          </div>
          <div style="font-size: 0.9rem; opacity: 0.9;">
            Instala la app para mejor rendimiento offline
          </div>
        </div>
        <button onclick="window.installPWA()" style="
          background: white;
          color: #667eea;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          font-size: 0.9rem;
        ">
          Instalar
        </button>
        <button onclick="window.dismissInstallBanner()" style="
          background: transparent;
          color: white;
          border: none;
          padding: 0.5rem;
          cursor: pointer;
          font-size: 1.5rem;
          line-height: 1;
        ">
          ×
        </button>
      </div>
    `;

    document.body.appendChild(banner);

    (window as any).dismissInstallBanner = () => {
      banner.remove();
      localStorage.setItem("pwa-install-dismissed", "true");
    };

    // Don't show again if previously dismissed
    if (localStorage.getItem("pwa-install-dismissed")) {
      banner.remove();
      return;
    }

    // Auto-dismiss after 1 minute
    setTimeout(() => {
      if (document.getElementById("pwa-install-banner")) {
        banner.remove();
      }
    }, 60000);
  }

  private hideInstallBanner(): void {
    const banner = document.getElementById("pwa-install-banner");
    if (banner) {
      banner.remove();
    }
  }

  private applyUpdate(): void {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
  }

  public async getCacheInfo(): Promise<any> {
    if (!this.registration || !this.registration.active) {
      return null;
    }

    return new Promise((resolve) => {
      const channel = new MessageChannel();

      channel.port1.onmessage = (event) => {
        if (event.data.type === "CACHE_SIZE_RESULT") {
          resolve(event.data.cacheInfo);
        }
      };

      this.registration!.active!.postMessage({ type: "GET_CACHE_SIZE" }, [
        channel.port2,
      ]);

      // Timeout after 5 seconds
      setTimeout(() => resolve(null), 5000);
    });
  }

  public async clearCache(): Promise<void> {
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
      logger.info("🧹 Caché PWA limpiado");
    }
  }

  public isInstalled(): boolean {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    );
  }

  public isUpdateAvailable(): boolean {
    return this.updateAvailable;
  }
}

// Initialize PWA manager
export const pwaManager = new PWAManager();
