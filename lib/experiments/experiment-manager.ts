// Experiment Manager - Bridge between experiments and components
// Provides a clean API for getting experiment variants and overrides

import {
  getExperimentVariant,
  assignVariant,
  trackExperimentEvent,
} from "./feature-flags";
import { ALL_EXPERIMENTS } from "./experiments-registry";

// Re-export core functions
export { getExperimentVariant, trackExperimentEvent };

// Experiment keys/constants
export const EXPERIMENT_KEYS = {
  HERO_HEADLINE: "hero-headline-test",
  HERO_VISUAL: "hero-visual-test",
  CTA_BUTTON: "cta-button-test",
  PRICING_LAYOUT: "pricing-layout-test",
  PRICING_MESSAGING: "pricing-messaging-test",
  PRICING_TRIAL: "pricing-trial-test",
  SOCIAL_PROOF_STYLE: "social-proof-style-test",
  TRUST_SIGNALS: "trust-signals-test",
  BENEFITS_PRESENTATION: "benefits-presentation-test",
  FAQ_PRESENTATION: "faq-presentation-test",
  NAVIGATION_STYLE: "navigation-style-test",
  MOBILE_OPTIMIZATION: "mobile-optimization-test",
} as const;

// Override storage for testing/development
const experimentOverrides = new Map<string, string>();

/**
 * Set experiment override for testing purposes
 */
export function setExperimentOverride(
  experimentId: string,
  variantId: string,
): void {
  experimentOverrides.set(experimentId, variantId);
}

/**
 * Clear experiment override
 */
export function clearExperimentOverride(experimentId: string): void {
  experimentOverrides.delete(experimentId);
}

/**
 * Get experiment variant with override support
 */
export function getExperimentVariantWithOverride(
  experimentId: string,
  userId?: string,
): string {
  // Check for override first (useful for testing)
  const override = experimentOverrides.get(experimentId);
  if (override) {
    return override;
  }

  return getExperimentVariant(experimentId, userId);
}

/**
 * Check if experiment exists
 */
export function experimentExists(experimentId: string): boolean {
  return experimentId in ALL_EXPERIMENTS;
}

/**
 * Get all available experiments
 */
export function getAvailableExperiments() {
  return Object.keys(ALL_EXPERIMENTS);
}

/**
 * Reset all overrides (useful for testing cleanup)
 */
export function resetExperimentOverrides(): void {
  experimentOverrides.clear();
}
