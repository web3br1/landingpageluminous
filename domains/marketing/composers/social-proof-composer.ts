// Composer Layer - Social Proof Section Composer
// Orchestrates social proof content composition with business logic and experiments

import type { SocialProofContent } from "../types/social-proof.types";
import { socialProofContentVariants } from "../content/social-proof-content";

/**
 * Composes social proof content based on context and experiments
 * @param options Configuration options for social proof composition
 * @returns Composed social proof content ready for UI consumption
 */
export function composeSocialProofContent(
  options: {
    variant?: "default" | "logos-only" | "testimonials-only" | "metrics-only";
    experimentId?: string;
    userSegment?: "smb" | "enterprise" | "startup";
    maxLogos?: number;
    maxTestimonials?: number;
    featuredOnly?: boolean;
    minRating?: number;
    layout?: SocialProofContent["layout"];
  } = {},
): SocialProofContent {
  const {
    variant = "default",
    maxLogos,
    maxTestimonials,
    featuredOnly = false,
    minRating = 4,
    layout,
  } = options;

  // Select base content variant
  let content =
    socialProofContentVariants[variant] || socialProofContentVariants.default;

  // Apply layout override if specified
  if (layout) {
    content = { ...content, layout };
  }

  // Filter testimonials by rating
  if (minRating > 0 && content.testimonials.length > 0) {
    content = {
      ...content,
      testimonials: content.testimonials.filter(
        (t) => (t.rating || 0) >= minRating,
      ),
    };
  }

  // Filter featured testimonials only
  if (featuredOnly && content.testimonials.length > 0) {
    content = {
      ...content,
      testimonials: content.testimonials.filter((t) => t.featured),
    };
  }

  // Apply limits
  if (maxLogos && maxLogos > 0 && content.logos.length > maxLogos) {
    content = {
      ...content,
      logos: content.logos.slice(0, maxLogos),
    };
  }

  if (
    maxTestimonials &&
    maxTestimonials > 0 &&
    content.testimonials.length > maxTestimonials
  ) {
    content = {
      ...content,
      testimonials: content.testimonials.slice(0, maxTestimonials),
    };
  }

  // Apply user segment adaptations
  if (options.userSegment === "enterprise") {
    // Enterprise users see more technical testimonials and higher-value metrics
    content = {
      ...content,
      testimonials: content.testimonials.filter(
        (t) =>
          t.author.role.toLowerCase().includes("director") ||
          t.author.role.toLowerCase().includes("head") ||
          t.author.company.toLowerCase().includes("corp") ||
          t.author.company.toLowerCase().includes("enterprise"),
      ),
    };
  }

  return {
    ...content,
    // Add envelope structure for SSR tests
    envelope: {
      id: "social-proof",
      type: "social-proof" as const,
      version: "1.0.0",
      timestamp: Date.now(),
    },
    // Add any runtime personalization or A/B testing here
  };
}

// Default composer for simple usage
export const defaultSocialProofComposer = () => composeSocialProofContent();

// Logos only variant
export const logosOnlySocialProofComposer = () =>
  composeSocialProofContent({
    variant: "logos-only",
  });

// Testimonials focused variant
export const testimonialsOnlySocialProofComposer = () =>
  composeSocialProofContent({
    variant: "testimonials-only",
  });

// Metrics focused variant
export const metricsOnlySocialProofComposer = () =>
  composeSocialProofContent({
    variant: "metrics-only",
  });

// Featured testimonials only
export const featuredSocialProofComposer = () =>
  composeSocialProofContent({
    featuredOnly: true,
    maxTestimonials: 2,
  });

// Compact version for constrained spaces
export const compactSocialProofComposer = () =>
  composeSocialProofContent({
    maxLogos: 4,
    maxTestimonials: 2,
    layout: "mixed-logos-testimonials",
  });
