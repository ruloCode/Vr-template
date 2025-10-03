/**
 * Advanced Cache Manager for VR Assets
 * Handles IndexedDB storage for large multimedia files
 */

export class CacheManager {
  constructor() {
    this.dbName = 'VRAssetsCache';
    this.dbVersion = 1;
    this.db = null;

    this.stores = {
      assets: 'assets',           // Binary asset data
      metadata: 'metadata',       // Asset metadata and hashes
      analytics: 'analytics'      // Usage statistics
    };

    // Cache size limits (in MB) - OPTIMIZED for lower memory usage
    this.limits = {
      maxTotalSize: 300,    // OPTIMIZED: 300MB total cache (reduced from 1GB)
      maxAssetSize: 50,     // OPTIMIZED: 50MB per asset (reduced from 100MB)
      lowStorageThreshold: 50 // OPTIMIZED: 50MB minimum free space
    };

    this.initPromise = this.initialize();
  }

  /**
   * Initialize IndexedDB
   */
  async initialize() {
    try {
      this.db = await this.openDatabase();
      await this.performMaintenance();
      console.log('🗃️ CacheManager initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ CacheManager initialization failed:', error);
      return false;
    }
  }

  /**
   * Open IndexedDB database
   */
  openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Assets store - binary data with URL as key
        if (!db.objectStoreNames.contains(this.stores.assets)) {
          const assetsStore = db.createObjectStore(this.stores.assets, { keyPath: 'url' });
          assetsStore.createIndex('size', 'size', { unique: false });
          assetsStore.createIndex('lastAccessed', 'lastAccessed', { unique: false });
          assetsStore.createIndex('scene', 'scene', { unique: false });
        }

        // Metadata store
        if (!db.objectStoreNames.contains(this.stores.metadata)) {
          const metadataStore = db.createObjectStore(this.stores.metadata, { keyPath: 'url' });
          metadataStore.createIndex('hash', 'hash', { unique: false });
          metadataStore.createIndex('type', 'type', { unique: false });
          metadataStore.createIndex('scene', 'scene', { unique: false });
        }

        // Analytics store
        if (!db.objectStoreNames.contains(this.stores.analytics)) {
          const analyticsStore = db.createObjectStore(this.stores.analytics, { keyPath: 'key' });
          analyticsStore.createIndex('date', 'date', { unique: false });
        }

        console.log('🔧 Database schema created/updated');
      };
    });
  }

  /**
   * Store asset in cache
   */
  async storeAsset(url, data, metadata = {}) {
    await this.initPromise;

    try {
      const blob = data instanceof Blob ? data : new Blob([data]);
      const size = blob.size;

      // Check size limits
      if (size > this.limits.maxAssetSize * 1024 * 1024) {
        throw new Error(`Asset too large: ${size} bytes (max: ${this.limits.maxAssetSize}MB)`);
      }

      // Check available space
      const hasSpace = await this.ensureSpace(size);
      if (!hasSpace) {
        throw new Error('Insufficient storage space');
      }

      const transaction = this.db.transaction([this.stores.assets, this.stores.metadata], 'readwrite');

      // Store binary data
      const assetData = {
        url,
        data: blob,
        size,
        storedAt: Date.now(),
        lastAccessed: Date.now(),
        scene: metadata.scene || null,
        type: metadata.type || this.getAssetType(url)
      };

      await this.promisifyRequest(
        transaction.objectStore(this.stores.assets).put(assetData)
      );

      // Store metadata
      const metadataRecord = {
        url,
        hash: metadata.hash || await this.generateHash(blob),
        type: assetData.type,
        size,
        scene: assetData.scene,
        originalSize: metadata.originalSize || size,
        compressed: metadata.compressed || false,
        quality: metadata.quality || 'original',
        storedAt: assetData.storedAt,
        lastAccessed: assetData.lastAccessed,
        accessCount: 1,
        ...metadata
      };

      await this.promisifyRequest(
        transaction.objectStore(this.stores.metadata).put(metadataRecord)
      );

      console.log(`💾 Asset cached: ${url} (${this.formatSize(size)})`);

      // Update analytics
      this.updateAnalytics('assets_stored', { url, size, type: assetData.type });

      return true;

    } catch (error) {
      console.error('❌ Failed to store asset:', url, error);
      return false;
    }
  }

  /**
   * Retrieve asset from cache
   */
  async getAsset(url) {
    await this.initPromise;

    try {
      const transaction = this.db.transaction([this.stores.assets, this.stores.metadata], 'readwrite');

      // Get asset data
      const assetData = await this.promisifyRequest(
        transaction.objectStore(this.stores.assets).get(url)
      );

      if (!assetData) {
        return null;
      }

      // Update last accessed time
      assetData.lastAccessed = Date.now();
      await this.promisifyRequest(
        transaction.objectStore(this.stores.assets).put(assetData)
      );

      // Update metadata access stats
      const metadata = await this.promisifyRequest(
        transaction.objectStore(this.stores.metadata).get(url)
      );

      if (metadata) {
        metadata.lastAccessed = Date.now();
        metadata.accessCount = (metadata.accessCount || 0) + 1;
        await this.promisifyRequest(
          transaction.objectStore(this.stores.metadata).put(metadata)
        );
      }

      console.log(`📦 Asset retrieved from cache: ${url}`);

      // Update analytics
      this.updateAnalytics('assets_retrieved', { url, size: assetData.size });

      return {
        data: assetData.data,
        metadata: metadata || {},
        url: assetData.url,
        size: assetData.size,
        type: assetData.type
      };

    } catch (error) {
      console.error('❌ Failed to retrieve asset:', url, error);
      return null;
    }
  }

  /**
   * Check if asset exists in cache
   */
  async hasAsset(url) {
    await this.initPromise;

    try {
      const transaction = this.db.transaction([this.stores.metadata], 'readonly');
      const metadata = await this.promisifyRequest(
        transaction.objectStore(this.stores.metadata).get(url)
      );
      return !!metadata;
    } catch (error) {
      console.error('❌ Error checking asset existence:', error);
      return false;
    }
  }

  /**
   * Verify asset integrity using hash
   */
  async verifyAsset(url, expectedHash) {
    const asset = await this.getAsset(url);
    if (!asset) return false;

    const actualHash = await this.generateHash(asset.data);
    return actualHash === expectedHash;
  }

  /**
   * Remove asset from cache
   */
  async removeAsset(url) {
    await this.initPromise;

    try {
      const transaction = this.db.transaction([this.stores.assets, this.stores.metadata], 'readwrite');

      await Promise.all([
        this.promisifyRequest(transaction.objectStore(this.stores.assets).delete(url)),
        this.promisifyRequest(transaction.objectStore(this.stores.metadata).delete(url))
      ]);

      console.log(`🗑️ Asset removed from cache: ${url}`);
      this.updateAnalytics('assets_removed', { url });

      return true;
    } catch (error) {
      console.error('❌ Failed to remove asset:', error);
      return false;
    }
  }

  /**
   * Get assets by scene
   */
  async getAssetsByScene(sceneId) {
    await this.initPromise;

    try {
      const transaction = this.db.transaction([this.stores.metadata], 'readonly');
      const index = transaction.objectStore(this.stores.metadata).index('scene');
      const assets = await this.promisifyRequest(index.getAll(sceneId));

      return assets.map(metadata => ({
        url: metadata.url,
        type: metadata.type,
        size: metadata.size,
        lastAccessed: metadata.lastAccessed
      }));
    } catch (error) {
      console.error('❌ Error getting assets by scene:', error);
      return [];
    }
  }

  /**
   * Ensure sufficient storage space
   */
  async ensureSpace(requiredSize) {
    try {
      // Check storage quota
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const available = estimate.quota - estimate.usage;
        const required = requiredSize + (this.limits.lowStorageThreshold * 1024 * 1024);

        if (available < required) {
          console.log('🧹 Insufficient space, performing cleanup...');
          const freed = await this.performCleanup(required - available);
          return freed >= required;
        }
      }

      // Check total cache size
      const totalSize = await this.getTotalCacheSize();
      const maxSize = this.limits.maxTotalSize * 1024 * 1024;

      if (totalSize + requiredSize > maxSize) {
        console.log('🧹 Cache size limit exceeded, performing cleanup...');
        const targetSize = requiredSize + (maxSize * 0.1); // Clean 10% more than needed
        const freed = await this.performCleanup(targetSize);
        return freed >= requiredSize;
      }

      return true;
    } catch (error) {
      console.error('❌ Error checking storage space:', error);
      return true; // Assume space is available on error
    }
  }

  /**
   * Perform cache cleanup using LRU strategy
   */
  async performCleanup(targetSize) {
    let freedSize = 0;

    try {
      const transaction = this.db.transaction([this.stores.assets, this.stores.metadata], 'readwrite');
      const assetsStore = transaction.objectStore(this.stores.assets);
      const metadataStore = transaction.objectStore(this.stores.metadata);

      // Get all assets sorted by last accessed time (LRU)
      const index = assetsStore.index('lastAccessed');
      const cursor = await this.promisifyRequest(index.openCursor());

      const toRemove = [];

      if (cursor) {
        do {
          const asset = cursor.value;
          toRemove.push({
            url: asset.url,
            size: asset.size,
            lastAccessed: asset.lastAccessed
          });

          freedSize += asset.size;

          if (freedSize >= targetSize) {
            break;
          }
        } while (cursor.continue());
      }

      // Remove selected assets
      for (const asset of toRemove) {
        await Promise.all([
          this.promisifyRequest(assetsStore.delete(asset.url)),
          this.promisifyRequest(metadataStore.delete(asset.url))
        ]);

        console.log(`🗑️ Cleaned up: ${asset.url} (${this.formatSize(asset.size)})`);
      }

      console.log(`✅ Cleanup completed: freed ${this.formatSize(freedSize)}`);
      this.updateAnalytics('cache_cleanup', { freedSize, removedCount: toRemove.length });

      return freedSize;

    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      return 0;
    }
  }

  /**
   * Get total cache size
   */
  async getTotalCacheSize() {
    await this.initPromise;

    try {
      const transaction = this.db.transaction([this.stores.assets], 'readonly');
      const store = transaction.objectStore(this.stores.assets);
      const cursor = await this.promisifyRequest(store.openCursor());

      let totalSize = 0;

      if (cursor) {
        do {
          totalSize += cursor.value.size || 0;
        } while (cursor.continue());
      }

      return totalSize;
    } catch (error) {
      console.error('❌ Error calculating cache size:', error);
      return 0;
    }
  }

  /**
   * Perform routine maintenance
   */
  async performMaintenance() {
    try {
      // Clean up expired or corrupted entries
      const transaction = this.db.transaction([this.stores.assets, this.stores.metadata], 'readonly');
      const metadataStore = transaction.objectStore(this.stores.metadata);
      const cursor = await this.promisifyRequest(metadataStore.openCursor());

      const corrupted = [];
      const old = [];
      const now = Date.now();
      const maxAge = 2 * 24 * 60 * 60 * 1000; // OPTIMIZED: 2 days (reduced from 7 days)

      if (cursor) {
        do {
          const metadata = cursor.value;

          // OPTIMIZED: More aggressive cleanup - remove old assets with low access count
          if (now - metadata.storedAt > maxAge && metadata.accessCount < 3) {
            old.push(metadata.url);
          }

          // TODO: Add integrity checks if needed

        } while (cursor.continue());
      }

      // Clean up old, rarely accessed assets
      for (const url of old) {
        await this.removeAsset(url);
      }

      if (old.length > 0) {
        console.log(`🧹 Maintenance: removed ${old.length} old assets`);
      }

    } catch (error) {
      console.error('❌ Error during maintenance:', error);
    }
  }

  /**
   * Generate hash for asset integrity checking
   */
  async generateHash(blob) {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('❌ Error generating hash:', error);
      return Date.now().toString(); // Fallback to timestamp
    }
  }

  /**
   * Update analytics
   */
  async updateAnalytics(event, data) {
    try {
      const transaction = this.db.transaction([this.stores.analytics], 'readwrite');
      const store = transaction.objectStore(this.stores.analytics);

      const key = `${event}_${new Date().toISOString().split('T')[0]}`;

      let record = await this.promisifyRequest(store.get(key));
      if (!record) {
        record = { key, event, date: new Date().toISOString(), count: 0, data: [] };
      }

      record.count++;
      record.data.push({ timestamp: Date.now(), ...data });

      // Keep only last 100 entries per day
      if (record.data.length > 100) {
        record.data = record.data.slice(-100);
      }

      await this.promisifyRequest(store.put(record));
    } catch (error) {
      console.error('❌ Error updating analytics:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    await this.initPromise;

    try {
      const transaction = this.db.transaction([this.stores.assets, this.stores.metadata], 'readonly');

      // Count assets by type
      const metadataStore = transaction.objectStore(this.stores.metadata);
      const typeIndex = metadataStore.index('type');

      const stats = {
        totalAssets: 0,
        totalSize: 0,
        byType: {},
        byScene: {},
        oldestAsset: null,
        newestAsset: null
      };

      const cursor = await this.promisifyRequest(metadataStore.openCursor());

      if (cursor) {
        do {
          const metadata = cursor.value;
          stats.totalAssets++;
          stats.totalSize += metadata.size || 0;

          // By type
          stats.byType[metadata.type] = (stats.byType[metadata.type] || 0) + 1;

          // By scene
          if (metadata.scene) {
            stats.byScene[metadata.scene] = (stats.byScene[metadata.scene] || 0) + 1;
          }

          // Age tracking
          if (!stats.oldestAsset || metadata.storedAt < stats.oldestAsset.storedAt) {
            stats.oldestAsset = metadata;
          }
          if (!stats.newestAsset || metadata.storedAt > stats.newestAsset.storedAt) {
            stats.newestAsset = metadata;
          }

        } while (cursor.continue());
      }

      // Add storage estimate if available
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        stats.storage = {
          used: estimate.usage,
          available: estimate.quota - estimate.usage,
          total: estimate.quota,
          percentage: Math.round((estimate.usage / estimate.quota) * 100)
        };
      }

      return stats;

    } catch (error) {
      console.error('❌ Error getting cache stats:', error);
      return null;
    }
  }

  /**
   * Clear all cached data
   */
  async clearAll() {
    await this.initPromise;

    try {
      const transaction = this.db.transaction([this.stores.assets, this.stores.metadata], 'readwrite');

      await Promise.all([
        this.promisifyRequest(transaction.objectStore(this.stores.assets).clear()),
        this.promisifyRequest(transaction.objectStore(this.stores.metadata).clear())
      ]);

      console.log('🗑️ All cached assets cleared');
      this.updateAnalytics('cache_cleared', { timestamp: Date.now() });

      return true;
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
      return false;
    }
  }

  /**
   * Utility methods
   */

  getAssetType(url) {
    const extension = url.split('.').pop().toLowerCase();

    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) {
      return 'image';
    }
    if (['mp4', 'webm', 'mov', 'avi'].includes(extension)) {
      return 'video';
    }
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) {
      return 'audio';
    }

    return 'unknown';
  }

  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)}${units[unitIndex]}`;
  }

  promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Create and export singleton instance
export const cacheManager = new CacheManager();

// Global access for debugging
window.cacheManager = cacheManager;

console.log('🗃️ Cache Manager module loaded');