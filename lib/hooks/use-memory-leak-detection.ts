"use client";

import { useEffect, useRef, useCallback } from "react";

// Types for tracking resources
export interface ResourceTracker {
  id: string;
  type: "eventListener" | "interval" | "timeout" | "observer" | "subscription";
  target?: unknown;
  eventType?: string;
  createdAt: number;
  stack?: string;
}

// Global registry for tracking resources (only in development)
const resourceRegistry = new Map<string, ResourceTracker[]>();

// Utility to get stack trace
const getStackTrace = (): string => {
  try {
    throw new Error();
  } catch (error) {
    return (error as Error).stack || "";
  }
};

// Hook for tracking resources and detecting leaks
export function useMemoryLeakDetection(componentName: string) {
  const componentIdRef = useRef(
    `${componentName}-${Math.random().toString(36).substr(2, 9)}`,
  );
  const resourcesRef = useRef<ResourceTracker[]>([]);
  const mountedRef = useRef(true);

  // Track a resource with memory leak warnings
  const trackResource = useCallback(
    (resource: Omit<ResourceTracker, "id" | "createdAt" | "stack">) => {
      if (process.env.NODE_ENV !== "development") return () => {};

      const tracker: ResourceTracker = {
        ...resource,
        id: `${componentIdRef.current}-${resource.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        stack: getStackTrace(),
      };

      resourcesRef.current.push(tracker);

      // Add to global registry
      const componentResources =
        resourceRegistry.get(componentIdRef.current) || [];
      componentResources.push(tracker);
      resourceRegistry.set(componentIdRef.current, componentResources);

      // Warn if too many resources of same type
      const resourceTypeCount = resourcesRef.current.filter(
        (r) => r.type === resource.type,
      ).length;
      if (resourceTypeCount > 10) {
        console.warn(
          `[Memory Leak Warning] ${componentIdRef.current} has ${resourceTypeCount} ${resource.type} resources. Possible memory leak.`,
          {
            component: componentIdRef.current,
            resourceType: resource.type,
            stack: tracker.stack,
          },
        );
      }

      // Return cleanup function
      return () => {
        const index = resourcesRef.current.findIndex(
          (r) => r.id === tracker.id,
        );
        if (index > -1) {
          resourcesRef.current.splice(index, 1);
        }

        // Remove from global registry
        const globalResources =
          resourceRegistry.get(componentIdRef.current) || [];
        const globalIndex = globalResources.findIndex(
          (r) => r.id === tracker.id,
        );
        if (globalIndex > -1) {
          globalResources.splice(globalIndex, 1);
          if (globalResources.length === 0) {
            resourceRegistry.delete(componentIdRef.current);
          } else {
            resourceRegistry.set(componentIdRef.current, globalResources);
          }
        }
      };

      // Return cleanup function
      return () => {
        const index = resourcesRef.current.findIndex(
          (r) => r.id === tracker.id,
        );
        if (index > -1) {
          resourcesRef.current.splice(index, 1);
        }

        // Remove from global registry
        const globalResources =
          resourceRegistry.get(componentIdRef.current) || [];
        const globalIndex = globalResources.findIndex(
          (r) => r.id === tracker.id,
        );
        if (globalIndex > -1) {
          globalResources.splice(globalIndex, 1);
          if (globalResources.length === 0) {
            resourceRegistry.delete(componentIdRef.current);
          } else {
            resourceRegistry.set(componentIdRef.current, globalResources);
          }
        }
      };
    },
    [],
  );

  // Get current resource count
  const getResourceCount = useCallback(() => {
    return resourcesRef.current.length;
  }, []);

  // Get leaked resources (called after unmount)
  const getLeakedResources = useCallback(() => {
    return [...resourcesRef.current];
  }, []);

  // Cleanup all tracked resources
  const cleanupAll = useCallback(() => {
    resourcesRef.current.forEach((resource) => {
      try {
        switch (resource.type) {
          case "eventListener":
            if (resource.target && resource.eventType) {
              resource.target.removeEventListener(resource.eventType, () => {});
            }
            break;
          case "interval":
            if (typeof resource.target === "number") {
              clearInterval(resource.target);
            }
            break;
          case "timeout":
            if (typeof resource.target === "number") {
              clearTimeout(resource.target);
            }
            break;
          case "observer":
            if (
              resource.target &&
              typeof resource.target.disconnect === "function"
            ) {
              resource.target.disconnect();
            }
            break;
          case "subscription":
            if (
              resource.target &&
              typeof resource.target.unsubscribe === "function"
            ) {
              resource.target.unsubscribe();
            }
            break;
        }
      } catch (error) {
        console.warn(`Failed to cleanup resource ${resource.id}:`, error);
      }
    });

    resourcesRef.current = [];
  }, []);

  // Detect memory spikes
  const detectMemorySpike = useCallback((thresholdBytes: number) => {
    if (
      typeof window === "undefined" ||
      !(window.performance as unknown)?.memory
    ) {
      return null;
    }

    const currentMemory = (window.performance as unknown).memory.usedJSHeapSize;
    if (currentMemory > thresholdBytes) {
      return {
        memoryUsage: currentMemory,
        threshold: thresholdBytes,
        exceeded: currentMemory - thresholdBytes,
        timestamp: Date.now(),
      };
    }

    return null;
  }, []);

  // Warn about leaks on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;

      if (
        process.env.NODE_ENV === "development" &&
        resourcesRef.current.length > 0
      ) {
        console.warn(`🚨 Memory leak detected in ${componentName}:`, {
          leakedResources: resourcesRef.current.length,
          resources: resourcesRef.current.map((r) => ({
            type: r.type,
            target: r.target?.constructor?.name || r.target,
            eventType: r.eventType,
            createdAt: new Date(r.createdAt).toISOString(),
          })),
        });

        // Store leak info globally for testing
        if (typeof window !== "undefined") {
          (window as unknown).__memoryLeaks =
            (window as unknown).__memoryLeaks || {};
          (window as unknown).__memoryLeaks[componentIdRef.current] = {
            componentName,
            leakedResources: resourcesRef.current.length,
            resources: resourcesRef.current,
            timestamp: Date.now(),
          };
        }
      }

      cleanupAll();
    };
  }, [componentName, cleanupAll]);

  return {
    trackResource,
    getResourceCount,
    getLeakedResources,
    cleanupAll,
    detectMemorySpike,
  };
}

// Hook for tracking event listeners specifically
export function useEventListenerTracker() {
  const { trackResource } = useMemoryLeakDetection("EventListenerTracker");

  const addTrackedEventListener = useCallback(
    (
      target: EventTarget,
      eventType: string,
      listener: EventListener,
      options?: boolean | AddEventListenerOptions,
    ) => {
      target.addEventListener(eventType, listener, options);

      const cleanup = trackResource({
        type: "eventListener",
        target,
        eventType,
      });

      return () => {
        target.removeEventListener(eventType, listener, options);
        cleanup();
      };
    },
    [trackResource],
  );

  return { addTrackedEventListener };
}

// Hook for tracking intervals/timeouts
export function useTimerTracker() {
  const { trackResource } = useMemoryLeakDetection("TimerTracker");

  const setTrackedInterval = useCallback(
    (callback: () => void, delay: number) => {
      const id = setInterval(callback, delay);

      const cleanup = trackResource({
        type: "interval",
        target: id,
      });

      return () => {
        clearInterval(id);
        cleanup();
      };
    },
    [trackResource],
  );

  const setTrackedTimeout = useCallback(
    (callback: () => void, delay: number) => {
      const id = setTimeout(callback, delay);

      const cleanup = trackResource({
        type: "timeout",
        target: id,
      });

      return () => {
        clearTimeout(id);
        cleanup();
      };
    },
    [trackResource],
  );

  return { setTrackedInterval, setTrackedTimeout };
}

// Hook for tracking observers
export function useObserverTracker() {
  const { trackResource } = useMemoryLeakDetection("ObserverTracker");

  const createTrackedObserver = useCallback(
    (
      callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit,
    ) => {
      const observer = new IntersectionObserver(callback, options);

      const cleanup = trackResource({
        type: "observer",
        target: observer,
      });

      return {
        observer,
        disconnect: () => {
          observer.disconnect();
          cleanup();
        },
      };
    },
    [trackResource],
  );

  return { createTrackedObserver };
}

// Global memory leak detector for tests
export function getGlobalMemoryLeaks() {
  if (typeof window === "undefined") return {};

  return (window as unknown).__memoryLeaks || {};
}

export function clearGlobalMemoryLeaks() {
  if (typeof window !== "undefined") {
    (window as unknown).__memoryLeaks = {};
  }
  resourceRegistry.clear();
}

// Test utility: wait for component cleanup
export function waitForCleanup(componentId?: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Force garbage collection hint (not guaranteed)
      if (typeof window !== "undefined" && (window as unknown).gc) {
        (window as unknown).gc();
      }

      // Check for leaks
      const leaks = getGlobalMemoryLeaks();
      const hasLeaks = componentId
        ? leaks[componentId]?.leakedResources > 0
        : Object.values(leaks).some(
            (leak: unknown) => leak.leakedResources > 0,
          );

      if (hasLeaks) {
        console.warn("Memory leaks detected:", leaks);
      }

      resolve();
    }, 100);
  });
}
