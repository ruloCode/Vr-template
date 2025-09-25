/**
 * Intelligent Asset Preloader for VR Experience
 * Optimizes loading order and provides progress tracking
 */

export class AssetPreloader {
  constructor() {
    this.preloadQueue = [];
    this.loadedAssets = new Set();
    this.loadingAssets = new Map(); // url -> Promise
    this.progress = {
      total: 0,
      loaded: 0,
      failed: 0,
      currentAsset: null
    };
    this.listeners = new Set();

    // Priority levels
    this.PRIORITY = {
      CRITICAL: 1,    // Current scene assets
      HIGH: 2,        // Next scene assets
      MEDIUM: 3,      // Next 2-3 scenes
      LOW: 4          // Background preloading
    };

    // Asset type configurations
    this.ASSET_CONFIG = {
      images: {
        crossOrigin: 'anonymous',
        timeout: 30000
      },
      videos: {
        preload: 'metadata',
        timeout: 60000,
        muted: true,
        playsInline: true
      },
      audio: {
        crossOrigin: 'anonymous',
        timeout: 20000
      }
    };

    // Preload strategy based on connection
    this.connectionStrategy = this.getConnectionStrategy();

    this.init();
  }

  init() {
    // Monitor connection changes
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        this.connectionStrategy = this.getConnectionStrategy();
        this.adjustPreloadingStrategy();
      });
    }

    // Monitor memory pressure
    this.monitorMemoryPressure();

    console.log('📦 AssetPreloader initialized with strategy:', this.connectionStrategy);
  }

  /**
   * Get preloading strategy based on connection
   */
  getConnectionStrategy() {
    if (!('connection' in navigator)) {
      return 'moderate'; // Default for unknown connections
    }

    const connection = navigator.connection;
    const effectiveType = connection.effectiveType;
    const downlink = connection.downlink;

    // Aggressive preloading for fast connections
    if (effectiveType === '4g' && downlink > 10) {
      return 'aggressive';
    }

    // Conservative for slow connections
    if (effectiveType === '2g' || downlink < 1.5) {
      return 'conservative';
    }

    return 'moderate';
  }

  /**
   * Adjust preloading based on current strategy
   */
  adjustPreloadingStrategy() {
    const strategy = this.connectionStrategy;

    switch (strategy) {
      case 'aggressive':
        this.maxConcurrent = 6;
        this.preloadDistance = 3; // Preload 3 scenes ahead
        break;
      case 'moderate':
        this.maxConcurrent = 4;
        this.preloadDistance = 2; // Preload 2 scenes ahead
        break;
      case 'conservative':
        this.maxConcurrent = 2;
        this.preloadDistance = 1; // Only next scene
        break;
    }

    console.log(`📡 Preload strategy: ${strategy}, concurrent: ${this.maxConcurrent}, distance: ${this.preloadDistance}`);
  }

  /**
   * Monitor memory pressure and adjust accordingly
   */
  monitorMemoryPressure() {
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = performance.memory;
        const usedPercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

        if (usedPercentage > 85) {
          console.warn('⚠️ High memory usage detected:', usedPercentage.toFixed(1) + '%');
          this.pausePreloading();
        } else if (usedPercentage < 70 && this.isPaused) {
          console.log('✅ Memory usage normalized, resuming preload');
          this.resumePreloading();
        }
      };

      setInterval(checkMemory, 10000); // Check every 10 seconds
    }
  }

  /**
   * Add assets to preload queue
   */
  queueAssets(assets, priority = this.PRIORITY.MEDIUM) {
    assets.forEach(asset => {
      if (!this.loadedAssets.has(asset.url) && !this.isQueued(asset.url)) {
        this.preloadQueue.push({
          ...asset,
          priority,
          addedAt: Date.now()
        });
      }
    });

    // Sort by priority
    this.preloadQueue.sort((a, b) => a.priority - b.priority);
    this.progress.total = this.preloadQueue.length + this.loadedAssets.size;

    this.notifyProgress();
    this.processQueue();
  }

  /**
   * Queue scene assets with smart prioritization
   */
  queueSceneAssets(sceneId, priority = this.PRIORITY.MEDIUM) {
    const sceneConfig = window.SCENES_CONFIG[sceneId];
    if (!sceneConfig) {
      console.warn('⚠️ Scene config not found:', sceneId);
      return;
    }

    const assets = this.extractSceneAssets(sceneConfig, sceneId);
    this.queueAssets(assets, priority);

    console.log(`📋 Queued ${assets.length} assets for scene: ${sceneId} (priority: ${priority})`);
  }

  /**
   * Extract all assets from scene configuration
   */
  extractSceneAssets(sceneConfig, sceneId) {
    const assets = [];

    // Skybox image
    if (sceneConfig.assets.skybox) {
      assets.push({
        url: sceneConfig.assets.skybox,
        type: 'image',
        scene: sceneId,
        critical: true
      });
    }

    // Audio
    if (sceneConfig.assets.audio) {
      assets.push({
        url: sceneConfig.assets.audio,
        type: 'audio',
        scene: sceneId,
        critical: true
      });
    }

    // Extract screen assets from DOM
    const screenAssets = this.extractScreenAssets(sceneId);
    assets.push(...screenAssets);

    return assets;
  }

  /**
   * Extract screen assets (videos/images) for specific scene
   */
  extractScreenAssets(sceneId) {
    const assets = [];
    const sceneNumber = sceneId.replace('escena-', '');

    // Query selectors for scene-specific assets
    const selectors = [
      `#escena${sceneNumber}-screen`,
      `#escena${sceneNumber}B-screen`,
      `img[id*="escena${sceneNumber}"]`,
      `img[id*="escena_${sceneNumber}"]`,
      `video[id*="escena${sceneNumber}"]`
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const src = el.src || el.getAttribute('src');
        if (src && !src.startsWith('#')) {
          assets.push({
            url: src,
            type: el.tagName.toLowerCase() === 'video' ? 'video' : 'image',
            scene: sceneId,
            element: el
          });
        }
      });
    });

    return assets;
  }

  /**
   * Process the preload queue
   */
  async processQueue() {
    if (this.isPaused || this.loadingAssets.size >= this.maxConcurrent) {
      return;
    }

    const asset = this.preloadQueue.shift();
    if (!asset) {
      return;
    }

    this.progress.currentAsset = asset.url;
    this.notifyProgress();

    try {
      const loadPromise = this.loadAsset(asset);
      this.loadingAssets.set(asset.url, loadPromise);

      await loadPromise;

      this.loadedAssets.add(asset.url);
      this.progress.loaded++;

      console.log(`✅ Asset loaded: ${asset.url} (${this.progress.loaded}/${this.progress.total})`);

    } catch (error) {
      console.error(`❌ Failed to load asset: ${asset.url}`, error);
      this.progress.failed++;
    } finally {
      this.loadingAssets.delete(asset.url);
      this.notifyProgress();

      // Continue processing queue
      setTimeout(() => this.processQueue(), 10);
    }
  }

  /**
   * Load individual asset based on type
   */
  async loadAsset(asset) {
    const { url, type } = asset;
    const config = this.ASSET_CONFIG[type + 's'] || {};

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout loading ${url}`));
      }, config.timeout || 30000);

      const cleanup = () => clearTimeout(timeout);

      switch (type) {
        case 'image':
          const img = new Image();
          if (config.crossOrigin) {
            img.crossOrigin = config.crossOrigin;
          }

          img.onload = () => {
            cleanup();
            // Store in cache or update existing element
            this.updateAssetElement(asset, img);
            resolve(img);
          };

          img.onerror = () => {
            cleanup();
            reject(new Error(`Failed to load image: ${url}`));
          };

          img.src = url;
          break;

        case 'video':
          const video = document.createElement('video');
          Object.assign(video, config);

          video.onloadedmetadata = () => {
            cleanup();
            this.updateAssetElement(asset, video);
            resolve(video);
          };

          video.onerror = () => {
            cleanup();
            reject(new Error(`Failed to load video: ${url}`));
          };

          video.src = url;
          break;

        case 'audio':
          const audio = new Audio();
          if (config.crossOrigin) {
            audio.crossOrigin = config.crossOrigin;
          }

          audio.oncanplaythrough = () => {
            cleanup();
            this.updateAssetElement(asset, audio);
            resolve(audio);
          };

          audio.onerror = () => {
            cleanup();
            reject(new Error(`Failed to load audio: ${url}`));
          };

          audio.src = url;
          break;

        default:
          cleanup();
          reject(new Error(`Unknown asset type: ${type}`));
      }
    });
  }

  /**
   * Update DOM element with loaded asset
   */
  updateAssetElement(asset, loadedElement) {
    if (asset.element) {
      // Update existing element attributes if needed
      if (loadedElement.tagName === 'VIDEO' && asset.element.tagName === 'VIDEO') {
        // Video is already loaded and ready
        asset.element.preload = 'metadata';
      }
    }

    // Store reference for future use
    this.cachedAssets = this.cachedAssets || new Map();
    this.cachedAssets.set(asset.url, loadedElement);
  }

  /**
   * Check if asset is already queued
   */
  isQueued(url) {
    return this.preloadQueue.some(asset => asset.url === url);
  }

  /**
   * Preload current scene and nearby scenes
   */
  async preloadCurrentAndNearbyScenes(currentSceneId) {
    console.log('🎯 Preloading current and nearby scenes for:', currentSceneId);

    // Get scene sequence
    const sceneIds = Object.keys(window.SCENES_CONFIG);
    const currentIndex = sceneIds.indexOf(currentSceneId);

    if (currentIndex === -1) {
      console.warn('⚠️ Current scene not found in sequence');
      return;
    }

    // Current scene - CRITICAL priority
    this.queueSceneAssets(currentSceneId, this.PRIORITY.CRITICAL);

    // Next scenes based on strategy
    for (let i = 1; i <= this.preloadDistance; i++) {
      const nextIndex = currentIndex + i;
      if (nextIndex < sceneIds.length) {
        const priority = i === 1 ? this.PRIORITY.HIGH : this.PRIORITY.MEDIUM;
        this.queueSceneAssets(sceneIds[nextIndex], priority);
      }
    }

    // Previous scene (in case user goes back)
    if (currentIndex > 0) {
      this.queueSceneAssets(sceneIds[currentIndex - 1], this.PRIORITY.HIGH);
    }
  }

  /**
   * Force preload critical assets for immediate scene
   */
  async preloadCriticalAssets(sceneId) {
    console.log('⚡ Force preloading critical assets for:', sceneId);

    const sceneConfig = window.SCENES_CONFIG[sceneId];
    if (!sceneConfig) return;

    const criticalAssets = [];

    // Skybox and audio are always critical
    if (sceneConfig.assets.skybox) {
      criticalAssets.push({
        url: sceneConfig.assets.skybox,
        type: 'image',
        scene: sceneId,
        critical: true
      });
    }

    if (sceneConfig.assets.audio) {
      criticalAssets.push({
        url: sceneConfig.assets.audio,
        type: 'audio',
        scene: sceneId,
        critical: true
      });
    }

    // Load critical assets immediately
    const loadPromises = criticalAssets.map(asset => this.loadAsset(asset));

    try {
      await Promise.all(loadPromises);
      console.log('✅ Critical assets preloaded for scene:', sceneId);
      return true;
    } catch (error) {
      console.error('❌ Failed to preload critical assets:', error);
      return false;
    }
  }

  /**
   * Pause preloading (e.g., during high memory usage)
   */
  pausePreloading() {
    this.isPaused = true;
    console.log('⏸️ Preloading paused');
  }

  /**
   * Resume preloading
   */
  resumePreloading() {
    this.isPaused = false;
    console.log('▶️ Preloading resumed');
    this.processQueue();
  }

  /**
   * Clear preload queue
   */
  clearQueue() {
    this.preloadQueue.length = 0;
    this.progress.total = this.loadedAssets.size;
    this.progress.currentAsset = null;
    this.notifyProgress();
    console.log('🗑️ Preload queue cleared');
  }

  /**
   * Get preload progress
   */
  getProgress() {
    const total = this.progress.total;
    const completed = this.progress.loaded + this.progress.failed;

    return {
      ...this.progress,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      remaining: Math.max(0, total - completed),
      isComplete: completed >= total && total > 0
    };
  }

  /**
   * Add progress listener
   */
  onProgress(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify progress listeners
   */
  notifyProgress() {
    const progress = this.getProgress();
    this.listeners.forEach(listener => {
      try {
        listener(progress);
      } catch (error) {
        console.error('❌ Progress listener error:', error);
      }
    });
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      loaded: this.loadedAssets.size,
      queued: this.preloadQueue.length,
      loading: this.loadingAssets.size,
      strategy: this.connectionStrategy,
      maxConcurrent: this.maxConcurrent,
      preloadDistance: this.preloadDistance,
      isPaused: this.isPaused
    };
  }
}

// Create and export singleton instance
export const assetPreloader = new AssetPreloader();

// Global access for debugging
window.assetPreloader = assetPreloader;

console.log('📦 Asset Preloader module loaded');