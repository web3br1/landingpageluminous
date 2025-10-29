// Layout Utilities - Helper functions for domain layouts
// Provides convenient access to domain-specific layout configurations

import {
  composeLayout,
  validateLayoutComposition,
  getAvailableLayouts,
} from "./layout-registry";
import type { ComposedLayout } from "./layout-registry";

// Domain-specific layout composers
export const composeMarketingLayout = (): ComposedLayout =>
  composeLayout("marketing");
export const composeProductLayout = (): ComposedLayout =>
  composeLayout("product");
export const composeConversionLayout = (): ComposedLayout =>
  composeLayout("conversion");

// Layout validation helpers
export const validateMarketingSections = (sections: Array<{ id: string }>) =>
  validateLayoutComposition("marketing", sections);

export const validateProductSections = (sections: Array<{ id: string }>) =>
  validateLayoutComposition("product", sections);

export const validateConversionSections = (sections: Array<{ id: string }>) =>
  validateLayoutComposition("conversion", sections);

// Domain constants
export const MARKETING_SECTIONS = [
  "hero",
  "social-proof",
  "benefits",
  "features",
  "pricing",
  "faq",
  "final-cta",
  "footer",
] as const;

export const PRODUCT_SECTIONS = [
  "navigation",
  "hero",
  "features",
  "pricing",
  "demo",
  "faq",
  "footer",
] as const;

export const CONVERSION_SECTIONS = [
  "form",
  "progress",
  "trust-indicators",
  "pricing-summary",
] as const;

// Layout feature detection
export const layoutSupports = {
  marketing: {
    experiments: true,
    analytics: true,
    structuredData: true,
    errorBoundaries: true,
  },
  product: {
    navigation: true,
    analytics: true,
    errorBoundaries: true,
  },
  conversion: {
    forms: true,
    progressTracking: true,
    trustIndicators: true,
    analytics: true,
    errorBoundaries: true,
  },
};

// Utility for getting layout requirements
export const getLayoutRequirements = (layoutId: string) => {
  const layout = composeLayout(layoutId);
  return {
    requiredSections: layout.validation?.requiredSections || [],
    allowedSections: layout.validation?.allowedSections || [],
    maxSections: layout.validation?.maxSections,
    analyticsGoals: layout.config.analytics?.conversionGoals || [],
    hasStructuredData: !!layout.metadata?.structuredData,
    hasErrorBoundary: layout.config.errorBoundary || false,
  };
};

// Development helpers
export const isDevelopmentLayout = () => {
  return process.env.NODE_ENV === "development";
};

export const getLayoutDebugInfo = (layoutId: string) => {
  if (!isDevelopmentLayout()) return null;

  const layout = composeLayout(layoutId);
  return {
    id: layout.config.id,
    name: layout.config.name,
    providers: layout.providers.length,
    className: layout.className,
    validation: layout.validation,
    metadata: layout.metadata,
    analytics: layout.config.analytics,
  };
};
