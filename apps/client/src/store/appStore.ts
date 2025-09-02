import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { AppState, VRScene, PreloadProgress, AudioState } from '@/types/protocol';

interface AppStore extends AppState {
  // Actions
  setConnectionStatus: (status: AppState['connectionStatus']) => void;
  setAudioUnlocked: (unlocked: boolean) => void;
  setPreloadProgress: (progress: Partial<PreloadProgress>) => void;
  setCurrentScene: (scene: VRScene | null) => void;
  setAvailableScenes: (scenes: VRScene[]) => void;
  updateServerTime: (serverTime: number, clientOffset: number, latency: number) => void;
  setDebugMode: (show: boolean) => void;
  setControlsVisible: (show: boolean) => void;
  setFullscreen: (fullscreen: boolean) => void;
  updateBattery: (level: number) => void;
  initializeAudioState: (context: AudioContext) => void;
  updateAudioState: (updates: Partial<AudioState>) => void;
}

// Generate device ID
const generateDeviceId = (): string => {
  const stored = localStorage.getItem('vr-device-id');
  if (stored) return stored;
  
  const id = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('vr-device-id', id);
  return id;
};

// Get battery level
const getBatteryLevel = async (): Promise<number | null> => {
  try {
    if ('getBattery' in navigator) {
      const battery = await (navigator as any).getBattery();
      return Math.round(battery.level * 100);
    }
  } catch (error) {
    console.warn('Battery API not available:', error);
  }
  return null;
};

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set) => ({
    // Initial state
    isConnected: false,
    connectionStatus: 'disconnected',
    
    audioUnlocked: false,
    audioState: {
      context: null,
      isUnlocked: false,
      currentSource: null,
      currentBuffer: null,
      gainNode: null,
      startTime: 0,
      pauseTime: 0,
      isPlaying: false
    },
    
    preloadComplete: false,
    preloadProgress: {
      totalAssets: 0,
      loadedAssets: 0,
      currentAsset: '',
      percentage: 0,
      errors: []
    },
    
    currentScene: null,
    availableScenes: [],
    
    serverTime: 0,
    clientOffset: 0,
    latency: 0,
    
    showDebug: import.meta.env.VITE_DEBUG === 'true',
    showControls: false,
    isFullscreen: false,
    
    deviceId: generateDeviceId(),
    battery: null,
    
    // Actions
    setConnectionStatus: (status) => set({ 
      connectionStatus: status,
      isConnected: status === 'connected' 
    }),
    
    setAudioUnlocked: (unlocked) => set({ audioUnlocked: unlocked }),
    
    setPreloadProgress: (progress) => set((state) => ({
      preloadProgress: { ...state.preloadProgress, ...progress },
      preloadComplete: progress.percentage === 100
    })),
    
    setCurrentScene: (scene) => set({ currentScene: scene }),
    
    setAvailableScenes: (scenes) => set({ availableScenes: scenes }),
    
    updateServerTime: (serverTime, clientOffset, latency) => set({
      serverTime,
      clientOffset,
      latency
    }),
    
    setDebugMode: (show) => set({ showDebug: show }),
    
    setControlsVisible: (show) => set({ showControls: show }),
    
    setFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),
    
    updateBattery: (level) => set({ battery: level }),
    
    initializeAudioState: (context) => {
      const gainNode = context.createGain();
      gainNode.connect(context.destination);
      
      set((state) => ({
        audioState: {
          ...state.audioState,
          context,
          gainNode,
          isUnlocked: true
        },
        audioUnlocked: true
      }));
    },
    
    updateAudioState: (updates) => set((state) => ({
      audioState: { ...state.audioState, ...updates }
    }))
  }))
);

// Subscribe to battery changes
getBatteryLevel().then(level => {
  if (level !== null) {
    useAppStore.getState().updateBattery(level);
  }
});

// Listen for battery level changes
if ('getBattery' in navigator) {
  (navigator as any).getBattery().then((battery: any) => {
    battery.addEventListener('levelchange', () => {
      useAppStore.getState().updateBattery(Math.round(battery.level * 100));
    });
  });
}

// Listen for fullscreen changes
document.addEventListener('fullscreenchange', () => {
  useAppStore.getState().setFullscreen(!!document.fullscreenElement);
});

// Debug mode toggle with keyboard
if (import.meta.env.DEV) {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'D')) {
      const { showDebug, setDebugMode } = useAppStore.getState();
      setDebugMode(!showDebug);
    }
  });
}


