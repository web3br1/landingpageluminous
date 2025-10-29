// Composer Layer - Demo Section Composer
// Orchestrates demo content composition with business logic and experiments

import type { DemoContent } from "../types/demo.types";
import { demoContentVariants } from "../content/demo-content";
import { withCompositionValidation } from "@/lib/composition/composer-validation";

/**
 * Composes demo content based on context and experiments
 * @param options Configuration options for demo composition
 * @returns Composed demo content ready for UI consumption
 */
export function composeDemoContent(
  options: {
    variant?: "default" | "video-only" | "interactive-tour";
    experimentId?: string;
    userSegment?: "smb" | "enterprise" | "startup";
    demoType?: DemoContent["demoType"];
    maxTourSteps?: number;
    includeStats?: boolean;
    includeTestimonial?: boolean;
  } = {},
) {
  return withCompositionValidation(() => {
    const {
      variant = "default",
      userSegment = "smb",
      demoType,
      maxTourSteps,
      includeStats = true,
      includeTestimonial = true,
    } = options;

    // Select base content variant
    let content = demoContentVariants[variant] || demoContentVariants.default;

    // Override demo type if specified
    if (demoType) {
      content = { ...content, demoType };
    }

    // Apply user segment adaptations
    if (userSegment === "enterprise") {
      // Enterprise users get more comprehensive demo with advanced features
      content = {
        ...content,
        features: {
          ...content.features,
          items: [
            ...content.features.items,
            "RBAC avançado (Role-Based Access Control)",
            "Auditoria completa de ações",
            "Integração com Active Directory",
            "SLA garantido 99.9%",
            "Suporte dedicado 24/7",
          ],
        },
      };
    } else if (userSegment === "startup") {
      // Startups get simplified demo focused on quick wins
      content = {
        ...content,
        features: {
          ...content.features,
          items: content.features.items.slice(0, 4), // Limit to first 4 features
        },
      };
    }

    // Limit tour steps if specified
    if (
      maxTourSteps &&
      content.tourSteps &&
      content.tourSteps.length > maxTourSteps
    ) {
      content = {
        ...content,
        tourSteps: content.tourSteps.slice(0, maxTourSteps),
      };
    }

    // Control stats inclusion
    if (!includeStats && content.stats) {
      const { stats, ...contentWithoutStats } = content;
      content = contentWithoutStats as DemoContent;
    }

    // Control testimonial inclusion
    if (!includeTestimonial && content.testimonial) {
      const { testimonial, ...contentWithoutTestimonial } = content;
      content = contentWithoutTestimonial as DemoContent;
    }

    // Add runtime personalization or A/B testing
    return {
      content: {
        ...content,
        envelope: {
          id: "demo",
          type: "demo" as const,
          version: "1.0.0",
          timestamp: Date.now(),
        },
      },
      variant: {
        id: variant,
        name: `${variant.charAt(0).toUpperCase() + variant.slice(1)} Demo`,
        description: `Demo variant: ${variant}`,
      },
    };
  }, "demo-composer");
}

// Default composer for simple usage
export const defaultDemoComposer = () => composeDemoContent();

// Video-focused demo
export const videoDemoComposer = () =>
  composeDemoContent({
    variant: "video-only",
  });

// Interactive tour demo
export const tourDemoComposer = () =>
  composeDemoContent({
    variant: "interactive-tour",
  });

// Enterprise-focused demo
export const enterpriseDemoComposer = () =>
  composeDemoContent({
    variant: "default",
    userSegment: "enterprise",
    includeStats: true,
    includeTestimonial: true,
  });

// Compact demo for constrained spaces
export const compactDemoComposer = () =>
  composeDemoContent({
    variant: "default",
    maxTourSteps: 3,
    includeStats: false,
    includeTestimonial: false,
  });
