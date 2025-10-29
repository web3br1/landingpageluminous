// ===== ANIMATION LAYERS MODEL =====
// Modelo de camadas para controle de prioridade e preempção
// BG < MID < FG < FX (ordem crescente de prioridade)

import type { AnimationID, ChapterId } from "@/lib/types/design-system";

// ===== LAYER DEFINITIONS =====

/** Animation layers by priority */
export enum AnimationLayer {
  /** Background elements (gradients, orbs, particles) - lowest priority */
  BG = "bg",

  /** Middle content (cards, headings, graphics) - medium priority */
  MID = "mid",

  /** Foreground elements (overlays, CTAs, feedback) - high priority */
  FG = "fg",

  /** Special effects (wipes, crossfades) - highest priority */
  FX = "fx",
}

/** Layer priority mapping (higher number = higher priority) */
export const LAYER_PRIORITY: Record<AnimationLayer, number> = {
  [AnimationLayer.BG]: 1,
  [AnimationLayer.MID]: 2,
  [AnimationLayer.FG]: 3,
  [AnimationLayer.FX]: 4,
} as const;

/** Maximum concurrent animations per layer */
export const LAYER_CONCURRENCY_LIMIT: Record<AnimationLayer, number> = {
  [AnimationLayer.BG]: 2, // Background can have more concurrent animations
  [AnimationLayer.MID]: 3, // Content layer standard limit
  [AnimationLayer.FG]: 2, // UI elements more selective
  [AnimationLayer.FX]: 1, // Special effects are exclusive
} as const;

/** Total maximum concurrent animations across all layers */
export const TOTAL_CONCURRENCY_LIMIT = 3;

// ===== ANIMATION STATES =====

/** Animation lifecycle states */
export enum AnimationState {
  IDLE = "idle",
  PENDING = "pending",
  RUNNING = "running",
  PAUSED = "paused",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  INTERRUPTED = "interrupted",
}

/** Animation interruption types */
export enum InterruptionType {
  /** Soft cancel: complete current easing then clean up */
  SOFT = "soft",

  /** Hard cancel: immediate cleanup to stable state */
  HARD = "hard",

  /** Preemption: higher priority animation takes over */
  PREEMPTION = "preemption",
}

// ===== ANIMATION METADATA =====

/** Animation metadata structure */
export interface AnimationMetadata {
  id: AnimationID;
  layer: AnimationLayer;
  chapterId?: ChapterId;
  priority: number;
  state: AnimationState;
  startTime: number;
  duration: number;
  progress: number; // 0-1
  isReducedMotion: boolean;
  canBeInterrupted: boolean;
  tags: string[]; // For grouping/filtering
}

/** Animation configuration */
export interface AnimationConfig {
  id: AnimationID;
  layer: AnimationLayer;
  duration: number;
  easing: string | number[];
  loop?: boolean | number;
  delay?: number;
  chapterId?: ChapterId;
  canBeInterrupted?: boolean;
  tags?: string[];
  onStart?: () => void;
  onComplete?: () => void;
  onInterrupt?: (type: InterruptionType) => void;
  onProgress?: (progress: number) => void;
}

// ===== LAYER MANAGER =====

/** Layer state and management */
interface LayerState {
  activeAnimations: Set<AnimationID>;
  queuedAnimations: AnimationID[];
  locked: boolean;
  starvationCount: number;
  lastPreemptionTime: number;
}

/** Global animation layer manager */
export class LayerManager {
  private static instance: LayerManager;
  private layers: Map<AnimationLayer, LayerState> = new Map();
  private animationRegistry: Map<AnimationID, AnimationMetadata> = new Map();
  private globalLock: boolean = false;

  private constructor() {
    // Initialize layer states
    Object.values(AnimationLayer).forEach((layer) => {
      this.layers.set(layer, {
        activeAnimations: new Set(),
        queuedAnimations: [],
        locked: false,
        starvationCount: 0,
        lastPreemptionTime: Date.now(),
      });
    });
  }

  static getInstance(): LayerManager {
    if (!LayerManager.instance) {
      LayerManager.instance = new LayerManager();
    }
    return LayerManager.instance;
  }

  // ===== REGISTRATION =====

  /** Register a new animation */
  registerAnimation(config: AnimationConfig): AnimationMetadata {
    const metadata: AnimationMetadata = {
      id: config.id,
      layer: config.layer,
      chapterId: config.chapterId,
      priority: LAYER_PRIORITY[config.layer],
      state: AnimationState.IDLE,
      startTime: 0,
      duration: config.duration,
      progress: 0,
      isReducedMotion: false, // Will be set by controller
      canBeInterrupted: config.canBeInterrupted ?? true,
      tags: config.tags ?? [],
    };

    this.animationRegistry.set(config.id, metadata);
    return metadata;
  }

  /** Unregister animation */
  unregisterAnimation(animationId: AnimationID): void {
    this.animationRegistry.delete(animationId);

    // Remove from all layer states
    this.layers.forEach((layerState) => {
      layerState.activeAnimations.delete(animationId);
      const queueIndex = layerState.queuedAnimations.indexOf(animationId);
      if (queueIndex > -1) {
        layerState.queuedAnimations.splice(queueIndex, 1);
      }
    });
  }

  // ===== STATE MANAGEMENT =====

  /** Update animation state */
  updateAnimationState(
    animationId: AnimationID,
    state: AnimationState,
    progress?: number,
  ): void {
    const metadata = this.animationRegistry.get(animationId);
    if (!metadata) return;

    metadata.state = state;
    if (progress !== undefined) {
      metadata.progress = progress;
    }

    const layerState = this.layers.get(metadata.layer)!;

    // Update layer tracking
    switch (state) {
      case AnimationState.RUNNING:
        layerState.activeAnimations.add(animationId);
        // Remove from queue if present
        const queueIndex = layerState.queuedAnimations.indexOf(animationId);
        if (queueIndex > -1) {
          layerState.queuedAnimations.splice(queueIndex, 1);
        }
        break;

      case AnimationState.COMPLETED:
      case AnimationState.CANCELLED:
      case AnimationState.INTERRUPTED:
        layerState.activeAnimations.delete(animationId);
        break;
    }
  }

  // ===== PRIORITY & PREEMPTION =====

  /** Check if animation can start based on layer limits */
  canStartAnimation(layer: AnimationLayer, animationId: AnimationID): boolean {
    if (this.globalLock) return false;

    const layerState = this.layers.get(layer)!;
    if (layerState.locked) return false;

    const activeCount = layerState.activeAnimations.size;
    const maxConcurrent = LAYER_CONCURRENCY_LIMIT[layer];

    // Check layer-specific limit
    if (activeCount >= maxConcurrent) {
      return false;
    }

    // Check global limit
    const totalActive = this.getTotalActiveAnimations();
    if (totalActive >= TOTAL_CONCURRENCY_LIMIT) {
      // Try to preempt lower priority animations
      return this.attemptPreemption(layer, animationId);
    }

    return true;
  }

  /** Attempt to preempt lower priority animations */
  private attemptPreemption(
    requestingLayer: AnimationLayer,
    animationId: AnimationID,
  ): boolean {
    const requestingPriority = LAYER_PRIORITY[requestingLayer];

    // Find animations to preempt (lower priority, interruptible)
    const animationsToPreempt: AnimationID[] = [];

    for (const [layer, layerState] of Array.from(this.layers.entries())) {
      if (LAYER_PRIORITY[layer] < requestingPriority) {
        for (const activeId of Array.from(layerState.activeAnimations)) {
          const metadata = this.animationRegistry.get(activeId);
          if (metadata?.canBeInterrupted) {
            animationsToPreempt.push(activeId);
          }
        }
      }
    }

    if (animationsToPreempt.length === 0) {
      return false; // Cannot preempt anything
    }

    // Preempt the animations (will trigger interruption callbacks)
    animationsToPreempt.forEach((id) => {
      this.interruptAnimation(id, InterruptionType.PREEMPTION);
    });

    return true;
  }

  /** Interrupt an animation */
  interruptAnimation(animationId: AnimationID, type: InterruptionType): void {
    const metadata = this.animationRegistry.get(animationId);
    if (!metadata) return;

    // Update metadata
    metadata.state = AnimationState.INTERRUPTED;

    // Update layer tracking
    const layerState = this.layers.get(metadata.layer)!;
    layerState.activeAnimations.delete(animationId);

    // Track preemption for starvation prevention
    if (type === InterruptionType.PREEMPTION) {
      layerState.starvationCount++;
      layerState.lastPreemptionTime = Date.now();
    }

    // Trigger interruption callback (will be handled by animation controller)
    // The actual interruption logic is handled by the animation implementation
  }

  // ===== STARVATION PREVENTION =====

  /** Check for starvation and apply protection */
  checkStarvationProtection(layer: AnimationLayer): boolean {
    const layerState = this.layers.get(layer)!;
    const now = Date.now();

    // Reset starvation count if enough time has passed
    if (now - layerState.lastPreemptionTime > 3000) {
      // 3 seconds
      layerState.starvationCount = 0;
      return false;
    }

    // If preempted more than 2 times in last 2 seconds, protect this layer
    if (layerState.starvationCount > 2) {
      layerState.locked = true;

      // Unlock after protection period
      setTimeout(() => {
        layerState.locked = false;
        layerState.starvationCount = 0;
      }, 3000);

      return true; // Protected
    }

    return false; // Not protected
  }

  // ===== LAYER LOCKING =====

  /** Lock a specific layer */
  lockLayer(layer: AnimationLayer): void {
    const layerState = this.layers.get(layer)!;
    layerState.locked = true;
  }

  /** Unlock a specific layer */
  unlockLayer(layer: AnimationLayer): void {
    const layerState = this.layers.get(layer)!;
    layerState.locked = false;
  }

  /** Lock all layers globally */
  lockGlobal(): void {
    this.globalLock = true;
  }

  /** Unlock all layers globally */
  unlockGlobal(): void {
    this.globalLock = false;
  }

  // ===== UTILITIES =====

  /** Get total active animations across all layers */
  getTotalActiveAnimations(): number {
    let total = 0;
    this.layers.forEach((layerState) => {
      total += layerState.activeAnimations.size;
    });
    return total;
  }

  /** Get active animations by layer */
  getActiveAnimationsByLayer(layer: AnimationLayer): AnimationID[] {
    const layerState = this.layers.get(layer)!;
    return Array.from(layerState.activeAnimations);
  }

  /** Get all active animations */
  getAllActiveAnimations(): AnimationID[] {
    const allActive: AnimationID[] = [];
    this.layers.forEach((layerState) => {
      allActive.push(...Array.from(layerState.activeAnimations));
    });
    return allActive;
  }

  /** Get animation metadata */
  getAnimationMetadata(animationId: AnimationID): AnimationMetadata | null {
    return this.animationRegistry.get(animationId) || null;
  }

  /** Get layer state */
  getLayerState(layer: AnimationLayer): LayerState {
    return { ...this.layers.get(layer)! };
  }

  /** Get all layer states for debugging */
  getAllLayerStates(): Record<AnimationLayer, LayerState> {
    const states: Partial<Record<AnimationLayer, LayerState>> = {};
    this.layers.forEach((state, layer) => {
      states[layer] = { ...state };
    });
    return states as Record<AnimationLayer, LayerState>;
  }

  // ===== CLEANUP =====

  /** Reset all layer states (for testing/debugging) */
  reset(): void {
    this.layers.clear();
    this.animationRegistry.clear();
    this.globalLock = false;

    // Reinitialize
    Object.values(AnimationLayer).forEach((layer) => {
      this.layers.set(layer, {
        activeAnimations: new Set(),
        queuedAnimations: [],
        locked: false,
        starvationCount: 0,
        lastPreemptionTime: Date.now(),
      });
    });
  }
}

// ===== HOOKS =====

/** Hook for layer management */
export function useLayerManager() {
  const manager = LayerManager.getInstance();

  return {
    // Registration
    registerAnimation: (config: AnimationConfig) =>
      manager.registerAnimation(config),
    unregisterAnimation: (id: AnimationID) => manager.unregisterAnimation(id),

    // State management
    updateAnimationState: (
      id: AnimationID,
      state: AnimationState,
      progress?: number,
    ) => manager.updateAnimationState(id, state, progress),

    // Priority checks
    canStartAnimation: (layer: AnimationLayer, id: AnimationID) =>
      manager.canStartAnimation(layer, id),

    // Layer control
    lockLayer: (layer: AnimationLayer) => manager.lockLayer(layer),
    unlockLayer: (layer: AnimationLayer) => manager.unlockLayer(layer),
    lockGlobal: () => manager.lockGlobal(),
    unlockGlobal: () => manager.unlockGlobal(),

    // Interruption
    interruptAnimation: (id: AnimationID, type: InterruptionType) =>
      manager.interruptAnimation(id, type),

    // Monitoring
    getTotalActiveAnimations: () => manager.getTotalActiveAnimations(),
    getActiveAnimationsByLayer: (layer: AnimationLayer) =>
      manager.getActiveAnimationsByLayer(layer),
    getAllActiveAnimations: () => manager.getAllActiveAnimations(),
    getLayerState: (layer: AnimationLayer) => manager.getLayerState(layer),
    getAllLayerStates: () => manager.getAllLayerStates(),
  };
}
