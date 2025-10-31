// ===== DIRECTOR API - COREOGRAFIA CENTRALIZADA =====
// API principal para controle orquestrado de animações
// Interface de alto nível para direção de cena

import type {
  AnimationID,
  ChapterId,
  CTAVariant,
} from "@/lib/types/design-system";
import {
  LayerManager,
  AnimationLayer,
  AnimationState,
  InterruptionType,
} from "./layers-model";
import { TimelineController } from "./timeline-semantic";
import { AnimationController } from "@/lib/theme/animation-controller";

// ===== DIRECTOR CONFIG =====

/** Director configuration */
export interface DirectorConfig {
  /** Maximum concurrent animations */
  maxConcurrent: number;

  /** CPU budget thresholds */
  cpuBudget: "low" | "medium" | "high";

  /** Layer concurrency overrides */
  layerConcurrency?: Partial<Record<AnimationLayer, number>>;

  /** Auto-preemption enabled */
  autoPreemption: boolean;

  /** Reduced motion mappings */
  reducedMotionMappings: Record<string, unknown>;

  /** Telemetry enabled */
  telemetryEnabled: boolean;
}

/** Default director configuration */
const DEFAULT_DIRECTOR_CONFIG: DirectorConfig = {
  maxConcurrent: 3,
  cpuBudget: "medium",
  autoPreemption: true,
  reducedMotionMappings: {
    translate: "opacity",
    scale: "opacity",
    blur: "none",
  },
  telemetryEnabled: true,
};

// ===== BUDGET SYSTEM =====

/** CPU budget thresholds */
const CPU_BUDGETS = {
  low: { maxFrameTime: 20, maxConcurrent: 2 },
  medium: { maxFrameTime: 16.67, maxConcurrent: 3 },
  high: { maxFrameTime: 13.33, maxConcurrent: 5 },
} as const;

// ===== DIRECTOR CLASS =====

/** Main animation director */
export class AnimationDirector {
  private static instance: AnimationDirector;
  private config: DirectorConfig;
  private layerManager: LayerManager;
  private timelineController: TimelineController;
  private animationController: ReturnType<
    typeof AnimationController.getInstance
  >;
  private activeTimelines: Set<string> = new Set();
  private lockedLayers: Set<AnimationLayer> = new Set();

  private constructor() {
    this.config = DEFAULT_DIRECTOR_CONFIG;
    this.layerManager = LayerManager.getInstance();
    this.timelineController = TimelineController.getInstance();
    this.animationController = AnimationController.getInstance();
  }

  static getInstance(): AnimationDirector {
    if (!AnimationDirector.instance) {
      AnimationDirector.instance = new AnimationDirector();
    }
    return AnimationDirector.instance;
  }

  // ===== CONFIGURATION =====

  /** Configure director */
  configure(config: Partial<DirectorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /** Get current configuration */
  getConfig(): DirectorConfig {
    return { ...this.config };
  }

  // ===== TIMELINE MANAGEMENT =====

  /** Create timeline */
  createTimeline(
    id: string,
    config: {
      layer: AnimationLayer;
      priority?: number;
      loop?: boolean;
      reducedMotionMap?: Record<string, unknown>;
    },
  ) {
    const timeline = this.timelineController.create(id, {
      // Timeline-specific overrides can go here
    });

    this.activeTimelines.add(timeline.id);
    return timeline;
  }

  /** Play timeline */
  play(id: string): void {
    this.timelineController.play(id);
    this.trackEvent("timeline_play", { timelineId: id });
  }

  /** Pause timeline */
  pause(id: string): void {
    this.timelineController.pause(id);
    this.trackEvent("timeline_pause", { timelineId: id });
  }

  /** Resume timeline */
  resume(id: string): void {
    this.timelineController.resume(id);
    this.trackEvent("timeline_resume", { timelineId: id });
  }

  /** Cancel timeline */
  cancel(id: string, options: { graceMs?: number } = {}): void {
    const { graceMs = 0 } = options;
    this.timelineController.cancel(id, graceMs);
    this.trackEvent("timeline_cancel", { timelineId: id, graceMs });
  }

  /** Seek timeline */
  seek(id: string, timeMs: number): void {
    this.timelineController.seek(id, timeMs);
    this.trackEvent("timeline_seek", { timelineId: id, timeMs });
  }

  /** Set timeline speed */
  setSpeed(id: string, factor: number): void {
    this.timelineController.setSpeed(id, factor);
    this.trackEvent("timeline_speed_change", { timelineId: id, factor });
  }

  // ===== SCROLL SYNC =====

  /** Bind timeline to scroll */
  bindScroll(
    id: string,
    config: {
      rangePx?: { start: number; end: number };
      progress$?: { min: number; max: number };
      damping?: number;
    },
  ): void {
    this.timelineController.bindScroll(id, config);
    this.trackEvent("timeline_scroll_bind", { timelineId: id, config });
  }

  // ===== EVENT BINDING =====

  /** Bind to timeline events */
  on(
    id: string,
    eventType: "marker" | "region",
    targetId: string,
    callback: () => void,
  ): void {
    this.timelineController.on(id, eventType, targetId, callback);
  }

  // ===== CUE SYSTEM =====

  /** Trigger cue */
  cue(cueId: string): void {
    // Find timeline containing this cue
    for (const timelineId of Array.from(this.activeTimelines)) {
      const definition = this.timelineController.getDefinition(timelineId);
      if (!definition) continue;

      const cue = definition.cues.find((c) => c.id === cueId);
      if (cue) {
        this.executeCue(cue, timelineId);
        this.trackEvent("cue_triggered", { cueId, timelineId });
        break;
      }
    }
  }

  /** Execute cue action */
  private executeCue(cue: unknown, timelineId: string): void {
    const cueData = cue as { action?: string; params?: { time?: number } };
    switch (cueData.action) {
      case "start":
        // Animation control not implemented yet
        break;
      case "stop":
        // Animation control not implemented yet
        break;
      case "pause":
        // Animation control not implemented yet
        break;
      case "resume":
        // Animation control not implemented yet
        break;
      case "seek":
        if (cueData.params?.time !== undefined) {
          this.seek(timelineId, cueData.params.time);
        }
        break;
    }
  }

  // ===== LAYER MANAGEMENT =====

  /** Lock layer */
  lock(layer: AnimationLayer): void {
    this.layerManager.lockLayer(layer);
    this.lockedLayers.add(layer);
    this.trackEvent("layer_locked", { layer });
  }

  /** Unlock layer */
  unlock(layer: AnimationLayer): void {
    this.layerManager.unlockLayer(layer);
    this.lockedLayers.delete(layer);
    this.trackEvent("layer_unlocked", { layer });
  }

  /** Check if layer can accept new animations */
  canAcceptAnimation(layer: AnimationLayer, animationId: AnimationID): boolean {
    return this.layerManager.canStartAnimation(layer, animationId);
  }

  // ===== BUDGET MANAGEMENT =====

  /** Set performance budget */
  setBudget(budget: DirectorConfig["cpuBudget"]): void {
    this.config.cpuBudget = budget;

    const budgetConfig = CPU_BUDGETS[budget];
    this.config.maxConcurrent = budgetConfig.maxConcurrent;

    this.trackEvent("budget_changed", {
      budget,
      maxConcurrent: budgetConfig.maxConcurrent,
    });
  }

  /** Get current budget status */
  getBudgetStatus() {
    const budget = CPU_BUDGETS[this.config.cpuBudget];
    const activeAnimations = this.layerManager.getTotalActiveAnimations();

    return {
      budget: this.config.cpuBudget,
      maxConcurrent: budget.maxConcurrent,
      activeAnimations,
      withinBudget: activeAnimations <= budget.maxConcurrent,
      layerBreakdown: Object.values(AnimationLayer).map((layer) => ({
        layer,
        active: this.layerManager.getActiveAnimationsByLayer(layer).length,
        max: budget.maxConcurrent, // Simplified - could be layer-specific
      })),
    };
  }

  // ===== INTERRUPTIBILITY =====

  /** Interrupt animation gracefully */
  interrupt(animationId: AnimationID, type: InterruptionType): void {
    this.layerManager.interruptAnimation(animationId, type);

    // Handle interruption based on type
    switch (type) {
      case InterruptionType.SOFT:
        // Allow current easing to complete, then clean up
        setTimeout(() => {
          this.forceInterrupt(animationId);
        }, 300); // Standard easing duration
        break;

      case InterruptionType.HARD:
        // Immediate cleanup
        this.forceInterrupt(animationId);
        break;

      case InterruptionType.PREEMPTION:
        // Higher priority took over
        this.forceInterrupt(animationId);
        break;
    }

    this.trackEvent("animation_interrupted", { animationId, type });
  }

  /** Force interrupt animation */
  private forceInterrupt(animationId: AnimationID): void {
    // Clean up layer tracking
    this.layerManager.unregisterAnimation(animationId);
  }

  // ===== TELEMETRY =====

  /** Track director event */
  private trackEvent(event: string, data: Record<string, unknown>): void {
    if (!this.config.telemetryEnabled) return;

    // Send to analytics system
    console.log(`[Director] ${event}:`, data);

    // In production, this would send to your analytics service
    // analytics.track(`animation_${event}`, data)
  }

  // ===== MONITORING =====

  /** Get director status */
  getStatus() {
    return {
      config: this.config,
      activeTimelines: Array.from(this.activeTimelines),
      lockedLayers: Array.from(this.lockedLayers),
      budget: this.getBudgetStatus(),
      layerStates: this.layerManager.getAllLayerStates(),
    };
  }

  /** Reset director state */
  reset(): void {
    // Cancel all active timelines
    for (const timelineId of Array.from(this.activeTimelines)) {
      this.cancel(timelineId, { graceMs: 0 });
    }

    // Unlock all layers
    for (const layer of Array.from(this.lockedLayers)) {
      this.unlock(layer);
    }

    // Reset managers
    this.layerManager.reset();
    this.activeTimelines.clear();
    this.lockedLayers.clear();

    this.trackEvent("director_reset", {});
  }
}

// ===== GLOBAL DIRECTOR INSTANCE =====
export const director = AnimationDirector.getInstance();

// ===== HOOKS =====

/** Hook for director access */
export function useDirector() {
  return {
    // Timeline management
    createTimeline: (
      id: string,
      config: Parameters<AnimationDirector["createTimeline"]>[1],
    ) => director.createTimeline(id, config),

    play: (id: string) => director.play(id),
    pause: (id: string) => director.pause(id),
    resume: (id: string) => director.resume(id),
    cancel: (
      id: string,
      options?: Parameters<AnimationDirector["cancel"]>[1],
    ) => director.cancel(id, options),

    seek: (id: string, time: number) => director.seek(id, time),
    setSpeed: (id: string, factor: number) => director.setSpeed(id, factor),

    // Event binding
    on: (
      id: string,
      eventType: "marker" | "region",
      targetId: string,
      callback: () => void,
    ) => director.on(id, eventType, targetId, callback),

    // Scroll sync
    bindScroll: (
      id: string,
      config: Parameters<AnimationDirector["bindScroll"]>[1],
    ) => director.bindScroll(id, config),

    // Cue system
    cue: (cueId: string) => director.cue(cueId),

    // Layer management
    lock: (layer: AnimationLayer) => director.lock(layer),
    unlock: (layer: AnimationLayer) => director.unlock(layer),
    canAcceptAnimation: (layer: AnimationLayer, id: AnimationID) =>
      director.canAcceptAnimation(layer, id),

    // Budget management
    setBudget: (budget: DirectorConfig["cpuBudget"]) =>
      director.setBudget(budget),
    getBudgetStatus: () => director.getBudgetStatus(),

    // Monitoring
    getStatus: () => director.getStatus(),
    reset: () => director.reset(),

    // Configuration
    configure: (config: Partial<DirectorConfig>) => director.configure(config),
    getConfig: () => director.getConfig(),
  };
}

/** Hook for chapter-specific director control */
export function useChapterDirector(chapterId: ChapterId) {
  const director = useDirector();

  return {
    // Chapter-specific methods
    playChapter: () => director.play(`chapter:${chapterId}`),
    pauseChapter: () => director.pause(`chapter:${chapterId}`),
    resumeChapter: () => director.resume(`chapter:${chapterId}`),
    cancelChapter: (options?: Parameters<AnimationDirector["cancel"]>[1]) =>
      director.cancel(`chapter:${chapterId}`, options),

    // Chapter cues
    cueHeroEnter: () => director.cue("hero.enter"),
    cueHowStepB: () => director.cue("how.stepB"),
    cuePricingHighlight: () => director.cue("pricing.highlight"),

    // All director methods
    ...director,
  };
}

// ===== UTILITY FUNCTIONS =====

/** Create chapter timeline with director */
export function createChapterTimeline(chapterId: ChapterId) {
  const timelineId = `chapter:${chapterId}`;

  return director.createTimeline(timelineId, {
    layer: AnimationLayer.MID, // Default layer for chapters
    priority: 2,
    loop: false,
  });
}

/** Quick chapter cue trigger */
export function cueChapter(chapterId: ChapterId, cueName: string) {
  director.cue(`${chapterId}.${cueName}`);
}

/** Emergency stop all animations */
export function emergencyStop() {
  director.reset();
  console.warn(
    "[Director] Emergency stop triggered - all animations cancelled",
  );
}
