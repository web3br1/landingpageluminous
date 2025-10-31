// Pricing Presale Composer
// Composes pricing presale section content with A/B testing support

import { pricingPresaleConfiguration } from "../content/pricing-presale-content";
import type { ComposedPricingPresaleData } from "../types/pricing-presale.types";
import { createVariantComposer } from "./_base";

export const composePricingPresaleContent: () => Promise<ComposedPricingPresaleData> =
  createVariantComposer("pricing-presale", {
    defaultVariant: pricingPresaleConfiguration.defaultVariant,
    variants: pricingPresaleConfiguration.variants as any,
    experimentId: "pricing_presale_variant",
  });
