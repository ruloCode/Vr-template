import { AssetManifest, VRScene } from '@/types/protocol';
import { logger, perf, captureError } from './logger';
import { config } from './config';
import { useAppStore } from '@/store/appStore';

export interface PreloadedAssets {
  manifest: AssetManifest;
  imageCache: Map<string, HTMLImageElement>;
  audioCache: Map<string, ArrayBuffer>;
  errors: string[];
}

export class AssetPreloader {
  private abortController: AbortController | null = null;
  private loadedAssets = 0;
  private totalAssets = 0;
  private errors: string[] = [];

  constructor() {}

  public async preloadAll(): Promise<PreloadedAssets> {
    perf.mark('preload-start');
    logger.info('🚀 Iniciando precarga de assets');

    try {
      this.abortController = new AbortController();
      this.resetProgress();

      // Load manifest first
      const manifest = await this.loadManifest();
      logger.info('📄 Manifest cargado:', manifest.scenes.length, 'escenas');

      useAppStore.getState().setAvailableScenes(manifest.scenes);

      // Calculate total assets (images + audio, excluding placeholders)
      const realScenes = manifest.scenes.filter(scene => 
        !scene.image360.includes('placeholder') && 
        !scene.audio.includes('placeholder')
      );
      this.totalAssets = realScenes.length * 2; // image + audio per scene
      
      this.updateProgress('Iniciando precarga...', 0);

      // Preload all assets in parallel with concurrency limit
      const imageCache = new Map<string, HTMLImageElement>();
      const audioCache = new Map<string, ArrayBuffer>();

      await this.preloadAssetsWithConcurrency(realScenes, imageCache, audioCache);

      perf.mark('preload-end');
      perf.measure('Total preload time', 'preload-start', 'preload-end');

      logger.info('✅ Precarga completada:', {
        totalAssets: this.totalAssets,
        errors: this.errors.length,
        imagesLoaded: imageCache.size,
        audioLoaded: audioCache.size
      });

      this.updateProgress('Precarga completada', 100);

      return {
        manifest,
        imageCache,
        audioCache,
        errors: this.errors
      };

    } catch (error) {
      logger.error('❌ Error en precarga:', error);
      captureError(error as Error, 'asset-preloader');
      throw error;
    }
  }

  public abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      logger.info('🛑 Precarga cancelada');
    }
  }

  private async loadManifest(): Promise<AssetManifest> {
    try {
      const fetchOptions: RequestInit = {};
      if (this.abortController?.signal) {
        fetchOptions.signal = this.abortController.signal;
      }
      const response = await fetch('/asset-manifest.json', fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const manifest: AssetManifest = await response.json();
      
      // Validate manifest structure
      if (!manifest.version || !Array.isArray(manifest.scenes)) {
        throw new Error('Invalid manifest structure');
      }

      return manifest;
    } catch (error) {
      throw new Error(`Failed to load asset manifest: ${(error as Error).message}`);
    }
  }

  private async preloadAssetsWithConcurrency(
    scenes: VRScene[],
    imageCache: Map<string, HTMLImageElement>,
    audioCache: Map<string, ArrayBuffer>
  ): Promise<void> {
    const semaphore = new Semaphore(config.preloader.parallelLoads);
    const promises: Promise<void>[] = [];

    for (const scene of scenes) {
      // Preload image
      promises.push(
        semaphore.acquire().then(async (release) => {
          try {
            await this.preloadImage(scene.image360, imageCache);
          } finally {
            release();
          }
        })
      );

      // Preload audio
      promises.push(
        semaphore.acquire().then(async (release) => {
          try {
            await this.preloadAudio(scene.audio, audioCache);
          } finally {
            release();
          }
        })
      );
    }

    await Promise.allSettled(promises);
  }

  private async preloadImage(src: string, cache: Map<string, HTMLImageElement>): Promise<void> {
    const fullSrc = src.startsWith('/') ? src : `/${src}`;
    
    try {
      perf.mark(`image-load-start-${src}`);
      this.updateProgress(`Cargando imagen: ${src}`, this.getProgress());

      const img = await this.loadImageWithTimeout(fullSrc);
      cache.set(src, img);
      
      this.incrementProgress();
      perf.mark(`image-load-end-${src}`);
      perf.measure(`Image load: ${src}`, `image-load-start-${src}`, `image-load-end-${src}`);
      
      logger.debug('🖼️ Imagen cargada:', src, `${img.naturalWidth}x${img.naturalHeight}`);
      
    } catch (error) {
      const errorMsg = `Failed to load image ${src}: ${(error as Error).message}`;
      this.errors.push(errorMsg);
      logger.error('❌', errorMsg);
      this.incrementProgress(); // Still increment to continue progress
    }
  }

  private async preloadAudio(src: string, cache: Map<string, ArrayBuffer>): Promise<void> {
    const fullSrc = src.startsWith('/') ? src : `/${src}`;
    
    try {
      perf.mark(`audio-load-start-${src}`);
      this.updateProgress(`Cargando audio: ${src}`, this.getProgress());

      const arrayBuffer = await this.loadAudioWithTimeout(fullSrc);
      cache.set(src, arrayBuffer);
      
      this.incrementProgress();
      perf.mark(`audio-load-end-${src}`);
      perf.measure(`Audio load: ${src}`, `audio-load-start-${src}`, `audio-load-end-${src}`);
      
      logger.debug('🎵 Audio cargado:', src, `${arrayBuffer.byteLength} bytes`);
      
    } catch (error) {
      const errorMsg = `Failed to load audio ${src}: ${(error as Error).message}`;
      this.errors.push(errorMsg);
      logger.error('❌', errorMsg);
      this.incrementProgress(); // Still increment to continue progress
    }
  }

  private loadImageWithTimeout(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const timeout = setTimeout(() => {
        reject(new Error('Load timeout'));
      }, config.preloader.timeout);

      img.onload = () => {
        clearTimeout(timeout);
        resolve(img);
      };

      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Image load failed'));
      };

      // Handle abort signal
      this.abortController?.signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new Error('Aborted'));
      });

      img.src = src;
    });
  }

  private async loadAudioWithTimeout(src: string): Promise<ArrayBuffer> {
    const controller = new AbortController();
    
    const timeout = setTimeout(() => {
      controller.abort();
    }, config.preloader.timeout);

    try {
      // Combine parent abort signal with local timeout
      const signal = this.abortController ? 
        this.combineAbortSignals(this.abortController.signal, controller.signal) :
        controller.signal;

      const response = await fetch(src, { signal });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      clearTimeout(timeout);
      
      return arrayBuffer;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  private combineAbortSignals(signal1: AbortSignal, signal2: AbortSignal): AbortSignal {
    const controller = new AbortController();
    
    const abort = () => controller.abort();
    
    if (signal1.aborted || signal2.aborted) {
      abort();
    } else {
      signal1.addEventListener('abort', abort);
      signal2.addEventListener('abort', abort);
    }
    
    return controller.signal;
  }

  private resetProgress(): void {
    this.loadedAssets = 0;
    this.errors = [];
    this.updateProgress('Inicializando...', 0);
  }

  private incrementProgress(): void {
    this.loadedAssets++;
    const percentage = Math.round((this.loadedAssets / this.totalAssets) * 100);
    this.updateProgress(`${this.loadedAssets}/${this.totalAssets} assets cargados`, percentage);
  }

  private getProgress(): number {
    return Math.round((this.loadedAssets / this.totalAssets) * 100);
  }

  private updateProgress(currentAsset: string, percentage: number): void {
    useAppStore.getState().setPreloadProgress({
      totalAssets: this.totalAssets,
      loadedAssets: this.loadedAssets,
      currentAsset,
      percentage,
      errors: [...this.errors]
    });
  }
}

// Simple semaphore implementation for concurrency control
class Semaphore {
  private permits: number;
  private waitQueue: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      if (this.permits > 0) {
        this.permits--;
        resolve(() => this.release());
      } else {
        this.waitQueue.push(() => resolve(() => this.release()));
      }
    });
  }

  private release(): void {
    this.permits++;
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift()!;
      this.permits--;
      next();
    }
  }
}

// Global preloader instance
export const assetPreloader = new AssetPreloader();


