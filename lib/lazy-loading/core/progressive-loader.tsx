"use client";

import React, { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { logger } from "../../observability/logger";
import { useViewportTrigger, createIntersectionConfig } from "./intersection-observer";

/**
 * Progressive Loading System - Phase 1 Foundation
 * Core implementation with SKELETON → PLACEHOLDER → FULL pipeline
 */

export enum LoadingStage {
  SKELETON = "skeleton",
  PLACEHOLDER = "placeholder",
  FULL = "full",
}

export enum LoadingState {
  IDLE = "idle",
  LOADING = "loading",
  LOADED = "loaded",
  ERROR = "error",
  TIMEOUT = "timeout",
}

/**
 * Loading Context - Phase 1 signals
 */
export interface LoadingContext {
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  hardwareConcurrency?: number;
  cookieConsent?: {
    analytics: boolean;
    necessary: boolean;
  };
}

/**
 * Progressive Loader Configuration
 */
export interface ProgressiveLoaderConfig {
  sectionId: string;

  // Component to load
  component: () => Promise<{ default: React.ComponentType<unknown> }>;

  // Stage components
  stages: {
    skeleton: React.ComponentType;
    placeholder?: React.ComponentType;
  };

  // Scaffold B metadata
  loadPriority: "hero" | "early" | "deferred";
  strategy: "eager" | "progressive" | "deferred";

  // Context for adaptation
  context: LoadingContext;

  // Callbacks
  onStageComplete?: (stage: LoadingStage) => void;
  onError?: (error: Error) => void;

  // Accessibility
  ariaLabel?: string;
  preserveLayout?: boolean;
}

/**
 * Progressive Loader Result
 */
export interface ProgressiveLoaderResult {
  element: React.ReactElement;
  currentStage: LoadingStage;
  state: LoadingState;
  error: Error | null;
}

/**
 * Context Collector - Phase 1 Implementation
 */
export class ContextCollector {
  static async collectMinimalContext(): Promise<Pick<LoadingContext, "effectiveType" | "hardwareConcurrency">> {
    if (typeof window === "undefined") {
      return {};
    }

    const context: any = {};

    try {
      // Network info (basic, no tracking)
      if ("connection" in navigator) {
        context.effectiveType = (navigator as any).connection?.effectiveType;
      }

      // Hardware concurrency (basic capability)
      context.hardwareConcurrency = navigator.hardwareConcurrency;

      // Log collection (ll_ prefix)
      logger.info("Context collected", {
        event: "ll_context_collected",
        ll_effective_type: context.effectiveType,
        ll_hardware_concurrency: context.hardwareConcurrency,
        ll_minimal_mode: true,
      });
    } catch (error) {
      logger.warn("Failed to collect minimal context", {
        event: "ll_context_collection_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return context;
  }

  static async collectWithConsent(cookieConsent: { analytics: boolean }): Promise<LoadingContext> {
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
 * Strategy Adaptor - Phase 1 Logic
 */
export class StrategyAdaptor {
  static adaptStrategy(
    baseStrategy: "eager" | "progressive" | "deferred",
    context: LoadingContext
  ): "eager" | "progressive" | "deferred" {
    // Privacy gate: no aggressive loading without consent
    if (baseStrategy === "eager" && !context.cookieConsent?.analytics) {
      logger.info("Strategy adapted due to privacy", {
        event: "ll_strategy_adapted",
        ll_reason: "privacy_gate",
        ll_original_strategy: baseStrategy,
        ll_adapted_strategy: "progressive",
      });
      return "progressive";
    }

    // Network/capability adaptation
    const isSlowNetwork = context.effectiveType === "slow-2g" || context.effectiveType === "2g";
    const isLowPower = (context.hardwareConcurrency || 4) < 4;

    if (isSlowNetwork || isLowPower) {
      logger.info("Strategy adapted due to capabilities", {
        event: "ll_strategy_adapted",
        ll_reason: "capability_limitation",
        ll_original_strategy: baseStrategy,
        ll_adapted_strategy: "deferred",
        ll_slow_network: isSlowNetwork,
        ll_low_power: isLowPower,
      });
      return "deferred";
    }

    return baseStrategy;
  }
}

/**
 * Progressive Loader Hook - Core Implementation
 */
export function useProgressiveLoader(
  config: ProgressiveLoaderConfig
): ProgressiveLoaderResult {
  const {
    sectionId,
    component,
    stages,
    loadPriority,
    strategy,
    context,
    onStageComplete,
    onError,
    ariaLabel = `Loading ${sectionId} section`,
    preserveLayout = true,
  } = config;

  const [currentStage, setCurrentStage] = useState<LoadingStage>(LoadingStage.SKELETON);
  const [state, setState] = useState<LoadingState>(LoadingState.IDLE);
  const [Component, setComponent] = useState<React.ComponentType<unknown> | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const stageStartTimeRef = useRef<number>(Date.now());

  // Adapt strategy based on context
  const adaptedStrategy = StrategyAdaptor.adaptStrategy(strategy, context);

  // Intersection observer for viewport-based triggering
  const { ref: intersectionRef, isTriggered } = useViewportTrigger(
    sectionId,
    (ratio) => {
      logger.info("Viewport trigger activated", {
        event: "ll_viewport_trigger_activated",
        ll_section_id: sectionId,
        ll_intersection_ratio: ratio,
        ll_adapted_strategy: adaptedStrategy,
      });
    },
    createIntersectionConfig(loadPriority)
  );

  // Log stage completion
  const logStageComplete = useCallback((stage: LoadingStage, error?: Error) => {
    const stageDuration = Date.now() - stageStartTimeRef.current;
    const totalDuration = Date.now() - startTimeRef.current;

    logger.info(`Stage ${stage} completed`, {
      event: "ll_stage_completed",
      ll_section_id: sectionId,
      ll_stage: stage,
      ll_stage_duration: stageDuration,
      ll_total_duration: totalDuration,
      ll_error: error?.message,
      ll_adapted_strategy: adaptedStrategy,
      ll_load_priority: loadPriority,
    });

    onStageComplete?.(stage);
  }, [sectionId, onStageComplete, adaptedStrategy, loadPriority]);

  // Log error with ll_ prefix
  const logError = useCallback((error: Error, context: string) => {
    const totalDuration = Date.now() - startTimeRef.current;

    logger.error(`Progressive loading error: ${context}`, {
      event: "ll_error",
      ll_section_id: sectionId,
      ll_error_message: error.message,
      ll_error_context: context,
      ll_total_duration: totalDuration,
      ll_current_stage: currentStage,
    });

    onError?.(error);
  }, [sectionId, currentStage, onError]);

  // Load component with progressive stages
  const loadComponent = useCallback(async () => {
    if (state === LoadingState.LOADING || state === LoadingState.LOADED) {
      return;
    }

    setState(LoadingState.LOADING);
    startTimeRef.current = Date.now();

    try {
      // Stage 1: SKELETON (immediate)
      setCurrentStage(LoadingStage.SKELETON);
      stageStartTimeRef.current = Date.now();
      logStageComplete(LoadingStage.SKELETON);

      // Brief delay for skeleton visibility (accessibility)
      await new Promise(resolve => setTimeout(resolve, 50));

      // Stage 2: PLACEHOLDER (quick preview - optional)
      if (stages.placeholder) {
        setCurrentStage(LoadingStage.PLACEHOLDER);
        stageStartTimeRef.current = Date.now();
        logStageComplete(LoadingStage.PLACEHOLDER);

        // Brief delay for placeholder visibility
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Stage 3: FULL (complete component)
      setCurrentStage(LoadingStage.FULL);
      stageStartTimeRef.current = Date.now();

      const module = await component();
      setComponent(() => module.default);
      setState(LoadingState.LOADED);

      logStageComplete(LoadingStage.FULL);

    } catch (err) {
      const error = err as Error;
      setError(error);
      setState(LoadingState.ERROR);
      logError(error, "component_loading_failed");
    }
  }, [component, stages.placeholder, state, logStageComplete, logError]);

  // Auto-load based on adapted strategy and intersection trigger
  useEffect(() => {
    logger.debug("Evaluating load trigger", {
      event: "ll_trigger_evaluation",
      ll_section_id: sectionId,
      ll_adapted_strategy: adaptedStrategy,
      ll_is_triggered: isTriggered,
      ll_load_priority: loadPriority,
    });

    switch (adaptedStrategy) {
      case "eager":
        // Load immediately for critical content
        logger.info("Eager loading triggered", {
          event: "ll_eager_trigger",
          ll_section_id: sectionId,
        });
        loadComponent();
        break;

      case "progressive":
        // Load after brief delay for progressive enhancement
        const progressiveTimer = setTimeout(() => {
          logger.info("Progressive loading triggered", {
            event: "ll_progressive_trigger",
            ll_section_id: sectionId,
          });
          loadComponent();
        }, 100);
        return () => clearTimeout(progressiveTimer);

      case "deferred":
        // Load only when viewport trigger activates
        if (isTriggered && state === LoadingState.IDLE) {
          logger.info("Deferred loading triggered by viewport", {
            event: "ll_deferred_trigger",
            ll_section_id: sectionId,
          });
          loadComponent();
        }
        break;
    }
  }, [adaptedStrategy, isTriggered, loadComponent, sectionId, state, loadPriority]);

  // Render current stage with universal fallback
  const renderCurrentStage = useCallback(() => {
    const ariaProps = {
      "aria-busy": state === LoadingState.LOADING ? "true" : "false",
      "aria-label": ariaLabel,
      role: state === LoadingState.LOADING ? "status" : undefined,
    };

    try {
      switch (currentStage) {
        case LoadingStage.SKELETON:
          const SkeletonComponent = stages.skeleton;
          return (
            <div {...ariaProps} className="progressive-loader-skeleton">
              <SkeletonComponent />
            </div>
          );

        case LoadingStage.PLACEHOLDER:
          if (stages.placeholder) {
            const PlaceholderComponent = stages.placeholder;
            return (
              <div {...ariaProps} className="progressive-loader-placeholder">
                <PlaceholderComponent />
              </div>
            );
          }
          // Fall through to skeleton

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
          return renderUniversalFallback(ariaProps);
      }
    } catch (renderError) {
      // Ultimate fallback if rendering fails
      console.error(`[ProgressiveLoader] Render error for ${sectionId}:`, renderError);
      return renderUniversalFallback(ariaProps);
    }
  }, [currentStage, Component, stages, state, ariaLabel, sectionId]);

  // Universal fallback component (safe render mode)
  const renderUniversalFallback = useCallback((ariaProps: any) => {
    return (
      <div {...ariaProps} className="progressive-loader-universal-fallback">
        <div className="min-h-[200px] flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-center p-4">
            <div className="text-gray-400 text-sm mb-2">
              {state === LoadingState.ERROR ? "Unable to load content" : "Loading..."}
            </div>
            {error && (
              <div className="text-red-600 text-xs mb-2">
                {error.message}
              </div>
            )}
            {state === LoadingState.ERROR && (
              <button
                onClick={loadComponent}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
                disabled={state === LoadingState.LOADING}
              >
                {state === LoadingState.LOADING ? "Loading..." : "Retry"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }, [error, state, loadComponent]);

  // CLS prevention: maintain consistent dimensions
  const containerStyle = preserveLayout ? {
    minHeight: "200px", // Base minimum, can be overridden
    width: "100%",
  } : {};

  const element = (
    <div
      ref={intersectionRef}
      className={`progressive-loader progressive-loader-${sectionId}`}
      style={containerStyle}
      data-loading-stage={currentStage}
      data-loading-state={state}
      data-load-priority={loadPriority}
      data-adapted-strategy={adaptedStrategy}
    >
      {renderCurrentStage()}
    </div>
  );

  return {
    element,
    currentStage,
    state,
    error,
  };
}

/**
 * Progressive Loader Component - React Wrapper
 */
export function ProgressiveLoader(props: ProgressiveLoaderConfig): React.ReactElement {
  const { element } = useProgressiveLoader(props);
  return element;
}

/**
 * Utility function to create loader config from Scaffold B metadata
 */
export function createLoaderConfig(
  sectionId: string,
  component: () => Promise<{ default: React.ComponentType<unknown> }>,
  stages: ProgressiveLoaderConfig["stages"],
  scaffoldMetadata: {
    loadPriority: "hero" | "early" | "deferred";
    strategy: "eager" | "progressive" | "deferred";
    requiresAnalyticsConsent: boolean;
  },
  context: LoadingContext
): ProgressiveLoaderConfig {
  const adaptedStrategy = StrategyAdaptor.adaptStrategy(scaffoldMetadata.strategy, context);

  logger.info("Loader config created", {
    event: "ll_config_created",
    ll_section_id: sectionId,
    ll_original_strategy: scaffoldMetadata.strategy,
    ll_adapted_strategy: adaptedStrategy,
    ll_requires_consent: scaffoldMetadata.requiresAnalyticsConsent,
    ll_has_consent: context.cookieConsent?.analytics,
  });

  return {
    sectionId,
    component,
    stages,
    context,
    preserveLayout: true,
    onStageComplete: (stage) => {
      logger.info(`Stage completed for ${sectionId}`, {
        event: "ll_stage_completed",
        ll_section_id: sectionId,
        ll_stage: stage,
      });
    },
    onError: (error) => {
      logger.error(`Loader error for ${sectionId}`, {
        event: "ll_error",
        ll_section_id: sectionId,
        error: error.message,
      });
    },
  };
}
