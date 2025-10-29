// Verticals Composer
// Composes verticals section content with A/B testing support

import { verticalsConfiguration } from "../content/verticals-content";
import type { ComposedVerticalsData } from "../types/verticals.types";
import { createVariantComposer } from "./_base";

export const composeVerticalsContent: () => ComposedVerticalsData =
  createVariantComposer("verticals", {
    defaultVariant: verticalsConfiguration.defaultVariant,
    variants: verticalsConfiguration.variants as any,
    experimentId: "verticals_variant",
  });
