"use client";

// ===== SCROLL SYNC SYSTEM =====
// Sistema de sincronização determinística com scroll
// Usa histerese para evitar flickering em micro-movimentos

import React from "react";
import type { AnimationID, ChapterId } from "@/lib/types/design-system";
import { useDebounce, useThrottle } from "@/lib/utils/advanced-utils";

// ===== SCROLL SYNC CONFIG =====

/** Scroll sync configuration */
export interface ScrollSyncConfig {
  /** Scroll range in pixels */
  range: {
    start: number;
    end: number;
  };

  /** Progress mapping */
  progress: {
    min: number;
    max: number;
    easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
  };

  /** Hysteretic behavior */
  hysteresis: {
    enabled: boolean;
    threshold: number; // pixels
    deadZone: number; // 0-1 progress range
  };

  /** Damping and smoothing */
  damping: {
    enabled: boolean;
    factor: number; // 0-1
    duration: number; // ms
  };

  /** Performance optimizations */
  performance: {
    throttleMs: number;
    debounceMs: number;
    maxFrameRate: number;
  };

  /** Chapter-specific settings */
  chapterSettings?: Partial<
    Record<
      ChapterId,
      {
        pinEnabled: boolean;
        pinOffset: number;
        reverseDirection: boolean;
      }
    >
  >;
}

/** Default scroll sync configuration */
const DEFAULT_SCROLL_SYNC_CONFIG: ScrollSyncConfig = {
  range: {
    start: 0,
    end: 1000,
  },
  progress: {
    min: 0,
    max: 1,
    easing: "linear",
  },
  hysteresis: {
    enabled: true,
    threshold: 5, // 5px minimum movement
    deadZone: 0.02, // 2% progress dead zone
  },
  damping: {
    enabled: true,
    factor: 0.1,
    duration: 100,
  },
  performance: {
    throttleMs: 16, // ~60fps
    debounceMs: 100,
    maxFrameRate: 60,
  },
};

// ===== SCROLL STATE MANAGEMENT =====

/** Scroll state with hysteresis */
interface HysteresisState {
  currentProgress: number;
  targetProgress: number;
  lockedProgress: number;
  direction: "up" | "down" | "stable";
  lastSignificantMove: number;
  isInDeadZone: boolean;
}

/** Scroll sync instance */
interface ScrollSyncInstance {
  id: string;
  config: ScrollSyncConfig;
  hysteresisState: HysteresisState;
  isActive: boolean;
  lastScrollTime: number;
  frameCount: number;
  listeners: Set<(progress: number, direction: string) => void>;
}

// ===== SCROLL SYNC ENGINE =====

/** Main scroll sync engine */
export class ScrollSyncEngine {
  private static instance: ScrollSyncEngine;
  private instances: Map<string, ScrollSyncInstance> = new Map();
  private rafId: number | null = null;
  private lastScrollY = 0;
  private scrollVelocity = 0;
  private isRunning = false;

  private constructor() {
    this.bindScrollListener();
  }

  static getInstance(): ScrollSyncEngine {
    if (!ScrollSyncEngine.instance) {
      ScrollSyncEngine.instance = new ScrollSyncEngine();
    }
    return ScrollSyncEngine.instance;
  }

  // ===== INSTANCE MANAGEMENT =====

  /** Create scroll sync instance */
  createInstance(
    id: string,
    config: Partial<ScrollSyncConfig> = {},
  ): ScrollSyncInstance {
    const finalConfig = { ...DEFAULT_SCROLL_SYNC_CONFIG, ...config };

    const instance: ScrollSyncInstance = {
      id,
      config: finalConfig,
      hysteresisState: {
        currentProgress: 0,
        targetProgress: 0,
        lockedProgress: 0,
        direction: "stable",
        lastSignificantMove: Date.now(),
        isInDeadZone: false,
      },
      isActive: false,
      lastScrollTime: Date.now(),
      frameCount: 0,
      listeners: new Set(),
    };

    this.instances.set(id, instance);
    return instance;
  }

  /** Get scroll sync instance */
  getInstance(id: string): ScrollSyncInstance | null {
    return this.instances.get(id) || null;
  }

  /** Remove scroll sync instance */
  removeInstance(id: string): boolean {
    const instance = this.instances.get(id);
    if (instance) {
      instance.listeners.clear();
    }
    return this.instances.delete(id);
  }

  // ===== SCROLL BINDING =====

  /** Bind scroll sync to DOM element */
  bindToElement(
    instanceId: string,
    elementSelector: string,
    chapterId?: ChapterId,
  ): void {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    // SSR safety: only run on client-side
    if (typeof document === "undefined" || typeof window === "undefined")
      return;

    const element = document.querySelector(elementSelector);
    if (!element) {
      console.warn(`Scroll sync: Element not found: ${elementSelector}`);
      return;
    }

    // Calculate range based on element position
    const rect = element.getBoundingClientRect();
    const scrollTop = window.scrollY;
    const viewportHeight = window.innerHeight;

    instance.config.range = {
      start: scrollTop + rect.top - viewportHeight * 0.5,
      end: scrollTop + rect.bottom - viewportHeight * 0.5,
    };

    // Apply chapter-specific settings
    if (chapterId && instance.config.chapterSettings?.[chapterId]) {
      const chapterSettings = instance.config.chapterSettings[chapterId];
      if (chapterSettings.reverseDirection) {
        // Reverse progress mapping
        const temp = instance.config.progress.min;
        instance.config.progress.min = instance.config.progress.max;
        instance.config.progress.max = temp;
      }
    }

    instance.isActive = true;
  }

  /** Unbind scroll sync */
  unbind(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.isActive = false;
    }
  }

  // ===== SCROLL LISTENER =====

  /** Bind global scroll listener */
  private bindScrollListener(): void {
    if (typeof window === "undefined") return;

    let lastScrollTime = Date.now();

    const handleScroll = () => {
      // SSR safety: only run on client-side
      if (typeof window === "undefined") return;

      const currentTime = Date.now();
      const scrollY = window.scrollY;

      // Calculate scroll velocity
      const timeDelta = currentTime - lastScrollTime;
      const scrollDelta = scrollY - this.lastScrollY;
      this.scrollVelocity = Math.abs(scrollDelta) / timeDelta; // pixels per ms

      this.lastScrollY = scrollY;
      lastScrollTime = currentTime;

      // Update all active instances
      this.instances.forEach((instance) => {
        if (instance.isActive) {
          this.updateInstanceProgress(instance, scrollY);
        }
      });

      // Start animation loop if not running
      if (!this.isRunning) {
        this.startAnimationLoop();
      }
    };

    // Use passive listener for better performance (SSR safety already checked above)
    window.addEventListener("scroll", handleScroll, { passive: true });
  }

  // ===== PROGRESS CALCULATION =====

  /** Update instance progress with hysteresis */
  private updateInstanceProgress(
    instance: ScrollSyncInstance,
    scrollY: number,
  ): void {
    const { range, progress, hysteresis } = instance.config;

    // Calculate raw progress
    const rawProgress = Math.max(
      0,
      Math.min(1, (scrollY - range.start) / (range.end - range.start)),
    );

    // Apply easing if specified
    const easedProgress = this.applyEasing(
      rawProgress,
      progress.easing || "linear",
    );

    // Map to progress range
    const mappedProgress =
      progress.min + easedProgress * (progress.max - progress.min);

    // Update hysteresis state
    this.updateHysteresisState(
      instance.hysteresisState,
      mappedProgress,
      scrollY,
    );

    // Set target progress
    instance.hysteresisState.targetProgress = mappedProgress;
  }

  /** Update hysteresis state */
  private updateHysteresisState(
    state: HysteresisState,
    newProgress: number,
    scrollY: number,
  ): void {
    const progressDelta = Math.abs(newProgress - state.lockedProgress);

    // Check if movement is significant enough to exit dead zone
    if (progressDelta > 0.001) {
      // Minimum progress change
      state.lastSignificantMove = Date.now();
    }

    // Determine direction
    if (newProgress > state.lockedProgress + 0.001) {
      state.direction = "down";
    } else if (newProgress < state.lockedProgress - 0.001) {
      state.direction = "up";
    } else {
      state.direction = "stable";
    }

    // Apply hysteresis logic
    const config = DEFAULT_SCROLL_SYNC_CONFIG.hysteresis;
    const timeSinceLastMove = Date.now() - state.lastSignificantMove;

    if (config.enabled) {
      // Check if we're in dead zone
      const deadZoneSize = config.deadZone;
      const deadZoneStart = state.lockedProgress - deadZoneSize / 2;
      const deadZoneEnd = state.lockedProgress + deadZoneSize / 2;

      state.isInDeadZone =
        newProgress >= deadZoneStart && newProgress <= deadZoneEnd;

      // Only update if outside dead zone and significant movement
      if (!state.isInDeadZone && progressDelta > config.deadZone) {
        state.lockedProgress = newProgress;
      }
    } else {
      // No hysteresis - direct update
      state.lockedProgress = newProgress;
    }

    // Smooth current progress towards target
    const dampingFactor = DEFAULT_SCROLL_SYNC_CONFIG.damping.factor;
    state.currentProgress +=
      (state.lockedProgress - state.currentProgress) * dampingFactor;
  }

  // ===== ANIMATION LOOP =====

  /** Start smooth animation loop */
  private startAnimationLoop(): void {
    if (this.isRunning) return;

    this.isRunning = true;

    const animate = () => {
      let hasActiveInstances = false;

      // Update all instances
      this.instances.forEach((instance) => {
        if (instance.isActive) {
          hasActiveInstances = true;

          const progress = instance.hysteresisState.currentProgress;
          const direction = instance.hysteresisState.direction;

          // Notify listeners
          instance.listeners.forEach((listener) => {
            listener(progress, direction);
          });

          instance.frameCount++;
        }
      });

      // Continue loop if there are active instances
      if (hasActiveInstances) {
        this.rafId = requestAnimationFrame(animate);
      } else {
        this.isRunning = false;
        this.rafId = null;
      }
    };

    this.rafId = requestAnimationFrame(animate);
  }

  // ===== EVENT LISTENERS =====

  /** Add progress listener */
  addListener(
    instanceId: string,
    callback: (progress: number, direction: string) => void,
  ): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.listeners.add(callback);
    }
  }

  /** Remove progress listener */
  removeListener(
    instanceId: string,
    callback: (progress: number, direction: string) => void,
  ): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.listeners.delete(callback);
    }
  }

  // ===== UTILITIES =====

  /** Apply easing function */
  private applyEasing(progress: number, easing: string): number {
    switch (easing) {
      case "ease-in":
        return progress * progress;
      case "ease-out":
        return 1 - (1 - progress) * (1 - progress);
      case "ease-in-out":
        return progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      case "linear":
      default:
        return progress;
    }
  }

  /** Get scroll velocity */
  getScrollVelocity(): number {
    return this.scrollVelocity;
  }

  /** Get all active instances */
  getActiveInstances(): ScrollSyncInstance[] {
    return Array.from(this.instances.values()).filter(
      (instance) => instance.isActive,
    );
  }

  /** Get performance metrics */
  getPerformanceMetrics() {
    const instances = Array.from(this.instances.values());
    const activeCount = instances.filter((i) => i.isActive).length;
    const avgFrameRate =
      instances.reduce((sum, i) => sum + i.frameCount, 0) / instances.length;

    return {
      activeInstances: activeCount,
      totalInstances: instances.length,
      averageFrameRate: avgFrameRate || 0,
      scrollVelocity: this.scrollVelocity,
      isAnimationLoopRunning: this.isRunning,
    };
  }

  // ===== CLEANUP =====

  /** Reset scroll sync engine */
  reset(): void {
    // Cancel animation loop
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // Clear all instances
    this.instances.forEach((instance) => {
      instance.listeners.clear();
    });
    this.instances.clear();

    // Reset state
    this.isRunning = false;
    this.lastScrollY = 0;
    this.scrollVelocity = 0;
  }
}

// ===== HOOKS =====

/** Hook for scroll sync */
export function useScrollSync(
  id: string,
  config: Partial<ScrollSyncConfig> = {},
) {
  const engine = ScrollSyncEngine.getInstance();
  const [progress, setProgress] = React.useState(0);
  const [direction, setDirection] = React.useState("stable");

  React.useEffect(() => {
    const instance = engine.createInstance(id, config);

    const handleProgress = (newProgress: number, newDirection: string) => {
      setProgress(newProgress);
      setDirection(newDirection);
    };

    engine.addListener(id, handleProgress);

    return () => {
      engine.removeListener(id, handleProgress);
      engine.removeInstance(id);
    };
  }, [id, config, engine]);

  const bindToElement = React.useCallback(
    (selector: string, chapterId?: ChapterId) => {
      engine.bindToElement(id, selector, chapterId);
    },
    [id, engine],
  );

  const unbind = React.useCallback(() => {
    engine.unbind(id);
  }, [id, engine]);

  return {
    progress,
    direction,
    bindToElement,
    unbind,
    instance: engine.getInstance(id),
    performance: engine.getPerformanceMetrics(),
  };
}

/** Hook for chapter-specific scroll sync */
export function useChapterScrollSync(chapterId: ChapterId) {
  const syncId = `scroll-${chapterId}`;

  return useScrollSync(syncId, {
    hysteresis: {
      enabled: true,
      threshold: 5,
      deadZone: 0.02,
    },
    damping: {
      enabled: true,
      factor: 0.15,
      duration: 80,
    },
    performance: {
      throttleMs: 16,
      debounceMs: 50,
      maxFrameRate: 60,
    },
    chapterSettings: {
      [chapterId]: {
        pinEnabled: chapterId === "howItWorks" || chapterId === "useCases",
        pinOffset: 0,
        reverseDirection: false,
      },
    },
  });
}

// ===== UTILITY FUNCTIONS =====

/** Hook for pinned scroll effect */
export function usePinnedScroll(
  element: HTMLElement | null,
  config: {
    startOffset?: number;
    endOffset?: number;
    onProgress?: (progress: number) => void;
  } = {},
) {
  const { startOffset = 0, endOffset = 0, onProgress } = config;

  return useScrollSync(`pinned-${element?.id || "element"}`, {
    range: element
      ? {
          start: element.offsetTop - startOffset,
          end: element.offsetTop + element.offsetHeight + endOffset,
        }
      : { start: 0, end: 0 },
    progress: {
      min: 0,
      max: 1,
      easing: "linear",
    },
    hysteresis: {
      enabled: false,
      threshold: 0,
      deadZone: 0, // Disable for pinned effects
    },
    damping: {
      enabled: false,
      factor: 0,
      duration: 0, // Direct response for pinning
    },
  });
}

/** Hook for parallax scroll effect */
export function useParallaxScroll(
  element: HTMLElement | null,
  speed: number = 0.5,
  maxOffset: number = 16,
) {
  const sync = useScrollSync(`parallax-${element?.id || "element"}`, {
    hysteresis: {
      enabled: false,
      threshold: 0,
      deadZone: 0,
    },
    damping: {
      enabled: true,
      factor: 0.1,
      duration: 50,
    },
  });

  // Apply transform based on progress
  React.useEffect(() => {
    if (!element) return;
    const offset = (sync.progress - 0.5) * 2 * maxOffset * speed;
    element.style.transform = `translateY(${offset}px)`;
  }, [element, sync.progress, speed, maxOffset]);

  return sync;
}

// ===== TYPE EXPORTS =====
export type { ScrollSyncInstance };
