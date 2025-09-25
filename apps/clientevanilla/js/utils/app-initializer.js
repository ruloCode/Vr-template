/**
 * App Initializer - Coordinates startup and optimization systems
 * Manages Service Worker, preloading, and initial app state
 */

import { assetPreloader } from './asset-preloader.js';
import { cacheManager } from './cache-manager.js';

export class AppInitializer {
  constructor() {
    this.initialized = false;
    this.serviceWorkerReady = false;
    this.assetsPreloaded = false;
    this.startTime = Date.now();

    // Load asset manifest
    this.manifest = null;
    this.loadManifest();
  }

  /**
   * Load asset manifest with asset information
   */
  async loadManifest() {
    try {
      const response = await fetch('/asset-manifest.json');
      if (response.ok) {
        this.manifest = await response.json();
        console.log('📋 Asset manifest loaded:', this.manifest.totalAssets, 'assets');
      }
    } catch (error) {
      console.warn('⚠️ Could not load asset manifest:', error);
      // Continue without manifest - fallback mode
    }
  }

  /**
   * Initialize the complete application
   */
  async initialize() {
    if (this.initialized) {
      console.warn('⚠️ App already initialized');
      return;
    }

    console.log('🚀 Initializing VR Ecopetrol App...');

    try {
      // Phase 1: Critical system initialization
      await this.initializeCriticalSystems();

      // Phase 2: Service Worker and caching
      await this.initializeServiceWorker();

      // Phase 3: Asset preloading
      await this.initializeAssetPreloading();

      // Phase 4: Application systems
      await this.initializeApp();

      this.initialized = true;
      const totalTime = Date.now() - this.startTime;

      console.log(`✅ App initialized successfully in ${totalTime}ms`);

      // Notify completion
      this.notifyInitializationComplete(totalTime);

    } catch (error) {
      console.error('❌ App initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize critical systems first
   */
  async initializeCriticalSystems() {
    console.log('⚡ Initializing critical systems...');

    // Wait for essential DOM elements
    await this.waitForCriticalElements();

    // Initialize cache manager
    await cacheManager.initPromise;

    console.log('✅ Critical systems ready');
  }

  /**
   * Initialize Service Worker
   */
  async initializeServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker not supported');
      return;
    }

    console.log('🔧 Initializing Service Worker...');

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      // Wait for Service Worker to be ready
      await navigator.serviceWorker.ready;

      this.serviceWorkerReady = true;
      console.log('✅ Service Worker ready:', registration.scope);

      // Set up message listener for SW communication
      this.setupServiceWorkerMessages();

      // Request preload of critical assets
      if (this.manifest) {
        const criticalAssets = this.manifest.preloadStrategies.critical;
        if (criticalAssets.length > 0) {
          this.sendMessageToSW({
            type: 'PRELOAD_ASSETS',
            assets: criticalAssets
          });
        }
      }

    } catch (error) {
      console.error('❌ Service Worker initialization failed:', error);
      // Continue without Service Worker
    }
  }

  /**
   * Set up Service Worker message handling
   */
  setupServiceWorkerMessages() {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, data } = event.data;

      switch (type) {
        case 'SW_ACTIVATED':
          console.log('🚀 Service Worker activated');
          break;

        case 'PRELOAD_COMPLETE':
          console.log('✅ Service Worker preload completed');
          this.onServiceWorkerPreloadComplete(data);
          break;

        case 'CACHE_STATUS_RESPONSE':
          this.onCacheStatusResponse(data);
          break;

        case 'CACHE_CLEARED':
          console.log('🗑️ Cache cleared by Service Worker');
          break;

        default:
          console.log('📨 Service Worker message:', type, data);
      }
    });
  }

  /**
   * Send message to Service Worker
   */
  sendMessageToSW(message) {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  }

  /**
   * Initialize asset preloading system
   */
  async initializeAssetPreloading() {
    console.log('📦 Initializing asset preloading...');

    // Start preloading critical assets
    if (this.manifest) {
      // Queue assets from manifest
      this.queueAssetsFromManifest();
    } else {
      // Fallback - queue basic critical assets
      this.queueFallbackAssets();
    }

    // Set up progress monitoring
    this.monitorPreloadProgress();

    console.log('✅ Asset preloading initialized');
  }

  /**
   * Queue assets from manifest
   */
  queueAssetsFromManifest() {
    if (!this.manifest) return;

    const strategies = this.manifest.preloadStrategies;

    // Queue critical assets first
    if (strategies.critical && strategies.critical.length > 0) {
      const criticalAssets = strategies.critical.map(url => ({
        url,
        type: this.getAssetTypeFromUrl(url),
        critical: true
      }));

      assetPreloader.queueAssets(criticalAssets, assetPreloader.PRIORITY.CRITICAL);
    }

    // Queue aggressive preload assets
    if (strategies.aggressive && strategies.aggressive.length > 0) {
      const aggressiveAssets = strategies.aggressive.map(url => ({
        url,
        type: this.getAssetTypeFromUrl(url)
      }));

      assetPreloader.queueAssets(aggressiveAssets, assetPreloader.PRIORITY.HIGH);
    }
  }

  /**
   * Queue fallback assets if manifest not available
   */
  queueFallbackAssets() {
    const fallbackAssets = [
      { url: '/images/base.jpg', type: 'image', critical: true },
      { url: '/audio/toma_01.mp3', type: 'audio', critical: true },
      { url: '/images/escena_1.png', type: 'image' },
      { url: '/images/escena_2.png', type: 'image' }
    ];

    assetPreloader.queueAssets(fallbackAssets, assetPreloader.PRIORITY.CRITICAL);
  }

  /**
   * Monitor preload progress
   */
  monitorPreloadProgress() {
    assetPreloader.onProgress((progress) => {
      this.updateGlobalProgress(progress);

      // Consider preloading complete when critical assets are done
      if (progress.percentage >= 100 && !this.assetsPreloaded) {
        this.assetsPreloaded = true;
        this.onAssetPreloadComplete();
      }
    });
  }

  /**
   * Update global progress indicators
   */
  updateGlobalProgress(progress) {
    // Update any global progress indicators
    window.dispatchEvent(new CustomEvent('app-progress', {
      detail: {
        type: 'asset-preload',
        progress: progress.percentage,
        loaded: progress.loaded,
        total: progress.total,
        currentAsset: progress.currentAsset
      }
    }));
  }

  /**
   * Initialize main application after critical loading
   */
  async initializeApp() {
    console.log('🎯 Initializing main application...');

    // Wait for A-Frame to be ready
    await this.waitForAFrame();

    // Initialize VR scene manager and other systems
    // This is handled by the main app.js module

    console.log('✅ Main application initialized');
  }

  /**
   * Wait for critical DOM elements
   */
  async waitForCriticalElements() {
    const requiredElements = ['#app-loading', 'a-scene'];

    for (const selector of requiredElements) {
      await this.waitForElement(selector);
    }
  }

  /**
   * Wait for A-Frame to be loaded and ready
   */
  async waitForAFrame() {
    return new Promise((resolve) => {
      if (typeof AFRAME !== 'undefined') {
        // A-Frame already loaded
        resolve();
        return;
      }

      // Wait for A-Frame to load
      const checkAFrame = () => {
        if (typeof AFRAME !== 'undefined') {
          resolve();
        } else {
          setTimeout(checkAFrame, 100);
        }
      };

      checkAFrame();
    });
  }

  /**
   * Wait for specific DOM element to exist
   */
  async waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Timeout fallback
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element not found: ${selector}`));
      }, timeout);
    });
  }

  /**
   * Get asset type from URL
   */
  getAssetTypeFromUrl(url) {
    const extension = url.split('.').pop().toLowerCase();

    if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
      return 'image';
    }
    if (['mp4', 'webm', 'mov'].includes(extension)) {
      return 'video';
    }
    if (['mp3', 'wav', 'ogg'].includes(extension)) {
      return 'audio';
    }

    return 'unknown';
  }

  /**
   * Handle Service Worker preload completion
   */
  onServiceWorkerPreloadComplete(data) {
    console.log('✅ Service Worker preload completed:', data);

    // Update our preload progress
    if (data && data.assets) {
      data.assets.forEach(assetUrl => {
        assetPreloader.loadedAssets.add(assetUrl);
      });
    }
  }

  /**
   * Handle cache status response
   */
  onCacheStatusResponse(data) {
    console.log('📊 Cache status:', data.status);

    // Store cache status for debugging
    window.cacheStatus = data.status;
  }

  /**
   * Handle asset preload completion
   */
  onAssetPreloadComplete() {
    console.log('✅ Asset preloading completed');

    // Notify the application that assets are ready
    window.dispatchEvent(new CustomEvent('assets-ready'));

    // Enable any features that depend on preloaded assets
    this.enableAssetDependentFeatures();
  }

  /**
   * Enable features that depend on preloaded assets
   */
  enableAssetDependentFeatures() {
    // Mark that assets are ready for scene manager
    window.assetsReady = true;

    // Enable any UI elements that were waiting for assets
    document.body.classList.add('assets-ready');
  }

  /**
   * Notify that initialization is complete
   */
  notifyInitializationComplete(totalTime) {
    // Dispatch event for other systems to listen to
    window.dispatchEvent(new CustomEvent('app-initialized', {
      detail: {
        totalTime,
        serviceWorkerReady: this.serviceWorkerReady,
        assetsPreloaded: this.assetsPreloaded,
        manifest: this.manifest
      }
    }));

    // Global flag for debugging
    window.appInitialized = true;
  }

  /**
   * Get initialization status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      serviceWorkerReady: this.serviceWorkerReady,
      assetsPreloaded: this.assetsPreloaded,
      totalTime: Date.now() - this.startTime,
      manifest: !!this.manifest
    };
  }

  /**
   * Force clear all caches (for debugging/maintenance)
   */
  async clearAllCaches() {
    console.log('🧹 Clearing all caches...');

    try {
      // Clear IndexedDB cache
      await cacheManager.clearAll();

      // Clear Service Worker caches
      if (this.serviceWorkerReady) {
        this.sendMessageToSW({ type: 'CLEAR_CACHE' });
      }

      // Clear asset preloader
      assetPreloader.clearQueue();

      console.log('✅ All caches cleared');
      return true;

    } catch (error) {
      console.error('❌ Error clearing caches:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const stats = {
        indexedDB: await cacheManager.getStats(),
        assetPreloader: assetPreloader.getStats(),
        serviceWorker: null
      };

      // Request Service Worker cache stats
      if (this.serviceWorkerReady) {
        const channel = new MessageChannel();
        this.sendMessageToSW({ type: 'GET_CACHE_STATUS' });
        // SW will respond via message event
      }

      return stats;

    } catch (error) {
      console.error('❌ Error getting cache stats:', error);
      return null;
    }
  }
}

// Create and export singleton instance
export const appInitializer = new AppInitializer();

// Global access for debugging
window.appInitializer = appInitializer;

console.log('🏗️ App Initializer loaded');