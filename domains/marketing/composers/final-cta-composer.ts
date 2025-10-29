// Composer Layer - Final CTA Section Composer
// Orchestrates final CTA content composition with business logic and experiments

import type { FinalCtaContent } from "../types/final-cta.types";
import { finalCtaContentVariants } from "../content/final-cta-content";

/**
 * Composes final CTA content based on context and experiments
 * @param options Configuration options for final CTA composition
 * @returns Composed final CTA content ready for UI consumption
 */
export function composeFinalCtaContent(
  options: {
    variant?: "default" | "enterprise";
    experimentId?: string;
    userSegment?: "smb" | "enterprise" | "startup";
  } = {},
): FinalCtaContent {
  const { variant = "default", userSegment = "smb" } = options;

  // Select base content variant
  let content =
    finalCtaContentVariants[variant] || finalCtaContentVariants.default;

  // Apply user segment adaptations
  if (userSegment === "enterprise" && variant === "default") {
    content = finalCtaContentVariants.enterprise;
  }

  // Add any runtime personalization or A/B testing here
  return {
    ...content,
    // Add envelope structure for SSR tests
    envelope: {
      id: "final-cta",
      type: "final-cta" as const,
      version: "1.0.0",
      timestamp: Date.now(),
    },
    // Add tracking metadata for analytics
  };
}

// Default composer for simple usage
export const defaultFinalCtaComposer = () => composeFinalCtaContent();

// Enterprise-focused composer
export const enterpriseFinalCtaComposer = () =>
  composeFinalCtaContent({
    variant: "enterprise",
    userSegment: "enterprise",
  });
