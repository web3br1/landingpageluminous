// How It Works Composer
// Composes how-it-works section content with A/B testing support

import { howItWorksConfiguration } from "../content/how-it-works-content";
import type { ComposedHowItWorksData } from "../types/how-it-works.types";
import { createVariantComposer } from "./_base";

export const composeHowItWorksContent: () => ComposedHowItWorksData =
  createVariantComposer("how-it-works", {
    defaultVariant: howItWorksConfiguration.defaultVariant,
    variants: howItWorksConfiguration.variants as any,
    experimentId: "how_it_works_variant",
  });
