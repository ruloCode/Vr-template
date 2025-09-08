import "aframe";
import { logger, captureError } from "@/utils/logger";
import { VRApp } from "@/components/VRApp";
import { useAppStore } from "@/store/appStore";
import { pwaManager } from "@/utils/pwa";

// Initialize the VR application
async function initializeApp() {
  try {
    logger.info("🚀 Iniciando VR Ecopetrol App");
    logger.info("📱 User Agent:", navigator.userAgent);
    logger.info("🌐 URL:", window.location.href);
    logger.info("📦 Version:", __VR_VERSION__);
    logger.info("🏗️ Build Time:", __BUILD_TIME__);
    logger.info("📲 PWA Installed:", pwaManager.isInstalled());
    logger.info("🔄 PWA Update Available:", pwaManager.isUpdateAvailable());

    // Check for required browser features
    if (!checkBrowserSupport()) {
      throw new Error("Browser no soportado para experiencia VR");
    }

    // Initialize the VR App
    const app = new VRApp();
    await app.initialize();

    // Expose app globally for debugging
    if (import.meta.env.DEV) {
      (window as any).VR_APP = app;
    }

    // Hide initial loader
    const loader = document.getElementById("initial-loader");
    if (loader) {
      loader.style.opacity = "0";
      setTimeout(() => loader.remove(), 500);
    }

    logger.info("✅ VR App inicializada exitosamente");
  } catch (error) {
    logger.error("❌ Error inicializando la aplicación:", error);
    captureError(error as Error, "app-initialization");
    showError(error as Error);
  }
}

function checkBrowserSupport(): boolean {
  const checks = {
    webgl: !!window.WebGLRenderingContext,
    webgl2: !!window.WebGL2RenderingContext,
    webAudio: !!(window.AudioContext || (window as any).webkitAudioContext),
    webSocket: !!window.WebSocket,
    fetch: !!window.fetch,
    promisesSupport: !!window.Promise,
    localStorageSupport: (() => {
      try {
        localStorage.setItem("test", "test");
        localStorage.removeItem("test");
        return true;
      } catch {
        return false;
      }
    })(),
    deviceOrientationSupport: "DeviceOrientationEvent" in window,
    fullscreenSupport: !!(
      document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled
    ),
  };

  logger.info("🔍 Browser Support Check:", checks);

  // Critical features
  const critical = [
    "webgl",
    "webAudio",
    "webSocket",
    "fetch",
    "promisesSupport",
  ];
  const missingCritical = critical.filter(
    (feature) => !checks[feature as keyof typeof checks]
  );

  if (missingCritical.length > 0) {
    logger.error("❌ Características críticas no soportadas:", missingCritical);
    return false;
  }

  // Warnings for non-critical features
  if (!checks.webgl2) {
    logger.warn("⚠️ WebGL2 no disponible, usando WebGL1");
  }

  if (!checks.deviceOrientationSupport) {
    logger.warn("⚠️ Device Orientation no disponible");
  }

  if (!checks.fullscreenSupport) {
    logger.warn("⚠️ Fullscreen API no disponible");
  }

  return true;
}

function showError(error: Error) {
  const app = document.getElementById("app");
  if (!app) return;

  const errorHtml = `
    <div class="error-container">
      <div class="error-title">❌ Error de Inicialización</div>
      <div class="error-message">
        <p>No se pudo cargar la experiencia VR:</p>
        <p><strong>${error.message}</strong></p>
        <p>Por favor, verifica que estés usando un navegador compatible y que tengas conexión estable.</p>
      </div>
      <div class="error-actions">
        <button class="btn btn-primary" onclick="window.location.reload()">
          🔄 Reintentar
        </button>
        <button class="btn btn-secondary" onclick="window.open('/dashboard', '_blank')">
          🎮 Abrir Dashboard
        </button>
      </div>
    </div>
  `;

  // Hide loader and show error
  const loader = document.getElementById("initial-loader");
  if (loader) {
    loader.remove();
  }

  app.innerHTML = errorHtml;
}

// Global error handlers
window.addEventListener("error", (event) => {
  logger.error("💥 Error global:", {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
  });
  captureError(event.error || new Error(event.message), "global-error");
});

window.addEventListener("unhandledrejection", (event) => {
  logger.error("💥 Promesa rechazada no manejada:", event.reason);
  captureError(
    event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason)),
    "unhandled-rejection"
  );
});

// Performance monitoring
if ("performance" in window) {
  window.addEventListener("load", () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      const navigationStart = perfData.fetchStart; // Use fetchStart instead of navigationStart
      logger.info("📊 Performance timing:", {
        domContentLoaded: Math.round(
          perfData.domContentLoadedEventEnd - navigationStart
        ),
        loadComplete: Math.round(perfData.loadEventEnd - navigationStart),
        firstPaint:
          performance.getEntriesByName("first-paint")[0]?.startTime || 0,
        firstContentfulPaint:
          performance.getEntriesByName("first-contentful-paint")[0]
            ?.startTime || 0,
      });
    }, 1000);
  });
}

// Expose global utilities for debugging
if (import.meta.env.DEV) {
  (window as any).VR_DEBUG = {
    logger,
    store: useAppStore,
    version: __VR_VERSION__,
    buildTime: __BUILD_TIME__,
    reconnectSocket: () => {
      // Función global para reconectar manualmente
      const app = (window as any).VR_APP;
      if (app && app.reconnectWebSocket) {
        app.reconnectWebSocket().catch(console.error);
      } else {
        console.warn("VR App no está disponible para reconexión");
      }
    },
  };

  logger.info(
    "🔧 Debug mode enabled. Use window.VR_DEBUG for debugging tools."
  );
}

// Start the application
initializeApp();
