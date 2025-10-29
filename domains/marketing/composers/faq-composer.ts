// Composer Layer - FAQ Section Composer
// Orchestrates FAQ content composition with business logic and experiments

import type { FaqContent } from "../types/faq.types";
import { faqContentVariants } from "../content/faq-content";

/**
 * Composes FAQ content based on context and experiments
 * @param options Configuration options for FAQ composition
 * @returns Composed FAQ content ready for UI consumption
 */
export function composeFaqContent(
  options: {
    variant?: "default" | "enterprise";
    experimentId?: string;
    userSegment?: "smb" | "enterprise" | "startup";
    limit?: number;
    categories?: string[];
  } = {},
): FaqContent {
  const {
    variant = "default",
    userSegment = "smb",
    limit,
    categories,
  } = options;

  // Select base content variant
  let content = faqContentVariants[variant] || faqContentVariants.default;

  // Apply user segment adaptations
  if (userSegment === "enterprise" && variant === "default") {
    content = faqContentVariants.enterprise;
  }

  // Filter by categories if specified
  if (categories && categories.length > 0) {
    content = {
      ...content,
      items: content.items.filter(
        (item) => item.category && categories.includes(item.category),
      ),
    };
  }

  // Apply limit if specified
  if (limit && limit > 0 && content.items.length > limit) {
    content = {
      ...content,
      items: content.items.slice(0, limit),
    };
  }

  // Add tracking metadata for analytics
  return {
    ...content,
    // Add envelope structure for SSR tests
    envelope: {
      id: "faq",
      type: "faq" as const,
      version: "1.0.0",
      timestamp: Date.now(),
    },
    // Add any runtime tracking or personalization here
  };
}

// Default composer for simple usage
export const defaultFaqComposer = () => composeFaqContent();

// Enterprise-focused composer
export const enterpriseFaqComposer = () =>
  composeFaqContent({
    variant: "enterprise",
    userSegment: "enterprise",
  });

// Limited FAQ for constrained spaces
export const compactFaqComposer = () =>
  composeFaqContent({
    limit: 4,
    categories: ["funcionalidades", "preços", "segurança", "suporte"],
  });
