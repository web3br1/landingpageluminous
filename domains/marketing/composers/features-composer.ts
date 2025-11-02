// Content Composer - Features Section
// Orchestrates features content with experiments, personalization, and analytics

import {
  featuresContentVariants,
  featuresConfiguration,
  featuresVariants,
} from "../content/features-content";
import type {
  ComposedFeaturesData,
  FeaturesVariant,
} from "../types/features.types";
import {
  withCompositionValidation,
  ComposerGuard,
} from "@/lib/composition/composer-validation";
import { createVariantComposer } from "./_base";
import { z } from "zod";

// Register validator for features composer
const FeaturesComposerSchema = z.object({
  content: z.object({
    title: z.string(),
    subtitle: z.string(),
    features: z.array(
      z.object({
        icon: z.string(),
        title: z.string(),
        description: z.string(),
        category: z.string().optional(),
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

// ComposerGuard.registerValidator("features", FeaturesComposerSchema); // TODO: Implementar quando ComposerGuard estiver disponível

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
export const composeFeaturesContent: () => Promise<ComposedFeaturesData> =
  createVariantComposer("features-composer", {
    defaultVariant: featuresConfiguration.defaultVariant,
    variants: featuresVariants,
    experimentId: "features_variant",
  });

// export const composeFeaturesContent: () => Promise<ComposedFeaturesData> = createVariantComposer(
//   'features-composer',
//   { defaultVariant: featuresConfiguration.defaultVariant, variants: featuresVariants as any, experimentId: 'features_variant' }
// )

// Utility functions for testing and development
export function getFeaturesVariant(variantId: string): FeaturesVariant | null {
  return featuresVariants.find((v) => v.id === variantId) || null;
}

export function getAllFeaturesVariants(): FeaturesVariant[] {
  return featuresVariants;
}

export function getFeaturesContent(variantId: string) {
  return featuresContentVariants[
    variantId as keyof typeof featuresContentVariants
  ];
}
