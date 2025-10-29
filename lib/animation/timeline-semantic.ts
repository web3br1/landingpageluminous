// ===== TIMELINE SEMANTIC SYSTEM =====
// Sistema de timeline semântica com cues, markers e regions
// Permite controle narrativo determinístico de animações

import type {
  AnimationID,
  ChapterId,
  HSLString,
} from "@/lib/types/design-system";
import { generateId } from "@/lib/utils/advanced-utils";

// ===== TIMELINE STRUCTURES =====

/** Timeline marker (point in time) */
export interface TimelineMarker {
  id: string;
  time: number; // milliseconds from timeline start
  label?: string;
  data?: Record<string, unknown>; // Additional context
}

/** Timeline cue (named trigger point) */
export interface TimelineCue {
  id: string;
  markerId: string;
  action: "start" | "stop" | "pause" | "resume" | "seek";
  targetAnimation?: AnimationID;
  params?: Record<string, unknown>;
}

/** Timeline region (time range with properties) */
export interface TimelineRegion {
  id: string;
  startMarker: string;
  endMarker: string;
  properties: {
    speed?: number; // Time dilation factor
    layerLock?: boolean;
    scrollSync?: boolean;
    reducedMotionMap?: Record<string, unknown>;
  };
  events?: {
    onEnter?: () => void;
    onExit?: () => void;
    onProgress?: (progress: number) => void;
  };
}

/** Timeline definition */
export interface TimelineDefinition {
  id: string;
  chapterId?: ChapterId;
  duration: number; // Total duration in ms
  markers: TimelineMarker[];
  cues: TimelineCue[];
  regions: TimelineRegion[];
  loop?: boolean;
  speed?: number; // Default speed multiplier
  tags?: string[];
}

/** Timeline instance state */
export interface TimelineInstance {
  id: string;
  definition: TimelineDefinition;
  state: "idle" | "playing" | "paused" | "completed" | "cancelled";
  currentTime: number;
  speed: number;
  startTime: number;
  pauseTime: number;
  loopCount: number;
  activeRegions: Set<string>;
  listeners: Map<string, Set<() => void>>;
}

// ===== TIMELINE REGISTRY =====

/** Global timeline registry */
class TimelineRegistry {
  private static instance: TimelineRegistry;
  private definitions: Map<string, TimelineDefinition> = new Map();
  private instances: Map<string, TimelineInstance> = new Map();

  private constructor() {}

  static getInstance(): TimelineRegistry {
    if (!TimelineRegistry.instance) {
      TimelineRegistry.instance = new TimelineRegistry();
    }
    return TimelineRegistry.instance;
  }

  // ===== DEFINITION MANAGEMENT =====

  /** Register timeline definition */
  registerDefinition(definition: TimelineDefinition): void {
    this.definitions.set(definition.id, definition);
  }

  /** Get timeline definition */
  getDefinition(id: string): TimelineDefinition | null {
    return this.definitions.get(id) || null;
  }

  /** List all definitions */
  getAllDefinitions(): TimelineDefinition[] {
    return Array.from(this.definitions.values());
  }

  /** Remove definition */
  removeDefinition(id: string): boolean {
    return this.definitions.delete(id);
  }

  // ===== INSTANCE MANAGEMENT =====

  /** Create timeline instance */
  createInstance(
    definitionId: string,
    overrides?: Partial<TimelineDefinition>,
  ): TimelineInstance {
    const definition = this.definitions.get(definitionId);
    if (!definition) {
      throw new Error(`Timeline definition '${definitionId}' not found`);
    }

    const finalDefinition = { ...definition, ...overrides };
    const instanceId = `${definitionId}_${generateId("timeline")}`;

    const instance: TimelineInstance = {
      id: instanceId,
      definition: finalDefinition,
      state: "idle",
      currentTime: 0,
      speed: finalDefinition.speed || 1,
      startTime: 0,
      pauseTime: 0,
      loopCount: 0,
      activeRegions: new Set(),
      listeners: new Map(),
    };

    this.instances.set(instanceId, instance);
    return instance;
  }

  /** Get timeline instance */
  getInstance(id: string): TimelineInstance | null {
    return this.instances.get(id) || null;
  }

  /** Remove timeline instance */
  removeInstance(id: string): boolean {
    return this.instances.delete(id);
  }

  // ===== STATE MANAGEMENT =====

  /** Update timeline state */
  updateInstanceState(id: string, updates: Partial<TimelineInstance>): void {
    const instance = this.instances.get(id);
    if (!instance) return;

    Object.assign(instance, updates);

    // Trigger listeners
    this.triggerListeners(id, "stateChange", instance);
  }

  /** Update current time */
  updateCurrentTime(id: string, time: number): void {
    const instance = this.instances.get(id);
    if (!instance) return;

    const clampedTime = Math.max(
      0,
      Math.min(time, instance.definition.duration),
    );
    instance.currentTime = clampedTime;

    // Check region transitions
    this.updateActiveRegions(instance);

    // Trigger progress listeners
    this.triggerListeners(id, "timeUpdate", instance);
  }

  /** Update active regions based on current time */
  private updateActiveRegions(instance: TimelineInstance): void {
    const newActiveRegions = new Set<string>();

    instance.definition.regions.forEach((region) => {
      const startMarker = instance.definition.markers.find(
        (m) => m.id === region.startMarker,
      );
      const endMarker = instance.definition.markers.find(
        (m) => m.id === region.endMarker,
      );

      if (startMarker && endMarker) {
        const isActive =
          instance.currentTime >= startMarker.time &&
          instance.currentTime <= endMarker.time;

        if (isActive) {
          newActiveRegions.add(region.id);

          // Check if this is a new region entry
          if (!instance.activeRegions.has(region.id)) {
            region.events?.onEnter?.();
            this.triggerListeners(instance.id, "regionEnter", region);
          }

          // Calculate progress within region
          const regionDuration = endMarker.time - startMarker.time;
          const regionProgress =
            (instance.currentTime - startMarker.time) / regionDuration;
          region.events?.onProgress?.(regionProgress);
        } else if (instance.activeRegions.has(region.id)) {
          // Region exit
          region.events?.onExit?.();
          this.triggerListeners(instance.id, "regionExit", region);
        }
      }
    });

    instance.activeRegions = newActiveRegions;
  }

  // ===== EVENT SYSTEM =====

  /** Add event listener */
  addListener(instanceId: string, event: string, callback: () => void): void {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    if (!instance.listeners.has(event)) {
      instance.listeners.set(event, new Set());
    }

    instance.listeners.get(event)!.add(callback);
  }

  /** Remove event listener */
  removeListener(
    instanceId: string,
    event: string,
    callback: () => void,
  ): void {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    const eventListeners = instance.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  /** Trigger event listeners */
  private triggerListeners(
    instanceId: string,
    event: string,
    data?: unknown,
  ): void {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    const eventListeners = instance.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => callback());
    }
  }

  // ===== UTILITIES =====

  /** Get marker by ID */
  getMarker(instanceId: string, markerId: string): TimelineMarker | null {
    const instance = this.instances.get(instanceId);
    if (!instance) return null;

    return instance.definition.markers.find((m) => m.id === markerId) || null;
  }

  /** Get all markers */
  getMarkers(instanceId: string): TimelineMarker[] {
    const instance = this.instances.get(instanceId);
    return instance ? instance.definition.markers : [];
  }

  /** Get cues for marker */
  getCuesForMarker(instanceId: string, markerId: string): TimelineCue[] {
    const instance = this.instances.get(instanceId);
    if (!instance) return [];

    return instance.definition.cues.filter((c) => c.markerId === markerId);
  }

  /** Get active regions */
  getActiveRegions(instanceId: string): string[] {
    const instance = this.instances.get(instanceId);
    return instance ? Array.from(instance.activeRegions) : [];
  }

  // ===== SERIALIZATION =====

  /** Export timeline definition as JSON */
  exportDefinition(id: string): string | null {
    const definition = this.definitions.get(id);
    return definition ? JSON.stringify(definition, null, 2) : null;
  }

  /** Import timeline definition from JSON */
  importDefinition(json: string): TimelineDefinition | null {
    try {
      const definition = JSON.parse(json) as TimelineDefinition;
      this.registerDefinition(definition);
      return definition;
    } catch {
      return null;
    }
  }
}

// ===== PREDEFINED TIMELINES =====

/** Predefined chapter timelines */
export const CHAPTER_TIMELINES: Record<ChapterId, TimelineDefinition> = {
  hero: {
    id: "chapter:hero",
    chapterId: "hero",
    duration: 2400,
    markers: [
      { id: "enter", time: 0, label: "Hero entrance" },
      { id: "ctaGlow", time: 900, label: "CTA highlight" },
      { id: "exit", time: 2400, label: "Hero exit" },
    ],
    cues: [
      { id: "hero.enter", markerId: "enter", action: "start" },
      {
        id: "hero.ctaGlow",
        markerId: "ctaGlow",
        action: "start",
        targetAnimation: "ctaGlow" as AnimationID,
      },
      { id: "hero.exit", markerId: "exit", action: "start" },
    ],
    regions: [],
    speed: 1,
    tags: ["chapter", "hero", "marketing"],
  },

  howItWorks: {
    id: "chapter:how",
    chapterId: "howItWorks",
    duration: 3200,
    markers: [
      { id: "A", time: 0, label: "Step A" },
      { id: "B", time: 800, label: "Step B" },
      { id: "C", time: 1600, label: "Step C" },
      { id: "exit", time: 3200, label: "Chapter exit" },
    ],
    cues: [
      { id: "how.stepA", markerId: "A", action: "start" },
      { id: "how.stepB", markerId: "B", action: "start" },
      { id: "how.stepC", markerId: "C", action: "start" },
    ],
    regions: [
      {
        id: "pin.howItWorks",
        startMarker: "A",
        endMarker: "exit",
        properties: {
          scrollSync: true,
          layerLock: false,
        },
        events: {
          onProgress: (progress) => {
            // Update pin progress
          },
        },
      },
    ],
    speed: 1,
    tags: ["chapter", "how-it-works", "pedagogical"],
  },

  useCases: {
    id: "chapter:use-cases",
    chapterId: "useCases",
    duration: 2800,
    markers: [
      { id: "tab1", time: 0, label: "Tab 1" },
      { id: "tab2", time: 700, label: "Tab 2" },
      { id: "tab3", time: 1400, label: "Tab 3" },
      { id: "tab4", time: 2100, label: "Tab 4" },
    ],
    cues: [
      { id: "usecases.tab1", markerId: "tab1", action: "start" },
      { id: "usecases.tab2", markerId: "tab2", action: "start" },
      { id: "usecases.tab3", markerId: "tab3", action: "start" },
      { id: "usecases.tab4", markerId: "tab4", action: "start" },
    ],
    regions: [],
    speed: 1,
    tags: ["chapter", "use-cases", "interactive"],
  },

  features: {
    id: "chapter:features",
    chapterId: "features",
    duration: 2000,
    markers: [
      { id: "gridEnter", time: 0, label: "Grid entrance" },
      { id: "morph", time: 600, label: "Element morph" },
      { id: "reveal", time: 1200, label: "Final reveal" },
    ],
    cues: [
      { id: "features.enter", markerId: "gridEnter", action: "start" },
      { id: "features.morph", markerId: "morph", action: "start" },
      { id: "features.reveal", markerId: "reveal", action: "start" },
    ],
    regions: [],
    speed: 1,
    tags: ["chapter", "features", "showcase"],
  },

  pricing: {
    id: "chapter:pricing",
    chapterId: "pricing",
    duration: 3600,
    markers: [
      { id: "tableEnter", time: 0, label: "Table entrance" },
      { id: "planHighlight", time: 1200, label: "Popular plan highlight" },
      { id: "roiTween", time: 2400, label: "ROI animation" },
      { id: "callToAction", time: 3600, label: "CTA pulse" },
    ],
    cues: [
      { id: "pricing.enter", markerId: "tableEnter", action: "start" },
      { id: "pricing.highlight", markerId: "planHighlight", action: "start" },
      { id: "pricing.roi", markerId: "roiTween", action: "start" },
      { id: "pricing.cta", markerId: "callToAction", action: "start" },
    ],
    regions: [],
    speed: 1,
    tags: ["chapter", "pricing", "conversion"],
  },

  ctaFinal: {
    id: "chapter:cta-final",
    chapterId: "ctaFinal",
    duration: 1200,
    markers: [
      { id: "enter", time: 0, label: "Final CTA entrance" },
      { id: "pulse", time: 600, label: "CTA pulse" },
    ],
    cues: [
      { id: "cta.enter", markerId: "enter", action: "start" },
      { id: "cta.pulse", markerId: "pulse", action: "start" },
    ],
    regions: [],
    loop: true,
    speed: 1,
    tags: ["chapter", "cta-final", "conversion"],
  },
};

// ===== TIMELINE CONTROLLER =====

/** Main timeline controller */
export class TimelineController {
  private static instance: TimelineController;
  private registry: TimelineRegistry;

  private constructor() {
    this.registry = TimelineRegistry.getInstance();
    this.initializePredefinedTimelines();
  }

  static getInstance(): TimelineController {
    if (!TimelineController.instance) {
      TimelineController.instance = new TimelineController();
    }
    return TimelineController.instance;
  }

  /** Initialize predefined chapter timelines */
  private initializePredefinedTimelines(): void {
    Object.values(CHAPTER_TIMELINES).forEach((timeline) => {
      this.registry.registerDefinition(timeline);
    });
  }

  // ===== TIMELINE MANAGEMENT =====

  /** Create timeline instance */
  create(
    id: string,
    overrides?: Partial<TimelineDefinition>,
  ): TimelineInstance {
    return this.registry.createInstance(id, overrides);
  }

  /** Play timeline */
  play(instanceId: string): void {
    const instance = this.registry.getInstance(instanceId);
    if (!instance) return;

    instance.state = "playing";
    instance.startTime = Date.now();
    this.registry.updateInstanceState(instanceId, instance);
  }

  /** Pause timeline */
  pause(instanceId: string): void {
    const instance = this.registry.getInstance(instanceId);
    if (!instance) return;

    instance.state = "paused";
    instance.pauseTime = Date.now();
    this.registry.updateInstanceState(instanceId, instance);
  }

  /** Resume timeline */
  resume(instanceId: string): void {
    const instance = this.registry.getInstance(instanceId);
    if (!instance || instance.state !== "paused") return;

    instance.state = "playing";
    // Adjust start time to account for pause duration
    const pauseDuration = Date.now() - instance.pauseTime;
    instance.startTime += pauseDuration;
    this.registry.updateInstanceState(instanceId, instance);
  }

  /** Cancel timeline */
  cancel(instanceId: string, graceMs: number = 0): void {
    const instance = this.registry.getInstance(instanceId);
    if (!instance) return;

    if (graceMs > 0) {
      // Soft cancel - allow grace period
      setTimeout(() => {
        instance.state = "cancelled";
        this.registry.updateInstanceState(instanceId, instance);
      }, graceMs);
    } else {
      // Hard cancel - immediate
      instance.state = "cancelled";
      this.registry.updateInstanceState(instanceId, instance);
    }
  }

  /** Seek to specific time */
  seek(instanceId: string, timeMs: number): void {
    this.registry.updateCurrentTime(instanceId, timeMs);
  }

  /** Set playback speed */
  setSpeed(instanceId: string, speed: number): void {
    const instance = this.registry.getInstance(instanceId);
    if (!instance) return;

    instance.speed = Math.max(0.1, Math.min(5, speed)); // Clamp between 0.1x and 5x
    this.registry.updateInstanceState(instanceId, instance);
  }

  // ===== EVENT BINDING =====

  /** Bind to marker event */
  on(
    instanceId: string,
    eventType: "marker" | "region",
    targetId: string,
    callback: () => void,
  ): void {
    const eventKey = `${eventType}:${targetId}`;
    this.registry.addListener(instanceId, eventKey, callback);
  }

  // ===== SCROLL SYNC =====

  /** Bind timeline to scroll progress */
  bindScroll(
    instanceId: string,
    config: {
      rangePx?: { start: number; end: number };
      progress$?: { min: number; max: number };
      damping?: number;
    },
  ): void {
    const { rangePx, progress$ = { min: 0, max: 1 }, damping = 0.1 } = config;

    let targetProgress = 0;
    let currentProgress = 0;

    const updateTimeline = () => {
      if (Math.abs(targetProgress - currentProgress) < 0.001) return;

      currentProgress += (targetProgress - currentProgress) * damping;
      const instance = this.registry.getInstance(instanceId);

      if (instance) {
        const time = currentProgress * instance.definition.duration;
        this.seek(instanceId, time);
      }

      requestAnimationFrame(updateTimeline);
    };

    const handleScroll = () => {
      if (!rangePx) return;

      const scrollY = window.scrollY;
      const progress = Math.max(
        0,
        Math.min(1, (scrollY - rangePx.start) / (rangePx.end - rangePx.start)),
      );

      targetProgress =
        progress$.min + progress * (progress$.max - progress$.min);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateTimeline();
  }

  // ===== UTILITIES =====

  /** Get timeline instance */
  getInstance(id: string): TimelineInstance | null {
    return this.registry.getInstance(id);
  }

  /** Get timeline definition */
  getDefinition(id: string): TimelineDefinition | null {
    return this.registry.getDefinition(id);
  }

  /** Export timeline */
  export(id: string): string | null {
    return this.registry.exportDefinition(id);
  }

  /** Import timeline */
  import(json: string): TimelineDefinition | null {
    return this.registry.importDefinition(json);
  }
}

// ===== HOOKS =====

/** Hook for timeline management */
export function useTimeline(instanceId?: string) {
  const controller = TimelineController.getInstance();

  return {
    // Timeline management
    create: (id: string, overrides?: Partial<TimelineDefinition>) =>
      controller.create(id, overrides),

    play: (id: string) => controller.play(id),
    pause: (id: string) => controller.pause(id),
    resume: (id: string) => controller.resume(id),
    cancel: (id: string, graceMs?: number) => controller.cancel(id, graceMs),
    seek: (id: string, time: number) => controller.seek(id, time),
    setSpeed: (id: string, speed: number) => controller.setSpeed(id, speed),

    // Event binding
    on: (
      id: string,
      eventType: "marker" | "region",
      targetId: string,
      callback: () => void,
    ) => controller.on(id, eventType, targetId, callback),

    // Scroll binding
    bindScroll: (
      id: string,
      config: Parameters<TimelineController["bindScroll"]>[1],
    ) => controller.bindScroll(id, config),

    // State access
    getInstance: (id: string) => controller.getInstance(id),
    getDefinition: (id: string) => controller.getDefinition(id),

    // Current instance if provided
    currentInstance: instanceId ? controller.getInstance(instanceId) : null,
  };
}

/** Hook for chapter timelines */
export function useChapterTimeline(chapterId: ChapterId) {
  const timelineId = `chapter:${chapterId}`;
  const timeline = useTimeline();

  return {
    ...timeline,
    timelineId,
    definition: timeline.getDefinition(timelineId),
    instance: timeline.getInstance(timelineId),

    // Chapter-specific methods
    playChapter: () => timeline.play(timelineId),
    pauseChapter: () => timeline.pause(timelineId),
    resumeChapter: () => timeline.resume(timelineId),
    cancelChapter: (graceMs?: number) => timeline.cancel(timelineId, graceMs),

    // Cue system
    cue: (cueId: string) => {
      // Find and trigger cue
      const definition = timeline.getDefinition(timelineId);
      if (!definition) return;

      const cue = definition.cues.find((c) => c.id === cueId);
      if (cue) {
        // Trigger cue action
        switch (cue.action) {
          case "start":
            if (cue.targetAnimation) {
              // Start specific animation
            }
            break;
          // Handle other actions...
        }
      }
    },
  };
}
