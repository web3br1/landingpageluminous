"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { logger } from "../../observability/logger";

/**
 * Intersection Observer Hook - Phase 1
 * Granular thresholds [0.1, 0.3, 0.5, 0.8, 1.0] with ratio tracking
 */

export interface IntersectionConfig {
  rootMargin?: string;
  thresholds?: number[];
  triggerOnce?: boolean;
}

export interface IntersectionState {
  isIntersecting: boolean;
  intersectionRatio: number;
  boundingClientRect?: DOMRectReadOnly;
  intersectionRect?: DOMRectReadOnly;
  rootBounds?: DOMRectReadOnly;
}

/**
 * Default granular thresholds for progressive loading
 */
export const GRANULAR_THRESHOLDS = [0.1, 0.2, 0.3, 0.5, 0.7, 0.8, 0.9, 1.0];

/**
 * Custom useIntersectionObserver hook
 */
export function useIntersectionObserver(
  config: IntersectionConfig = {},
  sectionId?: string
): {
  ref: (element: Element | null) => void;
  state: IntersectionState;
  isSupported: boolean;
} {
  const {
    rootMargin = "50px",
    thresholds = GRANULAR_THRESHOLDS,
    triggerOnce = true,
  } = config;

  const [state, setState] = useState<IntersectionState>({
    isIntersecting: false,
    intersectionRatio: 0,
  });

  const [isSupported, setIsSupported] = useState(false);
  const elementRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hasTriggeredRef = useRef(false);

  // Set element ref and create observer
  const setRef = useCallback((element: Element | null) => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    elementRef.current = element;

    // Check if IntersectionObserver is supported
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsSupported(false);
      logger.warn("IntersectionObserver not supported", {
        event: "ll_intersection_unsupported",
        ll_section_id: sectionId,
      });
      return;
    }

    setIsSupported(true);

    if (!element) return;

      try {
      // Create observer with granular thresholds
      observerRef.current = new IntersectionObserver(
        (entries) => {
          try {
            const entry = entries[0];
            if (!entry) return;

            const newState: IntersectionState = {
              isIntersecting: entry.isIntersecting,
              intersectionRatio: entry.intersectionRatio,
              boundingClientRect: entry.boundingClientRect,
              intersectionRect: entry.intersectionRect,
              rootBounds: entry.rootBounds,
            };

            setState(newState);

            // Log intersection events with ll_ prefix
            logger.debug("Intersection observed", {
              event: "ll_intersection_observed",
              ll_section_id: sectionId,
              ll_is_intersecting: entry.isIntersecting,
              ll_intersection_ratio: entry.intersectionRatio,
              ll_thresholds: thresholds,
              ll_root_margin: rootMargin,
            });

            // Disconnect if triggerOnce is true and element is intersecting
            if (triggerOnce && entry.isIntersecting && !hasTriggeredRef.current) {
              hasTriggeredRef.current = true;

              logger.info("Intersection triggered (once)", {
                event: "ll_intersection_triggered_once",
                ll_section_id: sectionId,
                ll_intersection_ratio: entry.intersectionRatio,
              });

              if (observerRef.current) {
                observerRef.current.disconnect();
              }
            }
          } catch (callbackError) {
            logger.error("IntersectionObserver callback error", {
              event: "ll_intersection_callback_error",
              ll_section_id: sectionId,
              error: callbackError instanceof Error ? callbackError.message : String(callbackError),
            });
          }
        },
        {
          rootMargin,
          threshold: thresholds,
        }
      );
    } catch (observerError) {
      logger.error("Failed to create IntersectionObserver", {
        event: "ll_intersection_observer_creation_error",
        ll_section_id: sectionId,
        error: observerError instanceof Error ? observerError.message : String(observerError),
      });
      setIsSupported(false);
      return;
    }

    // Start observing
    observerRef.current.observe(element);

    logger.info("Intersection observer started", {
      event: "ll_intersection_started",
      ll_section_id: sectionId,
      ll_thresholds: thresholds,
      ll_root_margin: rootMargin,
      ll_trigger_once: triggerOnce,
    });
  }, [rootMargin, thresholds, triggerOnce, sectionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        logger.debug("Intersection observer cleaned up", {
          event: "ll_intersection_cleanup",
          ll_section_id: sectionId,
        });
      }
    };
  }, [sectionId]);

  return {
    ref: setRef,
    state,
    isSupported,
  };
}

/**
 * Hook for viewport-based progressive loading triggers
 */
export function useViewportTrigger(
  sectionId: string,
  onTrigger: (ratio: number) => void,
  config: IntersectionConfig = {}
): {
  ref: (element: Element | null) => void;
  isTriggered: boolean;
  intersectionRatio: number;
} {
  const [isTriggered, setIsTriggered] = useState(false);
  const { ref, state, isSupported } = useIntersectionObserver(config, sectionId);

  useEffect(() => {
    // Fallback for unsupported browsers - trigger immediately
    if (!isSupported) {
      logger.warn("Using fallback trigger (no IntersectionObserver)", {
        event: "ll_fallback_trigger",
        ll_section_id: sectionId,
      });
      onTrigger(1.0);
      setIsTriggered(true);
      return;
    }

    // Check if element is sufficiently visible
    const shouldTrigger = state.isIntersecting && state.intersectionRatio >= 0.1;

    if (shouldTrigger && !isTriggered) {
      logger.info("Viewport trigger activated", {
        event: "ll_viewport_trigger",
        ll_section_id: sectionId,
        ll_intersection_ratio: state.intersectionRatio,
      });

      onTrigger(state.intersectionRatio);
      setIsTriggered(true);
    }
  }, [state.isIntersecting, state.intersectionRatio, isTriggered, sectionId, onTrigger, isSupported]);

  return {
    ref,
    isTriggered,
    intersectionRatio: state.intersectionRatio,
  };
}

/**
 * Progressive loading trigger with granular ratio awareness
 */
export function useProgressiveTrigger(
  sectionId: string,
  onRatioChange: (ratio: number, isIntersecting: boolean) => void,
  config: IntersectionConfig = {}
): {
  ref: (element: Element | null) => void;
  currentRatio: number;
  isIntersecting: boolean;
} {
  const { ref, state } = useIntersectionObserver({
    ...config,
    triggerOnce: false, // We want continuous ratio updates
  }, sectionId);

  useEffect(() => {
    onRatioChange(state.intersectionRatio, state.isIntersecting);
  }, [state.intersectionRatio, state.isIntersecting, onRatioChange]);

  return {
    ref,
    currentRatio: state.intersectionRatio,
    isIntersecting: state.isIntersecting,
  };
}

/**
 * Utility function to create intersection config for different priorities
 */
export function createIntersectionConfig(
  priority: "hero" | "early" | "deferred"
): IntersectionConfig {
  switch (priority) {
    case "hero":
      return {
        rootMargin: "100px", // Load earlier for critical content
        thresholds: GRANULAR_THRESHOLDS,
        triggerOnce: true,
      };

    case "early":
      return {
        rootMargin: "200px", // Moderate early loading
        thresholds: GRANULAR_THRESHOLDS,
        triggerOnce: true,
      };

    case "deferred":
      return {
        rootMargin: "50px", // Load only when clearly visible
        thresholds: [0.3, 0.5, 0.8], // Fewer thresholds for deferred
        triggerOnce: true,
      };

    default:
      return {
        rootMargin: "100px",
        thresholds: GRANULAR_THRESHOLDS,
        triggerOnce: true,
      };
  }
}

/**
 * Performance monitoring for intersection events
 */
export function useIntersectionMetrics(sectionId: string) {
  const metricsRef = useRef({
    firstIntersection: 0,
    ratioChanges: 0,
    maxRatio: 0,
  });

  const trackIntersection = useCallback((ratio: number, isIntersecting: boolean) => {
    if (metricsRef.current.firstIntersection === 0 && isIntersecting) {
      metricsRef.current.firstIntersection = Date.now();
    }

    metricsRef.current.ratioChanges++;
    metricsRef.current.maxRatio = Math.max(metricsRef.current.maxRatio, ratio);

    logger.debug("Intersection metrics updated", {
      event: "ll_intersection_metrics",
      ll_section_id: sectionId,
      ll_current_ratio: ratio,
      ll_is_intersecting: isIntersecting,
      ll_max_ratio: metricsRef.current.maxRatio,
      ll_ratio_changes: metricsRef.current.ratioChanges,
    });
  }, [sectionId]);

  const getMetrics = useCallback(() => ({
    ...metricsRef.current,
    timeToFirstIntersection: metricsRef.current.firstIntersection > 0
      ? Date.now() - metricsRef.current.firstIntersection
      : 0,
  }), []);

  return {
    trackIntersection,
    getMetrics,
  };
}
