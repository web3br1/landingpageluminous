"use client";

import React, { Suspense, useEffect, useState, useCallback } from "react";
import { SectionId } from "../registry/section-registry";
import { LoadingTrigger } from "./lazy-loading-policy";

/**
 * Progressive Loading Stages - Fase 1 Foundation
 */
export enum LoadingStage {
  SKELETON = "skeleton",    // Loading placeholder
  PLACEHOLDER = "placeholder", // Basic content preview
  PREVIEW = "preview",      // Low-quality preview (optional)
  FULL = "full"            // Full content
}

/**
 * Props interface for lazy-loaded components
 */
export interface LazyComponentProps {
  // Common props for all lazy components
  sectionId?: SectionId;
  variant?: string;
  priority?: "low" | "normal" | "high";

  // Loading context
  loadingStage?: LoadingStage;
  isVisible?: boolean;

  // Performance hints
  shouldAnimate?: boolean;
  prefetchData?: boolean;

  // Custom props for specific components
  [key: string]: unknown;
}

/**
 * Progressive Loader Props - Integrates with Scaffold B Composition
 */
export interface ProgressiveLoaderProps {
  sectionId: SectionId;
  component: () => Promise<{ default: React.ComponentType<unknown> }>;

  // Stages configuration
  stages: {
    skeleton: React.ComponentType;
    placeholder?: React.ComponentType;
    preview?: React.ComponentType; // Optional in Phase 1
  };

  // Scaffold B Integration
  loadPriority: "hero" | "early" | "deferred";
  strategy: "eager" | "progressive" | "deferred";

  // Context awareness (Phase 1 signals)
  context: {
    effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
    hardwareConcurrency?: number;
    cookieConsent?: {
      analytics: boolean;
      necessary: boolean;
    };
  };

  // Accessibility
  ariaLabel?: string;
  preserveLayout?: boolean; // Prevent CLS

  // Callbacks
  onStageComplete?: (stage: LoadingStage) => void;
  onError?: (error: Error) => void;
}

/**
 * Privacy-Aware Context Collector - Phase 1 Foundation
 */
export class PrivacyAwareContextCollector {
  static async collectMinimalContext(): Promise<{
    effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
    hardwareConcurrency?: number;
  }> {
    if (typeof window === "undefined") {
      return {};
    }

    const context: any = {};

    // Network info (basic, no tracking)
    if ("connection" in navigator) {
      context.effectiveType = (navigator as any).connection?.effectiveType;
    }

    // Hardware concurrency (basic capability)
    context.hardwareConcurrency = navigator.hardwareConcurrency;

    return context;
  }

  static async collectWithConsent(cookieConsent: { analytics: boolean }): Promise<{
    effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
    hardwareConcurrency?: number;
    cookieConsent: { analytics: boolean; necessary: boolean };
  }> {
    const minimal = await this.collectMinimalContext();

    return {
      ...minimal,
      cookieConsent: {
        analytics: cookieConsent.analytics,
        necessary: true, // Always required
      },
    };
  }
}

/**
 * Progressive Loader Component - Phase 1
 */
export function ProgressiveLoader({
  sectionId,
  component,
  stages,
  loadPriority,
  strategy,
  context,
  ariaLabel,
  preserveLayout = true,
  onStageComplete,
  onError,
}: ProgressiveLoaderProps) {
  const [currentStage, setCurrentStage] = useState<LoadingStage>(
    LoadingStage.SKELETON
  );
  const [Component, setComponent] = useState<React.ComponentType<LazyComponentProps> | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Determine loading strategy based on context (Phase 1 logic)
  const getAdaptedStrategy = useCallback((): "eager" | "progressive" | "deferred" => {
    // If no analytics consent, be conservative
    if (!context.cookieConsent?.analytics) {
      return strategy === "eager" ? "progressive" : strategy;
    }

    // Network-aware adaptation
    const isSlowNetwork = context.effectiveType === "slow-2g" || context.effectiveType === "2g";
    const isLowPower = (context.hardwareConcurrency || 4) < 4;

    if (isSlowNetwork || isLowPower) {
      return "deferred";
    }

    return strategy;
  }, [context, strategy]);

  // Load component with progressive stages
  const loadComponent = useCallback(async () => {
    try {
      const adaptedStrategy = getAdaptedStrategy();

      // Stage 1: Skeleton (immediate)
      setCurrentStage(LoadingStage.SKELETON);
      onStageComplete?.(LoadingStage.SKELETON);

      // Stage 2: Placeholder (quick preview)
      if (stages.placeholder && adaptedStrategy !== "deferred") {
        setCurrentStage(LoadingStage.PLACEHOLDER);
        onStageComplete?.(LoadingStage.PLACEHOLDER);

        // Brief delay for placeholder visibility
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Stage 3: Preview (optional, only if available and strategy allows)
      if (stages.preview && adaptedStrategy === "progressive") {
        setCurrentStage(LoadingStage.PREVIEW);
        onStageComplete?.(LoadingStage.PREVIEW);

        // Brief delay for preview visibility
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Stage 4: Full component
      const module = await component();
      setComponent(() => module.default);
      setCurrentStage(LoadingStage.FULL);
      onStageComplete?.(LoadingStage.FULL);

    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
    }
  }, [component, stages, getAdaptedStrategy, onStageComplete, onError]);

  // Trigger loading based on strategy
  useEffect(() => {
    const adaptedStrategy = getAdaptedStrategy();

    switch (adaptedStrategy) {
      case "eager":
        loadComponent();
        break;
      case "progressive":
        // Load after a brief delay for progressive enhancement
        const timer = setTimeout(loadComponent, 100);
        return () => clearTimeout(timer);
      case "deferred":
        // Wait for user interaction or scroll
        // This will be handled by intersection observer in parent
        break;
    }
  }, [loadComponent, getAdaptedStrategy]);

  // Accessibility: aria-busy for loading states
  const getAriaAttributes = () => {
    if (currentStage !== LoadingStage.FULL) {
      return {
        "aria-busy": "true",
        "aria-label": ariaLabel || `Loading ${sectionId} section`,
        role: "status",
      };
    }
    return {};
  };

  // Render current stage with universal fallback
  const renderCurrentStage = () => {
    const ariaProps = getAriaAttributes();

    try {
      switch (currentStage) {
        case LoadingStage.SKELETON:
          const SkeletonComponent = stages.skeleton;
          return (
            <div {...(ariaProps as any)} className="progressive-loader-skeleton">
              <SkeletonComponent />
            </div>
          );

        case LoadingStage.PLACEHOLDER:
          if (stages.placeholder) {
            const PlaceholderComponent = stages.placeholder;
            return (
              <div {...(ariaProps as any)} className="progressive-loader-placeholder">
                <PlaceholderComponent />
              </div>
            );
          }
          // Fall through to skeleton

        case LoadingStage.PREVIEW:
          if (stages.preview) {
            const PreviewComponent = stages.preview;
            return (
              <div {...(ariaProps as any)} className="progressive-loader-preview">
                <PreviewComponent />
              </div>
            );
          }
          // Fall through to placeholder/skeleton

        case LoadingStage.FULL:
          if (Component) {
            return (
              <Suspense
                fallback={
                  <div className="progressive-loader-loading">
                    <stages.skeleton />
                  </div>
                }
              >
                <Component />
              </Suspense>
            );
          }
          // Fall through to error

        default:
          // Universal fallback for any error state
          return renderUniversalFallback(ariaProps as any);
      }
    } catch (renderError) {
      // Ultimate fallback if rendering fails
      console.error(`[ProgressiveLoader] Render error for ${sectionId}:`, renderError);
      return renderUniversalFallback(ariaProps as any);
    }
  };

  // Universal fallback component (safe render mode)
  const renderUniversalFallback = (ariaProps: any) => {
    return (
      <div {...ariaProps} className="progressive-loader-universal-fallback">
        <div className="min-h-[200px] flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-center p-4">
            <div className="text-gray-400 text-sm mb-2">Loading...</div>
            {error && (
              <div className="text-red-600 text-xs mb-2">
                Unable to load content
              </div>
            )}
            <button
              onClick={loadComponent}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
              disabled={currentStage === LoadingStage.SKELETON}
            >
              {currentStage === LoadingStage.SKELETON ? "Loading..." : "Retry"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // CLS prevention: maintain consistent dimensions
  const containerStyle = preserveLayout ? {
    minHeight: "200px", // Base minimum, can be overridden
    width: "100%",
  } : {};

  return (
    <div
      className={`progressive-loader progressive-loader-${sectionId}`}
      style={containerStyle}
      data-loading-stage={currentStage}
      data-load-priority={loadPriority}
    >
      {renderCurrentStage()}
    </div>
  );
}

/**
 * Hook for Progressive Loading with Scaffold B Integration
 */
export function useProgressiveLoading(props: ProgressiveLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [stage, setStage] = useState<LoadingStage>(LoadingStage.SKELETON);

  const handleStageComplete = useCallback((completedStage: LoadingStage) => {
    setStage(completedStage);
    if (completedStage === LoadingStage.FULL) {
      setIsLoaded(true);
    }
    props.onStageComplete?.(completedStage);
  }, [props]);

  return {
    ProgressiveLoader: () => (
      <ProgressiveLoader
        {...props}
        onStageComplete={handleStageComplete}
      />
    ),
    isLoaded,
    currentStage: stage,
  };
}
