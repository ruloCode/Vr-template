import { logger } from '@/utils/logger';
import { config } from '@/utils/config';
import { AudioManager } from './AudioManager';
import { SceneManager } from './SceneManager';
import { VRWebSocketClient } from '@/utils/websocket';
import { useAppStore } from '@/store/appStore';

export class SyncManager {
  private audioManager: AudioManager;
  private sceneManager: SceneManager;
  private wsClient: VRWebSocketClient | null;
  private stateReportTimer: number | null = null;
  private driftCheckTimer: number | null = null;

  constructor(
    audioManager: AudioManager,
    sceneManager: SceneManager,
    wsClient: VRWebSocketClient | null
  ) {
    this.audioManager = audioManager;
    this.sceneManager = sceneManager;
    this.wsClient = wsClient;
    
    this.startStateReporting();
    this.startDriftChecking();
    
    logger.info('🔄 SyncManager inicializado');
  }

  public startSyncedPlayback(serverEpochMs: number): void {
    logger.info('⏰ Iniciando reproducción sincronizada:', new Date(serverEpochMs).toISOString());
    
    const store = useAppStore.getState();
    const now = Date.now();
    const adjustedServerTime = serverEpochMs - store.clientOffset;
    const delayMs = adjustedServerTime - now;
    
    logger.debug('🎯 Sync timing:', {
      serverTime: serverEpochMs,
      clientOffset: store.clientOffset,
      adjustedServerTime,
      localTime: now,
      delayMs
    });

    if (delayMs <= 0) {
      // Start immediately if we're already past the start time
      this.audioManager.play();
      logger.info('▶️ Iniciado inmediatamente (sin retraso)');
    } else if (delayMs > 10000) {
      // If delay is too large, something might be wrong
      logger.warn('⚠️ Retraso muy grande para sync:', delayMs + 'ms');
      this.audioManager.play();
    } else {
      // Use precise audio scheduling
      this.audioManager.startAtServerTime(serverEpochMs);
    }
  }

  public seek(deltaMs: number): void {
    logger.info('⏩ Seeking:', deltaMs + 'ms');
    this.audioManager.seek(deltaMs);
  }

  private startStateReporting(): void {
    if (!this.wsClient) {
      logger.debug('📊 No WebSocket, omitiendo reporte de estado');
      return;
    }

    this.stateReportTimer = window.setInterval(() => {
      this.reportState();
    }, 2000); // Report every 2 seconds
  }

  private reportState(): void {
    if (!this.wsClient) return;

    const currentScene = this.sceneManager.getCurrentScene();
    const audioState = this.audioManager.getPlaybackState();
    
    if (!currentScene) return;

    this.wsClient.send({
      type: 'STATE',
      payload: {
        sceneId: currentScene.id,
        currentTime: audioState.currentTime,
        playing: audioState.isPlaying,
        buffered: 100 // Assume fully buffered since we preload
      }
    });

    logger.debug('📊 Estado reportado:', {
      scene: currentScene.id,
      time: audioState.currentTime.toFixed(2) + 's',
      playing: audioState.isPlaying
    });
  }

  private startDriftChecking(): void {
    this.driftCheckTimer = window.setInterval(() => {
      this.checkAndCorrectDrift();
    }, 1000); // Check every second
  }

  private checkAndCorrectDrift(): void {
    const store = useAppStore.getState();
    const audioState = this.audioManager.getPlaybackState();
    
    if (!audioState.isPlaying || !this.wsClient) {
      return;
    }

    // Calculate expected time based on server sync
    const now = Date.now();
    const serverTime = now + store.clientOffset;
    const audioStartTime = this.calculateAudioStartTime();
    
    if (audioStartTime === 0) return;
    
    const expectedAudioTime = (serverTime - audioStartTime) / 1000;
    const actualAudioTime = audioState.currentTime;
    const driftMs = (actualAudioTime - expectedAudioTime) * 1000;
    
    if (Math.abs(driftMs) > config.audio.syncTolerance) {
      logger.warn('🔧 Drift detectado:', {
        expected: expectedAudioTime.toFixed(2) + 's',
        actual: actualAudioTime.toFixed(2) + 's',
        drift: driftMs.toFixed(0) + 'ms'
      });
      
      // Apply correction if drift is significant but not too large
      if (Math.abs(driftMs) < config.audio.maxDriftCorrection) {
        this.audioManager.correctDrift(driftMs);
      } else {
        logger.error('❌ Drift demasiado grande para corregir:', driftMs + 'ms');
      }
    }
  }

  private calculateAudioStartTime(): number {
    // This would need to be set when audio actually starts
    // For now, return a placeholder
    const store = useAppStore.getState();
    return store.audioState.startTime || 0;
  }

  public pause(): void {
    this.audioManager.pause();
  }

  public resume(): void {
    this.audioManager.resume();
  }

  public stop(): void {
    this.audioManager.stop();
  }

  public getPlaybackInfo() {
    const audioState = this.audioManager.getPlaybackState();
    const currentScene = this.sceneManager.getCurrentScene();
    const store = useAppStore.getState();
    
    return {
      scene: currentScene?.id || null,
      isPlaying: audioState.isPlaying,
      currentTime: audioState.currentTime,
      duration: audioState.duration,
      volume: audioState.volume,
      connectionStatus: store.connectionStatus,
      latency: store.latency,
      clientOffset: store.clientOffset
    };
  }

  public destroy(): void {
    logger.info('🧹 Destruyendo SyncManager');
    
    if (this.stateReportTimer) {
      clearInterval(this.stateReportTimer);
      this.stateReportTimer = null;
    }
    
    if (this.driftCheckTimer) {
      clearInterval(this.driftCheckTimer);
      this.driftCheckTimer = null;
    }
  }
}


