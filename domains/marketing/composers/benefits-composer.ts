// Content Composer - Benefits Section
// Orchestrates benefits content with experiments, personalization, and analytics

import {
  benefitsContentVariants,
  benefitsConfiguration,
  benefitsVariants,
} from "../content/benefits-content";
import type {
  ComposedBenefitsData,
  BenefitsVariant,
} from "../types/benefits.types";
import {
  withCompositionValidation,
  ComposerGuard,
} from "@/lib/composition/composer-validation";
import { createVariantComposer } from "./_base";
import { z } from "zod";

// Register validator for benefits composer
const BenefitsComposerSchema = z.object({
  content: z.object({
    title: z.string(),
    subtitle: z.string(),
    benefits: z.array(
      z.object({
        icon: z.string(),
        title: z.string(),
        description: z.string(),
        metric: z.string().optional(),
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

ComposerGuard.registerValidator("benefits", BenefitsComposerSchema);

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

export const composeBenefitsContent: () => ComposedBenefitsData =
  createVariantComposer("benefits-composer", {
    defaultVariant: benefitsConfiguration.defaultVariant,
    variants: benefitsVariants,
    experimentId: "benefits-presentation-test",
  });

// Utility functions for testing and development
export function getBenefitsVariant(variantId: string): BenefitsVariant | null {
  return benefitsVariants.find((v) => v.id === variantId) || null;
}

export function getAllBenefitsVariants(): BenefitsVariant[] {
  return benefitsVariants;
}

export function getBenefitsContent(variantId: string) {
  return benefitsContentVariants[
    variantId as keyof typeof benefitsContentVariants
  ];
}
