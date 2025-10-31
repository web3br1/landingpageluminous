"use client";

import React, { useState, useEffect } from "react";
import { flags } from "@/lib/flags";

// Type definitions for feature flags
export type FeatureFlagKey = keyof typeof flags.features;
export type ExperimentKey = keyof typeof flags.experiments;

// Hook for feature flags
export function useFeatureFlag(
  flagName: FeatureFlagKey,
  fallback: boolean = false,
) {
  const [isEnabled, setIsEnabled] = useState(fallback);

  useEffect(() => {
    const enabled = flags.getFeature(flagName, fallback);
    setIsEnabled(enabled);
  }, [flagName, fallback]);

  return isEnabled;
}

// Hook for experiments with SSR safety
export function useExperiment(experimentId: ExperimentKey) {
  const [variant, setVariant] = useState("control");
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Resolve experiment on client side after hydration
    const resolvedVariant = flags.getExperimentVariant(experimentId as string);
    const resolvedIsActive = flags.experiments[experimentId]?.active || false;

    setVariant(resolvedVariant);
    setIsActive(resolvedIsActive);
    setIsLoading(false);
  }, [experimentId]);

  const trackConversion = (goal: string) => {
    if (isActive && !isLoading) {
      flags.trackConversion(experimentId as string, goal);
    }
  };

  return {
    variant,
    isActive,
    isLoading,
    isVariant: (variantId: string) => variant === variantId,
    trackConversion,
  };
}

// Hook for conditional rendering based on experiments
export function useConditionalRender<T>(
  experimentId: ExperimentKey,
  variants: Record<string, T>,
  fallback: T,
): T {
  const { variant, isActive } = useExperiment(experimentId);

  if (!isActive) {
    return variants.control || fallback;
  }

  return variants[variant] || fallback;
}

// Hook for A/B testing content
export function useABContent(
  experimentId: ExperimentKey,
  contentVariants: Record<string, unknown>,
  fallback: unknown = null,
) {
  return useConditionalRender(experimentId, contentVariants, fallback);
}

// Utility hook for feature flag gates
export function useFeatureGate(flagName: FeatureFlagKey) {
  const isEnabled = useFeatureFlag(flagName);

  return {
    isEnabled,
    whenEnabled: (callback: () => void) => {
      if (isEnabled) callback();
    },
    // Note: Gate component removed temporarily due to JSX compilation issues
    // Will be re-added when proper .tsx setup is configured
  };
}

// Hook for experiment tracking
export function useExperimentTracker(experimentId: ExperimentKey) {
  const { variant, isActive, trackConversion } = useExperiment(experimentId);

  return {
    variant,
    isActive,
    track: {
      conversion: (goal: string) => trackConversion(goal),
      click: (element: string) => trackConversion(`click_${element}`),
      view: (element: string) => trackConversion(`view_${element}`),
      submit: (form: string) => trackConversion(`submit_${form}`),
    },
  };
}
