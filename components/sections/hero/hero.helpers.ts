/**
 * Hero Component Helpers
 *
 * Extracted helper functions to reduce component complexity
 * Following single responsibility principle
 */

import { withComponentContext } from "@/lib/architecture/logger-pattern";
import type { HeroContent } from "./hero.types";

/**
 * Validates and renders text content safely
 */
export function validateAndRenderText(value: unknown, fieldName: string): string {
  const logger = withComponentContext("hero", "validateAndRenderText");

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (value === undefined || value === null) {
    return "";
  }

  logger.error(`Invalid ${fieldName} type`, undefined, {
    expectedType: "string | number | undefined",
    actualType: typeof value,
    value,
    fieldName,
  });

  return `Erro: ${fieldName} inválido`;
}

/**
 * Safely extracts hero content from various data structures
 */
export function extractHeroContent(content: unknown): HeroContent {
  const logger = withComponentContext("hero", "extractHeroContent");

  // Safety check - if content is undefined, provide minimal fallback
  if (!content) {
    logger.warn("Hero component received undefined content, using fallback");
    return {
      headline: "Sistema temporariamente indisponível",
      subheadline: "Estamos trabalhando para melhorar sua experiência.",
      primaryCta: "Tentar novamente",
      secondaryCta: "Contatar suporte",
    };
  }

  // Handle nested content structure from production data
  const contentObj = content as Record<string, unknown>;

  if (contentObj?.content && typeof contentObj.content === 'object' && contentObj.content !== null) {
    const nestedContent = contentObj.content as Record<string, unknown>;
    if (nestedContent?.content) {
      return nestedContent.content as HeroContent;
    }
    return contentObj.content as HeroContent;
  }

  return contentObj as unknown as HeroContent;
}

/**
 * Generates accessibility labels for CTAs
 */
export function generateCtaAriaLabel(ctaText: string, type: 'primary' | 'secondary'): string {
  return `Clique para ${ctaText}`;
}

/**
 * Generates tracking data attributes
 */
export function generateTrackingAttributes(tracking?: { experimentId?: string; variant?: string; section?: string }) {
  return {
    'data-experiment-id': tracking?.experimentId,
    'data-variant-experiment': tracking?.variant,
    'data-section': tracking?.section,
  };
}

/**
 * Calculates responsive text classes based on screen size
 */
export function getResponsiveTextClasses(baseClasses: string): string {
  return `${baseClasses} text-[clamp(2.5rem,5vw,4rem)]`;
}

/**
 * Creates animation classes based on reduced motion preference
 */
export function getAnimationClasses(reducedMotion: boolean): {
  buttonHover: string;
  backgroundPulse: string;
} {
  if (reducedMotion) {
    return {
      buttonHover: "",
      backgroundPulse: "",
    };
  }

  return {
    buttonHover: "hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200",
    backgroundPulse: "animate-pulse",
  };
}
