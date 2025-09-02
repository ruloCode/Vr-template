import { logger, captureError } from '@/utils/logger';
import { config } from '@/utils/config';
import { useAppStore } from '@/store/appStore';

export class AudioManager {
  private context: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentBuffer: AudioBuffer | null = null;
  private audioCache: Map<string, ArrayBuffer>;
  private decodedCache = new Map<string, AudioBuffer>();
  
  // Playback state
  private isPlaying = false;
  private isPaused = false;
  private startTime = 0;
  private pauseTime = 0;
  private currentPosition = 0;

  
  // Crossfade state
  private fadeOutGain: GainNode | null = null;

  constructor(audioCache: Map<string, ArrayBuffer>) {
    this.audioCache = audioCache;
    logger.info('🎵 AudioManager inicializado');
  }

  public async unlock(): Promise<void> {
    try {
      if (this.context) {
        logger.warn('⚠️ AudioContext ya está desbloqueado');
        return;
      }

      // Create AudioContext
      const ContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.context = new ContextClass();
      
      // Create master gain node
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
      this.gainNode.gain.value = 1.0;

      // Resume if suspended (required on some browsers)
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }

      logger.info('🔓 AudioContext desbloqueado:', {
        sampleRate: this.context.sampleRate,
        state: this.context.state,
        baseLatency: this.context.baseLatency || 'unknown'
      });

      // Update store
      useAppStore.getState().initializeAudioState(this.context);

    } catch (error) {
      logger.error('❌ Error desbloqueando audio:', error);
      captureError(error as Error, 'audio-unlock');
      throw error;
    }
  }

  public async loadAudio(audioSrc: string): Promise<void> {
    if (!this.context) {
      throw new Error('AudioContext not initialized. Call unlock() first.');
    }

    try {
      // Check if already decoded
      if (this.decodedCache.has(audioSrc)) {
        this.currentBuffer = this.decodedCache.get(audioSrc)!;
        logger.debug('🎵 Audio ya decodificado:', audioSrc);
        return;
      }

      // Get from cache
      const arrayBuffer = this.audioCache.get(audioSrc);
      if (!arrayBuffer) {
        throw new Error(`Audio not found in cache: ${audioSrc}`);
      }

      logger.info('🎵 Decodificando audio:', audioSrc);
      
      // Decode audio
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer.slice(0));
      
      // Cache decoded buffer
      this.decodedCache.set(audioSrc, audioBuffer);
      this.currentBuffer = audioBuffer;
      
      logger.info('✅ Audio decodificado:', {
        src: audioSrc,
        duration: audioBuffer.duration,
        channels: audioBuffer.numberOfChannels,
        sampleRate: audioBuffer.sampleRate
      });

    } catch (error) {
      logger.error('❌ Error cargando audio:', audioSrc, error);
      captureError(error as Error, 'audio-load');
      throw error;
    }
  }

  public play(startTime?: number): void {
    if (!this.context || !this.currentBuffer || !this.gainNode) {
      logger.error('❌ AudioContext, buffer o gainNode no inicializados');
      return;
    }

    try {
      // Stop current source if playing
      this.stop();

      // Create new source
      this.currentSource = this.context.createBufferSource();
      this.currentSource.buffer = this.currentBuffer;
      this.currentSource.connect(this.gainNode);

      // Calculate start position
      const startOffset = startTime || this.currentPosition;
      const when = this.context.currentTime;
      
      // Start playback
      this.currentSource.start(when, startOffset);
      
      // Update state
      this.isPlaying = true;
      this.isPaused = false;
      this.startTime = this.context.currentTime - startOffset;
      // Schedule start time tracked internally
      
      logger.info('▶️ Audio iniciado:', {
        startOffset,
        when,
        duration: this.currentBuffer.duration
      });

      // Handle source end
      this.currentSource.onended = () => {
        if (this.isPlaying) {
          logger.info('🔚 Audio terminado naturalmente');
          this.isPlaying = false;
        }
      };

      // Update store
      useAppStore.getState().updateAudioState({
        isPlaying: true,
        startTime: this.startTime,
        currentSource: this.currentSource
      });

    } catch (error) {
      logger.error('❌ Error reproduciendo audio:', error);
      captureError(error as Error, 'audio-play');
    }
  }

  public pause(): void {
    if (!this.context || !this.isPlaying) {
      return;
    }

    try {
      // Calculate current position
      this.currentPosition = this.context.currentTime - this.startTime;
      this.pauseTime = this.context.currentTime;
      
      // Stop current source
      if (this.currentSource) {
        this.currentSource.stop();
        this.currentSource = null;
      }
      
      // Update state
      this.isPlaying = false;
      this.isPaused = true;
      
      logger.info('⏸️ Audio pausado en posición:', this.currentPosition);

      // Update store
      useAppStore.getState().updateAudioState({
        isPlaying: false,
        pauseTime: this.pauseTime
      });

    } catch (error) {
      logger.error('❌ Error pausando audio:', error);
      captureError(error as Error, 'audio-pause');
    }
  }

  public resume(): void {
    if (!this.isPaused) {
      return;
    }

    this.play(this.currentPosition);
    this.isPaused = false;
    
    logger.info('▶️ Audio reanudado desde posición:', this.currentPosition);
  }

  public stop(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (error) {
        // Source might already be stopped
      }
      this.currentSource = null;
    }

    this.isPlaying = false;
    this.isPaused = false;
    this.currentPosition = 0;
    
    logger.debug('⏹️ Audio detenido');
  }

  public seek(deltaMs: number): void {
    if (!this.currentBuffer) {
      return;
    }

    const deltaSec = deltaMs / 1000;
    const newPosition = Math.max(0, Math.min(
      this.getCurrentTime() + deltaSec,
      this.currentBuffer.duration
    ));

    logger.info('⏩ Seeking to:', newPosition, 'seconds');

    if (this.isPlaying) {
      this.play(newPosition);
    } else {
      this.currentPosition = newPosition;
    }
  }

  public setVolume(volume: number): void {
    if (this.gainNode) {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      this.gainNode.gain.value = clampedVolume;
      logger.debug('🔊 Volumen ajustado:', clampedVolume);
    }
  }

  public fadeOut(duration: number = config.audio.fadeOutDuration): Promise<void> {
    return new Promise((resolve) => {
      if (!this.context || !this.gainNode) {
        resolve();
        return;
      }

      const currentTime = this.context.currentTime;
      const endTime = currentTime + duration;
      
      this.gainNode.gain.cancelScheduledValues(currentTime);
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, currentTime);
      this.gainNode.gain.linearRampToValueAtTime(0, endTime);
      
      setTimeout(() => {
        this.stop();
        if (this.gainNode) {
          this.gainNode.gain.value = 1.0;
        }
        resolve();
      }, duration * 1000);
      
      logger.debug('🔇 Fade out iniciado:', duration + 's');
    });
  }

  public fadeIn(duration: number = config.audio.fadeInDuration): void {
    if (!this.context || !this.gainNode) {
      return;
    }

    const currentTime = this.context.currentTime;
    const endTime = currentTime + duration;
    
    this.gainNode.gain.cancelScheduledValues(currentTime);
    this.gainNode.gain.setValueAtTime(0, currentTime);
    this.gainNode.gain.linearRampToValueAtTime(1.0, endTime);
    
    logger.debug('🔊 Fade in iniciado:', duration + 's');
  }

  public async crossfadeTo(newAudioSrc: string): Promise<void> {
    if (!this.context) {
      throw new Error('AudioContext not initialized');
    }

    try {
      logger.info('🔄 Crossfade a:', newAudioSrc);

      // Load new audio
      await this.loadAudio(newAudioSrc);

      const fadeDuration = config.audio.crossfadeDuration;
      const currentTime = this.context.currentTime;

      // Start fade out of current audio
      if (this.isPlaying && this.gainNode) {
        this.fadeOutGain = this.gainNode;
        this.fadeOutGain.gain.cancelScheduledValues(currentTime);
        this.fadeOutGain.gain.setValueAtTime(1.0, currentTime);
        this.fadeOutGain.gain.linearRampToValueAtTime(0, currentTime + fadeDuration);
      }

      // Create new gain node for fade in
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
      this.gainNode.gain.value = 0;

      // Start new audio with fade in
      this.play();
      this.fadeIn(fadeDuration);

      // Clean up old source after fade
      setTimeout(() => {
        if (this.fadeOutGain) {
          this.fadeOutGain.disconnect();
          this.fadeOutGain = null;
        }
      }, fadeDuration * 1000 + 100);

    } catch (error) {
      logger.error('❌ Error en crossfade:', error);
      throw error;
    }
  }

  // Sync methods
  public startAtServerTime(serverEpochMs: number): void {
    if (!this.context) {
      logger.error('❌ AudioContext no inicializado para sync');
      return;
    }

    const store = useAppStore.getState();
    const localTime = Date.now();
    const serverTime = serverEpochMs - store.clientOffset;
    const delayMs = serverTime - localTime;
    
    if (delayMs <= 0) {
      // Start immediately
      this.play();
      logger.info('▶️ Audio iniciado inmediatamente (sync)');
    } else {
      // Schedule start
      const delaySeconds = delayMs / 1000;
      const when = this.context.currentTime + delaySeconds;
      
      if (this.currentBuffer && this.gainNode) {
        this.stop();
        this.currentSource = this.context.createBufferSource();
        this.currentSource.buffer = this.currentBuffer;
        this.currentSource.connect(this.gainNode);
        this.currentSource.start(when);
        
        this.isPlaying = true;
        this.startTime = when;
        // Schedule start time tracked internally
        
        logger.info('⏰ Audio programado para:', new Date(serverTime).toISOString(), `(+${delayMs}ms)`);
      }
    }
  }

  public correctDrift(driftMs: number): void {
    if (Math.abs(driftMs) < config.audio.syncTolerance || !this.isPlaying || !this.currentBuffer) {
      return;
    }

    logger.warn('🔧 Corrigiendo drift de audio:', driftMs + 'ms');

    const correctionSeconds = driftMs / 1000;
    const newPosition = Math.max(0, Math.min(
      this.getCurrentTime() - correctionSeconds,
      this.currentBuffer.duration
    ));

    // Restart at corrected position
    this.play(newPosition);
  }

  public getCurrentTime(): number {
    if (!this.context) return 0;
    
    if (this.isPlaying) {
      return this.context.currentTime - this.startTime;
    } else if (this.isPaused) {
      return this.currentPosition;
    }
    
    return 0;
  }

  public getDuration(): number {
    return this.currentBuffer?.duration || 0;
  }

  public getPlaybackState() {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentTime: this.getCurrentTime(),
      duration: this.getDuration(),
      volume: this.gainNode?.gain.value || 0
    };
  }

  public destroy(): void {
    logger.info('🧹 Destruyendo AudioManager');
    
    this.stop();
    
    if (this.context) {
      this.context.close();
      this.context = null;
    }
    
    this.decodedCache.clear();
    this.gainNode = null;
    this.currentBuffer = null;
  }
}


