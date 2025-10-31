// Lead Form Composer
// Composes lead-form section content with A/B testing support

import { leadFormConfiguration } from "../content/lead-form-content";
import type { ComposedLeadFormData } from "../types/lead-form.types";
import { createVariantComposer } from "./_base";

export const composeLeadFormContent: () => Promise<ComposedLeadFormData> =
  createVariantComposer("lead-form", {
    defaultVariant: leadFormConfiguration.defaultVariant,
    variants: leadFormConfiguration.variants as any,
    experimentId: "lead_form_variant",
  });
