// React hooks for A/B testing and feature flags

import { useEffect, useState } from "react";
import {
  getExperimentVariant,
  isFeatureEnabled,
  trackExperimentEvent,
} from "./feature-flags";

// ===== TYPES =====

export interface ExperimentVariantsMap {
  // Experiment ID -> Variant ID mapping
  [experimentId: string]: string;
}

/**
 * Hook for A/B testing - returns assigned variant for experiment
 */
export function useExperiment(experimentId: string, trackView = true) {
  const [variant, setVariant] = useState<string>("control");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get variant assignment
    const assignedVariant = getExperimentVariant(experimentId);
    setVariant(assignedVariant);
    setLoading(false);

    // Track view event if requested
    if (trackView && !loading) {
      trackExperimentEvent(experimentId, assignedVariant, "view");
    }
  }, [experimentId, trackView, loading]);

  return { variant, loading };
}

/**
 * Hook for feature flags
 */
export function useFeatureFlag(flagId: string) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const flagEnabled = isFeatureEnabled(flagId);
    setEnabled(flagEnabled);
    setLoading(false);
  }, [flagId]);

  return { enabled, loading };
}

/**
 * Hook for tracking experiment events
 */
export function useExperimentTracking(experimentId: string, variantId: string) {
  const trackEvent = (
    eventType: "view" | "click" | "convert" | "custom",
    eventName?: string,
    metadata?: Record<string, unknown>,
  ) => {
    trackExperimentEvent(
      experimentId,
      variantId,
      eventType,
      eventName,
      metadata,
    );
  };

  const trackClick = (
    elementName: string,
    metadata?: Record<string, unknown>,
  ) => {
    trackEvent("click", elementName, metadata);
  };

  const trackConvert = (
    conversionType: string,
    metadata?: Record<string, unknown>,
  ) => {
    trackEvent("convert", conversionType, metadata);
  };

  return { trackEvent, trackClick, trackConvert };
}

/**
 * Hook for A/B testing with automatic tracking
 */
export function useABTest(
  experimentId: string,
  options: {
    trackView?: boolean;
    onVariantAssigned?: (variant: string) => void;
  } = {},
) {
  const { trackView = true, onVariantAssigned } = options;
  const { variant, loading } = useExperiment(experimentId, trackView);
  const tracking = useExperimentTracking(experimentId, variant);

  useEffect(() => {
    if (!loading && variant !== "control") {
      onVariantAssigned?.(variant);
    }
  }, [variant, loading, onVariantAssigned]);

  return {
    variant,
    loading,
    ...tracking,
  };
}

/**
 * Hook for multiple experiments
 */
export function useExperiments(experimentIds: string[]) {
  const [variants, setVariants] = useState<ExperimentVariantsMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const assignedVariants: Record<string, string> = {};

    experimentIds.forEach((id) => {
      assignedVariants[id] = getExperimentVariant(id);
    });

    setVariants(assignedVariants);
    setLoading(false);

    // Track view events for all experiments
    Object.entries(assignedVariants).forEach(([expId, variant]) => {
      trackExperimentEvent(expId, variant, "view");
    });
  }, [experimentIds]);

  return { variants, loading };
}

/**
 * Higher-order component for A/B testing
 */
export function withExperiment<P extends object>(
  experimentId: string,
  Component: React.ComponentType<P & { experimentVariant: string }>,
) {
  return function ExperimentComponent(props: P) {
    const { variant } = useExperiment(experimentId);

    return <Component {...props} experimentVariant={variant} />;
  };
}

/**
 * Higher-order component for feature flags
 */
export function withFeatureFlag<P extends object>(
  flagId: string,
  Component: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<P>,
) {
  return function FeatureComponent(props: P) {
    const { enabled } = useFeatureFlag(flagId);

    if (!enabled && FallbackComponent) {
      return <FallbackComponent {...props} />;
    }

    return enabled ? <Component {...props} /> : null;
  };
}
