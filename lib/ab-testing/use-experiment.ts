"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ExperimentVariant,
  ExperimentDefinition,
  ExperimentResult,
} from "./ab-testing-framework";
import { experimentManager } from "./ab-testing-framework";

export interface ExperimentEventContext {
  // User context
  userId?: string;
  sessionId?: string;
  userSegment?: string;
  // Page context
  pageUrl?: string;
  pageTitle?: string;
  referrer?: string;
  // Device context
  deviceType?: "mobile" | "tablet" | "desktop";
  screenSize?: { width: number; height: number };
  // Experiment context
  variantId?: string;
  experimentName?: string;
  // Custom context properties
  [key: string]: unknown;
}

export interface ExperimentEventMetadata {
  // Timing information
  timestamp?: number;
  duration?: number;
  // Interaction details
  elementId?: string;
  elementType?: string;
  position?: { x: number; y: number };
  // Conversion details
  goalValue?: number;
  goalType?: string;
  // Custom metadata
  [key: string]: unknown;
}

interface UseExperimentOptions {
  enabled?: boolean;
  trackImpressions?: boolean;
  trackConversions?: boolean;
  userContext?: {
    userId?: string;
    segments?: string[];
    country?: string;
    device?: string;
  };
}

interface UseExperimentReturn {
  variant: ExperimentVariant | null;
  loading: boolean;
  error: Error | null;
  trackEvent: (
    eventType: string,
    value?: number,
    context?: ExperimentEventContext,
  ) => void;
  trackConversion: (
    goalId: string,
    value?: number,
    metadata?: ExperimentEventMetadata,
  ) => void;
  isControl: boolean;
  experimentId: string;
}

export function useExperiment(
  experimentId: string,
  options: UseExperimentOptions = {},
): UseExperimentReturn {
  const {
    enabled = true,
    trackImpressions = true,
    trackConversions = true,
    userContext,
  } = options;

  const [variant, setVariant] = useState<ExperimentVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Memoize user context to prevent unnecessary re-assignments
  const memoizedUserContext = useMemo(() => userContext, [userContext]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const assignVariant = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load experiments if not already loaded
        await experimentManager.loadExperiments();

        // Assign variant
        const assignedVariant = experimentManager.assignVariant(
          experimentId,
          memoizedUserContext?.userId,
        );

        if (!assignedVariant) {
          throw new Error(`No variant assigned for experiment ${experimentId}`);
        }

        setVariant(assignedVariant);

        // Track impression only on client side
        if (trackImpressions && typeof window !== "undefined") {
          experimentManager.trackEvent(
            experimentId,
            assignedVariant.id,
            "impression",
            1,
            {
              userId: memoizedUserContext?.userId,
              segments: memoizedUserContext?.segments,
              country: memoizedUserContext?.country,
              device: memoizedUserContext?.device,
              timestamp: Date.now(),
            },
          );
        }
      } catch (err) {
        const error = err as Error;
        setError(error);
        console.error("Experiment assignment failed:", error);
      } finally {
        setLoading(false);
      }
    };

    assignVariant();
  }, [experimentId, enabled, trackImpressions, memoizedUserContext]);

  const trackEvent = useCallback(
    (
      eventType: string,
      value: number = 1,
      context?: Record<string, unknown>,
    ) => {
      if (!variant || !enabled || typeof window === "undefined") return;

      experimentManager.trackEvent(experimentId, variant.id, eventType, value, {
        ...context,
        userId: memoizedUserContext?.userId,
        timestamp: Date.now(),
      });
    },
    [experimentId, variant, enabled, memoizedUserContext?.userId],
  );

  const trackConversion = useCallback(
    (goalId: string, value: number = 1, metadata?: Record<string, unknown>) => {
      if (
        !variant ||
        !enabled ||
        !trackConversions ||
        typeof window === "undefined"
      )
        return;

      experimentManager.trackEvent(experimentId, variant.id, goalId, value, {
        ...metadata,
        conversion: true,
        goalId,
        userId: memoizedUserContext?.userId,
        timestamp: Date.now(),
      });
    },
    [
      experimentId,
      variant,
      enabled,
      trackConversions,
      memoizedUserContext?.userId,
    ],
  );

  return {
    variant,
    loading,
    error,
    trackEvent,
    trackConversion,
    isControl: variant?.isControl || false,
    experimentId,
  };
}

// Hook for multiple experiments
export function useExperiments(
  experimentIds: string[],
  options: UseExperimentOptions = {},
): Record<string, UseExperimentReturn> {
  const experiments: Record<string, UseExperimentReturn> = {};

  /* eslint-disable react-hooks/rules-of-hooks */
  for (const id of experimentIds) {
    experiments[id] = useExperiment(id, options);
  }
  /* eslint-enable react-hooks/rules-of-hooks */

  return experiments;
}

// Hook for experiment results (admin/debugging)
export function useExperimentResults(experimentId: string) {
  const [results, setResults] = useState<ExperimentResult[]>([]);
  const [experiment, setExperiment] = useState<ExperimentDefinition | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const status = experimentManager.getExperimentStatus(experimentId);
      if (status) {
        setResults(status.results);
        setExperiment(status.experiment);
      } else {
        throw new Error(`Experiment ${experimentId} not found`);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [experimentId]);

  useEffect(() => {
    refreshResults();

    // Auto-refresh every 60 seconds
    const interval = setInterval(refreshResults, 60000);
    return () => clearInterval(interval);
  }, [refreshResults]);

  const getWinner = useCallback(() => {
    if (results.length === 0) return null;

    // Find variant with highest improvement and statistical significance
    const significantResults = results.filter(
      (r) =>
        r.metrics[Object.keys(r.metrics)[0]]?.statisticalSignificance &&
        r.metrics[Object.keys(r.metrics)[0]]?.improvement > 0,
    );

    if (significantResults.length === 0) return null;

    // Extract complex expression to variable
    const reducer = (winner: ExperimentResult, current: ExperimentResult) => {
      const winnerImprovement =
        winner.metrics[Object.keys(winner.metrics)[0]]?.improvement || 0;
      const currentImprovement =
        current.metrics[Object.keys(current.metrics)[0]]?.improvement || 0;
      return currentImprovement > winnerImprovement ? current : winner;
    };

    return significantResults.reduce(reducer);
  }, [results]);

  return {
    results,
    experiment,
    loading,
    error,
    refreshResults,
    winner: getWinner(),
    hasWinner: getWinner() !== null,
  };
}

// Hook for A/B testing configuration
export function useABTestingConfig() {
  const [experiments, setExperiments] = useState<ExperimentDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExperiments = async () => {
      try {
        await experimentManager.loadExperiments();
        // Get all experiments
        const allExperiments = Array.from(
          experimentManager["experiments"].values(),
        );
        setExperiments(allExperiments);
      } catch (error) {
        console.error("Failed to load experiments:", error);
      } finally {
        setLoading(false);
      }
    };

    loadExperiments();
  }, []);

  const activeExperiments = experiments.filter(
    (exp) => exp.status === "running",
  );
  const completedExperiments = experiments.filter(
    (exp) => exp.status === "completed",
  );

  return {
    experiments,
    activeExperiments,
    completedExperiments,
    loading,
    totalActive: activeExperiments.length,
    totalCompleted: completedExperiments.length,
  };
}

// Higher-order component for experiment variants
export function withExperiment<P extends object>(
  experimentId: string,
  variantComponentMap: Record<string, React.ComponentType<P>>,
  fallbackComponent?: React.ComponentType<P>,
  options?: UseExperimentOptions,
) {
  return function ExperimentWrapper(props: P) {
    const { variant, loading, error } = useExperiment(experimentId, options);

    if (loading) {
      return fallbackComponent
        ? React.createElement(fallbackComponent, props)
        : null;
    }

    if (error || !variant) {
      console.error("Experiment error:", error);
      return fallbackComponent
        ? React.createElement(fallbackComponent, props)
        : null;
    }

    const Component = variantComponentMap[variant.id] || fallbackComponent;
    if (!Component) {
      console.warn(`No component found for variant ${variant.id}`);
      return fallbackComponent
        ? React.createElement(fallbackComponent, props)
        : null;
    }

    return React.createElement(Component, props);
  };
}

// Utility hook for conditional rendering based on experiment
export function useExperimentVariant(
  experimentId: string,
  options?: UseExperimentOptions,
) {
  const { variant, loading } = useExperiment(experimentId, options);

  return {
    variant,
    loading,
    isVariant: (variantId: string) => variant?.id === variantId,
    isControl: variant?.isControl || false,
    variantConfig: variant?.config || {},
  };
}

// Hook for experiment analytics
export function useExperimentAnalytics(experimentId: string) {
  const [analytics, setAnalytics] = useState({
    impressions: 0,
    conversions: 0,
    conversionRate: 0,
    confidence: 0,
  });

  useEffect(() => {
    const updateAnalytics = () => {
      const status = experimentManager.getExperimentStatus(experimentId);
      if (status) {
        const totalImpressions = status.totalVisitors;
        const totalConversions = status.results.reduce((sum, result) => {
          return (
            sum +
            Object.values(result.metrics).reduce(
              (metricSum, metric) => metricSum + metric.conversion,
              0,
            )
          );
        }, 0);

        const conversionRate =
          totalImpressions > 0 ? totalConversions / totalImpressions : 0;
        const avgConfidence =
          status.results.length > 0
            ? status.results.reduce(
                (sum, result) => sum + result.confidence,
                0,
              ) / status.results.length
            : 0;

        setAnalytics({
          impressions: totalImpressions,
          conversions: totalConversions,
          conversionRate,
          confidence: avgConfidence,
        });
      }
    };

    updateAnalytics();
    const interval = setInterval(updateAnalytics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [experimentId]);

  return analytics;
}
