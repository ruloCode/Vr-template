import {
  SequenceConfig,
  SequenceState,
  SequenceScene,
  ServerMessage,
  SEQUENCE_TIMING,
} from "../types/protocol.js";
import { logger } from "../utils/logger.js";

export interface SequenceManagerEvents {
  onSceneChange: (sceneId: string, sceneIndex: number) => void;
  onSequenceComplete: (sequenceId: string) => void;
  onSequencePaused: (sequenceId: string) => void;
  onSequenceResumed: (sequenceId: string) => void;
  onProgress: (progress: number, remainingMs: number) => void;
  onError: (error: Error) => void;
}

export class SequenceManager {
  private currentSequence: SequenceConfig | null = null;
  private currentSceneIndex: number = 0;
  private sceneTimer: NodeJS.Timeout | null = null;
  private screenTimer: NodeJS.Timeout | null = null;
  private progressTimer: NodeJS.Timeout | null = null;
  private sequenceStartTime: number = 0;
  private sceneStartTime: number = 0;
  private isPaused: boolean = false;
  private isActive: boolean = false;
  private remainingTimeWhenPaused: number = 0;
  private events: SequenceManagerEvents;

  // Available predefined sequences
  private availableSequences: Map<string, SequenceConfig> = new Map();

  constructor(events: SequenceManagerEvents) {
    this.events = events;
    this.initializeDefaultSequences();
  }

  /**
   * Initialize default sequences
   */
  private initializeDefaultSequences() {
    // These would normally come from a configuration file or database
    const defaultSequences: SequenceConfig[] = [
      {
        id: "guion-completo",
        name: "Guión Completo Ecopetrol (5:32)",
        description:
          "Secuencia completa optimizada de todas las escenas siguiendo el guión oficial",
        scenes: [
          {
            sceneId: "escena-1",
            duration: 10000,
            name: "Energías Renovables",
            showScreens: true,
            screenDelay: 3000,
          },
          {
            sceneId: "escena-2",
            duration: 20000,
            name: "Operaciones Petroleras",
            showScreens: true,
            screenDelay: 5000,
          },
          {
            sceneId: "escena-3",
            duration: 25000,
            name: "Operaciones de Plataforma",
            showScreens: true,
            screenDelay: 6000,
          },
          {
            sceneId: "escena-4",
            duration: 20000,
            name: "Entorno Natural",
            showScreens: true,
            screenDelay: 5000,
          },
          {
            sceneId: "escena-5",
            duration: 37000,
            name: "Vista Panorámica",
            showScreens: true,
            screenDelay: 8000,
          },
          {
            sceneId: "escena-6",
            duration: 22000,
            name: "Operaciones Especializadas",
            showScreens: true,
            screenDelay: 5000,
          },
          {
            sceneId: "escena-7",
            duration: 50000,
            name: "Vista Industrial Avanzada",
            showScreens: true,
            screenDelay: 10000,
          },
          {
            sceneId: "escena-8",
            duration: 26000,
            name: "Operaciones Industriales",
            showScreens: true,
            screenDelay: 6000,
          },
          {
            sceneId: "escena-9",
            duration: 37000,
            name: "Instalaciones Avanzadas",
            showScreens: true,
            screenDelay: 8000,
          },
          {
            sceneId: "escena-10",
            duration: 25000,
            name: "Operaciones Especializadas",
            showScreens: true,
            screenDelay: 6000,
          },
          {
            sceneId: "escena-11",
            duration: 20000,
            name: "Infraestructura Completa",
            showScreens: true,
            screenDelay: 5000,
          },
        ],
        totalDuration: 332000, // Will be calculated
        autoLoop: false,
        showScreensAutomatically: true,
        transitions: {
          fadeOutTime: SEQUENCE_TIMING.DEFAULT_FADE_TIME_MS,
          loadTime: SEQUENCE_TIMING.DEFAULT_LOAD_TIME_MS,
          fadeInTime: SEQUENCE_TIMING.DEFAULT_FADE_TIME_MS,
        },
        editable: false,
      },
      {
        id: "demo-corto",
        name: "Demo Corto (5 minutos)",
        description: "Secuencia reducida para demos rápidas",
        scenes: [
          {
            sceneId: "escena-1",
            duration: 30000,
            name: "Energías Renovables",
            showScreens: true,
            screenDelay: 3000,
          },
          {
            sceneId: "escena-3",
            duration: 25000,
            name: "Operaciones de Plataforma",
            showScreens: true,
            screenDelay: 5000,
          },
          {
            sceneId: "escena-7",
            duration: 35000,
            name: "Vista Industrial",
            showScreens: true,
            screenDelay: 5000,
          },
          {
            sceneId: "escena-11",
            duration: 40000,
            name: "Infraestructura Final",
            showScreens: true,
            screenDelay: 8000,
          },
        ],
        totalDuration: 130000,
        autoLoop: true,
        showScreensAutomatically: true,
        transitions: {
          fadeOutTime: 800,
          loadTime: 1500,
          fadeInTime: 800,
        },
        editable: false,
      },
      {
        id: "cartagena-completo",
        name: "Secuencia Completa Cartagena",
        description: "Secuencia completa de todas las escenas de Cartagena",
        scenes: [
          {
            sceneId: "cartagena-1",
            duration: 15000,
            name: "Escenario Base",
            showScreens: false,
            screenDelay: 0,
          },
          {
            sceneId: "cartagena-2",
            duration: 25000,
            name: "Instalaciones Portuarias",
            showScreens: true,
            screenDelay: 5000,
          },
          {
            sceneId: "cartagena-3",
            duration: 20000,
            name: "Operaciones de Puerto",
            showScreens: true,
            screenDelay: 4000,
          },
          {
            sceneId: "cartagena-4",
            duration: 22000,
            name: "Infraestructura Portuaria",
            showScreens: true,
            screenDelay: 5000,
          },
          {
            sceneId: "cartagena-5",
            duration: 20000,
            name: "Operaciones Marítimas",
            showScreens: true,
            screenDelay: 4000,
          },
          {
            sceneId: "cartagena-6",
            duration: 25000,
            name: "Terminal Portuario",
            showScreens: true,
            screenDelay: 5000,
          },
          {
            sceneId: "cartagena-7",
            duration: 20000,
            name: "Operaciones Logísticas",
            showScreens: true,
            screenDelay: 4000,
          },
          {
            sceneId: "cartagena-8",
            duration: 30000,
            name: "Vista Panorámica Final",
            showScreens: false,
            screenDelay: 0,
          },
        ],
        totalDuration: 169000,
        autoLoop: false,
        showScreensAutomatically: true,
        transitions: {
          fadeOutTime: SEQUENCE_TIMING.DEFAULT_FADE_TIME_MS,
          loadTime: SEQUENCE_TIMING.DEFAULT_LOAD_TIME_MS,
          fadeInTime: SEQUENCE_TIMING.DEFAULT_FADE_TIME_MS,
        },
        editable: true,
      },
      {
        id: "meta-completo",
        name: "Secuencia Completa Meta",
        description: "Secuencia completa de todas las escenas de Meta",
        scenes: [
          {
            sceneId: "meta-1",
            duration: 15000,
            name: "Escenario Base",
            showScreens: false,
            screenDelay: 0,
          },
          {
            sceneId: "meta-2",
            duration: 25000,
            name: "Instalaciones Industriales",
            showScreens: true,
            screenDelay: 5000,
          },
          {
            sceneId: "meta-3",
            duration: 20000,
            name: "Operaciones de Campo",
            showScreens: true,
            screenDelay: 4000,
          },
          {
            sceneId: "meta-4",
            duration: 22000,
            name: "Tecnología Avanzada",
            showScreens: true,
            screenDelay: 5000,
          },
          {
            sceneId: "meta-5",
            duration: 20000,
            name: "Operaciones Especializadas",
            showScreens: true,
            screenDelay: 4000,
          },
          {
            sceneId: "meta-6",
            duration: 25000,
            name: "Infraestructura Moderna",
            showScreens: true,
            screenDelay: 5000,
          },
          {
            sceneId: "meta-7",
            duration: 25000,
            name: "Operaciones de Producción",
            showScreens: true,
            screenDelay: 5000,
          },
        ],
        totalDuration: 152000,
        autoLoop: false,
        showScreensAutomatically: true,
        transitions: {
          fadeOutTime: SEQUENCE_TIMING.DEFAULT_FADE_TIME_MS,
          loadTime: SEQUENCE_TIMING.DEFAULT_LOAD_TIME_MS,
          fadeInTime: SEQUENCE_TIMING.DEFAULT_FADE_TIME_MS,
        },
        editable: true,
      },
    ];

    // Calculate actual durations and store sequences
    defaultSequences.forEach((sequence) => {
      sequence.totalDuration = this.calculateSequenceDuration(sequence);
      this.availableSequences.set(sequence.id, sequence);
    });

    logger.info(
      `🎬 SequenceManager initialized with ${this.availableSequences.size} sequences`
    );
  }

  /**
   * Calculate total duration for a sequence including transitions
   */
  private calculateSequenceDuration(sequence: SequenceConfig): number {
    const scenesDuration = sequence.scenes.reduce(
      (total, scene) => total + scene.duration,
      0
    );
    const transitionsTime =
      (sequence.scenes.length - 1) *
      (sequence.transitions.fadeOutTime +
        sequence.transitions.loadTime +
        sequence.transitions.fadeInTime);
    return scenesDuration + transitionsTime;
  }

  /**
   * Start a sequence
   */
  async startSequence(
    sequenceId: string,
    config?: { autoLoop?: boolean; showScreensAutomatically?: boolean }
  ): Promise<boolean> {
    try {
      const sequence = this.availableSequences.get(sequenceId);
      if (!sequence) {
        throw new Error(`Sequence '${sequenceId}' not found`);
      }

      if (this.isActive) {
        await this.stopSequence();
      }

      // Apply config overrides
      if (config) {
        sequence.autoLoop = config.autoLoop ?? sequence.autoLoop;
        sequence.showScreensAutomatically =
          config.showScreensAutomatically ?? sequence.showScreensAutomatically;
      }

      this.currentSequence = sequence;
      this.currentSceneIndex = 0;
      this.isActive = true;
      this.isPaused = false;
      this.sequenceStartTime = Date.now();

      logger.info(
        `🎬 Starting sequence '${sequence.name}' with ${sequence.scenes.length} scenes`
      );

      // Start with first scene
      await this.loadScene(0);
      this.startProgressTimer();

      return true;
    } catch (error) {
      logger.error("Error starting sequence:", error);
      this.events.onError(error as Error);
      return false;
    }
  }

  /**
   * Stop current sequence
   */
  async stopSequence(): Promise<void> {
    if (!this.isActive) return;

    logger.info("⏹️ Stopping sequence");

    this.clearAllTimers();
    this.isActive = false;
    this.isPaused = false;
    this.currentSequence = null;
    this.currentSceneIndex = 0;
    this.remainingTimeWhenPaused = 0;
  }

  /**
   * Pause current sequence
   */
  pauseSequence(): boolean {
    if (!this.isActive || this.isPaused) return false;

    logger.info("⏸️ Pausing sequence");

    const now = Date.now();
    const sceneElapsed = now - this.sceneStartTime;
    const currentScene = this.getCurrentScene();

    if (currentScene) {
      this.remainingTimeWhenPaused = Math.max(
        0,
        currentScene.duration - sceneElapsed
      );
    }

    this.clearAllTimers();
    this.isPaused = true;

    if (this.currentSequence) {
      this.events.onSequencePaused(this.currentSequence.id);
    }

    return true;
  }

  /**
   * Resume paused sequence
   */
  resumeSequence(): boolean {
    if (!this.isActive || !this.isPaused) return false;

    logger.info("▶️ Resuming sequence");

    this.isPaused = false;
    this.sceneStartTime = Date.now();

    // Resume with remaining time
    this.scheduleNextScene(this.remainingTimeWhenPaused);
    this.startProgressTimer();

    if (this.currentSequence) {
      this.events.onSequenceResumed(this.currentSequence.id);
    }

    return true;
  }

  /**
   * Jump to next scene
   */
  async nextScene(): Promise<boolean> {
    if (!this.isActive || !this.currentSequence) return false;

    const nextIndex = this.currentSceneIndex + 1;
    if (nextIndex >= this.currentSequence.scenes.length) {
      // End of sequence
      await this.handleSequenceComplete();
      return false;
    }

    await this.loadScene(nextIndex);
    return true;
  }

  /**
   * Jump to previous scene
   */
  async previousScene(): Promise<boolean> {
    if (!this.isActive || !this.currentSequence || this.currentSceneIndex === 0)
      return false;

    const prevIndex = this.currentSceneIndex - 1;
    await this.loadScene(prevIndex);
    return true;
  }

  /**
   * Jump to specific scene by index
   */
  async jumpToScene(sceneIndex: number): Promise<boolean> {
    if (!this.isActive || !this.currentSequence) return false;

    if (sceneIndex < 0 || sceneIndex >= this.currentSequence.scenes.length) {
      return false;
    }

    await this.loadScene(sceneIndex);
    return true;
  }

  /**
   * Load and start a scene by index
   */
  private async loadScene(sceneIndex: number): Promise<void> {
    if (!this.currentSequence) throw new Error("No active sequence");

    const scene = this.currentSequence.scenes[sceneIndex];
    if (!scene) throw new Error(`Scene at index ${sceneIndex} not found`);

    this.clearSceneTimers();
    this.currentSceneIndex = sceneIndex;
    this.sceneStartTime = Date.now();

    logger.info(
      `🎬 Loading scene ${sceneIndex + 1}/${this.currentSequence.scenes.length}: ${scene.sceneId} (${scene.duration}ms)`
    );

    // Notify scene change
    this.events.onSceneChange(scene.sceneId, sceneIndex);

    // Schedule screens if enabled
    if (
      this.currentSequence.showScreensAutomatically &&
      scene.showScreens &&
      scene.screenDelay > 0
    ) {
      this.scheduleScreens(scene.screenDelay);
    }

    // Schedule next scene
    this.scheduleNextScene(scene.duration);
  }

  /**
   * Schedule screens to show after delay
   */
  private scheduleScreens(delayMs: number): void {
    this.screenTimer = setTimeout(() => {
      // Implementation would trigger screen show command
      logger.debug("📺 Triggering screen display");
    }, delayMs);
  }

  /**
   * Schedule next scene transition
   */
  private scheduleNextScene(delayMs: number): void {
    this.sceneTimer = setTimeout(async () => {
      if (!this.isActive || this.isPaused) return;

      const nextIndex = this.currentSceneIndex + 1;
      if (nextIndex >= this.currentSequence!.scenes.length) {
        await this.handleSequenceComplete();
      } else {
        await this.loadScene(nextIndex);
      }
    }, delayMs);
  }

  /**
   * Handle sequence completion
   */
  private async handleSequenceComplete(): Promise<void> {
    if (!this.currentSequence) return;

    logger.info(`✅ Sequence '${this.currentSequence.name}' completed`);

    const sequenceId = this.currentSequence.id;
    const shouldLoop = this.currentSequence.autoLoop;

    if (shouldLoop) {
      logger.info("🔄 Auto-looping sequence");
      this.currentSceneIndex = 0;
      await this.loadScene(0);
    } else {
      this.events.onSequenceComplete(sequenceId);
      await this.stopSequence();
    }
  }

  /**
   * Start progress update timer
   */
  private startProgressTimer(): void {
    this.progressTimer = setInterval(() => {
      if (!this.isActive || this.isPaused || !this.currentSequence) return;

      const now = Date.now();
      const totalElapsed = now - this.sequenceStartTime;
      const progress = Math.min(
        1,
        totalElapsed / this.currentSequence.totalDuration
      );
      const remainingMs = Math.max(
        0,
        this.currentSequence.totalDuration - totalElapsed
      );

      this.events.onProgress(progress, remainingMs);
    }, SEQUENCE_TIMING.PROGRESS_UPDATE_INTERVAL_MS);
  }

  /**
   * Clear all timers
   */
  private clearAllTimers(): void {
    this.clearSceneTimers();

    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  /**
   * Clear scene-related timers
   */
  private clearSceneTimers(): void {
    if (this.sceneTimer) {
      clearTimeout(this.sceneTimer);
      this.sceneTimer = null;
    }

    if (this.screenTimer) {
      clearTimeout(this.screenTimer);
      this.screenTimer = null;
    }
  }

  /**
   * Get current scene
   */
  private getCurrentScene(): SequenceScene | null {
    if (
      !this.currentSequence ||
      this.currentSceneIndex < 0 ||
      this.currentSceneIndex >= this.currentSequence.scenes.length
    ) {
      return null;
    }
    return this.currentSequence.scenes[this.currentSceneIndex];
  }

  /**
   * Get current sequence state
   */
  getState(): SequenceState {
    if (!this.isActive || !this.currentSequence) {
      return {
        isActive: false,
        isPaused: false,
        currentSceneIndex: 0,
        progress: 0,
        autoLoop: false,
      };
    }

    const now = Date.now();
    const totalElapsed = now - this.sequenceStartTime;
    const progress = Math.min(
      1,
      totalElapsed / this.currentSequence.totalDuration
    );
    const remainingMs = Math.max(
      0,
      this.currentSequence.totalDuration - totalElapsed
    );

    return {
      isActive: true,
      isPaused: this.isPaused,
      currentSequence: this.currentSequence,
      currentSceneIndex: this.currentSceneIndex,
      sceneStartTime: this.sceneStartTime,
      sequenceStartTime: this.sequenceStartTime,
      remainingTime: remainingMs,
      progress: progress,
      autoLoop: this.currentSequence.autoLoop,
    };
  }

  /**
   * Get available sequences
   */
  getAvailableSequences(): SequenceConfig[] {
    return Array.from(this.availableSequences.values());
  }

  /**
   * Add or update a sequence
   */
  setSequence(sequence: SequenceConfig): void {
    sequence.totalDuration = this.calculateSequenceDuration(sequence);
    this.availableSequences.set(sequence.id, sequence);
    logger.info(`📝 Updated sequence '${sequence.name}'`);
  }

  /**
   * Remove a sequence
   */
  removeSequence(sequenceId: string): boolean {
    if (this.isActive && this.currentSequence?.id === sequenceId) {
      this.stopSequence();
    }

    const removed = this.availableSequences.delete(sequenceId);
    if (removed) {
      logger.info(`🗑️ Removed sequence '${sequenceId}'`);
    }
    return removed;
  }
}
