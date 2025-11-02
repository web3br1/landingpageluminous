// Proof Traction Composer
// Composes proof-traction section content with A/B testing support

import { proofTractionConfiguration } from "../content/proof-traction-content";
import type { ComposedProofTractionData } from "../types/proof-traction.types";
import { createVariantComposer } from "./_base";

export const composeProofTractionContent: () => Promise<ComposedProofTractionData> =
  createVariantComposer("proof-traction", {
    defaultVariant: proofTractionConfiguration.defaultVariant,
    variants: proofTractionConfiguration.variants as any,
    experimentId: "proof_traction_variant",
  });
