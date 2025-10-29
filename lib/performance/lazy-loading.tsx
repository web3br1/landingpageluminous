"use client";

// Type declaration for HTMLImageElement if not available
declare global {
  interface HTMLImageElement extends HTMLElement {
    readonly complete: boolean;
    readonly naturalWidth: number;
    readonly naturalHeight: number;
  }
}

/**
 * Advanced Lazy Loading System - Fase 3
 * Sistema inteligente de lazy loading com intersection observer e predictive loading
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  isFeatureEnabled,
  FeatureFlag,
} from "../environment/environment-manager";
import { getAdvancedMonitoringSystem } from "../monitoring/advanced-metrics";
import { logger } from "../observability/logger";

/**
 * Lazy Load Options
 */
export interface LazyLoadOptions {
  rootMargin?: string;
  threshold?: number | number[];
  triggerDistance?: number;
  timeout?: number;
  fallback?: React.ComponentType;
  priority?: "low" | "medium" | "high" | "critical";
  preload?: boolean;
  prefetch?: boolean;
  skeleton?: React.ComponentType;
  onLoad?: () => void;
}

/**
 * Lazy Load State - Currently unused but kept for future expansion
 */
// Lazy Load State
enum LazyLoadState {
  IDLE = "idle",
  LOADING = "loading",
  LOADED = "loaded",
  ERROR = "error",
  TIMEOUT = "timeout",
}

/**
 * Lazy Component Props
 */
interface LazyComponentProps<T = unknown> {
  component: () => Promise<{ default: React.ComponentType<T> }>;
  options?: LazyLoadOptions;
  props?: T;
  children?: React.ReactNode;
}

/**
 * Lazy Loading Hook
 */
export function useLazyLoading(options: LazyLoadOptions = {}) {
  const [state, setState] = useState<LazyLoadState>(LazyLoadState.IDLE);
  const [Component, setComponent] =
    useState<React.ComponentType<unknown> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const elementRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const monitoring = getAdvancedMonitoringSystem();

  const {
    rootMargin = "50px",
    threshold = 0.1,
    triggerDistance = 200,
    timeout = 10000,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fallback,

    onLoad,
    priority = "medium",
    preload = false,
    prefetch = false,
  } = options;

  // Helper function to handle successful component loading
  const handleComponentSuccess = useCallback(
    (LoadedComponent: React.ComponentType<unknown>, startTime: number) => {
      setComponent(() => LoadedComponent);
      setState(LazyLoadState.LOADED);
      setError(null);

      const loadTime = Date.now() - startTime;
      onLoad?.();

      monitoring.recordUserEngagement(
        "component_lazy_loaded",
        undefined,
        undefined,
        {
          loadTime,
          priority,
          preload,
          prefetch,
        },
      );

      logger.debug("Component lazy loaded successfully", {
        loadTime,
        priority,
        state: "success",
      });
    },
    [priority, preload, prefetch, monitoring, onLoad],
  );

  // Helper function to handle component loading errors
  const handleComponentError = useCallback(
    (
      error: Error,
      retryCount: number,
      componentFn: () => Promise<{ default: React.ComponentType<unknown> }>,
    ) => {
      // Enhanced error handling for ChunkLoadError
      if (
        error.message?.includes("ChunkLoadError") ||
        error.message?.includes("Loading chunk")
      ) {
        logger.error("Webpack chunk failed to load", {
          error,
          retryCount,
          priority,
        });

        // Retry logic for chunk load failures (max 3 retries)
        if (retryCount < 3) {
          const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s
          logger.info(
            `Retrying chunk load in ${retryDelay}ms (attempt ${retryCount + 1}/3)`,
            { priority },
          );

          setTimeout(() => {
            loadComponent(componentFn, retryCount + 1);
          }, retryDelay);
          return;
        } else {
          logger.error("Max retries reached for chunk load failure", {
            error,
            priority,
          });
        }
      } else {
        logger.error("Component lazy loading failed", {
          error,
          priority,
          stack: error.stack,
        });
      }

      setError(error);
      setState(LazyLoadState.ERROR);
    },
    [priority],
  );

  // Load component function
  const loadComponent = useCallback(
    async (
      componentFn: () => Promise<{ default: React.ComponentType<unknown> }>,
      retryCount = 0,
    ) => {
      if (state === LazyLoadState.LOADING || state === LazyLoadState.LOADED)
        return;

      setState(LazyLoadState.LOADING);
      const startTime = Date.now();

      try {
        // Set timeout
        if (timeout > 0) {
          timeoutRef.current = setTimeout(() => {
            setState(LazyLoadState.TIMEOUT);
            setError(new Error(`Component loading timeout after ${timeout}ms`));
            logger.warn("Lazy loading timeout", { timeout, priority });
          }, timeout);
        }

        const module = await componentFn();
        const LoadedComponent = module.default;

        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        handleComponentSuccess(LoadedComponent, startTime);
      } catch (err) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        const error = err as Error;
        handleComponentError(error, retryCount, componentFn);
      }
    },
    [state, timeout, priority, handleComponentSuccess, handleComponentError],
  );

  // Intersection Observer setup
  useEffect(() => {
    if (!elementRef.current || !isFeatureEnabled(FeatureFlag.LAZY_LOADING))
      return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && state === LazyLoadState.IDLE) {
            // Calculate distance from viewport
            const rect = entry.boundingClientRect;
            const distance = Math.min(
              Math.abs(rect.top),
              Math.abs(rect.bottom),
              Math.abs(rect.left),
              Math.abs(rect.right),
            );

            if (distance <= triggerDistance) {
              logger.debug("Component entered viewport, triggering load", {
                distance,
                triggerDistance,
                priority,
              });

              // Trigger load - this would be called by parent component
              // loadComponent would be passed as prop or context
            }
          }
        });
      },
      {
        rootMargin,
        threshold,
      },
    );

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, triggerDistance, state, priority]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    elementRef,
    state,
    Component,
    error,
    loadComponent,
    isLoading: state === LazyLoadState.LOADING,
    isLoaded: state === LazyLoadState.LOADED,
    hasError: state === LazyLoadState.ERROR || state === LazyLoadState.TIMEOUT,
  };
}

// ===== HELPERS FOR REDUCING COMPLEXITY =====

/**
 * Hook for priority-based auto-loading logic
 */

function usePriorityAutoLoad(
  priority: string,
  state: LazyLoadState,
  loadComponent: (
    componentFn: () => Promise<{ default: React.ComponentType<unknown> }>,
  ) => Promise<void>,
  component: () => Promise<{ default: React.ComponentType<unknown> }>,
) {
  useEffect(() => {
    if (priority === "critical" && state === LazyLoadState.IDLE) {
      loadComponent(component);
    } else if (priority === "high" && state === LazyLoadState.IDLE) {
      const timer = setTimeout(() => loadComponent(component), 100);
      return () => clearTimeout(timer);
    }
  }, [priority, state, component, loadComponent]);
}

/**
 * Component for error state rendering
 */

function ErrorFallback({
  error,
  elementRef,
  loadComponent,
  component: _component,
}: {
  error: Error | null;
  elementRef: React.RefObject<HTMLElement>;

  loadComponent: (
    componentFn: () => Promise<{ default: React.ComponentType<unknown> }>,
  ) => Promise<void>;
  component: () => Promise<{ default: React.ComponentType<unknown> }>;
}) {
  return (
    <div
      className="lazy-load-error"
      ref={elementRef as React.RefObject<HTMLDivElement>}
    >
      <div className="text-red-600 text-sm p-4 border border-red-200 rounded">
        Failed to load component: {error?.message}
        <button
          onClick={() => loadComponent(_component)}
          className="ml-2 underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

/**
 * Component for loading state rendering
 */
function LoadingFallback({
  elementRef,
  SkeletonComponent,
}: {
  elementRef: React.RefObject<HTMLElement>;
  SkeletonComponent?: React.ComponentType;
}) {
  if (SkeletonComponent) {
    return <SkeletonComponent />;
  }

  return (
    <div
      className="lazy-load-loading animate-pulse"
      ref={elementRef as React.RefObject<HTMLDivElement>}
    >
      <div className="bg-gray-200 rounded h-32 flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    </div>
  );
}

/**
 * Component for idle state rendering
 */

function IdleTrigger({
  elementRef,
  loadComponent,
  component: _component,
  SkeletonComponent,
}: {
  elementRef: React.RefObject<HTMLElement>;

  loadComponent: (
    componentFn: () => Promise<{ default: React.ComponentType<unknown> }>,
  ) => Promise<void>;
  component: () => Promise<{ default: React.ComponentType<unknown> }>;
  SkeletonComponent?: React.ComponentType;
}) {
  return (
    <div
      ref={elementRef as React.RefObject<HTMLDivElement>}
      className="lazy-load-trigger"
      onClick={() => loadComponent(_component)}
      style={{ minHeight: "100px" }}
    >
      {SkeletonComponent ? (
        <SkeletonComponent />
      ) : (
        <div className="bg-gray-100 rounded h-32 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
          <div className="text-gray-600 text-sm">Click to load component</div>
        </div>
      )}
    </div>
  );
}

/**
 * Lazy Component Wrapper
 */
export function LazyComponent<T = Record<string, unknown>>({
  component,
  options = {},
  props = {} as T,
  children,
}: LazyComponentProps<T>) {
  const {
    fallback: FallbackComponent,
    skeleton: SkeletonComponent,
    priority = "medium",
  } = options;

  const {
    elementRef,
    state,
    Component,
    error,
    loadComponent,
    isLoading,
    isLoaded,
    hasError,
  } = useLazyLoading(options);

  // Auto-load based on priority
  usePriorityAutoLoad(
    priority,
    state,
    loadComponent as (
      componentFn: () => Promise<{ default: React.ComponentType<unknown> }>,
    ) => Promise<void>,
    component as () => Promise<{ default: React.ComponentType<unknown> }>,
  );

  // Render loaded component
  if (isLoaded && Component) {
    return React.createElement(
      Component,
      props as Record<string, unknown>,
      children,
    );
  }

  // Render error state
  if (hasError) {
    if (FallbackComponent) {
      return <FallbackComponent />;
    }
    return (
      <ErrorFallback
        error={error}
        elementRef={elementRef as React.RefObject<HTMLElement>}
        loadComponent={
          loadComponent as (
            componentFn: () => Promise<{
              default: React.ComponentType<unknown>;
            }>,
          ) => Promise<void>
        }
        component={
          component as () => Promise<{ default: React.ComponentType<unknown> }>
        }
      />
    );
  }

  // Render loading state
  if (isLoading) {
    return (
      <LoadingFallback
        elementRef={elementRef as React.RefObject<HTMLElement>}
        SkeletonComponent={SkeletonComponent}
      />
    );
  }

  // Render idle trigger
  return (
    <IdleTrigger
      elementRef={elementRef as React.RefObject<HTMLElement>}
      loadComponent={
        loadComponent as (
          componentFn: () => Promise<{ default: React.ComponentType<unknown> }>,
        ) => Promise<void>
      }
      component={
        component as () => Promise<{ default: React.ComponentType<unknown> }>
      }
      SkeletonComponent={SkeletonComponent}
    />
  );
}

/**
 * Lazy Section Component (for page sections)
 */
export function LazySection({
  component,
  options = {},
  className = "",
  ...props
}: LazyComponentProps & { className?: string }) {
  return (
    <section className={`lazy-section ${className}`}>
      <LazyComponent
        component={component}
        options={{
          rootMargin: "100px",
          threshold: 0.1,
          ...options,
        }}
        {...props}
      />
    </section>
  );
}

/**
 * Predictive Lazy Loading Hook
 */
export function usePredictiveLoading() {
  const [predictedComponents, setPredictedComponents] = useState<Set<string>>(
    new Set(),
  );

  const predictComponent = useCallback(
    (componentName: string, confidence: number = 0.8) => {
      // TODO: Implement predictive loading logic when needed
      // Currently just a placeholder for future expansion
    },
    [],
  );

  const preloadPredicted = useCallback(
    async (componentLoader: (name: string) => Promise<unknown>) => {
      // TODO: Implement preload logic when predictive loading is active
      // Currently just a placeholder for future expansion
    },
    [],
  );

  return {
    predictComponent: predictComponent as (
      _componentName: string,
      _confidence?: number,
    ) => void,

    preloadPredicted: preloadPredicted as (
      _componentLoader: (_name: string) => Promise<unknown>,
    ) => Promise<void>,
    predictedCount: predictedComponents.size,
  };
}

/**
 * Lazy Image Component with advanced optimization
 */
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  src,
  alt,
  className = "",
  width,
  height,
  priority = false,
  placeholder,
  onLoad,
  onError,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLElement | null>(null);
  const monitoring = getAdvancedMonitoringSystem();

  // Calculate aspect ratio for CLS prevention
  const aspectRatio = width && height ? `${width}/${height}` : undefined;

  useEffect(() => {
    if (!isFeatureEnabled(FeatureFlag.LAZY_LOADING) || priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "50px" },
    );

    if (imgRef.current) {
      observer.observe(imgRef.current as Element);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();

    monitoring.recordUserEngagement("image_loaded", undefined, undefined, {
      src,
      priority,
      lazy: !priority,
    });
  }, [src, priority, onLoad, monitoring]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();

    logger.error("Image failed to load", { src, priority });
  }, [src, priority, onError]);

  if (hasError) {
    return (
      <div
        className={`lazy-image-error bg-gray-200 flex items-center justify-center ${className}`}
        style={{
          width,
          height,
          aspectRatio, // Prevent CLS with aspect ratio
        }}
      >
        <span className="text-gray-500 text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div
      className={`lazy-image-container ${className}`}
      style={{
        width,
        height,
        aspectRatio, // Prevent CLS with aspect ratio
      }}
    >
      {!isLoaded && placeholder && (
        <img
          src={placeholder}
          alt=""
          className="lazy-image-placeholder absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />
      )}

      {isInView && (
        <img
          ref={imgRef as React.RefObject<HTMLImageElement>}
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          onLoad={handleLoad}
          onError={handleError}
          className={`lazy-image ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
          style={{
            width: "100%",
            height: "auto",
            aspectRatio, // Ensure consistent aspect ratio
          }}
        />
      )}
    </div>
  );
}

/**
 * Performance Monitoring Hook for Lazy Loading
 */
export function useLazyLoadingMetrics() {
  const monitoring = getAdvancedMonitoringSystem();

  const trackLazyLoad = useCallback(
    (
      componentName: string,
      loadTime: number,
      priority: string,
      success: boolean,
    ) => {
      monitoring.recordUserEngagement(
        "lazy_load_completed",
        undefined,
        undefined,
        {
          component: componentName,
          loadTime,
          priority,
          success,
        },
      );

      if (success) {
        logger.info("Lazy load completed", {
          component: componentName,
          loadTime,
          priority,
        });
      } else {
        logger.warn("Lazy load failed", {
          component: componentName,
          priority,
        });
      }
    },
    [monitoring],
  );

  const trackViewportEntry = useCallback(
    (componentName: string, distance: number) => {
      monitoring.recordUserEngagement(
        "component_viewport_entry",
        undefined,
        undefined,
        {
          component: componentName,
          distance,
        },
      );
    },
    [monitoring],
  );

  return {
    trackLazyLoad,
    trackViewportEntry,
  };
}

/**
 * Lazy Loading Provider for global coordination
 */
interface LazyLoadingProviderProps {
  children: React.ReactNode;
  enablePredictive?: boolean;
}

export function LazyLoadingProvider({
  children,
  enablePredictive = true,
}: LazyLoadingProviderProps) {
  const {
    predictComponent: _predictComponent,
    preloadPredicted: _preloadPredicted,
  } = usePredictiveLoading();

  // Set up global lazy loading coordination
  useEffect(() => {
    if (!isFeatureEnabled(FeatureFlag.LAZY_LOADING)) return;

    // Global coordination logic would go here
    logger.info("Lazy loading provider initialized", {
      predictiveEnabled: enablePredictive,
    });
  }, [enablePredictive]);

  return <>{children}</>;
}

// ===== UTILITY COMPONENTS =====

/**
 * Skeleton Loader Component
 */
export function SkeletonLoader({
  className = "",
  lines = 3,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded mb-2 last:mb-0"></div>
      ))}
    </div>
  );
}

/**
 * Card Skeleton Component
 */
export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-white rounded-lg shadow p-6 ${className}`}
    >
      <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
      <div className="h-32 bg-gray-200 rounded mb-4"></div>
      <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  );
}
