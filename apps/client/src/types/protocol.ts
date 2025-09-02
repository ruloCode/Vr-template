// Re-export protocol types from server for consistency
export * from '../../../server/src/types/protocol.js';

// Additional client-specific types
export interface AssetManifest {
  version: string;
  scenes: VRScene[];
}

export interface VRScene {
  id: string;
  title: string;
  image360: string;
  audio: string;
  durationSec: number;
  description?: string;
}

export interface PreloadProgress {
  totalAssets: number;
  loadedAssets: number;
  currentAsset: string;
  percentage: number;
  errors: string[];
}

export interface AudioState {
  context: AudioContext | null;
  isUnlocked: boolean;
  currentSource: AudioBufferSourceNode | null;
  currentBuffer: AudioBuffer | null;
  gainNode: GainNode | null;
  startTime: number;
  pauseTime: number;
  isPlaying: boolean;
}

export interface AppState {
  // Connection state
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  
  // Audio state
  audioUnlocked: boolean;
  audioState: AudioState;
  
  // Preload state
  preloadComplete: boolean;
  preloadProgress: PreloadProgress;
  
  // Scene state
  currentScene: VRScene | null;
  availableScenes: VRScene[];
  
  // Sync state
  serverTime: number;
  clientOffset: number;
  latency: number;
  
  // UI state
  showDebug: boolean;
  showControls: boolean;
  isFullscreen: boolean;
  
  // Device info
  deviceId: string;
  battery: number | null;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WSConnectionOptions {
  url?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}


