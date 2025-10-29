// Pillars Composer
// Composes pillars section content with A/B testing support

import { pillarsConfiguration } from "../content/pillars-content";
import type { ComposedPillarsData } from "../types/pillars.types";
import { createVariantComposer } from "./_base";

// Composer function
export const composePillarsContent: () => ComposedPillarsData =
  createVariantComposer("pillars", {
    defaultVariant: pillarsConfiguration.defaultVariant,
    variants: pillarsConfiguration.variants as any,
    experimentId: "pillars_variant",
  });
