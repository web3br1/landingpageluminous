// Content Composer - Pricing Section
// Orchestrates pricing content with experiments, personalization, and analytics

import {
  pricingContentVariants,
  pricingConfiguration,
  pricingVariants,
} from "../content/pricing-content";
import type {
  ComposedPricingData,
  PricingVariant,
} from "../types/pricing.types";
import {
  withCompositionValidation,
  ComposerGuard,
} from "@/lib/composition/composer-validation";
import { createVariantComposer } from "./_base";
import { z } from "zod";

// Register validator for pricing composer
const PricingComposerSchema = z.object({
  content: z.object({
    title: z.string(),
    subtitle: z.string(),
    plans: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        price: z.object({
          monthly: z.number(),
          annual: z.number(),
          currency: z.string(),
        }),
        badge: z.string().optional(),
        features: z.array(
          z.object({
            name: z.string(),
            included: z.boolean(),
          }),
        ),
        popular: z.boolean().optional(),
        cta: z.string().optional(),
      }),
    ),
  }),
  variant: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
  }),
  experiment: z
    .object({
      id: z.string(),
      variant: z.string(),
      isActive: z.boolean(),
    })
    .optional(),
});

ComposerGuard.registerValidator("pricing", PricingComposerSchema);

// Temporary: Mock implementations until lib modules are created
const useExperiment = (id: string) => ({
  variant: "default",
  isActive: false,
  id,
});
type AnalyticsData = Record<string, unknown>;

const useAnalytics = () => ({
  trackSectionView: (_section: string, _data?: AnalyticsData) => {},
});

// Use standardized composer with envelope contract
export const composePricingContent: () => ComposedPricingData =
  createVariantComposer("pricing-composer", {
    defaultVariant: pricingConfiguration.defaultVariant,
    variants: pricingVariants as any,
    experimentId: "pricing_variant",
  });

// export const composePricingContent: () => ComposedPricingData = createVariantComposer(
//   'pricing-composer',
//   { defaultVariant: pricingConfiguration.defaultVariant, variants: pricingVariants as any, experimentId: 'pricing_variant' }
// )

// Utility functions for testing and development
export function getPricingVariant(variantId: string): PricingVariant | null {
  return pricingVariants.find((v) => v.id === variantId) || null;
}

export function getAllPricingVariants(): PricingVariant[] {
  return pricingVariants;
}

export function getPricingContent(variantId: string) {
  return pricingContentVariants[
    variantId as keyof typeof pricingContentVariants
  ];
}
