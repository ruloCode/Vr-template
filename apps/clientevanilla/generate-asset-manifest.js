/**
 * Generate Asset Manifest with Hashes
 * Creates a comprehensive manifest of all VR assets with integrity hashes
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ASSET_DIRECTORIES = ['images', 'videos', 'audio'];
const OUTPUT_FILE = 'asset-manifest.json';

// Scene configuration mapping
const SCENES_CONFIG = {
  "escena-1": {
    id: "escena-1",
    name: "Escena 1 - Energías Renovables",
    description: "Panorámica de instalaciones de energía solar y eólica",
    priority: 1,
    preloadStrategy: "aggressive"
  },
  "escena-2": {
    id: "escena-2",
    name: "Escena 2 - Operaciones Petroleras",
    description: "Vista panorámica de operaciones petroleras industriales",
    priority: 1,
    preloadStrategy: "aggressive"
  },
  "escena-3": {
    id: "escena-3",
    name: "Escena 3 - Operaciones de Plataforma",
    description: "Vista panorámica de plataformas petroleras y CPF",
    priority: 2,
    preloadStrategy: "moderate"
  },
  "escena-4": {
    id: "escena-4",
    name: "Escena 4 - Entorno Natural",
    description: "Vista panorámica del entorno natural y paisajes",
    priority: 2,
    preloadStrategy: "moderate"
  },
  "escena-5": {
    id: "escena-5",
    name: "Escena 5 - Vista Panorámica",
    description: "Vista panorámica completa del entorno industrial y natural",
    priority: 2,
    preloadStrategy: "moderate"
  },
  "escena-6": {
    id: "escena-6",
    name: "Escena 6 - Operaciones Especializadas",
    description: "Vista panorámica de operaciones especializadas y tecnología avanzada",
    priority: 3,
    preloadStrategy: "conservative"
  },
  "escena-7": {
    id: "escena-7",
    name: "Escena 7 - Vista Industrial Avanzada",
    description: "Vista panorámica de instalaciones industriales avanzadas y tecnología moderna",
    priority: 3,
    preloadStrategy: "conservative"
  },
  "escena-8": {
    id: "escena-8",
    name: "Escena 8 - Operaciones Industriales",
    description: "Vista panorámica de operaciones industriales y equipos especializados",
    priority: 3,
    preloadStrategy: "conservative"
  },
  "escena-9": {
    id: "escena-9",
    name: "Escena 9 - Instalaciones Avanzadas",
    description: "Vista panorámica de instalaciones industriales avanzadas y tecnología moderna",
    priority: 3,
    preloadStrategy: "conservative"
  },
  "escena-10": {
    id: "escena-10",
    name: "Escena 10 - Operaciones Especializadas",
    description: "Vista panorámica de operaciones especializadas y equipos de alta tecnología",
    priority: 3,
    preloadStrategy: "conservative"
  },
  "escena-11": {
    id: "escena-11",
    name: "Escena 11 - Infraestructura Completa",
    description: "Vista panorámica completa de la infraestructura industrial y operacional",
    priority: 3,
    preloadStrategy: "conservative"
  },
  "base": {
    id: "base",
    name: "Escena Base",
    description: "Escena base por defecto",
    priority: 1,
    preloadStrategy: "critical"
  }
};

class AssetManifestGenerator {
  constructor() {
    this.manifest = {
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      totalAssets: 0,
      totalSize: 0,
      scenes: {},
      assets: {},
      categories: {
        images: { count: 0, size: 0 },
        videos: { count: 0, size: 0 },
        audio: { count: 0, size: 0 },
        critical: { count: 0, size: 0 }
      },
      preloadStrategies: {
        critical: [],
        aggressive: [],
        moderate: [],
        conservative: []
      },
      integrity: {}
    };

    this.processedFiles = new Set();
  }

  /**
   * Generate complete asset manifest
   */
  async generate() {
    console.log('🏗️ Generating asset manifest...');

    try {
      // Process each asset directory
      for (const directory of ASSET_DIRECTORIES) {
        if (fs.existsSync(directory)) {
          await this.processDirectory(directory);
        } else {
          console.warn(`⚠️ Directory not found: ${directory}`);
        }
      }

      // Process critical files
      await this.processCriticalAssets();

      // Organize assets by scenes
      this.organizeAssetsByScenes();

      // Generate preload strategies
      this.generatePreloadStrategies();

      // Calculate statistics
      this.calculateStatistics();

      // Write manifest file
      this.writeManifest();

      console.log('✅ Asset manifest generated successfully');
      console.log(`📊 Total assets: ${this.manifest.totalAssets}`);
      console.log(`📦 Total size: ${this.formatSize(this.manifest.totalSize)}`);

      return this.manifest;

    } catch (error) {
      console.error('❌ Error generating manifest:', error);
      throw error;
    }
  }

  /**
   * Process directory recursively
   */
  async processDirectory(directory, basePath = '') {
    const dirPath = path.join(process.cwd(), directory);

    if (!fs.existsSync(dirPath)) {
      console.warn(`⚠️ Directory not found: ${dirPath}`);
      return;
    }

    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const relativePath = path.join(directory, basePath, item).replace(/\\/g, '/');

      if (this.processedFiles.has(relativePath)) {
        continue;
      }

      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        // Recursively process subdirectories
        await this.processDirectory(directory, path.join(basePath, item));
      } else if (stats.isFile()) {
        await this.processAssetFile(itemPath, relativePath, stats);
        this.processedFiles.add(relativePath);
      }
    }
  }

  /**
   * Process individual asset file
   */
  async processAssetFile(filePath, relativePath, stats) {
    try {
      const extension = path.extname(relativePath).toLowerCase();
      const assetType = this.getAssetType(extension);

      if (assetType === 'unknown') {
        return; // Skip unknown file types
      }

      // Generate file hash for integrity checking
      const hash = await this.generateFileHash(filePath);

      // Determine scene association
      const scene = this.determineAssetScene(relativePath);

      // Get asset metadata
      const metadata = this.getAssetMetadata(relativePath, assetType);

      const asset = {
        url: '/' + relativePath,
        type: assetType,
        size: stats.size,
        hash: hash,
        scene: scene,
        critical: this.isCriticalAsset(relativePath),
        compressed: false,
        quality: 'original',
        lastModified: stats.mtime.toISOString(),
        ...metadata
      };

      this.manifest.assets[relativePath] = asset;
      this.manifest.totalAssets++;
      this.manifest.totalSize += stats.size;

      // Update category statistics
      this.manifest.categories[assetType].count++;
      this.manifest.categories[assetType].size += stats.size;

      if (asset.critical) {
        this.manifest.categories.critical.count++;
        this.manifest.categories.critical.size += stats.size;
      }

      // Store integrity hash
      this.manifest.integrity[asset.url] = hash;

      console.log(`📁 Processed: ${relativePath} (${this.formatSize(stats.size)})`);

    } catch (error) {
      console.error(`❌ Error processing asset: ${relativePath}`, error);
    }
  }

  /**
   * Process critical assets (HTML, JS, CSS, base images)
   */
  async processCriticalAssets() {
    const criticalFiles = [
      'index.html',
      'aframe-v1.3.0.min.js',
      'scenes-config.js',
      'sequence-config.js',
      'websocket-client.js',
      'images/base.jpg',
      'audio/toma_01.mp3'
    ];

    for (const file of criticalFiles) {
      const filePath = path.join(process.cwd(), file);

      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        await this.processAssetFile(filePath, file, stats);

        // Mark as critical
        if (this.manifest.assets[file]) {
          this.manifest.assets[file].critical = true;
        }
      }
    }
  }

  /**
   * Generate SHA-256 hash for file
   */
  async generateFileHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('error', reject);
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }

  /**
   * Determine asset type from extension
   */
  getAssetType(extension) {
    const types = {
      // Images
      '.jpg': 'images',
      '.jpeg': 'images',
      '.png': 'images',
      '.webp': 'images',
      '.gif': 'images',

      // Videos
      '.mp4': 'videos',
      '.webm': 'videos',
      '.mov': 'videos',
      '.avi': 'videos',

      // Audio
      '.mp3': 'audio',
      '.wav': 'audio',
      '.ogg': 'audio',
      '.m4a': 'audio'
    };

    return types[extension] || 'unknown';
  }

  /**
   * Determine which scene an asset belongs to
   */
  determineAssetScene(relativePath) {
    const filename = path.basename(relativePath).toLowerCase();

    // Base assets
    if (filename.includes('base')) {
      return 'base';
    }

    // Scene-specific patterns
    for (let i = 1; i <= 11; i++) {
      const patterns = [
        `escena_${i}`,
        `escena${i}`,
        `escena ${i}`,
        `toma_${i.toString().padStart(2, '0')}`,
        `solar_${i}`,
        `escena_${i}.`
      ];

      for (const pattern of patterns) {
        if (filename.includes(pattern)) {
          return `escena-${i}`;
        }
      }
    }

    return null; // Generic asset
  }

  /**
   * Check if asset is critical for initial load
   */
  isCriticalAsset(relativePath) {
    const criticalPatterns = [
      'base.jpg',
      'toma_01.mp3',
      'escena_1.',
      'solar_1.',
      '.js',
      '.html',
      '.css'
    ];

    return criticalPatterns.some(pattern =>
      relativePath.toLowerCase().includes(pattern)
    );
  }

  /**
   * Get additional metadata for asset
   */
  getAssetMetadata(relativePath, assetType) {
    const metadata = {};

    // Video-specific metadata
    if (assetType === 'videos') {
      metadata.preload = 'metadata';
      metadata.autoplay = false;
      metadata.loop = relativePath.includes('escena_4') ||
                     relativePath.includes('escena_6') ||
                     relativePath.includes('escena_7') ||
                     relativePath.includes('escena_11');
    }

    // Audio-specific metadata
    if (assetType === 'audio') {
      metadata.autoplay = true;
      metadata.loop = false;

      // Extract duration pattern from filename if available
      const durationMatch = relativePath.match(/(\d+)s/);
      if (durationMatch) {
        metadata.estimatedDuration = parseInt(durationMatch[1]);
      }
    }

    // Image-specific metadata
    if (assetType === 'images') {
      metadata.format = path.extname(relativePath).slice(1).toLowerCase();

      // Detect panoramic images
      if (relativePath.includes('escena_') || relativePath.includes('base.jpg')) {
        metadata.panoramic = true;
        metadata.resolution = 'high'; // Assume high res for panoramic
      }
    }

    return metadata;
  }

  /**
   * Organize assets by scenes
   */
  organizeAssetsByScenes() {
    // Initialize scene structures
    for (const sceneId of Object.keys(SCENES_CONFIG)) {
      this.manifest.scenes[sceneId] = {
        ...SCENES_CONFIG[sceneId],
        assets: [],
        totalSize: 0,
        assetCount: 0
      };
    }

    // Assign assets to scenes
    for (const [relativePath, asset] of Object.entries(this.manifest.assets)) {
      if (asset.scene && this.manifest.scenes[asset.scene]) {
        this.manifest.scenes[asset.scene].assets.push({
          url: asset.url,
          type: asset.type,
          size: asset.size,
          critical: asset.critical,
          hash: asset.hash
        });

        this.manifest.scenes[asset.scene].totalSize += asset.size;
        this.manifest.scenes[asset.scene].assetCount++;
      }
    }
  }

  /**
   * Generate preload strategies
   */
  generatePreloadStrategies() {
    for (const [sceneId, scene] of Object.entries(this.manifest.scenes)) {
      const strategy = scene.preloadStrategy || 'moderate';

      // Add scene assets to appropriate strategy
      scene.assets.forEach(asset => {
        this.manifest.preloadStrategies[strategy].push({
          url: asset.url,
          scene: sceneId,
          type: asset.type,
          size: asset.size,
          priority: scene.priority || 3
        });
      });
    }

    // Sort strategies by priority and size
    Object.keys(this.manifest.preloadStrategies).forEach(strategy => {
      this.manifest.preloadStrategies[strategy].sort((a, b) => {
        // Sort by priority first, then by size (smaller first for faster loading)
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.size - b.size;
      });
    });
  }

  /**
   * Calculate final statistics
   */
  calculateStatistics() {
    this.manifest.statistics = {
      assetsByType: {},
      assetsByScene: {},
      averageAssetSize: this.manifest.totalAssets > 0 ?
        this.manifest.totalSize / this.manifest.totalAssets : 0,
      largestAsset: null,
      smallestAsset: null
    };

    let largest = null;
    let smallest = null;

    // Calculate type and scene distributions
    for (const asset of Object.values(this.manifest.assets)) {
      // By type
      if (!this.manifest.statistics.assetsByType[asset.type]) {
        this.manifest.statistics.assetsByType[asset.type] = { count: 0, size: 0 };
      }
      this.manifest.statistics.assetsByType[asset.type].count++;
      this.manifest.statistics.assetsByType[asset.type].size += asset.size;

      // By scene
      if (asset.scene) {
        if (!this.manifest.statistics.assetsByScene[asset.scene]) {
          this.manifest.statistics.assetsByScene[asset.scene] = { count: 0, size: 0 };
        }
        this.manifest.statistics.assetsByScene[asset.scene].count++;
        this.manifest.statistics.assetsByScene[asset.scene].size += asset.size;
      }

      // Track largest and smallest
      if (!largest || asset.size > largest.size) {
        largest = { url: asset.url, size: asset.size, type: asset.type };
      }
      if (!smallest || asset.size < smallest.size) {
        smallest = { url: asset.url, size: asset.size, type: asset.type };
      }
    }

    this.manifest.statistics.largestAsset = largest;
    this.manifest.statistics.smallestAsset = smallest;
  }

  /**
   * Write manifest to file
   */
  writeManifest() {
    const manifestPath = path.join(process.cwd(), OUTPUT_FILE);
    const manifestJson = JSON.stringify(this.manifest, null, 2);

    fs.writeFileSync(manifestPath, manifestJson, 'utf8');
    console.log(`💾 Manifest written to: ${manifestPath}`);
  }

  /**
   * Format byte size to human readable
   */
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
}

// Main execution
if (require.main === module) {
  const generator = new AssetManifestGenerator();

  generator.generate()
    .then(manifest => {
      console.log('\n📋 Manifest Generation Complete!');
      console.log('═══════════════════════════════════');
      console.log(`📊 Total Assets: ${manifest.totalAssets}`);
      console.log(`📦 Total Size: ${generator.formatSize(manifest.totalSize)}`);
      console.log(`🖼️  Images: ${manifest.categories.images.count} (${generator.formatSize(manifest.categories.images.size)})`);
      console.log(`🎥 Videos: ${manifest.categories.videos.count} (${generator.formatSize(manifest.categories.videos.size)})`);
      console.log(`🎵 Audio: ${manifest.categories.audio.count} (${generator.formatSize(manifest.categories.audio.size)})`);
      console.log(`⚡ Critical: ${manifest.categories.critical.count} assets`);
      console.log(`🏗️ Scenes: ${Object.keys(manifest.scenes).length}`);
      console.log('═══════════════════════════════════');
    })
    .catch(error => {
      console.error('❌ Failed to generate manifest:', error);
      process.exit(1);
    });
}

module.exports = AssetManifestGenerator;