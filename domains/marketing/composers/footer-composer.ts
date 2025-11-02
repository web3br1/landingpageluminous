// Composer Layer - Footer Section Composer
// Orchestrates footer content composition with business logic and experiments

import type { FooterContent } from "../types/footer.types";
import { footerContentVariants } from "../content/footer-content";
import { withCompositionValidation } from "@/lib/composition/composer-validation";

/**
 * Composes footer content based on context and experiments
 * @param options Configuration options for footer composition
 * @returns Composed footer content ready for UI consumption
 */
export async function composeFooterContent(
  options: {
    variant?: "default" | "minimal";
    experimentId?: string;
    showNewsletter?: boolean;
    customLinks?: Record<string, string[]>;
  } = {},
) {
  const { variant = "default", showNewsletter = true } = options;

  // Select base content variant
  let content = footerContentVariants[variant] || footerContentVariants.default;

  // Apply newsletter preference
  if (!showNewsletter && content.newsletter) {
    const { newsletter, ...contentWithoutNewsletter } = content;
    content = contentWithoutNewsletter as FooterContent;
  }

  // Apply any custom link modifications here if needed

  return await withCompositionValidation(
    async () => ({
      content: {
        ...content,
        envelope: {
          id: "footer",
          type: "footer" as const,
          version: "1.0.0",
          timestamp: Date.now(),
        },
      },
      variant: {
        id: variant,
        name: `${variant.charAt(0).toUpperCase() + variant.slice(1)} Footer`,
        description: `Footer variant: ${variant}`,
      },
      // Add any runtime personalization or A/B testing here
    }),
    "footer-composer",
  );
}

// Default composer for simple usage
export const defaultFooterComposer = () => composeFooterContent();

// Minimal footer for constrained spaces
export const minimalFooterComposer = () =>
  composeFooterContent({
    variant: "minimal",
    showNewsletter: false,
  });

// Enterprise footer with extended legal links
export const enterpriseFooterComposer = () =>
  composeFooterContent({
    variant: "default",
    showNewsletter: true,
  });
