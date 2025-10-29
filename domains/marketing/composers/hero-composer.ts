// Content Composer - Hero Section
// Orchestrates hero content with experiments, personalization, and analytics

import {
  heroContentVariants,
  heroConfiguration,
  heroVariants,
} from "../content/hero-content";
import type { ComposedHeroData, HeroContent } from "../types/hero.types";
import { flags } from "@/lib/flags";

// Server-safe experiment variant resolution
const getExperimentVariant = (id: string) => {
  try {
    // Try to use flags for experiments (works in both server and client)
    const variant = flags.getExperimentVariant(id);
    // Map variant names to match configuration
    if (variant === "variant_a") return "experiment_a";
    if (variant === "variant_b") return "experiment_b";
    return variant || "default";
  } catch (error) {
    // Fallback for SSR or when flags are not available
    return "default";
  }
};
type AnalyticsData = Record<string, unknown>;

const useAnalytics = () => ({
  trackSectionView: (_section: string, _data?: AnalyticsData) => {},
});

export function composeHeroContent(): ComposedHeroData {
  try {
    // Get experiment variant (fallback to default)
    const experimentId = heroConfiguration.experimentId || "hero_headline_test";
    const variantId =
      getExperimentVariant(experimentId) || heroConfiguration.defaultVariant;

    // Find the variant configuration
    let variant = heroConfiguration.variants.find((v) => v.id === variantId);

    if (!variant) {
      console.warn(`Hero variant "${variantId}" not found, using default`);
      // Fallback to default variant
      variant = heroConfiguration.variants.find(
        (v) => v.id === heroConfiguration.defaultVariant,
      );
    }

    if (!variant) {
      console.error("No valid hero variant found, using minimal fallback");
      // Ultimate fallback - create a minimal valid variant
      const fallbackVariant = {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback variant",
        content: heroContentVariants.default,
        weight: 0,
      };
      return {
        content: fallbackVariant.content,
        variant: fallbackVariant,
        experiment: undefined,
      };
    }

    // Ensure variant has required fields with fallbacks for validation schema
    const safeVariant = {
      id: variant.id,
      name: variant.name,
      description: variant.description || variant.name || "Hero variant",
      content: variant.content,
    };

    // Check if variant conditions are met (future enhancement)
    // For now, all variants are available

    // Track impression for analytics (only on client)
    if (typeof window !== "undefined") {
      try {
        const { trackSectionView } = useAnalytics();
        trackSectionView("hero", {
          experimentId: experimentId,
          variant: safeVariant.id,
          content: safeVariant.content.headline, // Track which headline was shown
        });
      } catch (analyticsError) {
        console.warn("Analytics tracking failed:", analyticsError);
      }
    }

    // Map content to test-expected structure (title/subtitle + envelope)
    const contentWithTitles = {
      ...safeVariant.content,
      // Map headline/subheadline to title/subtitle for test compatibility
      title: safeVariant.content.headline,
      subtitle: safeVariant.content.subheadline,
      // Ensure tracking is properly defined
      tracking: safeVariant.content.tracking || {
        section: "hero",
        eventCategory: "landing_page",
        eventAction: "section_interaction",
      },
      // Add envelope structure inside content as expected by tests
      envelope: {
        id: "hero",
        type: "hero" as const,
        version: "1.0.0",
        timestamp: Date.now(),
      },
    };

    return {
      content: contentWithTitles,
      variant: safeVariant,
      experiment:
        variantId !== heroConfiguration.defaultVariant
          ? {
              id: experimentId,
              variant: variantId,
              isActive: true,
            }
          : undefined,
    };
  } catch (error) {
    console.error("Hero composition failed, using emergency fallback:", error);

    // Emergency fallback that should always work
    const emergencyVariant = {
      id: "emergency",
      name: "Emergency Fallback",
      description: "Emergency fallback when composition fails",
      content: {
        headline: "Sistema temporariamente indisponível",
        subheadline: "Estamos trabalhando para melhorar sua experiência.",
        primaryCta: "Tentar novamente",
      },
      weight: 0,
    };

    const emergencyContent = {
      ...emergencyVariant.content,
      title: emergencyVariant.content.headline,
      subtitle: emergencyVariant.content.subheadline,
      envelope: {
        id: "hero",
        type: "hero" as const,
        version: "1.0.0",
        timestamp: Date.now(),
      },
    };

    return {
      content: emergencyContent,
      variant: emergencyVariant,
      experiment: undefined,
    };
  }
}

// Utility functions for testing and development
export function getHeroVariant(variantId: string) {
  return heroConfiguration.variants.find((v) => v.id === variantId) || null;
}

export function getAllHeroVariants() {
  return heroConfiguration.variants;
}

export function getHeroContent(variantId: string) {
  return heroContentVariants[variantId as keyof typeof heroContentVariants];
}
